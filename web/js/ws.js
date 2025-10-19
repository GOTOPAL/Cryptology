export class ChatWS {
  constructor() {
    this.ws = null;
    this.onopen = () => {};
    this.onclose = () => {};
    this.onmessage = (_msg) => {};
    this.onerror = (e) => console.error(e);
  }

  get connected() { return this.ws && this.ws.readyState === WebSocket.OPEN; }

  async connect(url, username, room) {
    if (this.connected) return;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.send({ type: 'join', username, room });
      this.onopen();
    };
    this.ws.onclose = () => { this.onclose(); };
    this.ws.onerror = (e) => { this.onerror(e); };
    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        this.onmessage(msg);
      } catch (e) { console.warn('invalid json', e); }
    };

    // bekleme: bağlanana kadar
    await new Promise((res, rej) => {
      const t = setInterval(() => {
        if (this.connected) { clearInterval(t); res(); }
      }, 20);
      setTimeout(() => { clearInterval(t); rej(new Error('WS timeout')); }, 5000);
    });
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }

  send(obj) {
    if (!this.connected) throw new Error('WS bağlı değil');
    this.ws.send(JSON.stringify(obj));
  }

  sendChat(payloadB64, cipher) {
    this.send({ type: 'chat', payload: payloadB64, cipher, ts: Date.now() });
  }
}