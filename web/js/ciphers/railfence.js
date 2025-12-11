import { BaseCipher } from './base.js';

export class RailFenceCipher extends BaseCipher {
  /** @param {number|string} key - Ray sayısı (Örn: 2, 3) */
  constructor(key) {
    super(key);
    this.numRails = parseInt(key);

    if (isNaN(this.numRails) || this.numRails < 2) {
      throw new Error("Rail Fence için anahtar en az 2 olan bir sayı olmalıdır.");
    }
  }

  // Zikzak örüntüsünü oluşturan yardımcı fonksiyon
  // Bize her adımda hangi raya (satıra) gitmemiz gerektiğini söyler.
  _getRailPattern(length) {
    const pattern = new Array(length);
    let rail = 0;
    let direction = 1; // 1: Aşağı, -1: Yukarı

    for (let i = 0; i < length; i++) {
      pattern[i] = rail;
      
      // Yön değiştirme mantığı (Üst veya alt sınıra çarpınca)
      if (rail === 0) direction = 1;
      else if (rail === this.numRails - 1) direction = -1;
      
      rail += direction;
    }
    return pattern;
  }

  encrypt(plaintext, counter=0) {
    if (this.numRails >= plaintext.length) {
        // Eğer ray sayısı metinden uzunsa şifreleme olmaz, kopyasını döndür
        return new Uint8Array(plaintext);
    }

    // Raylar için boş kutular hazırla (Her biri byte dizisi tutacak)
    const rails = Array.from({ length: this.numRails }, () => []);
    
    // Her byte'ın hangi raya gideceğini hesapla
    const pattern = this._getRailPattern(plaintext.length);

    for (let i = 0; i < plaintext.length; i++) {
      const targetRail = pattern[i];
      rails[targetRail].push(plaintext[i]);
    }

    // Tüm rayları sırasıyla birleştir (Flatten)
    // [Ray0] + [Ray1] + [Ray2]...
    const out = new Uint8Array(plaintext.length);
    let index = 0;
    for (const rail of rails) {
      out.set(rail, index);
      index += rail.length;
    }
    
    return out;
  }

  decrypt(ciphertext, counter=0) {
    if (this.numRails >= ciphertext.length) {
        return new Uint8Array(ciphertext);
    }

    const len = ciphertext.length;
    
    // 1. ADIM: Hangi raya kaç karakter düşeceğini hesapla (İskelet oluştur)
    const pattern = this._getRailPattern(len);
    const railCounts = new Array(this.numRails).fill(0);
    for (const p of pattern) {
      railCounts[p]++;
    }

    // 2. ADIM: Şifreli veriyi (ciphertext) bu sayılara göre parçalayıp raylara doldur
    const rails = [];
    let offset = 0;
    for (let r = 0; r < this.numRails; r++) {
      // ciphertext'ten bu raya ait olan kısmı kesip al
      const count = railCounts[r];
      rails[r] = Array.from(ciphertext.slice(offset, offset + count)); 
      // Array.from kullandık ki shift() (ilk elemanı alma) işlemini kolay yapalım
      offset += count;
    }

    // 3. ADIM: Zikzak örüntüsünü tekrar takip et ve raylardan sırasıyla karakter çek
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      const targetRail = pattern[i];
      // O sıradaki rayın en başındaki karakteri al ve sil
      out[i] = rails[targetRail].shift();
    }

    return out;
  }
}