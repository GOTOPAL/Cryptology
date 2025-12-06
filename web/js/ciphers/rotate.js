import { BaseCipher } from './base.js';

export class RotateCipher extends BaseCipher {
  /** @param {number|string} key - 1 ile 7 arasında bir sayı */
  constructor(key) {
    super(key);
    const n = Number(key);
    // Bir byte 8 bit olduğu için mod 8 alıyoruz. 
    // Örn: 9 kere döndürmek ile 1 kere döndürmek aynıdır.
    this.amount = n % 8;
  }

  // Sola Döndürme (Left Rotate)
  // Örnek: 00000001 (1) -> 3 sola -> 00001000 (8)
  encrypt(plaintext, counter=0) {
    const out = new Uint8Array(plaintext.length);
    for (let i = 0; i < plaintext.length; i++) {
      const byte = plaintext[i];
      // Sola kaydır | Sağdan taşanı geri getir
      out[i] = ((byte << this.amount) | (byte >>> (8 - this.amount))) & 0xff;
    }
    return out;
  }

  // Sağa Döndürme (Right Rotate) - Şifreyi Çözme
  decrypt(ciphertext, counter=0) {
    const out = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      const byte = ciphertext[i];
      // Sağa kaydır | Soldan taşanı geri getir
      out[i] = ((byte >>> this.amount) | (byte << (8 - this.amount))) & 0xff;
    }
    return out;
  }
}