'use strict';
/* ---------- Saf mantık (test edilebilir) ---------- */
const CV={ajan_mavi:.842,ajan_kirmizi:.779,casus_mavi:.787,casus_kirmizi:.809,baskan:.782,bombaci:.788,takim_mavi:.797,takim_kirmizi:.791,stajyer:.784,maktul:.784,sarhos:.81,kumarbaz:.782};
const CV_UP=.010; // 'Rengimi göster' kapağının alt kenarını yukarı çeker (oran). Daha fazla kaldırmak için artır, indirmek için azalt; .02 üstüne çıkarsan bazı kartlarda çizim görünmeye başlar
const HOST5={a:[1,1,1,1,1],b:[2,2,2,1,1],c:[3,2,2,1,1],d:[4,3,2,1,1],e:[5,4,3,2,1]};
const MIN={5:[5,4,3,2,1],3:[3,2,1]};
const LEADER_HOSTAGE=false;  // kural kitabı: lider rehine olarak seçilemez
let SWAP_SECS=15;          // rehinelerin oda değiştirme süresi (lider seçimi bitince başlar)
let PICK_SECS=30;          // liderin rehine seçme süresi
let GAMBLE_SECS=10,GAP_SECS=4,TEST=false;const minPlayers=()=>TEST?4:10;
function applyTest(on){TEST=!!on;SWAP_SECS=on?5:15;PICK_SECS=on?10:30;GAMBLE_SECS=on?5:10;GAP_SECS=on?2:4} // test modu: süreler kısaltılır // Kumarbaz tahmin süresi; tahmin mesajı ile sonuç arasındaki bekleme
const voteSecs=r=>TEST?10:(r===1?30:20); // lider oylama süresi: 1. tur 30 sn, sonraki turlar 20 sn
function hostages(n,rounds){if(rounds===5){return HOST5[n<=10?'a':n<=13?'b':n<=17?'c':n<=21?'d':'e']}return n<=10?[1,1,1]:n<=21?[2,1,1]:[3,2,1]}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/* Deste planlayıcı: Başkan ve Bombacı her zaman var; diğer yan karakterler açılıp kapatılabilir, Mavi/Kırmızı sayıları elle verilebilir */
const OPT_DEF={ajanM:true,ajanK:true,casusM:true,casusK:true,stajyer:true,maktul:true,sarhos:true,kumarbaz:'auto',blue:'',red:''};
function planDeck(n,o,rnd){
 o={...OPT_DEF,...(o||{})};const d=['baskan','bombaci'],warn=[];
 [['ajanM','ajan_mavi'],['ajanK','ajan_kirmizi'],['casusM','casus_mavi'],['casusK','casus_kirmizi'],['stajyer','stajyer'],['maktul','maktul']].forEach(([k,c])=>{if(o[k])d.push(c)});
 let k=o.kumarbaz==='her'?1:0,rem=n-d.length-k;
 if(rem<0){const fz=d.length+k-n;return{error:`${n} oyuncuya ${d.length+k} özel karakter sığmaz (Başkan + Bombacı hep var${k?', Kumarbaz da var':''}; Sarhoş sayılmaz). Listeden ${fz} karakteri daha kapat.`}}
 let extra=false;const num=v=>v===''||v==null?null:Math.max(0,Math.floor(+v)||0),bs=num(o.blue),rs=num(o.red);let blue,red;
 if(bs==null&&rs==null){
  if(o.kumarbaz==='auto'&&rem%2){k=1;rem--}              // resmi kural: takımlar eşit bölünemiyorsa Kumarbaz
  if(rem%2){extra=true;rem--} // Kumarbaz teki düzeltemiyorsa (Hiç yok / Her zaman): Sarhoş fazladan denge kartı olur
  blue=red=rem/2;
 }else{ // Mavi ve Kırmızı her zaman eşit: biri girilirse diğeri aynı olur
  if(bs!=null&&rs!=null&&bs!==rs)return{error:'Mavi ve Kırmızı takım sayısı aynı olmalı'};
  blue=red=bs!=null?bs:rs;
  if(2*blue>rem)return{error:`Mavi ${blue} + Kırmızı ${red} = ${2*blue}, ama en fazla ${rem} düz takım kartı sığıyor`};
  const left=rem-2*blue;if(left===1&&o.kumarbaz==='auto')k=1;else if(left===1)extra=true;else if(left>0)return{error:`${left} kart boşta kalıyor, takım sayısını artır`};
 }
 const cards=[...d,...Array(k).fill('kumarbaz'),...Array(blue).fill('takim_mavi'),...Array(red).fill('takim_kirmizi')];
 let sober;
 if(extra){cards.push('sarhos');sober=rnd&&Math.random()<.5?'takim_kirmizi':'takim_mavi'} // takımlar eşit kalsın diye Sarhoş fazladan kart olarak eklenir (Sarhoş ayarı kapalı olsa da)
 else if(o.sarhos){const plain=cards.map((c,i)=>c.startsWith('takim')?i:-1).filter(i=>i>=0);
  if(plain.length){const si=rnd?plain[Math.floor(Math.random()*plain.length)]:plain[0];sober=cards[si];cards[si]='sarhos'} // Sarhoş, düz bir takım kartının yerine geçer
  else warn.push('Düz takım kartı yok, Sarhoş eklenemedi')}
 return{cards,sober,blue,red,k,extra,warn}}
function buildDeck(n,o){const r=planDeck(n,o,true);if(r.error)throw new Error(r.error);return{deck:shuffle(r.cards),sober:r.sober}}
/* ---------- Arayüz ve ağ ---------- */
const $=i=>document.getElementById(i);
const vib=n=>{try{navigator.vibrate&&navigator.vibrate(n)}catch(e){}};
const wl=()=>{try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{})}catch(e){}};
const LS=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
if(/[?&]sifirla(&|=|$)/.test(location.search)){try{localStorage.removeItem('2r1b_me');localStorage.removeItem('2r1b_host')}catch(e){}} // adres sonuna ?sifirla yazılırsa kayıtlı oyun silinir (takılı kalan telefon için)
let gen=0,pg=0,joined=false,joinFresh=false,lostN=0,lvT=0;const LV0='⌂ Ana ekran';
let peer,conn,rt,isHost=false,code='',me=LS('2r1b_me'),H=null,C={},mode='closed',pm='closed',tm=0,ct=0,tk=0;
let freshStart=false,ut=0; // yeni kurulan oyunda seçilen kod başkasında kullanılıyorsa hızlıca vazgeçmek için
const normCode=s=>String(s||'').replace(/[çÇ]/g,'c').replace(/[ğĞ]/g,'g').replace(/[ıİ]/g,'i').replace(/[öÖ]/g,'o').replace(/[şŞ]/g,'s').replace(/[üÜ]/g,'u').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,20); // Türkçe harfler ASCII'ye çevrilir, sadece harf/rakam kalır
let NET=(me&&me.net)||'cloud'; // 'cloud' = PeerJS (internet), 'local' = PC'deki yerel sunucu (local.js)
const sel=new Set();
const uid=()=>Math.random().toString(36).slice(2,10);
const show=n=>{['home','lobby','game'].forEach(s=>$(s).hidden=s!==n);$('lv').hidden=n!=='lobby'}; // çıkış düğmesi sadece lobide; oyun sırasında gizli (bağlantı koparsa/hata olursa kendiliğinden belirir)
const msg=t=>{$('herr').textContent=t};
const status=t=>{$('cs').textContent=t||''};
function openPeer(id,cb){const g=++pg;if(peer)try{peer.destroy()}catch(e){}const P=NET==='local'?LocalPeer:Peer;peer=id?new P(id):new P();peer.on('open',()=>{if(g===pg)cb()});
 peer.on('error',e=>{if(g!==pg)return;
  if(isHost&&e.type==='unavailable-id'){if(freshStart&&++ut>2)return leaveToHome('Bu kod başka bir oyunda kullanılıyor, farklı bir kod dene.');status('Eski bağlantı temizleniyor, tekrar deneniyor…');setTimeout(()=>{if(g===pg)openPeer(id,cb)},3000)}
  else if(!isHost&&e.type==='peer-unavailable'){if(joinFresh&&!joined)return leaveToHome('Oyun bulunamadı: '+code);lost()} // yeni katılımda kod yanlışsa ana ekrana dön; yenileme sonrası moderatör açılana kadar dene
  else if(!isHost)lost();else status('Bağlantı hatası: '+e.type)})}
/* Her ekrandan çıkış: zamanlayıcıları, bağlantıyı ve kayıtlı oyunu temizleyip karşılama ekranına döner */
function leaveToHome(text,notify){
 const pr=peer;if(isHost&&notify&&H){try{bcast({t:'bye'})}catch(e){}} // moderatör çıkarsa diğer telefonlar da ana ekrana döner
 gen++;pg++;clearInterval(tk);clearTimeout(rt);clearTimeout(tm);clearTimeout(ct);clearTimeout(lvT);
 try{if(conn)conn.close()}catch(e){}
 setTimeout(()=>{try{if(pr)pr.destroy()}catch(e){}},notify?600:0);
 conn=null;peer=null;isHost=false;H=null;C={};me=null;code='';mode='closed';pm='closed';freshStart=false;ut=0;joined=false;joinFresh=false;lostN=0;
 try{localStorage.removeItem('2r1b_me');localStorage.removeItem('2r1b_host')}catch(e){}
 sel.clear();status('');$('ov').style.display='none';try{$('dlg').close()}catch(e){}
 const lv=$('lv');delete lv.dataset.arm;lv.textContent=LV0;
 $('hostp').hidden=true;$('panel').hidden=true;$('timer').textContent='';$('banner').textContent='';$('room').textContent='';$('card').classList.remove('flip');
 show('home');msg(text||'')}
/* ----- Moderatör (host) ----- */
const persist=()=>save('2r1b_host',{code,H:{...H,players:H.players.map(({conn,...p})=>p)}});
const room=r=>H.players.filter(p=>p.room===r);
const byPid=id=>H.players.find(p=>p.pid===id);
const left=()=>H.endAt?Math.max(0,Math.ceil((H.endAt-Date.now())/1000)):0;
const need=()=>hostages(H.players.length,H.rounds)[H.round-1];
const TIMED=['vote','round','pick','swap','gamble','gap'];
function hostInit(resume){
 isHost=true;H=resume||{players:[],phase:'lobby',round:1,rounds:5,stage:null,endAt:0,leaders:{},votes:{},picks:{A:null,B:null},swapEnd:{},hostages:[],final:false,used:{},test:!!$('tm').checked};applyTest(H.test);
 if(!resume&&me.play)H.players.push({pid:me.pid,name:me.name,self:true});
 openPeer('2r1b-'+code,()=>{freshStart=false;status('');peer.on('connection',c=>{c.on('data',m=>hostMsg(c,m));c.on('close',()=>{const p=H.players.find(p=>p.conn===c);if(p)p.conn=null})});
  if(H.phase==='lobby')lobbyAll();else{H.players.forEach(sendState);hostRender();show('game');if(TIMED.includes(H.stage))startTick()}});
}
function send(p,m){if(p.bot)return;if(p.self)onC(m);else if(p.conn&&p.conn.open)p.conn.send(m)}
function lobbyAll(){const names=H.players.map(p=>p.name);H.players.forEach(p=>send(p,{t:'lobby',names}));if(!me.play)renderLobby(names);show('lobby');persist()}
function hostMsg(c,m){
 if(m.t==='join'){let p=H.players.find(x=>x.pid===m.pid);
  if(!p){if(H.phase!=='lobby'){c.send({t:'err',m:'Oyun başladı, yeni oyuncu alınamıyor'});return}
   if(H.players.some(x=>x.name.toLowerCase()===m.name.toLowerCase())){c.send({t:'err',m:'Bu isim alınmış'});return}
   p={pid:m.pid,name:m.name};H.players.push(p)}
  p.conn=c;if(H.phase==='lobby')lobbyAll();else sendState(p);persist();return}
 const p=H.players.find(x=>x.conn===c);if(p)hostAct(p,m)}
function hostAct(p,m){
 if(m.t==='peek'){if(H.round===1&&!(H.peeks=H.peeks||{})[p.pid]){H.peeks[p.pid]=1;persist()}return} // kendi kartını açma hakkı: sadece 1. turda 1 kez; sayfa yenilense de host'ta tutulur (state göndermiyoruz: açık kartı kapatmasın)
 if(m.t==='vote'){ // lider oyu: sadece oylama aşamasında, kendi odasındaki birine
  if(H.stage!=='vote'||H.leaders[p.room])return;const t=H.players.find(x=>x.name===m.target);if(!t||t.room!==p.room)return;
  H.votes[p.pid]=t.pid;if(!checkVotes()){persist();sendState(p)}return}
 if(m.t==='pick'){ // rehine seçimi: sadece o odanın lideri
  const r=p.room;if(H.stage!=='pick'||H.leaders[r]!==p.pid||H.picks[r])return sendState(p);
  const ids=[...new Set((m.names||[]).map(n=>{const t=H.players.find(x=>x.name===n);return t&&t.room===r&&(LEADER_HOSTAGE||t.pid!==p.pid)?t.pid:null}))];
  if(ids.length!==need()||ids.includes(null))return sendState(p);
  setPick(r,ids);return}
 if(m.t==='gamble'){if(H.stage==='gamble'&&H.gambler===p.pid&&(m.team==='mavi'||m.team==='kirmizi')){H.gChoice=m.team;persist();sendState(p)}return}
 if(m.t==='ajan'){const t=H.players.find(x=>x.name===m.target);
  if(!p.card||!p.card.startsWith('ajan')||!t||t===p||t.room!==p.room||H.used[p.pid]===H.round)return send(p,{t:'ajanNo'});
  H.used[p.pid]=H.round;persist();send(t,{t:'ajanReq',from:p.name});send(p,{t:'ajanOk',target:t.name})}}
function sendState(p){if(!p.card)return;const r=p.room,ld=byPid((H.leaders||{})[r]);
 send(p,{t:'state',card:p.card,sober:p.sober,room:r,mates:room(r).filter(x=>x!==p).map(x=>x.name),all:room(r).map(x=>x.name),
  round:H.round,total:H.rounds,peek:H.round===1&&!(H.peeks||{})[p.pid],hostages:need(),last:H.round===H.rounds,used:H.used[p.pid]===H.round,final:H.final,
  stage:H.stage,left:left(),leader:!!ld&&ld===p,leaderName:ld?ld.name:null,myVote:(byPid((H.votes||{})[p.pid])||{}).name||null,
  picked:!!(H.picks&&H.picks[r]),hostage:H.stage==='swap'&&(H.hostages||[]).includes(p.pid),
  hleft:H.swapEnd&&H.swapEnd[r]?Math.max(0,Math.ceil((H.swapEnd[r]-Date.now())/1000)):0,
  isG:H.gambler===p.pid,gname:(byPid(H.gambler)||{}).name,gChoice:(p.pid===H.gambler||['gap','result'].includes(H.stage))?H.gChoice:null,result:H.stage==='result'?H.result:null})}
function pushAll(){H.players.forEach(sendState);hostRender()}
function deal(){const n=H.players.length;if(n<minPlayers())return alert('En az '+minPlayers()+' oyuncu gerekli');let r;try{r=buildDeck(n,readOpts())}catch(e){return alert(e.message)}
 H.rounds=+$('rn').value;H.round=1;H.final=false;H.used={};H.peeks={};H.phase='game';H.gambler=null;H.gChoice=null;H.result=null;
 const rooms=shuffle(H.players.map((_,i)=>i)),half=Math.ceil(n/2);
 H.players.forEach((p,i)=>{p.card=r.deck[i];p.sober=p.card==='sarhos'?r.sober:undefined;p.room=rooms.indexOf(i)<half?'A':'B'});
 show('game');startVote()}
function hostRender(){const n=H.players.length,hs=need();
 $('hostp').hidden=false;$('cardbox').hidden=!me.play;
 const nm={vote:'lider oylaması',round:'tur sürüyor',pick:'rehine seçimi',swap:'oda değişimi',gamble:'Kumarbaz tahmini',gap:'Kumarbaz seçti',ready:'sonuç açıklanmaya hazır',result:'oyun bitti',over:'tur bitti'}[H.stage]||'';
 const L=r=>(byPid((H.leaders||{})[r])||{name:'—'}).name,s=left();
 $('hinfo').textContent=(TEST?'[TEST] ':'')+`Tur ${H.round}/${H.rounds} · ${nm}`+(s?` · ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`:'')+` · rehine: ${hs} · oyuncu: ${n}`+(H.leaders&&(H.leaders.A||H.leaders.B)?` · Lider A: ${L('A')}, B: ${L('B')}`:'');
 $('b1').hidden=true;$('b2').hidden=true;$('b3').hidden=!['gap','ready'].includes(H.stage);$('b5').hidden=H.stage!=='pick';
 if(!me.play){const pn=$('panel');pn.innerHTML='';if(['gamble','gap','ready','result'].includes(H.stage))endView(pn,{stage:H.stage,isG:false,gname:(byPid(H.gambler)||{}).name,gChoice:H.gChoice,result:H.result});pn.hidden=!pn.children.length}}
function bcast(m){H.players.forEach(p=>send(p,m))}
/* Tur akışı: lider oylaması → tur süresi → rehine seçimi (sadece lider) → oda değiştirme (15 sn) → yeni tur */
function startTick(){clearInterval(tk);tk=setInterval(tick,500);tick()}
function tick(){if(!H)return;
 if(H.endAt&&Date.now()>=H.endAt){if(H.stage==='vote')resolveVotes();else if(H.stage==='round')endRound();else if(H.stage==='pick')forcePick();else if(H.stage==='swap')finishSwap();else if(H.stage==='gamble')gambleDone()}
 hostRender()}
function tally(r){const m=room(r),c={};m.forEach(p=>{const v=H.votes[p.pid];if(v&&m.some(x=>x.pid===v))c[v]=(c[v]||0)+1});
 const mx=Math.max(0,...Object.values(c)),top=mx?m.filter(p=>c[p.pid]===mx):m;return top[Math.floor(Math.random()*top.length)].pid}
function checkVotes(){let ch=false;
 ['A','B'].forEach(r=>{if(!H.leaders[r]){const m=room(r);if(m.length&&m.every(p=>H.votes[p.pid])){H.leaders[r]=tally(r);ch=true}}});
 if(H.leaders.A&&H.leaders.B){startRound();return true}
 if(ch){persist();pushAll();return true}return false}
function startVote(){H.stage='vote';H.leaders={};H.votes={};H.picks={A:null,B:null};H.swapEnd={};H.hostages=[];H.endAt=Date.now()+voteSecs(H.round)*1000;
 H.players.filter(p=>p.bot).forEach(b=>{const m=room(b.room);H.votes[b.pid]=m[Math.floor(Math.random()*m.length)].pid}); // test oyuncuları rastgele oy verir
 startTick();if(!checkVotes()){persist();pushAll()}}
function resolveVotes(){['A','B'].forEach(r=>{if(!H.leaders[r])H.leaders[r]=tally(r)});startRound()} // süre doldu: çoğunluk, yoksa/eşitse rastgele
function startRound(){H.stage='round';H.endAt=Date.now()+(TEST?30000:MIN[H.rounds][H.round-1]*60000);persist();pushAll();startTick()}
const sample=r=>shuffle(room(r).filter(p=>LEADER_HOSTAGE||p.pid!==H.leaders[r])).slice(0,need()).map(p=>p.pid);
function endRound(){clearInterval(tk);const last=H.round>=H.rounds;H.picks={A:null,B:null};H.swapEnd={};H.hostages=[];H.stage='pick';H.endAt=Date.now()+PICK_SECS*1000;bcast({t:'end',last,secs:PICK_SECS});
 startTick();
 ['A','B'].forEach(r=>{const l=byPid(H.leaders[r]);if(l&&l.bot&&H.stage==='pick')setPick(r,sample(r))});
 if(H.stage==='pick'){persist();pushAll()}}
/* İki odanın lideri de seçimi bitirince (ya da 30 sn dolunca) tüm rehinelere aynı anda mesaj gider ve 15 sn sayaçları birlikte başlar */
function setPick(r,ids){H.picks[r]=ids;if(H.picks.A&&H.picks.B)startSwap();else{persist();pushAll()}}
function forcePick(){['A','B'].forEach(r=>{if(H.stage==='pick'&&!H.picks[r])setPick(r,sample(r))})} // 30 sn doldu / moderatör: seçmeyen odalar için rastgele
function startSwap(){const t=Date.now()+SWAP_SECS*1000;H.stage='swap';H.swapEnd={A:t,B:t};H.hostages=[...H.picks.A,...H.picks.B];H.endAt=t;persist();pushAll();startTick();
 H.players.forEach(p=>{if(H.hostages.includes(p.pid))send(p,{t:'moveNow',to:p.room==='A'?'B':'A',secs:SWAP_SECS})})}
function finishSwap(){H.players.forEach(p=>{if(H.hostages.includes(p.pid))p.room=p.room==='A'?'B':'A'}); // süre sonunda rehineler geçmiş sayılır
 H.hostages=[];if(H.round>=H.rounds)return endGame(); // son turun da rehine takası yapıldı
 H.round++;startVote()}
/* Oyun sonu: (Kumarbaz varsa 10 sn tahmin) → tahmin mesajı → kartlar açılır + kazanan */
function endGame(){const g=H.players.find(p=>p.card==='kumarbaz');if(!g)return readyForResult();
 H.gambler=g.pid;H.gChoice=null;H.stage='gamble';H.endAt=Date.now()+GAMBLE_SECS*1000;persist();pushAll();startTick()}
function readyForResult(){clearInterval(tk);H.stage='ready';H.endAt=0;persist();pushAll()} // tüm turlar + rehine takası bitti, Kumarbaz yok: sonuç moderatör düğmesini bekler
function gambleDone(){if(!H.gChoice)H.gChoice=Math.random()<.5?'mavi':'kirmizi'; // seçilmediyse rastgele
 H.stage='gap';H.endAt=0;clearInterval(tk);persist();pushAll()} // Kumarbaz seçti: sonuç otomatik açılmaz, moderatör 'Oyun bitti'ye basınca açılır
function showResult(){clearInterval(tk);const pr=H.players.find(p=>p.card==='baskan'),bm=H.players.find(p=>p.card==='bombaci'),same=pr.room===bm.room,win=same?'kirmizi':'mavi';
 H.result={win,same,room:pr.room,pn:pr.name,pr:pr.room,bn:bm.name,br:bm.room,rooms:{A:room('A').map(x=>({n:x.name,c:x.card,s:x.sober})),B:room('B').map(x=>({n:x.name,c:x.card,s:x.sober}))}};
 const g=byPid(H.gambler);if(g)H.result.g={name:g.name,choice:H.gChoice,ok:H.gChoice===win};
 H.stage='result';H.final=true;H.endAt=0;persist();pushAll()}
function finish(){if(!['gap','ready'].includes(H.stage))return;clearInterval(tk);showResult()} // 'Oyun bitti': yalnızca tüm turlar, son rehine takası ve (varsa) Kumarbaz tahmini bittikten sonra çalışır
function newGame(){if(!confirm('Yeni oyun: kartlar yeniden dağıtılacak. Emin misin?'))return;clearInterval(tk);H.stage=null;H.endAt=0;H.leaders={};H.votes={};H.picks={A:null,B:null};H.hostages=[];H.gambler=null;H.gChoice=null;H.result=null;H.phase='lobby';H.final=false;H.players.forEach(p=>{delete p.card;delete p.room;delete p.sober});lobbyAll();$('hostp').hidden=true}
/* ----- Oyuncu (client) ----- */
function connectClient(){const g=++gen;openPeer(null,()=>{if(g!==gen||!me)return;conn=peer.connect('2r1b-'+code,{reliable:true});const L=()=>{if(g===gen)lost()};
 conn.on('open',()=>{if(g!==gen||!me)return;status('');conn.send({t:'join',pid:me.pid,name:me.name})});conn.on('data',m=>{if(g===gen)onC(m)});conn.on('close',L);conn.on('error',L)})}
function lost(){if(isHost||!me)return;status('Bağlantı koptu, yeniden deneniyor… ('+(++lostN)+') Vazgeçmek için "Ana ekran" düğmesine bas');$('lv').hidden=false;clearTimeout(rt);rt=setTimeout(connectClient,2500)}
function renderLobby(names){$('lc').textContent=code;$('ll').innerHTML='';names.forEach(n=>{const li=document.createElement('li');li.textContent=n;$('ll').appendChild(li)});
 $('hp').hidden=!isHost;$('lh').hidden=isHost;if(isHost){buildSetup();$('bd').disabled=names.length<minPlayers();$('bb').hidden=!(H&&H.test);updateSum(names.length)}}
function onC(m){
 if(m.t==='lobby'||m.t==='state'){joined=true;lostN=0}
 if(m.t==='bye'){if(!isHost)leaveToHome('Moderatör oyunu kapattı.');return}
 if(m.t==='lobby'){C={};renderLobby(m.names);show('lobby')}
 else if(m.t==='state'){const was=C.swapped,sw=(C.swapped&&m.card===C.card)||(m.card==='sarhos'&&m.last); // Sarhoş son turda otomatik ayılır
  if(m.stage!==C.stage)sel.clear();
  C={...m,swapped:sw,endAt:Date.now()+(m.left||0)*1000,hEnd:Date.now()+(m.hleft||0)*1000};show('game');setMode('closed');draw();panel();if(m.stage==='result')setMode('full',0,'Tüm kartlar açıldı');
  $('room').textContent=m.room+' ODASI';$('banner').textContent=`Tur ${m.round}/${m.total} · Rehine sayısı: ${m.hostages}`+(m.leaderName?` · Lider: ${m.leaderName}${m.leader?' (sen)':''}`:'');
  if(sw&&!was&&m.card==='sarhos'){vib([100,60,100]);ov('Ayıldın!','Sarhoş kartın otomatik olarak gerçek karakter kartınla değişti. Basılı tutarak yeni kartına bak.','Tamam')}}
 else if(m.t==='end'){vib([300,150,300,150,600]);ov('TUR BİTTİ',(C.leader?'Rehineleri sen seçeceksin ('+m.secs+' sn).':'Lider rehineleri seçiyor ('+m.secs+' sn).'),'Tamam')}
 else if(m.t==='over'){vib([300,150,300]);ov('OYUN BİTTİ','Son oda değişimi tamamlandı. Moderatör sonucu açıklasın.','Tamam')}
 else if(m.t==='moveNow'){vib([200,100,200,100,400]);ov('ODANI DEĞİŞTİR!','Rehine seçildin. '+m.to+' odasına geç ('+m.secs+' sn).','Tamam')}
 else if(m.t==='ajanReq'){vib([80,60,80]);ov('Ajan seni inceliyor',m.from+' kartını görmek istiyor. Yüz yüze göstermelisin.','Kartımı göster',()=>setMode('full',10000,m.from+'’a kartını göster (10 sn)'))}
 else if(m.t==='ajanOk'){C.used=true;vib(60);setMode('full',10000,m.target+' ile yüz yüze kartlarınızı gösterin (10 sn). Bu tur başka kimseyi inceleyemezsin.')}
 else if(m.t==='ajanNo'){C.used=true;draw();$('hint').textContent='Bu tur hakkını kullandın.'}
 else if(m.t==='err'){leaveToHome(m.m)}}
function ov(t,s,b,fn){$('ovt').textContent=t;$('ovs').textContent=s;$('ok').textContent=b;$('ov').style.display='flex';$('ok').onclick=()=>{$('ov').style.display='none';fn&&fn()}}
const faceId=()=>C.swapped?C.sober:C.card;
function draw(){if(!C.card)return;const open=mode!=='closed',f=faceId();$('fr').src='cards/'+f+'.jpg';$('card').classList.toggle('flip',open);
 const cv=$('cover');clearTimeout(ct);cv.style.height=((CV[f]-CV_UP)*100)+'%';
 if(mode==='color')cv.style.display='block';else if(pm==='color'&&mode==='closed')ct=setTimeout(()=>cv.style.display='none',450);else cv.style.display='none';
 $('ba').hidden=!C.card.startsWith('ajan');$('ba').disabled=!!C.used;
 $('bs').hidden=true;$('bf').hidden=!C.final;$('bm').hidden=true}
let cdI=0;
function setMode(m,ms,h){clearTimeout(tm);clearInterval(cdI);cdI=0;$('cdn').textContent='';pm=mode;mode=m;$('hint').textContent=h||(m==='closed'?hintClosed():'');draw();
 if(m==='color'&&ms){const t0=Date.now(),upd=()=>{const n=Math.max(1,Math.ceil((ms-(Date.now()-t0))/1000));$('cdn').textContent=n;$('hint').textContent='Sadece takım rengin görünüyor — kapanmasına '+n+'…'};upd();cdI=setInterval(upd,100)} // renk: 3-2-1 geri sayım
 if(ms)tm=setTimeout(()=>setMode('closed'),ms)}
const CN={baskan:'Başkan',bombaci:'Bombacı',ajan_mavi:'Mavi Ajan',ajan_kirmizi:'Kırmızı Ajan',casus_mavi:'Mavi Casus',casus_kirmizi:'Kırmızı Casus',stajyer:'Stajyer',maktul:'Maktül',kumarbaz:'Kumarbaz',takim_mavi:'Mavi Takım',takim_kirmizi:'Kırmızı Takım',sarhos:'Sarhoş'};
const cardLabel=(c,sober)=>c==='sarhos'&&sober?'Sarhoş (asıl kart: '+(CN[sober]||sober)+')':(CN[c]||c);
const TN={mavi:'MAVİ',kirmizi:'KIRMIZI'},CL={mavi:'#3d7bff',kirmizi:'#ff3b3b'};
function endView(p,d){const tx=(s,c,col)=>{const e=document.createElement('div');e.className=c||'t';e.textContent=s;if(col)e.style.color=col;p.appendChild(e)};
 if(d.stage==='gamble'){
  if(d.isG){tx('KUMARBAZ — hangi takım kazanacak?');['mavi','kirmizi'].forEach(k=>{const b=document.createElement('button');b.textContent=TN[k]+' TAKIM';b.style.background=CL[k];if(d.gChoice===k)b.style.outline='4px solid #fc3';b.onclick=()=>{act({t:'gamble',team:k});C.gChoice=k;panel()};p.appendChild(b)})}
  else tx('Kumarbaz '+d.gname+' kazananı tahmin ediyor…')}
 else if(d.stage==='gap'){tx('Kumarbaz '+d.gname+' '+TN[d.gChoice]+' takımı seçti','t',CL[d.gChoice]);tx('Moderatör sonucu açıklayacak…','sm')}
 else if(d.stage==='ready')tx('Tüm turlar bitti. Moderatör sonucu açıklayacak…','t');
 else if(d.stage==='result'&&d.result){const r=d.result;
  tx(r.same?`Bombacı ve Başkan ${r.room} odasında, bu yüzden kazanan`:'Bombacı ve Başkan farklı odada,');
  tx(TN[r.win]+(r.same?' TAKIM':' TAKIM KAZANDI'),'win',CL[r.win]);
  tx(`Başkan: ${r.pn} (${r.pr}) · Bombacı: ${r.bn} (${r.br})`,'sm');
  if(r.rooms)['A','B'].forEach(k=>{const e=document.createElement('div');e.className='sm';e.style.cssText='text-align:left;white-space:pre-line;margin-top:10px;padding:8px 10px;border:1px solid var(--mut);border-radius:10px';
   e.textContent=k+' ODASI\n'+r.rooms[k].map(x=>'• '+x.n+' — '+cardLabel(x.c,x.s)).join('\n');p.appendChild(e)});
  if(r.g)tx(`Kumarbaz ${r.g.name} ${TN[r.g.choice]} dedi — ${r.g.ok?'doğru bildi':'bilemedi'}`,'sm')}}
/* ----- Lider oylaması / rehine seçimi paneli ----- */
function act(m){if(isHost)hostAct(H.players.find(p=>p.self),m);else if(conn)conn.send(m)}
function panel(){const p=$('panel');p.innerHTML='';if(!C.card){p.hidden=true;return}
 const tx=(s,c)=>{const d=document.createElement('div');d.className=c||'sm';d.textContent=s;p.appendChild(d)};
 const bt=(s,fn,on,dis)=>{const b=document.createElement('button');b.textContent=s;if(on)b.className='sel';b.disabled=!!dis;b.onclick=fn;p.appendChild(b)};
 const nm=n=>n===me.name?n+' (sen)':n,k=C.hostages;
 if(['gamble','gap','ready','result'].includes(C.stage)){endView(p,{stage:C.stage,isG:C.isG,gname:C.gname,gChoice:C.gChoice,result:C.result})}
 else if(C.hostage&&['pick','swap'].includes(C.stage)){tx('ODANI DEĞİŞTİR → '+(C.room==='A'?'B':'A')+' odasına geç','t')}
 else if(C.stage==='vote'){
  if(C.leaderName)tx('Odanın lideri belli: '+C.leaderName+'. Diğer odanın oylaması bekleniyor…');
  else{tx('LİDER SEÇİMİ — odandan birine oy ver','t');C.all.forEach(n=>bt(nm(n),()=>{C.myVote=n;act({t:'vote',target:n});panel()},n===C.myVote))}}
 else if(C.stage==='pick'){
  if(C.leader&&!C.picked){tx(`REHİNE SEÇ — ${sel.size}/${k} (son seçimde otomatik gönderilir)`,'t');
   C.all.filter(n=>LEADER_HOSTAGE||n!==me.name).forEach(n=>bt(nm(n),()=>{if(sel.has(n))sel.delete(n);else if(sel.size<k)sel.add(n);if(sel.size===k){act({t:'pick',names:[...sel]});C.picked=true;sel.clear()}panel()},sel.has(n)))}
  else if(C.picked)tx('Seçimin kaydedildi. Diğer odanın lideri bekleniyor…');
  else tx('Rehineleri lider seçiyor: '+(C.leaderName||''))}
 else if(C.stage==='swap'){if(C.hostage)tx('ODANI DEĞİŞTİR → '+(C.room==='A'?'B':'A')+' odasına geç','t');else tx('Rehineler odalarını değiştiriyor…')}
 p.hidden=!p.children.length}
/* ----- Geri sayım (herkeste görünür) ----- */
setInterval(()=>{const T=$('timer');let st=isHost&&H?H.stage:C.stage,end=isHost&&H?H.endAt:C.endAt;
 if(C.card&&C.hostage&&C.hEnd>Date.now()){st='swap';end=C.hEnd} // rehine: kendi 15 sn sayacı
 if(!TIMED.includes(st)||!end){T.textContent='';return}
 const s=Math.max(0,Math.ceil((end-Date.now())/1000));
 T.textContent=({vote:'Lider seçimi',round:'Kalan süre',pick:'Rehine seçimi',swap:'Oda değiştirme',gamble:'Kumarbaz tahmini',gap:'Sonuç'})[st]+' '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0')},250);
/* ----- Karakter seti (moderatör, dağıtımdan önce) ----- */
const SETUP=[['ajanM','Mavi Ajan'],['ajanK','Kırmızı Ajan'],['casusM','Mavi Casus'],['casusK','Kırmızı Casus'],['stajyer','Stajyer'],['maktul','Maktül'],['sarhos','Sarhoş']];
function buildSetup(){const g=$('sg');if(g.children.length)return;const o={...OPT_DEF,...(LS('2r1b_opts')||{})};if(o.blue!==o.red)o.blue=o.red=o.blue!==''?o.blue:o.red;
 const row=(t,el)=>{const l=document.createElement('label'),s=document.createElement('span');s.textContent=t;l.append(s,el);g.appendChild(l)};
 SETUP.forEach(([k,t])=>{const c=document.createElement('input');c.type='checkbox';c.dataset.k=k;c.checked=!!o[k];row(t,c)});
 const kb=document.createElement('select');kb.dataset.k='kumarbaz';
 [['auto','Otomatik (takımlar eşit bölünemezse)'],['her','Her zaman var'],['yok','Hiç yok (gri takım yok)']].forEach(([v,t])=>{const op=document.createElement('option');op.value=v;op.textContent=t;kb.appendChild(op)});
 kb.value=o.kumarbaz;row('Kumarbaz (gri)',kb);
 [['blue','Düz Mavi takım kartı sayısı'],['red','Düz Kırmızı takım kartı sayısı']].forEach(([k,t])=>{const i=document.createElement('input');i.type='number';i.min=0;i.placeholder='oto';i.dataset.k=k;i.value=o[k];row(t,i)});
 const pr=document.createElement('div');pr.className='btns';
 [['Standart',{}],['Gri yok',{kumarbaz:'yok'}],['Hep Kumarbaz',{kumarbaz:'her'}],['Sade',{ajanM:false,ajanK:false,casusM:false,casusK:false,stajyer:false,maktul:false,sarhos:false}]].forEach(([t,v])=>{const b=document.createElement('button');b.className='ghost';b.textContent=t;b.onclick=()=>{setOpts({...OPT_DEF,...v});updateSum()};pr.appendChild(b)});
 g.appendChild(pr);g.addEventListener('input',e=>{const k=e.target.dataset.k;if(k==='blue'||k==='red')g.querySelector('[data-k='+(k==='blue'?'red':'blue')+']').value=e.target.value; // biri girilince diğeri aynı olur
 save('2r1b_opts',readOpts());updateSum()})}
function readOpts(){const o={};document.querySelectorAll('#sg [data-k]').forEach(e=>{o[e.dataset.k]=e.type==='checkbox'?e.checked:e.value});return o}
function setOpts(o){document.querySelectorAll('#sg [data-k]').forEach(e=>{if(e.type==='checkbox')e.checked=!!o[e.dataset.k];else e.value=o[e.dataset.k]==null?'':o[e.dataset.k]});save('2r1b_opts',readOpts())}
function updateSum(n){if(n==null)n=H?H.players.length:0;const r=planDeck(n,readOpts(),false),s=$('ssum');
 s.textContent=(TEST?'TEST MODU · ':'')+n+' oyuncu · '+(r.error?'⚠ '+r.error:'Mavi '+r.blue+' · Kırmızı '+r.red+(r.k?' · Kumarbaz':'')+(r.extra?' · Sarhoş (fazladan, takımlar eşit kalsın diye)':r.sober?' · Sarhoş':'')+(r.warn.length?' · ⚠ '+r.warn.join('; '):''));
 s.style.color=r.error?'#ff6b6b':''}
/* ----- Olaylar ----- */
function start(isH){const name=$('nm').value.trim();if(!name)return msg('Önce adını yaz');wl();
 NET=$('net').value;if(NET==='local'&&location.protocol==='https:')return msg('Yerel ağ modu için bu sayfayı PC sunucusundan aç: http://PC-IP:8080');
 clearTimeout(rt);clearInterval(tk);gen++;isHost=false;H=null;joined=false;lostN=0;joinFresh=!isH; // eski/yarım kalmış denemeler yeni oyunu bozmasın
 if(isH){code=normCode($('cd').value)||Array.from({length:4},()=>'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random()*23)]).join('');freshStart=true;ut=0;me={name,pid:uid(),code,host:true,play:!$('np').checked,net:NET};save('2r1b_me',me);hostInit()}
 else{code=normCode($('cd').value);if(!code)return msg('Oyun kodunu yaz');me={name,pid:uid(),code,host:false,play:true,net:NET};save('2r1b_me',me);connectClient()}}
$('bj').onclick=()=>start(false);$('bh').onclick=()=>start(true);
$('bd').onclick=deal;$('bb').onclick=()=>{const n=H.players.length+1;H.players.push({pid:'bot'+n,name:'Test '+n,bot:true});lobbyAll()};
$('b3').onclick=finish;$('b4').onclick=newGame;
$('bk').src='cards/back.jpg';$('cover').style.backgroundImage='url(cards/back.jpg)';
const HOLD_MS=3000; // kendi kartını açmak için basılı tutma süresi (ms)
let holdT=0,holdI=0,hx=0,hy=0;const st=$('stage');
let DEMO=false; // kart demosu açıkken true: hak sınırsız, ağ yok
const hintClosed=()=>DEMO?'DEMO: kartı '+HOLD_MS/1000+' sn basılı tut (sınırsız)':C.peek?'Kartına bakmak için kartı '+HOLD_MS/1000+' sn basılı tut — tek hakkın var (sadece 1. turda)':'Kartını artık açamazsın. Takım rengini "Rengimi göster" ile paylaşabilirsin';
function holdStop(){clearTimeout(holdT);clearInterval(holdI);holdT=0;holdI=0;if(mode==='closed')$('hint').textContent=hintClosed()}
st.addEventListener('pointerdown',e=>{wl();hx=e.clientX;hy=e.clientY;holdStop();if(mode!=='closed')return;
 if(!C.peek){vib(40);return} // hak bitti: kart açılmaz (ajan incelemesi ve 'Rengimi göster' bundan bağımsız)
 const t0=Date.now();holdI=setInterval(()=>{$('hint').textContent='Basılı tut… '+Math.max(1,Math.ceil((HOLD_MS-(Date.now()-t0))/1000))+' sn'},200);$('hint').textContent='Basılı tut… '+HOLD_MS/1000+' sn';
 holdT=setTimeout(()=>{clearInterval(holdI);holdI=0;holdT=0;if(mode==='closed'&&C.peek){C.peek=DEMO;if(!DEMO)act({t:'peek'});vib(25);setMode('peek')}},HOLD_MS)});
st.addEventListener('pointermove',e=>{if(holdT&&Math.hypot(e.clientX-hx,e.clientY-hy)>12)holdStop()}); // parmak kayarsa/kaydırırsa açma iptal
['pointerup','pointerleave','pointercancel'].forEach(t=>st.addEventListener(t,()=>{holdStop();if(mode==='peek')setMode('closed')}));
document.addEventListener('contextmenu',e=>e.preventDefault());
$('bc').onclick=()=>{wl();vib(20);setMode('color',3000)};
$('bf').onclick=()=>setMode('full',20000,'Kartın tamamı görünüyor (20 sn)');
$('ba').onclick=()=>{if(C.used)return;const n=$('names');n.innerHTML='';(C.mates||[]).forEach(a=>{const b=document.createElement('button');b.textContent=a;
 b.onclick=()=>{$('dlg').close();if(DEMO){setMode('full',10000,a+' ile yüz yüze kartlarınızı gösterin (10 sn) [DEMO]');return}if(isHost)hostAct(H.players.find(p=>p.self),{t:'ajan',target:a});else conn.send({t:'ajan',target:a})};n.appendChild(b)});$('dlg').showModal()};
$('cx').onclick=()=>$('dlg').close();
/* ----- Kart demosu (ana menü): oyun kurmadan kart görselini ve açılış davranışlarını dener; gerçek kart ekranının aynısıdır ----- */
function demoLoad(card){const sw=card==='sarhos';
 C={card,sober:sw?'takim_mavi':undefined,swapped:false,room:'A',peek:true,final:true,mates:['Ayşe','Mehmet','Zeynep'],all:['Ayşe','Mehmet','Zeynep']};
 $('dsw').hidden=!sw;$('dswc').checked=false;setMode('closed')}
$('bdemo').onclick=()=>{DEMO=true;const sel=$('dsel');if(!sel.children.length)Object.keys(CN).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=CN[k];sel.appendChild(o)});
 $('hostp').hidden=true;$('panel').hidden=true;$('timer').textContent='';$('room').textContent='DEMO';$('banner').textContent='Gerçek kart ekranının aynısı · sınırsız deneyebilirsin';$('cardbox').hidden=false;$('demobar').hidden=false;
 show('game');demoLoad(sel.value)};
$('dsel').onchange=()=>demoLoad($('dsel').value);
$('dswc').onchange=()=>{C.swapped=$('dswc').checked;draw()};
$('dreq').onclick=()=>ov('Ajan seni inceliyor','Ayşe kartını görmek istiyor. Yüz yüze göstermelisin.','Kartımı göster',()=>setMode('full',10000,'Ayşe’a kartını göster (10 sn)'));
$('dx').onclick=()=>{DEMO=false;clearTimeout(tm);clearInterval(cdI);cdI=0;mode='closed';$('cdn').textContent='';$('card').classList.remove('flip');$('demobar').hidden=true;C={};show('home')};
$('b5').onclick=()=>{if(H.stage==='pick'&&confirm('Rehine seçmeyen liderler için rehineler rastgele belirlensin mi?'))forcePick()};
$('lv').onclick=()=>{const b=$('lv'),h=isHost;
 if(b.dataset.arm){clearTimeout(lvT);leaveToHome(h?'Oyun kapatıldı.':'Oyundan çıkıldı.',h)}
 else{b.dataset.arm=1;b.textContent=h?'Emin misin? Oyun HERKES için kapanır — tekrar dokun':'Emin misin? Çıkmak için tekrar dokun';lvT=setTimeout(()=>{delete b.dataset.arm;b.textContent=LV0},4000)}}; // iki dokunuşla çıkış (confirm() bazı tarayıcılarda engelli)
window.addEventListener('error',e=>{status('Hata: '+(e.message||'bilinmiyor')+' — takılırsan "Ana ekran" düğmesine bas');if($('home').hidden)$('lv').hidden=false});
/* ----- Açılışta devam ----- */
$('net').value=(me&&me.net)||(/^\d+\.\d+\.\d+\.\d+$/.test(location.hostname)||location.hostname==='localhost'||location.hostname.endsWith('.local')?'local':'cloud'); // PC sunucusundan açıldıysa yerel ağ önerilir
if(me){try{$('nm').value=me.name;if(me.host){const s=LS('2r1b_host');if(s&&s.code===me.code&&s.H){code=me.code;hostInit(s.H);H.players.forEach(p=>{if(!p.self)p.conn=null})}else leaveToHome('')}else{code=me.code;connectClient()}}catch(e){leaveToHome('Kayıtlı oyun açılamadı, sıfırlandı.')}}
