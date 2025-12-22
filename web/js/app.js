import { UI } from './ui.js';
import { ChatWS } from './ws.js';
import { registry } from './ciphers/registry.js';
import { strToBytes, bytesToStr, bytesToB64, b64ToBytes, nowTs } from './util.js';

import { RSAManager } from './rsa.js';

const ui = new UI();
const ws = new ChatWS();
const rsa = new RSAManager(); // RSA başlat
const otherUsersKeys = {};
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
      // 1. Bağlanır bağlanmaz RSA Anahtarlarını üret
      ui.addSystem("RSA Anahtarları üretiliyor...");
      const myPubKey = rsa.generateKeyPair();
      
      // 2. Benim Public Key'imi herkese duyur
      ws.send({
        type: 'signal',
        subtype: 'pub_key',
        payload: myPubKey
      });
      
      ui.addSystem("Public Key odaya dağıtıldı.");
      
      // Handshake butonunu aktif et
      document.getElementById('btn-handshake').disabled = false;

    } catch (e) {
      ui.addSystem('WS bağlanamadı: ' + e.message);
    }
  });


  // GÜVENLİ ANAHTAR DAĞITMA BUTONU
  document.getElementById('btn-handshake').addEventListener('click', () => {
    // 1. Rastgele güvenli bir AES anahtarı oluştur (Örn: "Secret-8821...")
    const randomKey = "KEY-" + Math.floor(Math.random() * 1000000);
    
    // 2. Kendi kutuma bu anahtarı yaz
    ui.$sharedKey.value = randomKey;
    refreshE2EE(); // Şifrelemeyi güncelle
    ui.addSystem(`Yeni Oturum Anahtarı Üretildi: ${randomKey}`);

    // 3. Odadaki HERKES için bu anahtarı onların kilidiyle şifreleyip gönder
    const users = Object.keys(otherUsersKeys);
    if (users.length === 0) {
      ui.addSystem("Odada anahtarı gönderilecek kimse yok (Public Key alınmadı).");
      return;
    }

    users.forEach(user => {
      const userPubKey = otherUsersKeys[user];
      // AES Anahtarını şifrele
      const encryptedSessionKey = rsa.encryptFor(randomKey, userPubKey);
      
      if (!encryptedSessionKey) {
        ui.addSystem(`${user} için şifreleme başarısız.`);
        return;
      }

      // Şifreli paketi gönder
      ws.send({
        type: 'signal',
        subtype: 'session_key',
        target: user, // Hedef kişi (Server bunu kullanabilir veya herkes alır)
        payload: encryptedSessionKey
      });
    });
    
    ui.addSystem(`Şifreli anahtar ${users.length} kişiye gönderildi.`);
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
    // 1. SİSTEM MESAJLARI
    if (msg.type === 'system') {
      ui.addSystem(msg.message || 'sistem');
      
      // YENİ: Biri odaya katıldığında (joined), ona Public Key'imi gönderiyorum ki beni tanısın
      if (msg.event === 'joined' && rsa.publicKey) {
         ws.send({ type: 'signal', subtype: 'pub_key', payload: rsa.publicKey });
      }
      return;
    }

    // 2. YENİ EKLENEN KISIM: SİNYAL (RSA) MESAJLARI
    if (msg.type === 'signal') {
        // Biri Public Key paylaştı
        if (msg.subtype === 'pub_key') {
            otherUsersKeys[msg.from] = msg.payload;
            ui.addSystem(`${msg.from} kullanıcısının Public Key'i alındı.`);
        }
        
        // Biri bana şifreli AES anahtarı attı
        if (msg.subtype === 'session_key') {
            const decryptedKey = rsa.decrypt(msg.payload);
            if (decryptedKey) {
                ui.$sharedKey.value = decryptedKey; // Kutuyu güncelle
                refreshE2EE(); // Şifrelemeyi yeni anahtarla yenile
                ui.addSystem(`${msg.from} sana GÜVENLİ ANAHTAR gönderdi: ${decryptedKey}`);
                
                // Görsel Efekt (Yeşil yanıp sönme)
                ui.$sharedKey.style.backgroundColor = "#29cc7a";
                ui.$sharedKey.style.color = "#000";
                setTimeout(() => {
                    ui.$sharedKey.style.backgroundColor = "";
                    ui.$sharedKey.style.color = "";
                }, 1500);
            }
        }
        return;
    }

    // 3. CHAT MESAJLARI
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

  // DEĞİŞEN KISIM BURASI:
  // Sabit 'caesar' yerine, arayüzden seçili olan ismi (cipherName) gönderiyoruz.
  const { cipherName } = ui.getValues(); 
  ws.sendChat(b64, { name: cipherName, counter });
  
  ui.addOutgoing(text);
  ui.clearInput();
  counter++;
}
wire();