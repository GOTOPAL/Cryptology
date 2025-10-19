import { UI } from './ui.js';
import { ChatWS } from './ws.js';
import { registry } from './ciphers/registry.js';
import { strToBytes, bytesToStr, bytesToB64, b64ToBytes, nowTs } from './util.js';

const ui = new UI();
const ws = new ChatWS();
let cipherInstance = null;
let counter = 0; // gelecekteki algoritmalar için mesaj sayacı

function refreshE2EE() {
  const { cipherName, sharedKey } = ui.getValues();
  try {
    cipherInstance = registry.get(cipherName, sharedKey);
    ui.setE2EEReady(true);
  } catch (e) {
    cipherInstance = null;
    ui.setE2EEReady(false);
  }
}

function wire() {
  refreshE2EE();

  ui.$btnConnect.addEventListener('click', async () => {
    const { url, username, room } = ui.getValues();
    try {
      await ws.connect(url, username, room);
    } catch (e) {
      ui.addSystem('WS bağlanamadı: ' + e.message);
      return;
    }
  });

  ui.$btnDisconnect.addEventListener('click', () => ws.disconnect());
  ui.$cipherName.addEventListener('change', refreshE2EE);
  ui.$sharedKey.addEventListener('input', refreshE2EE);

  ui.$btnSend.addEventListener('click', sendNow);
  ui.$msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNow(); }
  });

  ws.onopen = () => {
    ui.setWSConnected(true);
    ui.addSystem('WS bağlandı ve odaya katılma isteği gönderildi.');
  };
  ws.onclose = () => {
    ui.setWSConnected(false);
    ui.addSystem('WS bağlantısı kapandı.');
  };

  ws.onmessage = (msg) => {
    if (msg.type === 'system') {
      ui.addSystem(msg.message || 'sistem');
      return;
    }
    if (msg.type === 'chat') {
      if (!cipherInstance) { ui.addSystem('E2EE hazır değil, mesaj çözülemedi.'); return; }
      try {
        const ct = b64ToBytes(msg.payload);
        const pt = cipherInstance.decrypt(ct, msg?.cipher?.counter ?? 0);
        ui.addIncoming(msg.from || '???', bytesToStr(pt));
      } catch (e) {
        ui.addSystem('Mesaj çözülemedi: ' + e.message);
      }
      return;
    }
  };
}

function sendNow() {
  const text = ui.getInput();
  if (!text) return;
  if (!ws.connected) { ui.addSystem('Bağlı değilsiniz.'); return; }
  if (!cipherInstance) { ui.addSystem('E2EE hazır değil.'); return; }

  const pt = strToBytes(text);
  const ct = cipherInstance.encrypt(pt, counter);
  const b64 = bytesToB64(ct);
  ws.sendChat(b64, { name: 'caesar', counter });
  ui.addOutgoing(text);
  ui.clearInput();
  counter++;
}

wire();