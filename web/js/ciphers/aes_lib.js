import { BaseCipher } from './base.js';
import { bytesToStr, strToBytes } from '../util.js';

export class AESLibCipher extends BaseCipher {
  constructor(key) {
    super(key);
    this.keyStr = String(key);
  }

  encrypt(plaintext, counter=0) {
    // Byte dizisini string'e çevir
    const text = bytesToStr(plaintext);
    // AES-256 ile şifrele (CryptoJS otomatik tuzlama/salt yapar)
    const encrypted = window.CryptoJS.AES.encrypt(text, this.keyStr).toString();
    return strToBytes(encrypted);
  }

  decrypt(ciphertext, counter=0) {
    // Şifreli veri (Base64 string) byte olarak gelir, stringe çevir
    const cipherStr = bytesToStr(ciphertext);
    // Şifreyi çöz
    const bytes = window.CryptoJS.AES.decrypt(cipherStr, this.keyStr);
    // Sonucu UTF-8 string yap
    const decryptedText = bytes.toString(window.CryptoJS.enc.Utf8);
    return strToBytes(decryptedText);
  }
}