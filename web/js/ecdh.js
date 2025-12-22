export class ECDHManager {
  constructor() {
    // Bitcoin'in kullandığı eğriyi kullanıyoruz (secp256k1)
    // window.elliptic kütüphanesinden gelir
    this.ec = new window.elliptic.ec('secp256k1');
    this.keyPair = null;
  }

  // 1. Kendi Anahtar Çiftimi (Private/Public) Oluştur
  generateKeys() {
    this.keyPair = this.ec.genKeyPair();
    // Public Key'i hex string olarak döndür (Ağda göndermek için)
    return this.keyPair.getPublic().encode('hex');
  }

  // 2. Sırrı Hesapla (Büyülü Kısım)
  // Karşı tarafın Public Key'i + Benim Private Key'im = ORTAK SIR
  computeSecret(otherPublicKeyHex) {
    if (!this.keyPair) {
      throw new Error("Önce kendi anahtarlarını oluşturmalısın!");
    }

    try {
      // Gelen hex string'i anahtar nesnesine çevir
      const otherKey = this.ec.keyFromPublic(otherPublicKeyHex, 'hex');
      
      // Çarpım işlemini yap (ECDH)
      const sharedPoint = this.keyPair.derive(otherKey.getPublic());
      
      // Çıkan sonucu hex string'e çevir (Bu bizim AES anahtarımız olacak)
      return sharedPoint.toString(16);
    } catch (e) {
      console.error("ECDH Hatası:", e);
      return null;
    }
  }
}