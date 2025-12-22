export class ECIESManager {
  constructor() {
    // secp256k1 eğrisini kullanıyoruz (Bitcoin standardı)
    this.ec = new window.elliptic.ec('secp256k1');
  }

  // --- ŞİFRELEME (Alice Yapar) ---
  // Hedef: Bob'un Public Key'i
  // Veri: Gönderilecek Gizli Mesaj (Örn: "KEY-12345")
  encrypt(recipientPubKeyHex, message) {
    try {
      // 1. Bob'un anahtarını formatla
      const bobKey = this.ec.keyFromPublic(recipientPubKeyHex, 'hex');

      // 2. Geçici (Ephemeral) bir anahtar çifti üret (Sadece bu işlem için!)
      const ephemeralKey = this.ec.genKeyPair();

      // 3. Ortak Sırrı (Shared Secret) hesapla
      // Ephemeral Private + Bob Public = SIR
      const sharedPoint = ephemeralKey.derive(bobKey.getPublic());
      const sharedSecret = sharedPoint.toString(16); // Hex string

      // 4. Bu sırrı kullanarak mesajı AES ile şifrele (CryptoJS kullanarak)
      // Not: Gerçek hayatta KDF (Key Derivation Function) kullanılır, burada basitleştiriyoruz.
      const ciphertext = CryptoJS.AES.encrypt(message, sharedSecret).toString();

      // 5. Paketle: [Geçici Public Key] + [Şifreli Mesaj]
      return {
        ephemeralPub: ephemeralKey.getPublic().encode('hex'), // Bob sırrı bulmak için buna muhtaç
        ciphertext: ciphertext
      };

    } catch (e) {
      console.error("ECIES Encrypt Hatası:", e);
      return null;
    }
  }

  // --- ÇÖZME (Bob Yapar) ---
  // Gelen Paket: { ephemeralPub, ciphertext }
  // Benim Anahtarım: Private Key (ecdh.js'deki anahtarı kullanacağız)
  decrypt(myPrivateKeyHex, packageData) {
    try {
      const { ephemeralPub, ciphertext } = packageData;

      // 1. Kendi Private Key'imi yükle
      const myKey = this.ec.keyFromPrivate(myPrivateKeyHex, 'hex');

      // 2. Gelen Geçici Public Key'i yükle
      const senderEphemeralKey = this.ec.keyFromPublic(ephemeralPub, 'hex');

      // 3. Aynı Ortak Sırrı hesapla
      // Benim Private + Ephemeral Public = AYNI SIR
      const sharedPoint = myKey.derive(senderEphemeralKey.getPublic());
      const sharedSecret = sharedPoint.toString(16);

      // 4. Sırrı kullanarak şifreyi çöz
      const bytes = CryptoJS.AES.decrypt(ciphertext, sharedSecret);
      const originalMessage = bytes.toString(CryptoJS.enc.Utf8);

      return originalMessage;

    } catch (e) {
      console.error("ECIES Decrypt Hatası:", e);
      return null;
    }
  }
}