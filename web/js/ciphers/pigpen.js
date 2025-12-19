import { BaseCipher } from './base.js';
import { bytesToStr, strToBytes } from '../util.js';

export class PigpenCipher extends BaseCipher {
  constructor(key) {
    super(key);
    // Anahtara ihtiyacımız yok (Pigpen sabittir) ama sınıf yapısı bozulmasın diye tutuyoruz.
    
    // Pigpen Haritası (Latin -> Unicode Şekil)
    this.toPigpen = {
      'a': '┘', 'b': '⊔', 'c': '└',
      'd': '⊐', 'e': '□', 'f': '⊏',
      'g': '┐', 'h': '⊓', 'i': '┌',
      'j': '╯', 'k': '⋃', 'l': '╰', // Noktalı versiyonlar (benzerleri)
      'm': '⋐', 'n': '▣', 'o': '⋑',
      'p': '╮', 'q': '⋂', 'r': '╭',
      's': '∨', 't': '>', 'u': '<', 'v': '∧', // X şekilleri
      'w': '✇', 'x': '≫', 'y': '≪', 'z': '⨂'
    };

    // Ters Harita (Unicode Şekil -> Latin) - Çözmek için
    this.toLatin = {};
    for (const [char, symbol] of Object.entries(this.toPigpen)) {
      this.toLatin[symbol] = char;
    }
  }

  encrypt(plaintext, counter=0) {
    // 1. Byte dizisini yazıya çevir
    const text = bytesToStr(plaintext).toLowerCase();
    let result = "";

    // 2. Harf harf gez, haritadan şekli bul
    for (const char of text) {
      if (this.toPigpen[char]) {
        result += this.toPigpen[char];
      } else {
        // Harf değilse (boşluk, sayı) olduğu gibi bırak
        result += char;
      }
    }

    // 3. Oluşan şekilli yazıyı tekrar byte'a çevir (UTF-8)
    return strToBytes(result);
  }

  decrypt(ciphertext, counter=0) {
    // 1. Şifreli byte dizisini (şekilleri) yazıya çevir
    const text = bytesToStr(ciphertext);
    let result = "";

    // 2. Şekil şekil gez, ters haritadan harfi bul
    for (const char of text) {
      if (this.toLatin[char]) {
        result += this.toLatin[char];
      } else {
        result += char;
      }
    }

    // 3. Yazıyı byte'a çevir
    return strToBytes(result);
  }
}