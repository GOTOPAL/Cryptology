import { UI } from './ui.js';
import { ChatWS } from './ws.js';
import { registry } from './ciphers/registry.js';
import { strToBytes, bytesToStr, bytesToB64, b64ToBytes, nowTs } from './util.js';

import { RSAManager } from './rsa.js';
import { ECDHManager } from './ecdh.js';
import { ECIESManager } from './ecies.js';

const otherEccKeys = {};

const ui = new UI();
const ws = new ChatWS();
const rsa = new RSAManager(); // RSA başlat
const ecdh = new ECDHManager();
const ecies = new ECIESManager();
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
      // ECC Anahtarlarını da üret (ECIES için gerekli)
      const myEccHex = ecdh.generateKeys(); // ecdh manager içinde keyPair oluşur
      // 2. Benim Public Key'imi herkese duyur
      ws.send({
        type: 'signal',
        subtype: 'all_pub_keys',
        payload: {
          rsa: myPubKey,
          ecc: myEccHex
        }
        
      });
      
      ui.addSystem("Public Key odaya dağıtıldı.");
      
      // Handshake butonunu aktif et
      document.getElementById('btn-handshake').disabled = false; // RSA
      document.getElementById('btn-ecdh').disabled = false;      // ECDH
      document.getElementById('btn-ecies').disabled = false; // ECIES

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

   // ECDH BUTONU (Modern Handshake)
  document.getElementById('btn-ecdh').addEventListener('click', () => {
    ui.addSystem("⚡ ECDH Süreci Başlatıldı...");
    
    // 1. Kendi parçamı oluştur
    const myEcdhPub = ecdh.generateKeys();
    
    // 2. Herkese "Benim parçam bu, sizinkini verin" de
    ws.send({
      type: 'signal',
      subtype: 'ecdh_offer',
      payload: myEcdhPub
    });
    
    ui.addSystem("ECDH Teklifi gönderildi. Cevap bekleniyor...");
  });

  // 4. ECIES BUTONU (YENİ EKLENEN KISIM)
  document.getElementById('btn-ecies').addEventListener('click', () => {
    // Rastgele bir anahtar üret
    const randomKey = "KEY-" + Math.floor(Math.random() * 1000000);
    ui.$sharedKey.value = randomKey;
    refreshE2EE();
    ui.addSystem(`ECIES için Anahtar Üretildi: ${randomKey}`);

    // ECC Keyleri olan kullanıcıları bul
    const users = Object.keys(otherEccKeys); 
    if (users.length === 0) {
        ui.addSystem("Kimsenin ECC anahtarı yok. (Sayfayı yenileyip tekrar bağlanın)");
        return;
    }

    users.forEach(user => {
        const targetEccPub = otherEccKeys[user];
        
        // ECIES ile şifrele (Paketle)
        const packageData = ecies.encrypt(targetEccPub, randomKey);
        
        if (packageData) {
            ws.send({
                type: 'signal',
                subtype: 'ecies_package',
                target: user,
                payload: packageData
            });
        }
    });
    ui.addSystem(`ECIES Paketi ${users.length} kişiye yollandı.`);
  });



  document.getElementById('btn-send-file').addEventListener('click', () => {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    
    // Kontroller
    if (!file) { ui.addSystem("Lütfen önce bir dosya seçin."); return; }
    if (!ws.connected) { ui.addSystem("Bağlı değilsiniz."); return; }
    if (!cipherInstance) { ui.addSystem("E2EE hazır değil. Önce anahtar anlaşması yapın."); return; }

    // Uyarı: Basit şifreler dosyayı bozar
    const { cipherName } = ui.getValues();
    if (['caesar', 'vigenere', 'rotate', 'hill', 'railfence', 'polybius'].includes(cipherName)) {
        ui.addSystem(`HATA: ${cipherName} algoritması dosya şifreleyemez! Dosya bozulur. Lütfen AES veya DES seçin.`);
        return;
    }

    // Dosyayı Binary (Byte Dizisi) Olarak Oku
    const reader = new FileReader();
    
    reader.onload = function(evt) {
        const rawData = new Uint8Array(evt.target.result);
        ui.addSystem(`Dosya okunuyor (${file.name}, ${rawData.length} bytes)...`);

        try {
            // 1. Şifrele (Seçili algoritma ile)
            const encryptedData = cipherInstance.encrypt(rawData, counter);
            
            // 2. Base64'e çevir (Ağdan metin olarak geçmesi için)
            const b64Data = bytesToB64(encryptedData);

            // 3. Sunucuya Gönder
            ws.send({
                type: 'file',
                filename: file.name,
                mime: file.type,
                payload: b64Data,
                cipher: { name: cipherName, counter: counter }
            });
            
            ui.addSystem(`Dosya şifrelendi ve gönderildi: ${file.name}`);
            counter++; // Sayacı artır
            
        } catch (e) {
            console.error(e);
            ui.addSystem("Dosya şifreleme hatası: " + e.message);
        }
    };
    
    // Okumayı başlat
    reader.readAsArrayBuffer(file);
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
      
    // 2. Sadece RSA değil, ECC anahtarını da yolluyoruz
      if (msg.event === 'joined' && rsa.publicKey && ecdh.keyPair) {
         const myEccHex = ecdh.keyPair.getPublic().encode('hex');
         
         ws.send({ 
            type: 'signal', 
            subtype: 'all_pub_keys', // 'pub_key' yerine bunu kullanıyoruz
            payload: { 
                rsa: rsa.publicKey, 
                ecc: myEccHex 
            } 
         });
      }
      return;
    }

    // 2. YENİ EKLENEN KISIM: SİNYAL (RSA) MESAJLARI
    if (msg.type === 'signal') {
       // YENİ: Toplu Anahtar Dağıtımı
        if (msg.subtype === 'all_pub_keys') {
            // RSA Key'i kaydet (Eski sistem çalışsın)
            otherUsersKeys[msg.from] = msg.payload.rsa;
            
            // ECC Key'i kaydet (Yeni sistem için)
            otherEccKeys[msg.from] = msg.payload.ecc;
            
            ui.addSystem(`${msg.from} kullanıcısının RSA ve ECC anahtarları alındı.`);
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

        if (msg.subtype === 'ecdh_offer') {
            ui.addSystem(`⚡ ${msg.from} ECDH teklifi yaptı.`);
            
            // 1. Bob kendi parçalarını oluşturur
            const myEcdhPub = ecdh.generateKeys();
            
            // 2. Alice'in parçasıyla hesaplama yapar
            const sharedSecret = ecdh.computeSecret(msg.payload);
            
            // 3. Hesaplanan sırrı kutuya yazar (Sadece ilk 32 karakteri alalım, çok uzun olmasın)
            const finalKey = "ECDH-" + sharedSecret.substring(0, 10);
            ui.$sharedKey.value = finalKey;
            refreshE2EE();
            
            // 4. Bob, Alice'e kendi parçasını gönderir
            ws.send({
                type: 'signal',
                subtype: 'ecdh_answer',
                payload: myEcdhPub,
                target: msg.from // Sadece teklif yapana dön
            });
            
            ui.addSystem(`Ortak Sır Hesaplandı: ${finalKey}`);
            // Yeşil efekt
            ui.$sharedKey.style.backgroundColor = "#ff9800";
            setTimeout(() => ui.$sharedKey.style.backgroundColor = "", 1500);
        }

        // YENİ: ECDH Cevabı Geldi (Bob cevap verdi, Alice hesaplıyor)
        if (msg.subtype === 'ecdh_answer') {
             // Alice, Bob'un parçasını alır ve hesaplar
             const sharedSecret = ecdh.computeSecret(msg.payload);
             
             const finalKey = "ECDH-" + sharedSecret.substring(0, 10);
             ui.$sharedKey.value = finalKey;
             refreshE2EE();

             ui.addSystem(`${msg.from} ile Ortak Sır Hesaplandı: ${finalKey}`);
             
             // Yeşil efekt
             ui.$sharedKey.style.backgroundColor = "#ff9800";
             setTimeout(() => ui.$sharedKey.style.backgroundColor = "", 1500);
        }

        if (msg.subtype === 'ecies_package') {
             // msg.payload şudur: { ephemeralPub, ciphertext }
             
             // Çözmek için kendi Private Key'im lazım (ecdh nesnesinin içinde)
             // ecdh.keyPair.getPrivate('hex') ile alabiliriz
             const myPriv = ecdh.keyPair.getPrivate('hex');
             
             const decryptedKey = ecies.decrypt(myPriv, msg.payload);
             
             if (decryptedKey) {
                ui.$sharedKey.value = decryptedKey;
                refreshE2EE();
                ui.addSystem(`${msg.from} ECIES ile GÜVENLİ ANAHTAR yolladı: ${decryptedKey}`);
                ui.$sharedKey.style.backgroundColor = "#00bcd4"; // Mavi
                setTimeout(() => ui.$sharedKey.style.backgroundColor = "", 1500);
             } else {
                 ui.addSystem(`ECIES Çözme Hatası!`);
             }
        }
        
        return;
    }

    // --- DOSYA ALMA KISMI (YENİ) ---
    if (msg.type === 'file') {
        if (!cipherInstance) { ui.addSystem(`Dosya geldi ama şifre çözücü hazır değil: ${msg.filename}`); return; }

        try {
            ui.addSystem(`${msg.from} şifreli dosya gönderdi: ${msg.filename}. Çözülüyor...`);

            // 1. Base64'ten Byte'a çevir
            const encryptedBytes = b64ToBytes(msg.payload);
            
            // 2. Şifreyi Çöz (Aynı anahtar ve sayaç ile)
            const decryptedBytes = cipherInstance.decrypt(encryptedBytes, msg.cipher?.counter || 0);
            
            // 3. Byte'ları Blob'a (Sanal Dosya) çevir
            const blob = new Blob([decryptedBytes], { type: msg.mime });
            
            // 4. İndirme Linki Oluştur
            const url = URL.createObjectURL(blob);
            
            // 5. Ekrana Bas (HTML Hack ile mesaja ekle)
            let htmlContent = `<div><strong>Dosya:</strong> ${msg.filename}</div>`;
            
            // Eğer resimse önizleme göster
            if (msg.mime.startsWith('image/')) {
                htmlContent += `<img src="${url}" style="max-width: 200px; border-radius: 8px; margin-top: 5px; display:block;">`;
            }
            
            htmlContent += `<div style="margin-top:5px;"><a href="${url}" download="${msg.filename}" style="color: #00bcd4; text-decoration: underline;">İndir / Kaydet</a></div>`;
            
            // Mesaj baloncuğu olarak ekle
            ui.addIncoming(msg.from, "DOSYA"); 
            
            // Son eklenen mesajın içeriğini HTML ile değiştir
            setTimeout(() => {
                const messagesDiv = document.getElementById('messages');
                const lastMsg = messagesDiv.lastElementChild;
                if(lastMsg) {
                    const contentDiv = lastMsg.querySelector('.text') || lastMsg; 
                    contentDiv.innerHTML = htmlContent;
                }
            }, 10);
            
        } catch (e) {
            console.error(e);
            ui.addSystem(`Dosya şifresi çözülemedi: ${e.message}`);
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

  // arayüzden seçili olan ismi (cipherName) gönderiyoruz.
  const { cipherName } = ui.getValues(); 
  ws.sendChat(b64, { name: cipherName, counter });
  
  ui.addOutgoing(text);
  ui.clearInput();
  counter++;
}
wire();