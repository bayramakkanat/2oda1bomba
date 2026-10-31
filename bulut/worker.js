/* 2 Oda 1 Bomba – bulut aracısı (Cloudflare Workers + Durable Object)
   Telefonlar WebSocket ile buraya bağlanır; mesajlar odanın moderatörü ile oyuncular arasında iletilir.
   Her oyun kodu ayrı bir Durable Object'tir, oyunlar birbirine karışmaz.
   Protokol relay.js (istemci) ile uyumludur (reg, con, ack, d, cl, err, open). */
import { DurableObject } from 'cloudflare:workers';

// Sadece izin verilen sitelerden (ALLOWED_ORIGINS, wrangler.toml) gelen tarayıcı bağlantıları kabul edilir; böylece başkası aracınızı/kotanızı kullanamaz.
// Liste boşsa kontrol yapılmaz. Yerel test için localhost her zaman serbesttir.
function originAllowed(request, env) {
  const list = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!list.length) return true;
  const origin = request.headers.get('Origin') || '';
  return list.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return new Response('ok');
    if (url.pathname !== '/ws') return new Response('2 Oda 1 Bomba aracisi calisiyor.');
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('WebSocket gerekli', { status: 426 });
    if (!originAllowed(request, env)) return new Response('Bu siteden baglanti kabul edilmiyor', { status: 403 });

    const room = (url.searchParams.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    if (!room) return new Response('Oyun kodu (room) gerekli', { status: 400 });

    return env.HUB.get(env.HUB.idFromName(room)).fetch(request);
  }
};

export class Hub extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // İstemcinin 25 sn'de bir gönderdiği "ping"e Durable Object uyandırılmadan "pong" döner
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    // Uyku (hibernation) modunda bellek silinebilir: kimlik ve bağlantılar WebSocket'in kendi eklentisinde tutulur
    server.serializeAttachment({ id: null, links: {} });
    return new Response(null, { status: 101, webSocket: client });
  }

  find(id) {
    for (const w of this.ctx.getWebSockets()) {
      const a = w.deserializeAttachment();
      if (w.readyState === 1 && a && a.id === id) return w;
    }
    return null;
  }

  out(w, o) {
    try { if (w && w.readyState === 1) w.send(JSON.stringify(o)); } catch (e) {}
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string') return;
    let m;
    try { m = JSON.parse(raw); } catch (e) { return; }
    const a = ws.deserializeAttachment() || { id: null, links: {} };

    if (m.k === 'reg') {
      const id = m.id ? String(m.id).slice(0, 40) : '';
      const old = id ? this.find(id) : null;
      if (!id || (old && old !== ws)) return this.out(ws, { k: 'err', type: 'unavailable-id' });
      a.id = id;
      ws.serializeAttachment(a);
      return this.out(ws, { k: 'open' });
    }
    if (!a.id) return;

    if (m.k === 'con') {
      const t = this.find(m.to);
      if (!t || t === ws) return this.out(ws, { k: 'err', type: 'peer-unavailable' });
      const ta = t.deserializeAttachment();
      a.links[m.cid] = m.to;
      ws.serializeAttachment(a);
      ta.links[m.cid] = a.id;
      t.serializeAttachment(ta);
      this.out(t, { k: 'con', cid: m.cid, from: a.id });
      return this.out(ws, { k: 'ack', cid: m.cid });
    }

    const other = a.links[m.cid];
    if (!other) return;
    const o = this.find(other);

    if (m.k === 'd') {
      this.out(o, { k: 'd', cid: m.cid, m: m.m });
    } else if (m.k === 'cl') {
      this.out(o, { k: 'cl', cid: m.cid });
      delete a.links[m.cid];
      ws.serializeAttachment(a);
      if (o) {
        const oa = o.deserializeAttachment();
        if (oa && oa.links) { delete oa.links[m.cid]; o.serializeAttachment(oa); }
      }
    }
  }

  drop(ws) {
    const a = ws.deserializeAttachment();
    if (!a || !a.id) return;
    for (const cid of Object.keys(a.links || {})) {
      const o = this.find(a.links[cid]);
      if (o) {
        this.out(o, { k: 'cl', cid });
        const oa = o.deserializeAttachment();
        if (oa && oa.links) { delete oa.links[cid]; o.serializeAttachment(oa); }
      }
    }
  }

  async webSocketClose(ws, code) {
    this.drop(ws);
    try { ws.close(code && code !== 1005 && code !== 1006 ? code : 1000, 'bye'); } catch (e) {}
  }

  async webSocketError(ws) {
    this.drop(ws);
  }
}
