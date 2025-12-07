import { BaseCipher } from './base.js';

// Yardımcı fonksiyon: Modüler Tersi Bulma (Extended Euclidean Algorithm)
function modInverse(a, m) {
  let [m0, x, y] = [m, 1, 0];
  if (m === 1) return 0;
  a = ((a % m) + m) % m;
  while (a > 1) {
    const q = Math.floor(a / m);
    [a, m] = [m, a % m];
    [x, y] = [y, x - q * y];
  }
  if (x < 0) x += m0;
  return x;
}

// Yardımcı fonksiyon: En büyük ortak bölen
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

export class HillCipher extends BaseCipher {
  /** @param {string} keyStr - Örn: "3 3 2 5" (4 sayı) */
  constructor(keyStr) {
    super(keyStr);
    
    // Anahtarı boşluklara göre bölüp sayıya çevirelim
    const nums = keyStr.trim().split(/\s+/).map(Number);
    
    if (nums.length !== 4) {
      throw new Error("Hill (2x2) için 4 adet sayı girmelisiniz. Örn: '3 3 2 5'");
    }

    // Şifreleme Matrisi [a b / c d]
    this.keyMatrix = nums; // [a, b, c, d]
    const [a, b, c, d] = this.keyMatrix;

    // Determinant Hesapla: ad - bc
    let det = (a * d - b * c) % 256;
    if (det < 0) det += 256;

    // Matrisin tersi alınabilir mi? (Determinant ile 256 aralarında asal olmalı)
    // 256 = 2^8 olduğu için, determinant sadece TEK sayı olmalı.
    if (gcd(det, 256) !== 1) {
      throw new Error(`Bu matris geçersiz (Determinant: ${det}). Lütfen determinantı tek sayı olan bir matris girin. (Örn: 3 3 2 5)`);
    }

    // Deşifreleme (Inverse) Matrisini Hesapla
    const detInv = modInverse(det, 256);
    
    // Ters Matris Formülü: detInv * [d -b / -c a]
    this.invMatrix = [
      (d * detInv) % 256,
      (-b * detInv) % 256,
      (-c * detInv) % 256,
      (a * detInv) % 256
    ].map(x => (x < 0 ? x + 256 : x)); // Negatifleri pozitife çevir
  }

  process(data, matrix) {
    // Veriyi kopyala (orijinalini bozmayalım)
    // Eğer uzunluk tek ise, padding (sonuna 0) eklememiz lazım çünkü 2'şerli işliyoruz
    let len = data.length;
    let input = data;
    
    // Blok boyutu 2 olduğu için tek sayıysa 1 byte ekle
    if (len % 2 !== 0) {
        const padded = new Uint8Array(len + 1);
        padded.set(data);
        padded[len] = 32; // Boşluk (padding)
        input = padded;
        len++;
    }

    const out = new Uint8Array(len);
    const [k0, k1, k2, k3] = matrix;

    for (let i = 0; i < len; i += 2) {
      const p1 = input[i];
      const p2 = input[i+1];

      // Matris Çarpımı
      // [k0 k1] * [p1]
      // [k2 k3]   [p2]
      out[i]   = (k0 * p1 + k1 * p2) % 256;
      out[i+1] = (k2 * p1 + k3 * p2) % 256;
    }
    
    // Şifre çözerken padding'i atmak gerekir ama basitlik için bırakıyoruz.
    return out; 
  }

  encrypt(plaintext, counter=0) {
    return this.process(plaintext, this.keyMatrix);
  }

  decrypt(ciphertext, counter=0) {
    return this.process(ciphertext, this.invMatrix);
  }
}