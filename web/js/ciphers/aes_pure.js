import { BaseCipher } from './base.js';

// --- AES SABİTLERİ (S-BOX ve TERS S-BOX) ---
const SBOX = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
];

const INV_SBOX = new Array(256);
for(let i=0; i<256; i++) INV_SBOX[SBOX[i]] = i;

const RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

export class AESPureCipher extends BaseCipher {
  constructor(key) {
    super(key);
    // Anahtar 16 byte (128 bit) olmak zorunda. Kırp veya Dolur.
    let kBytes = new TextEncoder().encode(String(key));
    if (kBytes.length < 16) {
      const padded = new Uint8Array(16);
      padded.set(kBytes);
      kBytes = padded;
    } else {
      kBytes = kBytes.slice(0, 16);
    }
    
    // Key Expansion (Anahtar Genişletme)
    this.roundKeys = this.expandKey(kBytes);
  }

  // --- YARDIMCI FONKSİYONLAR ---
  
  // Galois Field Multiplication (AES'in kalbi)
  gmul(a, b) {
    let p = 0;
    for (let i = 0; i < 8; i++) {
      if ((b & 1) !== 0) p ^= a;
      let hiBitSet = (a & 0x80) !== 0;
      a = (a << 1) & 0xff;
      if (hiBitSet) a ^= 0x1b; // Rijndael polinomu
      b >>= 1;
    }
    return p;
  }

  expandKey(key) {
    const w = new Uint32Array(44); // 44 kelime (4 byte)
    // İlk 4 kelime anahtarın kendisi
    for(let i=0; i<4; i++) {
        w[i] = (key[4*i]<<24) | (key[4*i+1]<<16) | (key[4*i+2]<<8) | key[4*i+3];
    }
    
    for(let i=4; i<44; i++) {
        let temp = w[i-1];
        if(i % 4 === 0) {
            // RotWord + SubWord + Rcon
            temp = ((temp << 8) | (temp >>> 24)); // Rot
            temp = (SBOX[(temp>>>24)&0xff]<<24) | (SBOX[(temp>>>16)&0xff]<<16) | 
                   (SBOX[(temp>>>8)&0xff]<<8) | SBOX[temp&0xff];
            temp ^= (RCON[i/4] << 24);
        }
        w[i] = w[i-4] ^ temp;
    }
    return w;
  }

  // --- AES DÖNÜŞÜMLERİ ---

  subBytes(state) {
    for(let i=0; i<16; i++) state[i] = SBOX[state[i]];
  }
  invSubBytes(state) {
    for(let i=0; i<16; i++) state[i] = INV_SBOX[state[i]];
  }

  shiftRows(s) {
    // 2. satır 1, 3. satır 2, 4. satır 3 sola kayar
    let t = s[1]; s[1]=s[5]; s[5]=s[9]; s[9]=s[13]; s[13]=t;
    t=s[2]; s[2]=s[10]; s[10]=t; t=s[6]; s[6]=s[14]; s[14]=t;
    t=s[15]; s[15]=s[11]; s[11]=s[7]; s[7]=s[3]; s[3]=t;
  }
  invShiftRows(s) {
    let t = s[13]; s[13]=s[9]; s[9]=s[5]; s[5]=s[1]; s[1]=t;
    t=s[2]; s[2]=s[10]; s[10]=t; t=s[6]; s[6]=s[14]; s[14]=t;
    t=s[3]; s[3]=s[7]; s[7]=s[11]; s[11]=s[15]; s[15]=t;
  }

  mixColumns(s) {
    for(let i=0; i<16; i+=4) {
      let a=s[i], b=s[i+1], c=s[i+2], d=s[i+3];
      s[i]   = this.gmul(a,2)^this.gmul(b,3)^c^d;
      s[i+1] = a^this.gmul(b,2)^this.gmul(c,3)^d;
      s[i+2] = a^b^this.gmul(c,2)^this.gmul(d,3);
      s[i+3] = this.gmul(a,3)^b^c^this.gmul(d,2);
    }
  }
  invMixColumns(s) {
    for(let i=0; i<16; i+=4) {
      let a=s[i], b=s[i+1], c=s[i+2], d=s[i+3];
      s[i]   = this.gmul(a,14)^this.gmul(b,11)^this.gmul(c,13)^this.gmul(d,9);
      s[i+1] = this.gmul(a,9)^this.gmul(b,14)^this.gmul(c,11)^this.gmul(d,13);
      s[i+2] = this.gmul(a,13)^this.gmul(b,9)^this.gmul(c,14)^this.gmul(d,11);
      s[i+3] = this.gmul(a,11)^this.gmul(b,13)^this.gmul(c,9)^this.gmul(d,14);
    }
  }

  addRoundKey(state, w, round) {
    for(let i=0; i<4; i++) {
        let word = w[round*4 + i];
        state[i*4]   ^= (word >>> 24) & 0xff;
        state[i*4+1] ^= (word >>> 16) & 0xff;
        state[i*4+2] ^= (word >>> 8) & 0xff;
        state[i*4+3] ^= (word) & 0xff;
    }
  }

  // --- ANA İŞLEM ---

  processBlock(input, isEncrypt) {
    let state = new Uint8Array(input);
    
    if(isEncrypt) {
        this.addRoundKey(state, this.roundKeys, 0);
        for(let r=1; r<10; r++) {
            this.subBytes(state);
            this.shiftRows(state);
            this.mixColumns(state);
            this.addRoundKey(state, this.roundKeys, r);
        }
        // Son round (MixColumns yok)
        this.subBytes(state);
        this.shiftRows(state);
        this.addRoundKey(state, this.roundKeys, 10);
    } else {
        // Decrypt (Ters İşlem)
        this.addRoundKey(state, this.roundKeys, 10);
        for(let r=9; r>=1; r--) {
            this.invShiftRows(state);
            this.invSubBytes(state);
            this.addRoundKey(state, this.roundKeys, r);
            this.invMixColumns(state);
        }
        this.invShiftRows(state);
        this.invSubBytes(state);
        this.addRoundKey(state, this.roundKeys, 0);
    }
    return state;
  }

  encrypt(plaintext, counter=0) {
    // PKCS7 Padding (16 byte bloklara tamamla)
    let padLen = 16 - (plaintext.length % 16);
    let padded = new Uint8Array(plaintext.length + padLen);
    padded.set(plaintext);
    padded.fill(padLen, plaintext.length);

    let output = new Uint8Array(padded.length);
    for(let i=0; i<padded.length; i+=16) {
        let block = padded.slice(i, i+16);
        let processed = this.processBlock(block, true);
        output.set(processed, i);
    }
    return output;
  }

  decrypt(ciphertext, counter=0) {
    let output = new Uint8Array(ciphertext.length);
    for(let i=0; i<ciphertext.length; i+=16) {
        let block = ciphertext.slice(i, i+16);
        let processed = this.processBlock(block, false);
        output.set(processed, i);
    }
    
    // Padding temizle
    let padLen = output[output.length-1];
    if (padLen > 0 && padLen <= 16) {
        return output.slice(0, output.length - padLen);
    }
    return output;
  }
}