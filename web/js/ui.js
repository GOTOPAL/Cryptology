import { bytesToStr } from './util.js';

export class UI {
  constructor() {
    this.$wsUrl = document.getElementById('ws-url');
    this.$room = document.getElementById('room');
    this.$username = document.getElementById('username');
    this.$cipherName = document.getElementById('cipher-name');
    this.$sharedKey = document.getElementById('shared-key');
    this.$wsStatus = document.getElementById('ws-status');
    this.$e2eeStatus = document.getElementById('e2ee-status');
    this.$btnConnect = document.getElementById('btn-connect');
    this.$btnDisconnect = document.getElementById('btn-disconnect');
    this.$btnSend = document.getElementById('btn-send');
    this.$msgInput = document.getElementById('msg-input');
    this.$messages = document.getElementById('messages');
  }

  getValues() {
    return {
      url: this.$wsUrl.value.trim(),
      room: this.$room.value.trim() || 'general',
      username: this.$username.value.trim() || `user_${Math.floor(Math.random()*999)}`,
      cipherName: this.$cipherName.value,
      sharedKey: this.$sharedKey.value,
    };
  }

  setWSConnected(on) {
    this.$wsStatus.textContent = on ? 'bağlı' : 'kopuk';
    this.$wsStatus.className = on ? 'connected' : 'disconnected';
    this.$btnConnect.disabled = on;
    this.$btnDisconnect.disabled = !on;
    this.$btnSend.disabled = !on;
  }

  setE2EEReady(on) {
    this.$e2eeStatus.textContent = on ? 'hazır' : 'hazır değil';
    this.$e2eeStatus.className = on ? 'ready' : 'notready';
  }

  addSystem(text) { this._push('system', 'system', text); }
  addIncoming(from, text) { this._push('other', from, text); }
  addOutgoing(text) { this._push('you', 'you', text); }

  _push(kind, from, text) {
    const el = document.createElement('div');
    el.className = `msg ${kind}`;
    const f = document.createElement('div');
    f.className = 'from'; f.textContent = from;
    const b = document.createElement('div');
    b.className = 'bubble'; b.textContent = text;
    el.appendChild(f); el.appendChild(b);
    this.$messages.appendChild(el);
    this.$messages.scrollTop = this.$messages.scrollHeight;
  }

  clearInput() { this.$msgInput.value = ''; }
  getInput() { return this.$msgInput.value; }
}