export class RSAManager {
  constructor() {
    // JSEncrypt nesnesini başlat
    this.crypt = new JSEncrypt({ default_key_size: 1024 });
    this.publicKey = null;
    this.privateKey = null;
  }

  // 1. Kendi Anahtar Çiftini (Private/Public) Oluştur
  generateKeyPair() {
    console.log("RSA Anahtarları oluşturuluyor... (Biraz sürebilir)");
    this.privateKey = this.crypt.getPrivateKey();
    this.publicKey = this.crypt.getPublicKey();
    return this.publicKey;
  }

  // 2. Bir veriyi (AES Anahtarını), Karşı Tarafın Public Key'i ile şifrele
  encryptFor(data, recipientPublicKey) {
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(recipientPublicKey);
    return encryptor.encrypt(data); // Base64 döner
  }

  // 3. Bana gelen şifreli paketi Kendi Private Key'im ile çöz
  decrypt(encryptedData) {
    this.crypt.setPrivateKey(this.privateKey);
    return this.crypt.decrypt(encryptedData);
  }
}