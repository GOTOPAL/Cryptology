import { BaseCipher } from './base.js';

// Caesar şifrelemesi: bayt seviyesinde (UTF-8 -> byte shift -> base64)
export class CaesarCipher extends BaseCipher {
  /** @param {number|string} key */
  constructor(key) {
    super(key);
    const n = Number(key);
    if (!Number.isFinite(n)) throw new Error('Caesar anahtar sayısal olmalı');
    // 0..255 arasında normalize
    this.shift = ((n % 256) + 256) % 256;
  }
  encrypt(plaintext, counter=0) {
    const out = new Uint8Array(plaintext.length);
    for (let i = 0; i < plaintext.length; i++) {
      out[i] = (plaintext[i] + this.shift) & 0xff;
    }
    return out;
  }
  decrypt(ciphertext, counter=0) {
    const out = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      out[i] = (ciphertext[i] - this.shift + 256) & 0xff;
    }
    return out;
  }
}