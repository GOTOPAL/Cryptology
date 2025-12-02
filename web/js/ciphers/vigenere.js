import { BaseCipher } from './base.js';
import { strToBytes } from '../util.js'; // String'i byte dizisine çevirmek için yardımcı fonksiyon

export class VigenereCipher extends BaseCipher {
  /** @param {string} key - Örn: "gizli anahtar" */
  constructor(key) {
    super(key);
    if (!key || String(key).length === 0) {
      throw new Error('Vigenere için boş olmayan bir metin anahtarı girin.');
    }
    // Anahtarı byte dizisine çeviriyoruz (UTF-8)
    this.keyBytes = strToBytes(String(key));
  }

  encrypt(plaintext, counter=0) {
    const out = new Uint8Array(plaintext.length);
    const kLen = this.keyBytes.length;

    for (let i = 0; i < plaintext.length; i++) {
      // Hangi anahtar byte'ını kullanacağımızı modülo ile seçiyoruz
      const keyByte = this.keyBytes[i % kLen];
      
      // (Veri + Anahtar) mod 256
      out[i] = (plaintext[i] + keyByte) & 0xff;
    }
    return out;
  }

  decrypt(ciphertext, counter=0) {
    const out = new Uint8Array(ciphertext.length);
    const kLen = this.keyBytes.length;

    for (let i = 0; i < ciphertext.length; i++) {
      const keyByte = this.keyBytes[i % kLen];
      
      // (Şifreli - Anahtar) mod 256. Negatif çıkmaması için +256 ekliyoruz.
      out[i] = (ciphertext[i] - keyByte + 256) & 0xff;
    }
    return out;
  }
}