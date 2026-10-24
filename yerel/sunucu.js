'use strict';
/* 2 Oda 1 Bomba - yerel ağ sunucusu (internetsiz oynamak için)
   Hem oyun dosyalarını sunar hem de telefonlar arasında mesajları ileten WebSocket aracısıdır. */
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const {WebSocketServer}=require('ws');
const ROOT=path.resolve(__dirname,'..'),PORT=+process.env.PORT||8080;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.ico':'image/x-icon','.webp':'image/webp'};

const srv=http.createServer((req,res)=>{
 let u;try{u=decodeURIComponent(req.url.split('?')[0])}catch(e){res.writeHead(400);return res.end()}
 if(u==='/')u='/index.html';
 const f=path.resolve(ROOT,'.'+u);
 if(!f.startsWith(ROOT+path.sep)||f.startsWith(__dirname)||u.split('/').some(s=>s.startsWith('.'))){res.writeHead(403);return res.end('Yasak')}
 fs.readFile(f,(err,d)=>{
  if(err){res.writeHead(404);return res.end('Bulunamadi')}
  if(path.basename(f)==='index.html')d=Buffer.from(d.toString('utf8').replace(/<script src="https:\/\/cdn\.jsdelivr[^>]*><\/script>\s*/,'')); // internet yok: PeerJS CDN'i yüklenmeye çalışılmasın
  res.writeHead(200,{'Content-Type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(d)})});

const wss=new WebSocketServer({server:srv,path:'/ws'});
const peers=new Map();  // kayıtlı kimlik -> websocket
const conns=new Map();  // bağlantı kimliği -> [başlatan, hedef]
const out=(w,o)=>{if(w&&w.readyState===1)w.send(JSON.stringify(o))};

wss.on('connection',ws=>{
 ws.id=null;
 ws.on('message',raw=>{
  let m;try{m=JSON.parse(raw.toString())}catch(e){return}
  if(m.k==='reg'){
   const old=peers.get(m.id);
   if(!m.id||(old&&old.readyState===1))return out(ws,{k:'err',type:'unavailable-id'});
   ws.id=m.id;peers.set(m.id,ws);return out(ws,{k:'open'})}
  if(!ws.id)return;
  if(m.k==='con'){
   const t=peers.get(m.to);
   if(!t||t.readyState!==1)return out(ws,{k:'err',type:'peer-unavailable'});
   conns.set(m.cid,[ws.id,m.to]);out(t,{k:'con',cid:m.cid,from:ws.id});return out(ws,{k:'ack',cid:m.cid})}
  const pr=conns.get(m.cid);if(!pr)return;
  const other=pr[0]===ws.id?pr[1]:pr[1]===ws.id?pr[0]:null;if(!other)return;
  if(m.k==='d')out(peers.get(other),{k:'d',cid:m.cid,m:m.m});
  else if(m.k==='cl'){out(peers.get(other),{k:'cl',cid:m.cid});conns.delete(m.cid)}});
 ws.on('close',()=>{
  if(!ws.id)return;
  if(peers.get(ws.id)===ws)peers.delete(ws.id);
  for(const [cid,pr] of [...conns]){
   if(pr.includes(ws.id)){const o=pr[0]===ws.id?pr[1]:pr[0];out(peers.get(o),{k:'cl',cid});conns.delete(cid)}}})});

srv.listen(PORT,'0.0.0.0',()=>{
 const ips=[];for(const l of Object.values(os.networkInterfaces()))for(const i of l||[])if(i.family==='IPv4'&&!i.internal)ips.push(i.address);
 console.log('\n2 Oda 1 Bomba yerel sunucu calisiyor.\n');
 console.log('Moderator (bu PC):  http://localhost:'+PORT);
 console.log('Telefonlar (ayni Wi-Fi / bu PCnin hotspotu):');
 (ips.length?ips:['PC-IP']).forEach(ip=>console.log('  http://'+ip+':'+PORT));
 console.log('\nAna menude "Baglanti" olarak "Yerel ag" secili olmali. Kapatmak icin bu pencerede Ctrl+C.\n')});
