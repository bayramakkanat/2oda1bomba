'use strict';
/* Yerel ağ bağlantısı (internetsiz mod).
   PeerJS'in kullandığımız küçük arayüzünü (Peer, connect, on, send, close, destroy) taklit eder;
   mesajlar PC'de çalışan yerel/sunucu.js üzerinden WebSocket ile iletilir. */
class LocalConn{
 constructor(peer,cid){this.peer=peer;this.cid=cid;this.open=false;this.h={}}
 on(e,f){(this.h[e]=this.h[e]||[]).push(f);return this}
 emit(e,a){(this.h[e]||[]).slice().forEach(f=>f(a))}
 send(m){if(this.open)this.peer.tx({k:'d',cid:this.cid,m})}
 close(){if(this.open){this.open=false;this.peer.tx({k:'cl',cid:this.cid});delete this.peer.cs[this.cid]}}
}
class LocalPeer{
 constructor(id){this.id=id||'c'+Math.random().toString(36).slice(2,10);this.keep=!!id;this.h={};this.cs={};this.dead=false;this.opened=false;this.dial()}
 on(e,f){(this.h[e]=this.h[e]||[]).push(f);return this}
 emit(e,a){(this.h[e]||[]).slice().forEach(f=>f(a))}
 tx(o){if(this.ws&&this.ws.readyState===1)this.ws.send(JSON.stringify(o))}
 dial(){
  const ws=this.ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws');
  ws.onopen=()=>this.tx({k:'reg',id:this.id});
  ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}
   if(m.k==='open'){if(!this.opened){this.opened=true;this.emit('open',this.id)}}
   else if(m.k==='err'){
    if(this.opened&&m.type==='unavailable-id'){try{ws.close()}catch(x){}} // yeniden bağlanırken eski kayıt henüz silinmediyse tekrar dene
    else this.emit('error',{type:m.type})}
   else if(m.k==='con'){const c=new LocalConn(this,m.cid);c.open=true;this.cs[m.cid]=c;this.emit('connection',c)}
   else if(m.k==='ack'){const c=this.cs[m.cid];if(c){c.open=true;c.emit('open')}}
   else if(m.k==='d'){const c=this.cs[m.cid];if(c)c.emit('data',m.m)}
   else if(m.k==='cl'){const c=this.cs[m.cid];if(c){c.open=false;delete this.cs[m.cid];c.emit('close')}}};
  ws.onclose=()=>{
   if(this.dead)return;
   const cs=Object.values(this.cs);this.cs={};cs.forEach(c=>{if(c.open){c.open=false;c.emit('close')}});
   if(!this.opened)this.emit('error',{type:'network'});
   if(this.keep)setTimeout(()=>{if(!this.dead)this.dial()},2000)}; // moderatör: bağlantı koparsa kendini yeniden kaydeder
 }
 connect(to){const cid='x'+Math.random().toString(36).slice(2,10),c=new LocalConn(this,cid);this.cs[cid]=c;this.tx({k:'con',to,cid});return c}
 destroy(){this.dead=true;try{this.ws.close()}catch(e){}}
}
