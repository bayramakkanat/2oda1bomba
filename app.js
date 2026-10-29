'use strict';
/* ========================================================
   2 Oda 1 Bomba – Minimalist & Fiziksel Dostu Oyun Motoru
   Telefon = gizli kart + ortak saat. Gri roller kaldırıldı;
   sadece Sarhoş kaldı (son turda gerçek karakterine döner).
   ======================================================== */

// Renk paylaşımında kart şablonları (kart detayları rolü ele vermesin)
const SHARE = {
  ajan_mavi: 'takim_mavi',
  baskan: 'takim_mavi',
  casus_kirmizi: 'takim_mavi', // Kırmızı Casus: kartı mavi görünür, kırmızı için çalışır
  takim_mavi: 'takim_mavi',
  ajan_kirmizi: 'takim_kirmizi',
  bombaci: 'takim_kirmizi',
  casus_mavi: 'takim_kirmizi', // Mavi Casus: kartı kırmızı görünür, mavi için çalışır
  takim_kirmizi: 'takim_kirmizi',
  sarhos: 'sarhos'
};

const CV = {
  ajan_mavi: .842, ajan_kirmizi: .779, casus_mavi: .787, casus_kirmizi: .809,
  baskan: .782, bombaci: .788, takim_mavi: .797, takim_kirmizi: .791,
  sarhos: .81
};
const CV_UP = .010;

// Rehine takvimi: 3 turluk (basit) oyunda 3 - 2 - 1; 5 turlukta 5 - 4 - 3 - 2 - 1
const HOSTAGE_SCHEDULE = {
  3: [3, 2, 1],
  5: [5, 4, 3, 2, 1]
};

// Sarhoş ilk 2 tur sarhoş kalır, bu turun başında ayılır (3 turluk oyunda bu zaten son turdur)
const DRUNK_WAKE_ROUND = 3;

// Tur süreleri (saniye)
const ROUND_SECS_NORMAL = {
  3: [180, 120, 60],           // 3 dk, 2 dk, 1 dk
  5: [300, 240, 180, 120, 60]  // 5, 4, 3, 2, 1 dk
};
const ROUND_SECS_TEST = {
  3: [15, 10, 5],
  5: [15, 12, 10, 8, 5]
};

let SWAP_SECS = 45; // Rehine seçimi + oda değişimi süresi (saniye)
let TEST = false;

function applyTest(on) {
  TEST = !!on;
  SWAP_SECS = on ? 10 : 45;
}

const roundDuration = (rounds, r) => (TEST ? ROUND_SECS_TEST : ROUND_SECS_NORMAL)[rounds][r - 1];
const hostagesFor = (rounds, r) => HOSTAGE_SCHEDULE[rounds][r - 1];

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ----- Deste Planlayıcı (Mavi ve Kırmızı her zaman eşit) -----
   Başkan + Bombacı her zaman var. Ajan ve Casus çift olarak (1 Mavi + 1 Kırmızı) eklenir.
   Oyun hep çift sayıda oyuncuyla oynanır: oyuncu sayısı tekse moderatör oyuna girmeden yönetir (deal()).
   Sarhoş, rastgele bir düz takım kartının yerine geçer; DRUNK_WAKE_ROUND. turda o karakteri alır. */
const OPT_DEF = { ajan: true, casus: true, sarhos: true, blue: '', red: '' };

function planDeck(n, o) {
  o = { ...OPT_DEF, ...(o || {}) };
  if (n % 2 !== 0) return { error: 'Oyuncu sayısı çift olmalı (tek sayıda moderatör oyuna girmez).' };
  const d = ['baskan', 'bombaci'];
  if (o.ajan) d.push('ajan_mavi', 'ajan_kirmizi');
  if (o.casus) d.push('casus_mavi', 'casus_kirmizi');

  let rem = n - d.length;
  if (rem < 0) {
    return { error: `${n} oyuncuya ${d.length} özel kart sığmaz. Ajan veya Casus çiftini kapatın.` };
  }

  const num = v => (v === '' || v == null ? null : Math.max(0, Math.floor(+v) || 0));
  const bs = num(o.blue), rs = num(o.red);
  let blue, red;

  if (bs == null && rs == null) {
    blue = red = rem / 2; // oyuncu sayısı çift olduğu için kalan düz kart sayısı da çifttir
  } else {
    blue = red = (bs != null ? bs : rs);
    if (2 * blue > rem) return { error: `Mavi ${blue} + Kırmızı ${red} = ${2 * blue}, ama en fazla ${rem} düz kart sığıyor.` };
    const left = rem - 2 * blue;
    if (left > 0) return { error: `${left} kart boşta kalıyor, düz takım sayılarını artırın.` };
  }

  const cards = [...d, ...Array(blue).fill('takim_mavi'), ...Array(red).fill('takim_kirmizi')];

  let sober = null;
  if (o.sarhos) {
    const plain = cards.map((c, i) => (c.startsWith('takim') ? i : -1)).filter(i => i >= 0);
    if (plain.length) {
      const idx = plain[Math.floor(Math.random() * plain.length)];
      sober = cards[idx];
      cards[idx] = 'sarhos';
    }
  }

  return { cards, sober, blue, red };
}

function buildDeck(n, o) {
  const r = planDeck(n, o);
  if (r.error) throw new Error(r.error);
  return { deck: shuffle(r.cards), sober: r.sober };
}

/* ----- Ses (tek AudioContext, ilk dokunuşta açılır) & Titreşim ----- */
function vib(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}

let actx = null;
function unlockAudio() {
  try {
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return;
    if (!actx) actx = new A();
    if (actx.state === 'suspended') actx.resume();
  } catch (e) {}
}
['pointerdown', 'touchend', 'click'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));

function beep(type) {
  try {
    unlockAudio();
    const ctx = actx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'end') {
      // Tur bittiğinde tok bir uyarı sesi
      osc.type = 'square';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'start') {
      // Yeni tur başladığında yükselen melodi
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {}
}

// Aynı alarm hem moderatör mesajıyla hem yerel yedekle gelirse bir kez çalsın
let alarmDone = {};
function alarm(kind, key) {
  if (key) {
    if (alarmDone[key]) return;
    alarmDone[key] = 1;
  }
  beep(kind);
  if (kind === 'end') vib([300, 150, 300, 150, 600]);
  else if (kind === 'start') vib([150, 80, 250]);
}

/* ----- Durum ve Ağ Değişkenleri ----- */
const $ = i => document.getElementById(i);
const LS = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const uid = () => Math.random().toString(36).slice(2, 10);
const normCode = s => String(s || '').replace(/[çÇ]/g, 'c').replace(/[ğĞ]/g, 'g').replace(/[ıİ]/g, 'i').replace(/[öÖ]/g, 'o').replace(/[şŞ]/g, 's').replace(/[üÜ]/g, 'u').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);

// Ekran uyumasın: wake lock bir kez alınır, sayfa tekrar görünür olunca yenilenir
let wlock = null;
function wl() {
  try {
    if (!navigator.wakeLock || wlock || document.visibilityState !== 'visible') return;
    navigator.wakeLock.request('screen').then(l => {
      wlock = l;
      l.addEventListener('release', () => { wlock = null; });
    }).catch(() => {});
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && (me || DEMO)) wl();
});

// Telefonlarda tam ekran: tarayıcı kuralı gereği sadece dokunuş sırasında istenebilir (iPhone Safari desteklemez, README'de "Ana Ekrana Ekle" anlatılır)
const isTouch = () => window.matchMedia && matchMedia('(pointer: coarse)').matches;
function goFullscreen() {
  try {
    if (!isTouch() || document.fullscreenElement || document.webkitFullscreenElement) return;
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return;
    const pr = req.call(el, { navigationUI: 'hide' });
    if (pr && pr.then) {
      pr.then(() => {
        try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => {}); } catch (e) {}
      }).catch(() => {});
    }
  } catch (e) {}
}
// Oyuna girildikten sonra, tam ekrandan çıkılmışsa bir sonraki dokunuşta tekrar tam ekrana geçer
['click', 'touchend'].forEach(ev => document.addEventListener(ev, () => { if (me || DEMO) goFullscreen(); }, { passive: true }));

let gen = 0, pg = 0, joined = false, joinFresh = false, lostN = 0, lvT = 0;
const LV0 = '← Ana Ekran';
let peer, conn, rt, isHost = false, code = '', me = LS('2r1b_me'), H = null, C = {}, mode = 'closed';
let tk = 0, cdI = 0, hideT = 0, fadeT = 0, shareFade = 0;
let DEMO = false;

let NET = (me && me.net) || 'cloud';

const show = n => {
  ['home', 'lobby', 'game'].forEach(s => $(s).hidden = s !== n);
  $('lv').hidden = n !== 'lobby';
  if (n !== 'home') wl();
};
const msg = t => { $('herr').textContent = t; };
const status = t => { $('cs').textContent = t || ''; };

function openPeer(id, cb) {
  const g = ++pg;
  if (peer) try { peer.destroy(); } catch (e) {}
  LocalPeer.url = NET === 'relay' ? (window.RELAY_URL || '').replace(/\/+$/, '') + '/ws?room=' + encodeURIComponent(code) : '';
  const P = (NET === 'local' || NET === 'relay') ? LocalPeer : Peer;
  peer = id ? new P(id) : new P();
  peer.on('open', () => { if (g === pg) cb(); });
  peer.on('error', e => {
    if (g !== pg) return;
    if (isHost && e.type === 'unavailable-id') {
      status('Eski bağlantı temizleniyor, tekrar deneniyor…');
      setTimeout(() => { if (g === pg) openPeer(id, cb); }, 2500);
    } else if (!isHost && e.type === 'peer-unavailable') {
      if (joinFresh && !joined) return leaveToHome('Oyun bulunamadı: ' + code);
      lost();
    } else if (!isHost) {
      lost();
    } else {
      status('Bağlantı hatası: ' + e.type);
    }
  });
}

function leaveToHome(text, notify) {
  const pr = peer;
  if (isHost && notify && H) {
    try { bcast({ t: 'bye' }); } catch (e) {}
  }
  gen++; pg++;
  clearInterval(tk); clearTimeout(rt); clearInterval(cdI); clearTimeout(hideT); clearTimeout(fadeT);
  try { if (conn) conn.close(); } catch (e) {}
  setTimeout(() => { try { if (pr) pr.destroy(); } catch (e) {} }, notify ? 500 : 0);

  conn = null; peer = null; isHost = false; H = null; C = {}; me = null; code = ''; mode = 'closed'; shareFade = 0; alarmDone = {};
  document.body.classList.remove('cmode'); joined = false; joinFresh = false; lostN = 0;
  try { localStorage.removeItem('2r1b_me'); localStorage.removeItem('2r1b_host'); } catch (e) {}

  status(''); $('ov').style.display = 'none';
  const lv = $('lv'); delete lv.dataset.arm; lv.textContent = LV0;
  $('hostp').hidden = true; $('panel').hidden = true; $('timer').textContent = ''; $('banner').textContent = ''; $('room').textContent = '';
  $('card').classList.remove('flip');
  show('home'); msg(text || '');
}

/* ========================================================
   MODERATÖR (HOST) MANTIĞI
   ======================================================== */
const persist = () => save('2r1b_host', { code, H: { ...H, players: H.players.map(({ conn, ...p }) => p) } });
const byPid = id => (H && H.players ? H.players.find(p => p.pid === id) : null);
const left = () => (H && H.endAt ? Math.max(0, Math.ceil((H.endAt - Date.now()) / 1000)) : 0);
// Rehine sayısı, odada lider dışında yeterince kişi kalsın diye küçük oyunlarda (oda büyüklüğü - 1) ile sınırlanır
const need = r => Math.min(hostagesFor(H.rounds, r || H.round), Math.max(1, Math.floor(H.players.length / 2) - 1));

function hostInit(resume) {
  isHost = true;
  H = resume || {
    players: [], phase: 'lobby', round: 1, rounds: 3, stage: null,
    endAt: 0, final: false, test: !!$('tm').checked, result: null
  };
  if (H.stage === 'gamble') H.stage = 'ready'; // eski sürümden kalan kayıt
  applyTest(H.test);
  if (!resume && me.play) H.players.push({ pid: me.pid, name: me.name, self: true });

  openPeer('2r1b-' + code, () => {
    status('');
    peer.on('connection', c => {
      c.on('data', m => hostMsg(c, m));
      c.on('close', () => {
        const p = H.players.find(x => x.conn === c);
        if (!p) return;
        p.conn = null;
        if (H.phase === 'lobby') {
          // Lobide ayrılan oyuncu listeden hemen çıkar (tekrar bağlanırsa yeniden eklenir)
          H.players = H.players.filter(x => x !== p);
          lobbyAll();
        } else {
          hostRender(); // oyun sırasında koltuğu korunur, moderatör panelinde "bağlantısı kopan" sayısı görünür
        }
      });
    });
    if (H.phase === 'lobby') {
      lobbyAll();
    } else {
      H.players.forEach(sendState);
      hostRender();
      show('game');
      startTick();
    }
  });
}

function send(p, m) {
  if (p.bot) return;
  if (p.self) onC(m);
  else if (p.conn && p.conn.open) p.conn.send(m);
}
function bcast(m) { H.players.forEach(p => send(p, m)); }

function lobbyAll() {
  const names = H.players.map(p => p.name);
  H.players.forEach(p => send(p, { t: 'lobby', names }));
  if (!me.play) renderLobby(names);
  show('lobby');
  persist();
}

function hostMsg(c, m) {
  if (m.t !== 'join') return;

  let p = H.players.find(x => x.pid === m.pid);
  if (!p && H.phase !== 'lobby') {
    // Oyun başladıktan sonra tarayıcı verisi silinen oyuncu: aynı isimle, bağlantısı kopuk koltuğa geri dönebilir
    const seat = H.players.find(x => !x.self && !x.bot && x.name.toLowerCase() === String(m.name).toLowerCase() && !(x.conn && x.conn.open));
    if (seat) { seat.pid = m.pid; p = seat; }
  }
  if (!p) {
    if (H.phase !== 'lobby') { c.send({ t: 'err', m: 'Oyun başladı. Bağlantısı kopan oyuncular eski adlarıyla girebilir.' }); return; }
    if (H.players.some(x => x.name.toLowerCase() === m.name.toLowerCase())) { c.send({ t: 'err', m: 'Bu isim zaten alınmış.' }); return; }
    p = { pid: m.pid, name: m.name };
    H.players.push(p);
  }
  p.conn = c;
  if (H.phase === 'lobby') lobbyAll(); else sendState(p);
  persist();
}

function sendState(p) {
  if (!p.card) return;
  send(p, {
    t: 'state',
    card: p.card,
    initRoom: p.initRoom,
    round: H.round,
    total: H.rounds,
    hostages: need(),
    last: H.round === H.rounds,
    stage: H.stage,
    left: left(),
    final: H.final,
    result: H.stage === 'result' ? H.result : null
  });
}

function pushAll() {
  H.players.forEach(sendState);
  hostRender();
}

function deal() {
  let n = H.players.length;
  if (n < (TEST ? 4 : 6)) return alert(`En az ${TEST ? 4 : 6} oyuncu gerekli.`);

  // Oyun hep çift sayıda oyuncuyla oynanır: tek sayıda ise moderatör oyuna girmeden yönetir
  if (n % 2 !== 0) {
    if (!H.players.some(p => p.self)) {
      return alert(`Oyuncu sayısı tek (${n}) ve moderatör zaten oynamıyor. Oyun çift sayıda oynanır: bir oyuncu daha katılsın ya da biri çıksın.`);
    }
    if (!confirm(`${n} kişi var (tek sayı). Moderatör (sen) oyuna girmeden yönetsin, ${n - 1} kişiyle oynansın mı?`)) return;
    H.players = H.players.filter(p => !p.self);
    me.play = false;
    save('2r1b_me', me);
    n = H.players.length;
    if (n < (TEST ? 4 : 6)) return alert(`Moderatör çıkınca ${n} oyuncu kalıyor, en az ${TEST ? 4 : 6} gerekli.`);
  }
  let r;
  try {
    r = buildDeck(n, readOpts());
  } catch (e) {
    return alert(e.message);
  }

  H.rounds = +$('rn').value;
  H.round = 1;
  H.final = false;
  H.phase = 'game';
  H.result = null;

  // Başlangıç odaları eşit bölünür (A ve B)
  const order = shuffle(H.players.map((_, i) => i));
  const half = Math.ceil(n / 2);
  H.players.forEach((p, i) => {
    p.card = r.deck[i];
    p.sober = p.card === 'sarhos' ? r.sober : undefined;
    p.wasDrunk = false;
    p.initRoom = order.indexOf(i) < half ? 'A' : 'B';
  });

  H.stage = 'setup';
  H.endAt = 0;
  persist();
  pushAll();
  show('game');
}

function startRound(rNum) {
  H.round = rNum;
  H.stage = 'round';
  H.endAt = Date.now() + roundDuration(H.rounds, H.round) * 1000;

  // 3. tura girerken Sarhoş ayılır: kartı gerçek karakterine döner (3 turluk oyunda bu son turdur)
  const drunk = [];
  if (H.round >= DRUNK_WAKE_ROUND) {
    H.players.forEach(p => {
      if (p.card === 'sarhos' && p.sober) {
        p.card = p.sober;
        p.wasDrunk = true;
        drunk.push(p);
      }
    });
  }

  persist();
  pushAll();
  startTick();
  bcast({ t: 'sound', s: 'start', k: 'start-' + H.round });
  drunk.forEach(p => send(p, { t: 'drunk' }));
}

function endRound() {
  clearInterval(tk);
  if (H.round >= H.rounds) {
    // Tüm turlar tamamlandı: son rehineler gönderilir, sonra sonuçlar açılır
    readyForResult();
  } else {
    // Turlar arası rehine seçimi ve oda değişimi
    H.stage = 'swap';
    H.endAt = Date.now() + SWAP_SECS * 1000;
    persist();
    pushAll();
    startTick();
    bcast({ t: 'sound', s: 'end', k: 'end-' + H.round, msg: `${H.round}. TUR BİTTİ!\n${need()} rehine seçip odaları değiştirin.` });
  }
}

function nextRoundEarly() {
  if (H.stage === 'setup') {
    startRound(1);
  } else if (H.stage === 'swap') {
    startRound(H.round + 1);
  } else if (H.stage === 'round') {
    if (confirm('Mevcut tur süresini sonlandırıp rehine değişimine geçilsin mi?')) {
      endRound();
    }
  }
}

function readyForResult() {
  clearInterval(tk);
  H.stage = 'ready';
  H.endAt = 0;
  persist();
  pushAll();
  bcast({ t: 'sound', s: 'end', k: 'end-' + H.round, msg: `OYUN BİTTİ!\nSon ${need()} rehineyi odalarına gönderin, sonra herkes tek bir salonda toplansın.` });
}

function showResult() {
  clearInterval(tk);
  const pr = H.players.find(p => p.card === 'baskan');
  const bm = H.players.find(p => p.card === 'bombaci');

  // Sonuç ekranı: Başkan, Bombacı ve tüm oyuncuların rolleri
  H.result = {
    pn: pr ? pr.name : '—',
    bn: bm ? bm.name : '—',
    players: H.players.map(x => ({ n: x.name, c: x.card, d: !!x.wasDrunk }))
  };

  H.stage = 'result';
  H.final = true;
  H.endAt = 0;
  persist();
  pushAll();
  bcast({ t: 'sound', s: 'start', k: 'result' });
}

function newGame() {
  if (!confirm('Yeni oyun: Kartlar yeniden dağıtılacak. Emin misin?')) return;
  clearInterval(tk);
  H.stage = null; H.endAt = 0; H.result = null; H.phase = 'lobby'; H.final = false;
  H.players.forEach(p => { delete p.card; delete p.initRoom; delete p.sober; delete p.wasDrunk; });
  // Tek sayı yüzünden oyundan çıkarılan moderatör yeni oyunda tekrar oyuncu olarak eklenir
  if (me.wantPlay && !H.players.some(p => p.self)) {
    H.players.push({ pid: me.pid, name: me.name, self: true });
    me.play = true;
    save('2r1b_me', me);
  }
  lobbyAll();
  $('hostp').hidden = true;
}

function startTick() {
  clearInterval(tk);
  tk = setInterval(tick, 500);
  tick();
}

function tick() {
  if (!H) return;
  if (H.endAt && Date.now() >= H.endAt) {
    if (H.stage === 'round') endRound();
    else if (H.stage === 'swap') startRound(H.round + 1);
  }
  hostRender();
}

function hostRender() {
  if (!isHost || !H) return;
  $('hostp').hidden = false;
  $('cardbox').hidden = !me.play;

  const stageName = {
    setup: 'Odalara Geçiş Bekleniyor',
    round: `${H.round}. Tur Devam Ediyor`,
    swap: `Rehine Geçişi (${H.round}. Tur Sonu)`,
    ready: 'Oyun Bitti (Salonda Toplanın)',
    result: 'Kartlar ve Roller Açıldı'
  }[H.stage] || '';

  const s = left();
  const off = H.players.filter(p => !p.self && !p.bot && !(p.conn && p.conn.open)).length;
  $('hinfo').textContent = (TEST ? '[TEST MODU] ' : '') + `${stageName}` + (s ? ` · Kalan: ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '') + ` · Toplam Oyuncu: ${H.players.length}` + (off ? ` · ⚠ Bağlantısı kopan: ${off}` : '');

  $('bNext').hidden = !['setup', 'round', 'swap'].includes(H.stage);
  if (H.stage === 'setup') {
    $('bNext').textContent = 'Herkes Odasında, 1. Turu Başlat';
  } else if (H.stage === 'swap') {
    $('bNext').textContent = `Rehineler Geçti, ${H.round + 1}. Turu Başlat`;
  } else {
    $('bNext').textContent = 'Turu Erken Bitir';
  }
  $('bEnd').hidden = H.stage !== 'ready';

  if (!me.play) {
    const pn = $('panel');
    pn.innerHTML = '';
    if (['ready', 'result'].includes(H.stage)) {
      endView(pn, { stage: H.stage, hostages: need(), result: H.result });
    }
    pn.hidden = !pn.children.length;
  }
}

/* ========================================================
   OYUNCU (CLIENT) MANTIĞI
   ======================================================== */
function connectClient() {
  const g = ++gen;
  openPeer(null, () => {
    if (g !== gen || !me) return;
    conn = peer.connect('2r1b-' + code, { reliable: true });
    const L = () => { if (g === gen) lost(); };
    conn.on('open', () => {
      if (g !== gen || !me) return;
      status('');
      conn.send({ t: 'join', pid: me.pid, name: me.name });
    });
    conn.on('data', m => { if (g === gen) onC(m); });
    conn.on('close', L);
    conn.on('error', L);
  });
}

function lost() {
  if (isHost || !me) return;
  status('Bağlantı koptu, yeniden deneniyor… (' + (++lostN) + ')');
  $('lv').hidden = false;
  clearTimeout(rt);
  rt = setTimeout(connectClient, 2000);
}

function renderLobby(names) {
  $('lc').textContent = code;
  $('ll').innerHTML = '';
  const pTitle = document.querySelector('#lobby .panel-title');
  if (pTitle) pTitle.textContent = `👥 Katılan Oyuncular (${names.length})`;
  names.forEach(n => {
    const li = document.createElement('li');
    li.textContent = n;
    $('ll').appendChild(li);
  });
  $('hp').hidden = !isHost;
  $('lh').hidden = isHost;
  if (isHost) {
    buildSetup();
    $('bd').disabled = names.length < (TEST ? 4 : 6);
    $('bb').hidden = !(H && H.test);
    updateSum(names.length);
  }
}

function onC(m) {
  if (m.t === 'lobby' || m.t === 'state') { joined = true; lostN = 0; }
  if (m.t === 'bye') { if (!isHost) leaveToHome('Moderatör oyunu kapattı.'); return; }
  if (m.t === 'lobby') {
    C = {};
    alarmDone = {};
    renderLobby(m.names);
    show('lobby');
  } else if (m.t === 'sound') {
    alarm(m.s, m.k);
    if (m.msg) ov(m.msg.split('\n')[0], m.msg.split('\n')[1] || '', 'Tamam');
  } else if (m.t === 'drunk') {
    alarm('start', 'drunk');
    vib([200, 100, 200, 100, 400]);
    ov('AYILDIN!', 'Artık sarhoş değilsin: kartın gerçek karakterine döndü. Kartına basılı tutup bak.', 'Tamam');
  } else if (m.t === 'state') {
    if (m.stage === 'setup') alarmDone = {};
    C = { ...m, endAt: Date.now() + (m.left || 0) * 1000 };
    show('game');
    draw();
    panel();

    $('room').textContent = `BAŞLANGIÇ: ${m.initRoom} ODASI`;
    $('room').className = m.initRoom === 'A' ? 'room-badge room-a' : 'room-badge room-b';
    $('timer').className = 'game-timer';

    if (m.stage === 'result') {
      setMode('full', 0);
      $('timer').textContent = 'OYUN BİTTİ';
      $('banner').textContent = 'Kartlar açıldı! Koridorda toplanın.';
    } else if (m.stage === 'ready') {
      $('banner').textContent = `🏁 OYUN BİTTİ · Son ${m.hostages} rehineyi gönderin`;
    } else if (m.stage === 'setup') {
      $('banner').textContent = `Lütfen ${m.initRoom} Odasına Geçin`;
      $('timer').textContent = 'Odalara Geçiş Bekleniyor...';
    } else if (m.stage === 'swap') {
      $('banner').textContent = `🔔 ${m.round}. TUR BİTTİ!`;
      $('timer').className = 'game-timer swap';
    } else {
      $('banner').textContent = `${m.round}. TUR · Rehine Sayısı: ${m.hostages}`;
    }
  } else if (m.t === 'err') {
    leaveToHome(m.m);
  }
}

function ov(t, s, b, fn) {
  $('ovt').textContent = t;
  $('ovs').textContent = s;
  $('ok').textContent = b;
  $('ov').style.display = 'flex';
  $('ok').onclick = () => { $('ov').style.display = 'none'; fn && fn(); };
}

/* ----- Kart Görseli ve Açılma Modları ----- */
const CN = {
  baskan: 'Başkan', bombaci: 'Bombacı', ajan_mavi: 'Mavi Ajan', ajan_kirmizi: 'Kırmızı Ajan',
  casus_mavi: 'Mavi Casus', casus_kirmizi: 'Kırmızı Casus',
  takim_mavi: 'Mavi Takım', takim_kirmizi: 'Kırmızı Takım', sarhos: 'Sarhoş'
};
const cardLabel = (c, drunk) => (drunk ? `Sarhoştu → ${CN[c] || c}` : (CN[c] || c));

function draw() {
  if (!C.card) return;
  const cardId = C.card;
  // Renk paylaşımı sırasında ve kapanış animasyonunda, kartın kendi şeridi yerine ortak şablon şerit gösterilir
  const useShare = mode === 'color' || shareFade;
  const showFace = useShare ? (SHARE[cardId] || cardId) : cardId;

  $('fr').src = 'cards/' + showFace + '.jpg';
  $('card').classList.toggle('flip', mode !== 'closed');

  const cv = $('cover');
  if (useShare) {
    cv.style.height = ((CV[showFace] - CV_UP) * 100) + '%';
    cv.style.display = 'block';
  } else if (mode === 'show') {
    cv.style.height = '0';        // sadece geri sayım rozeti görünsün
    cv.style.display = 'block';
  } else {
    cv.style.display = 'none';
  }
}

function setMode(m, ms, hText) {
  clearInterval(cdI);
  clearTimeout(hideT);
  $('cdn').textContent = '';
  const was = mode;
  mode = m;

  if (was === 'color' && m === 'closed') {
    shareFade = 1; // kapanırken gerçek kart yüzü görünmesin
    clearTimeout(fadeT);
    fadeT = setTimeout(() => { shareFade = 0; draw(); }, 450);
  } else if (m !== 'closed') {
    shareFade = 0;
    clearTimeout(fadeT);
  }

  document.body.classList.toggle('cmode', m === 'color' || m === 'show');
  draw();

  if (m === 'closed') {
    $('hint').textContent = DEMO ? 'DEMO: Karta basılı tutarak açabilirsin' : 'Kendi kartına bakmak için basılı tut';
  } else if (hText) {
    $('hint').textContent = hText;
  }

  // Geri sayım sayacı (3..2..1)
  if (ms > 0) {
    const t0 = Date.now();
    const updateCountdown = () => {
      const leftSec = Math.max(1, Math.ceil((ms - (Date.now() - t0)) / 1000));
      $('cdn').textContent = leftSec;
    };
    updateCountdown();
    cdI = setInterval(updateCountdown, 100);
    hideT = setTimeout(() => setMode('closed'), ms);
  }
}

/* ----- Kart Etkileşimi (Hold to Peek, Release to Close) ----- */
const st = $('stage');

st.addEventListener('pointerdown', e => {
  wl();
  if (mode !== 'closed') return;
  setMode('peek', 0, 'Parmağını basılı tuttuğun sürece kart açık kalır');
});

const closePeek = () => {
  if (mode === 'peek') setMode('closed');
};
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => st.addEventListener(ev, closePeek));
document.addEventListener('contextmenu', e => e.preventDefault());

// Rengimi göster (3 sn ortak şablon şerit)
$('bc').onclick = () => {
  wl();
  vib(25);
  setMode('color', 3000, 'Sadece takım rengin görünüyor (3 sn)');
};

// Kartımı göster (5 sn tam kart paylaşımı)
$('bf').onclick = () => {
  wl();
  vib(25);
  setMode('show', 5000, 'Kartın herkese açık görünüyor (5 sn)');
};

/* ----- Oyun Sonu Paneli ----- */
function panel() {
  const p = $('panel');
  p.innerHTML = '';
  if (!C.card) { p.hidden = true; return; }

  if (['ready', 'result'].includes(C.stage)) {
    endView(p, { stage: C.stage, hostages: C.hostages, result: C.result });
  }
  p.hidden = !p.children.length;
}

function endView(p, d) {
  const tx = (s, c, col) => {
    const el = document.createElement('div');
    el.className = c || 't';
    el.textContent = s;
    if (col) el.style.color = col;
    p.appendChild(el);
  };

  if (d.stage === 'ready') {
    tx('🏁 TÜM TURLAR BİTTİ!', 'win');
    tx(`Son ${d.hostages} rehineyi odalarına gönderin.`, 't');
    tx('Sonra herkes tek bir salonda toplansın.', 't');
    tx('Moderatör sonuçları açıklayacak ve kartları açacak.', 'sm');
  } else if (d.stage === 'result' && d.result) {
    const r = d.result;
    tx('🎉 OYUN TAMAMLANDI!', 'win');
    tx(`Başkan: ${r.pn} · Bombacı: ${r.bn}`, 't');
    tx('Başkan ve Bombacı aynı odadaysa', 'sm');
    tx('KIRMIZI TAKIM KAZANIR', 't', '#ff3b3b');
    tx('Farklı odalardaysa', 'sm');
    tx('MAVİ TAKIM KAZANIR', 't', '#3d7bff');

    if (r.players) {
      const box = document.createElement('div');
      box.className = 'sm';
      box.style.cssText = 'text-align:left;white-space:pre-line;margin-top:10px;padding:10px;border:1px solid var(--fg-subtle);border-radius:10px';
      box.textContent = 'OYUNCU ROLLERİ:\n' + r.players.map(x => `• ${x.n}: ${cardLabel(x.c, x.d)}`).join('\n');
      p.appendChild(box);
    }
  }
}

/* ----- Geri Sayım Zamanlayıcısı (+ yerel yedek alarm) ----- */
setInterval(() => {
  const T = $('timer');
  const stage = isHost && H ? H.stage : C.stage;
  const end = isHost && H ? H.endAt : C.endAt;
  const rd = isHost && H ? H.round : C.round;

  if (!stage || !end || ['ready', 'result'].includes(stage)) {
    if (stage !== 'result') T.textContent = '';
    return;
  }

  const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
  const timeStr = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (stage === 'round') {
    T.textContent = `Kalan Süre: ${timeStr}`;
    T.className = 'game-timer';
    if (s === 0 && rd) alarm('end', 'end-' + rd); // moderatör mesajı gecikse bile süre dolunca çalar
  } else if (stage === 'swap') {
    T.textContent = `⏳ Rehine Değişimi: ${timeStr}`;
    T.className = 'game-timer swap';
    if (s === 0 && rd) alarm('start', 'start-' + (rd + 1));
  }
}, 250);

/* ----- Karakter Seti ve Ayarlar (Moderatör) ----- */
const SETUP_LIST = [
  ['ajan', 'Ajanlar (Mavi & Kırmızı Ajan)'],
  ['casus', 'Casuslar (Mavi & Kırmızı Casus)'],
  ['sarhos', 'Sarhoş (son turda ayılır)']
];

function buildSetup() {
  const g = $('sg');
  if (g.children.length) return;
  const o = { ...OPT_DEF, ...(LS('2r1b_opts') || {}) };

  const row = (t, el) => {
    const l = document.createElement('label'), s = document.createElement('span');
    s.textContent = t; l.append(s, el); g.appendChild(l);
  };

  SETUP_LIST.forEach(([k, t]) => {
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.dataset.k = k;
    c.checked = !!o[k];
    row(t, c);
  });

  [['blue', 'Düz Mavi takım sayısı'], ['red', 'Düz Kırmızı takım sayısı']].forEach(([k, t]) => {
    const i = document.createElement('input');
    i.type = 'number';
    i.min = 0;
    i.placeholder = 'oto';
    i.dataset.k = k;
    i.value = o[k] || '';
    row(t, i);
  });

  g.addEventListener('input', e => {
    const k = e.target.dataset.k;
    if (k === 'blue' || k === 'red') {
      const other = g.querySelector('[data-k=' + (k === 'blue' ? 'red' : 'blue') + ']');
      if (other) other.value = e.target.value;
    }
    save('2r1b_opts', readOpts());
    updateSum();
  });
}

function readOpts() {
  const o = {};
  document.querySelectorAll('#sg [data-k]').forEach(e => {
    o[e.dataset.k] = e.type === 'checkbox' ? e.checked : e.value;
  });
  return o;
}

function updateSum(n) {
  if (n == null) n = H ? H.players.length : 0;
  const opts = readOpts();
  const s = $('ssum');
  const pre = TEST ? 'TEST MODU · ' : '';
  let eff = n, note = '';
  if (n % 2 !== 0) {
    if (H && H.players.some(p => p.self)) {
      eff = n - 1;
      note = ' · Tek sayı: moderatör oyuna girmeden yönetecek';
    } else {
      s.textContent = pre + `${n} Oyuncu · ⚠ Tek sayı: bir oyuncu daha katılmalı ya da biri çıkmalı (oyun çift sayıda oynanır).`;
      s.style.color = '#ff6b6b';
      return;
    }
  }
  const r = planDeck(eff, opts);
  if (r.error) {
    s.textContent = pre + `${eff} Oyuncu · ⚠ ${r.error}`;
    s.style.color = '#ff6b6b';
  } else {
    const pair = (opts.ajan ? 1 : 0) + (opts.casus ? 1 : 0);
    let t = pre + `${eff} Oyuncu · Mavi: ${r.blue + pair + 1} · Kırmızı: ${r.red + pair + 1}`;
    if (r.sober) t += ' · Sarhoş var (3. turda ayılır)';
    else if (opts.sarhos) t += ' · (düz kart yok, Sarhoş eklenmedi)';
    s.textContent = t + note;
    s.style.color = '';
  }
}

/* ----- Giriş ve Başlatma Olayları ----- */
function start(isH) {
  const name = $('nm').value.trim();
  if (!name) return msg('Lütfen adını yaz.');
  goFullscreen();
  unlockAudio();
  wl();

  NET = $('net').value;
  if (NET === 'local' && location.protocol === 'https:') {
    return msg('Yerel ağ modu için bu sayfayı PC adresinden aç: http://PC-IP:8080');
  }
  if (NET === 'relay' && !window.RELAY_URL) {
    return msg('Bulut aracısı adresi ayarlı değil (config.js). Başka bir bağlantı türü seçin.');
  }

  clearTimeout(rt); clearInterval(tk); gen++; isHost = false; H = null; joined = false; lostN = 0; joinFresh = !isH;
  if (isH) {
    code = normCode($('cd').value) || Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)]).join('');
    me = { name, pid: uid(), code, host: true, play: !$('np').checked, wantPlay: !$('np').checked, net: NET };
    save('2r1b_me', me);
    hostInit();
  } else {
    code = normCode($('cd').value);
    if (!code) return msg('Oyun kodunu yazmalısın.');
    me = { name, pid: uid(), code, host: false, play: true, net: NET };
    save('2r1b_me', me);
    connectClient();
  }
}

$('bj').onclick = () => start(false);
$('bh').onclick = () => start(true);
$('bd').onclick = deal;
$('bb').onclick = () => {
  const n = H.players.length + 1;
  H.players.push({ pid: 'bot' + n, name: 'Test ' + n, bot: true });
  lobbyAll();
};

$('bNext').onclick = nextRoundEarly;
$('bEnd').onclick = showResult;
$('bNew').onclick = newGame;

$('bk').src = 'cards/back.jpg';
$('cover').style.backgroundImage = 'url(cards/back.jpg)';

/* ----- Kart Demosu (Menüden Kartları İnceleme) ----- */
function demoLoad(card) {
  const sw = card === 'sarhos';
  C = { card, sober: sw ? 'takim_mavi' : undefined, initRoom: 'A' };
  $('dsw').hidden = !sw;
  $('dswc').checked = false;
  setMode('closed');
}

$('bdemo').onclick = () => {
  DEMO = true;
  unlockAudio();
  const sel = $('dsel');
  if (!sel.children.length) {
    Object.keys(CN).forEach(k => {
      const o = document.createElement('option');
      o.value = k; o.textContent = CN[k];
      sel.appendChild(o);
    });
  }
  $('hostp').hidden = true; $('panel').hidden = true; $('timer').textContent = '';
  $('room').textContent = 'KART DEMOSU';
  $('banner').textContent = 'Kartları dilediğin gibi deneyebilirsin';
  $('cardbox').hidden = false; $('demobar').hidden = false;
  show('game');
  demoLoad(sel.value);
};

$('dsel').onchange = () => demoLoad($('dsel').value);
$('dswc').onchange = () => {
  if ($('dswc').checked) C.card = C.sober;
  else C.card = 'sarhos';
  draw();
};
$('dx').onclick = () => {
  DEMO = false;
  mode = 'closed';
  shareFade = 0;
  clearTimeout(fadeT); clearTimeout(hideT); clearInterval(cdI);
  $('cdn').textContent = '';
  document.body.classList.remove('cmode');
  $('card').classList.remove('flip');
  $('demobar').hidden = true;
  C = {};
  show('home');
};

/* ----- Çıkış / Temizleme Butonu ----- */
$('lv').onclick = () => {
  const b = $('lv'), h = isHost;
  if (b.dataset.arm) {
    clearTimeout(lvT);
    leaveToHome(h ? 'Oyun kapatıldı.' : 'Oyundan çıkıldı.', h);
  } else {
    b.dataset.arm = 1;
    b.textContent = h ? 'Emin misin? Oyun HERKES için kapanır!' : 'Emin misin? Çıkmak için tekrar bas';
    lvT = setTimeout(() => { delete b.dataset.arm; b.textContent = LV0; }, 4000);
  }
};

window.addEventListener('error', e => {
  status('Hata: ' + (e.message || 'bilinmiyor'));
  if ($('home').hidden) $('lv').hidden = false;
});

// PC sunucusundan açıldıysa yerel ağ otomatik önerilir
$('net').value = (me && me.net) || (/^\d+\.\d+\.\d+\.\d+$/.test(location.hostname) || location.hostname === 'localhost' || location.hostname.endsWith('.local') ? 'local' : (window.RELAY_URL ? 'relay' : 'cloud'));

if (me) {
  try {
    $('nm').value = me.name;
    if (me.host) {
      const s = LS('2r1b_host');
      if (s && s.code === me.code && s.H) {
        code = me.code;
        hostInit(s.H);
        H.players.forEach(p => { if (!p.self) p.conn = null; });
      } else {
        leaveToHome('');
      }
    } else {
      code = me.code;
      connectClient();
    }
  } catch (e) {
    leaveToHome('Kayıtlı oyun açılamadı, sıfırlandı.');
  }
}
