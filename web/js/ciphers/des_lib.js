import { BaseCipher } from './base.js';
import { bytesToStr, strToBytes, bytesToB64, b64ToBytes } from '../util.js';

export class DESLibCipher extends BaseCipher {
  constructor(key) {
    super(key);
    this.keyStr = String(key);
  }

  encrypt(plaintext, counter=0) {
    // 1. Byte dizisini string'e çevir (CryptoJS string sever)
    // Not: Gerçek binary verilerde WordArray dönüşümü gerekir ama 
    // ders projesi için Latin1/Utf8 string dönüşümü yeterlidir.
    const text = bytesToStr(plaintext);
    
    // 2. Kütüphane ile şifrele
    // CryptoJS global nesnesini index.html'den alıyoruz
    const encrypted = window.CryptoJS.DES.encrypt(text, this.keyStr).toString();
    
    // 3. Çıkan Base64 string'i tekrar byte dizisine çevir (Proje standardı)
    return strToBytes(encrypted);
  }

  decrypt(ciphertext, counter=0) {
    // 1. Byte dizisini string'e çevir (Bu aslında şifreli bir Base64 stringidir)
    const cipherStr = bytesToStr(ciphertext);
    
    // 2. Kütüphane ile çöz
    const bytes = window.CryptoJS.DES.decrypt(cipherStr, this.keyStr);
    
    // 3. Sonucu UTF-8 stringe, oradan byte dizisine çevir
    const decryptedText = bytes.toString(window.CryptoJS.enc.Utf8);
    
    return strToBytes(decryptedText);
  }
}