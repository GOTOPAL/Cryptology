import { BaseCipher } from './base.js';

// JavaScript'in negatif sayı hatasını düzelten Modulo fonksiyonu
// mod(-3, 256) -> 253 verir.
const mod = (n, m) => ((n % m) + m) % m;

// 256 gibi küçük sayılar için en güvenli Ters Alma (Inverse) yöntemi (Brute Force)
function findModInverse(a, m) {
    a = mod(a, m);
    for (let x = 1; x < m; x++) {
        if (mod(a * x, m) === 1) return x;
    }
    throw new Error(`Determinantın (${a}) tersi yok, bu matris kullanılamaz.`);
}

// En büyük ortak bölen
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

export class HillCipher extends BaseCipher {
    constructor(keyStr) {
        super(keyStr);
        
        // Anahtarı parse et
        const nums = keyStr.trim().split(/\s+/).map(Number);
        if (nums.length !== 4) {
            throw new Error("Hill (2x2) için 4 sayı gerekli. Örn: '3 3 2 5'");
        }

        // Şifreleme Matrisi: [a b / c d]
        this.keyMatrix = nums; 
        const [a, b, c, d] = this.keyMatrix;

        // 1. Determinant Hesapla (ad - bc)
        // JavaScript hatasını önlemek için 'mod' fonksiyonunu kullanıyoruz
        const det = mod((a * d) - (b * c), 256);

        // 2. Determinant geçerli mi? (Tek sayı olmalı)
        if (gcd(det, 256) !== 1) {
            throw new Error(`Matris geçersiz! Det=${det}. Lütfen determinantı tek sayı olan (3 3 2 5 gibi) bir anahtar girin.`);
        }

        // 3. Determinantın Tersi
        const detInv = findModInverse(det, 256);

        // 4. Ters Matris (Deşifreleme Matrisi)
        // Formül: detInv * [d  -b]
        //                  [-c  a]
        this.invMatrix = [
            mod(d * detInv, 256),
            mod(-b * detInv, 256),
            mod(-c * detInv, 256),
            mod(a * detInv, 256)
        ];

        // Debug için konsola bas (F12'de görebilirsin)
        console.log(`Hill Init -> Key: [${this.keyMatrix}], Inverse: [${this.invMatrix}], Det: ${det}, DetInv: ${detInv}`);
    }

    process(data, matrix, isDecrypting) {
        let input = data;
        
        // Şifrelerken: Uzunluk tek ise sonuna boşluk ekle (Padding)
        if (!isDecrypting && data.length % 2 !== 0) {
            const padded = new Uint8Array(data.length + 1);
            padded.set(data);
            padded[data.length] = 32; // Space (Boşluk)
            input = padded;
        }

        const len = input.length;
        // Eğer veri tek sayıda gelirse (bozulmuşsa) sonuncuyu işlem dışı bırak
        const processLen = (len % 2 === 0) ? len : len - 1;

        const out = new Uint8Array(len);
        const [k0, k1, k2, k3] = matrix;

        for (let i = 0; i < processLen; i += 2) {
            const p1 = input[i];
            const p2 = input[i+1];

            // Matris çarpımı ve Modulo
            out[i]   = mod((k0 * p1) + (k1 * p2), 256);
            out[i+1] = mod((k2 * p1) + (k3 * p2), 256);
        }
        
        // Şifre çözerken: Eğer sonda padding (boşluk) varsa temizle
        if (isDecrypting && len > 0) {
            const lastByte = out[len - 1];
            if (lastByte === 32 || lastByte === 0) {
                return out.slice(0, len - 1);
            }
        }

        return out;
    }

    encrypt(plaintext, counter=0) {
        return this.process(plaintext, this.keyMatrix, false);
    }

    decrypt(ciphertext, counter=0) {
        return this.process(ciphertext, this.invMatrix, true);
    }
}