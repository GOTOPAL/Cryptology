import { BaseCipher } from './base.js';

export class ColumnarCipher extends BaseCipher {
  /** @param {string} key - Örn: "ZEBRA" */
  constructor(key) {
    super(key);
    this.keyStr = String(key);
    if (this.keyStr.length === 0) throw new Error("Anahtar boş olamaz");
    
    this.numCols = this.keyStr.length;
    
    // Anahtara göre sütun okuma sırasını belirle
    // Örn: "HACK" -> A(1), C(2), H(0), K(3) -> Sıra: [1, 2, 0, 3]
    // Eğer harfler aynıysa (APPLE), orjinal sırayı korumak için index'e de bakıyoruz.
    this.order = Array.from(this.keyStr)
        .map((char, index) => ({ code: char.charCodeAt(0), index }))
        .sort((a, b) => a.code - b.code || a.index - b.index)
        .map(obj => obj.index);
  }

  encrypt(plaintext, counter=0) {
    let len = plaintext.length;
    
    // Izgarayı tam doldurmak için padding (boşluk/0) hesapla
    // Eğer veri anahtar uzunluğuna tam bölünmüyorsa sonuna ekleme yap
    const padLen = (this.numCols - (len % this.numCols)) % this.numCols;
    
    // Veri + Padding
    const paddedData = new Uint8Array(len + padLen);
    paddedData.set(plaintext);
    // Kalan kısımlar otomatik 0 (null byte) ile dolar, bu bizim padding'imizdir.

    const totalLen = paddedData.length;
    const rows = totalLen / this.numCols;
    const out = new Uint8Array(totalLen);
    
    let outIdx = 0;
    
    // Anahtar sırasına göre sütun sütun oku
    for (let i = 0; i < this.numCols; i++) {
        const colIndex = this.order[i]; // Hangi sütunu okuyacağız?
        
        for (let r = 0; r < rows; r++) {
            // Grid formülü: (Satır * ToplamSütun) + Sütun
            out[outIdx++] = paddedData[r * this.numCols + colIndex];
        }
    }
    return out;
  }

  decrypt(ciphertext, counter=0) {
    const len = ciphertext.length;
    // Columnar şifrelemede veri her zaman anahtarın katı olmalıdır (Padding'den dolayı)
    // Eğer değilse, algoritma bozulur ama biz yine de işlemeye çalışalım.
    
    const rows = Math.ceil(len / this.numCols);
    const grid = new Uint8Array(len); 
    
    let inIdx = 0;
    
    // Şifreli veri sütun sütun gelir. Biz bunu grid'de doğru yerlerine koymalıyız.
    // Yine anahtar sırasına göre döngü kuruyoruz.
    for (let i = 0; i < this.numCols; i++) {
        const colIndex = this.order[i]; // Veri bu sütuna ait
        
        for (let r = 0; r < rows; r++) {
            // Sınır kontrolü (Veri bozuk gelirse diye)
            if (inIdx < len) {
                grid[r * this.numCols + colIndex] = ciphertext[inIdx++];
            }
        }
    }

    // Padding Temizliği
    // Sondaki 0 (null) değerlerini atıyoruz.
    let validLen = len;
    while (validLen > 0 && grid[validLen - 1] === 0) {
        validLen--;
    }
    
    return grid.slice(0, validLen);
  }
}