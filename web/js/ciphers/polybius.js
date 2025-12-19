import { BaseCipher } from './base.js';

export class PolybiusCipher extends BaseCipher {
  /** @param {string} key - Tabloyu karıştırmak için anahtar kelime */
  constructor(key) {
    super(key);
    
    // 1. Anahtara dayalı 256'lık karışık tabloyu oluştur
    // Önce anahtardaki harflerin byte değerlerini al
    const keyBytes = Array.from(String(key)).map(c => c.charCodeAt(0));
    
    // Set kullanarak tekrarları önle (Polybius kuralı: her harf 1 kere geçer)
    const uniqueKey = new Set(keyBytes);
    
    // Tabloyu doldurmaya başla
    this.grid = [];
    
    // Önce anahtardaki sayıları ekle
    uniqueKey.forEach(byte => {
        // Sadece 0-255 arası değerleri al (UTF-8 güvenliği)
        if (byte >= 0 && byte <= 255) {
            this.grid.push(byte);
        }
    });
    
    // Geri kalan sayıları (0'dan 255'e kadar) sırayla ekle
    // Anahtarda olmayanları sona dolduruyoruz
    for (let i = 0; i < 256; i++) {
        if (!uniqueKey.has(i)) {
            this.grid.push(i);
        }
    }
    
    // Grid şu an [K, E, Y, 0, 1, 2, ...] şeklinde 256 elemanlı düz bir liste.
    // Bunu sanal olarak 16x16 bir matris gibi düşüneceğiz.
  }

  encrypt(plaintext, counter=0) {
    // Çıktı boyutu 2 katı olacak (Her byte -> Satır + Sütun)
    const out = new Uint8Array(plaintext.length * 2);
    let outIdx = 0;

    for (let i = 0; i < plaintext.length; i++) {
      const byte = plaintext[i];
      
      // Bu byte'ın tablodaki yerini bul
      const index = this.grid.indexOf(byte);
      
      // Byte tabloda yoksa (imkansız ama güvenlik için) olduğu gibi bırak
      if (index === -1) {
          out[outIdx++] = 0; 
          out[outIdx++] = byte;
          continue;
      }

      // Satır ve Sütun hesapla (16x16 Grid)
      const row = Math.floor(index / 16);
      const col = index % 16;
      
      // Koordinatları kaydet (Bunlar şifreli verimiz)
      out[outIdx++] = row;
      out[outIdx++] = col;
    }
    return out;
  }

  decrypt(ciphertext, counter=0) {
    // Şifreli veri ikili paketler halindedir. Tek sayıdaysa bozuktur.
    const len = ciphertext.length;
    const out = new Uint8Array(Math.floor(len / 2));
    
    let outIdx = 0;
    for (let i = 0; i < len; i += 2) {
      if (i + 1 >= len) break; // Son tek byte kalırsa yoksay

      const row = ciphertext[i];
      const col = ciphertext[i+1];

      // Koordinattan index'e geri dön: (Satır * 16) + Sütun
      const index = row * 16 + col;

      // Tablodan orijinal byte'ı çek
      if (index >= 0 && index < 256) {
          out[outIdx++] = this.grid[index];
      } else {
          out[outIdx++] = 63; // '?' (Bozuk veri)
      }
    }
    return out;
  }
}