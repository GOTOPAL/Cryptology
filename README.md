# 🔐 Kriptoloji E2EE Chat Uygulaması

> **AES – DES – RSA | Kütüphaneli & Kütüphanesiz Şifreleme | İstemci–Sunucu Haberleşmesi**

Modern kriptografi algoritmalarını gerçek zamanlı bir mesajlaşma sistemi üzerinde deneyimlemek için geliştirilmiş kapsamlı bir eğitim projesidir. Bu proje, simetrik (AES, DES) ve asimetrik (RSA, ECDH, ECIES) şifreleme yöntemlerini hem kütüphane kullanarak hem de sıfırdan manuel implementasyonlarla sunar.

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Desteklenen Algoritmalar](#-desteklenen-algoritmalar)
- [Teknik Mimari](#-teknik-mimari)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [Algoritma Detayları](#-algoritma-detayları)
- [Anahtar Dağıtım Mekanizmaları](#-anahtar-dağıtım-mekanizmaları)
- [Wireshark Analizi](#-wireshark-analizi)
- [Proje Yapısı](#-proje-yapısı)
- [Teknik Karşılaştırmalar](#-teknik-karşılaştırmalar)

---

## ✨ Özellikler

### Temel Özellikler
- 🔒 **End-to-End Encryption (E2EE)** - Sunucu sadece iletim yapar, şifre çözmez
- 💬 **Gerçek Zamanlı Mesajlaşma** - WebSocket tabanlı anlık iletişim
- 📁 **Şifreli Dosya Transferi** - Resim ve dosya şifreleme/çözme
- 🔑 **Çoklu Anahtar Dağıtım Protokolleri** - RSA, ECDH, ECIES
- 🏠 **Oda Bazlı Sohbet** - Çoklu kullanıcı ve oda desteği

### Eğitimsel Özellikler
- 📚 **Manuel Implementasyonlar** - AES ve DES algoritmalarının sıfırdan kodlanması
- 🔄 **Kütüphane Karşılaştırması** - CryptoJS vs Manuel çıktı analizi
- 📊 **12 Farklı Şifreleme Algoritması** - Klasikten moderne geniş yelpaze

---

## 🔐 Desteklenen Algoritmalar

### Simetrik Şifreleme (Blok Şifreler)

| Algoritma | Mod | Anahtar Boyutu | Blok Boyutu | Açıklama |
|-----------|-----|----------------|-------------|----------|
| **AES-128** | Pure (Manuel) | 128 bit (16 byte) | 128 bit | S-Box, MixColumns, ShiftRows ile tam implementasyon |
| **AES-256** | Library (CryptoJS) | 256 bit | 128 bit | Endüstri standardı, CBC modu |
| **DES** | Pure (Manuel) | 64 bit (8 byte) | 64 bit | 16 round Feistel ağı, 8 S-Box |
| **DES** | Library (CryptoJS) | 64 bit | 64 bit | Hızlı ve güvenilir |

### Klasik Şifreler

| Algoritma | Tip | Açıklama |
|-----------|-----|----------|
| **Caesar** | Kaydırma | Basit alfabetik kaydırma şifresi |
| **Vigenere** | Polialfabetik | Anahtar kelimeye dayalı çoklu Caesar |
| **Hill** | Matris | Lineer cebir tabanlı şifreleme |
| **Columnar** | Transpozisyon | Sütun bazlı karıştırma |
| **Rail Fence** | Transpozisyon | Zigzag pattern şifreleme |
| **Polybius** | Substitution | 16x16 grid tabanlı |
| **Pigpen** | Substitution | Mason (Farmason) şifresi |
| **Rotate** | Bitwise | Bit düzeyinde rotasyon |

### Asimetrik Şifreleme & Anahtar Değişimi

| Algoritma | Kullanım | Açıklama |
|-----------|----------|----------|
| **RSA-1024** | Anahtar Dağıtımı | Public/Private key ile simetrik anahtar şifreleme |
| **ECDH** | Anahtar Anlaşması | Elliptic Curve Diffie-Hellman (secp256k1) |
| **ECIES** | Hibrit Şifreleme | Ephemeral key + AES kombinasyonu |

---

## 🏗 Teknik Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEB İSTEMCİLERİ                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  İstemci A  │  │  İstemci B  │  │  İstemci C  │              │
│  │  (Browser)  │  │  (Browser)  │  │  (Browser)  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         │    ┌───────────┴───────────┐    │                      │
│         │    │   E2EE Şifreleme      │    │                      │
│         │    │   (Client-Side)       │    │                      │
│         │    │   AES/DES/RSA/ECDH    │    │                      │
│         │    └───────────────────────┘    │                      │
│         │                                  │                      │
└─────────┼──────────────────────────────────┼──────────────────────┘
          │         WebSocket (ws://)        │
          │         (Şifreli Payload)        │
          ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PYTHON SUNUCU                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    WebSocket Relay                          ││
│  │  • Mesaj iletimi (şifre ÇÖZMEZ)                            ││
│  │  • Oda yönetimi                                             ││
│  │  • Kullanıcı takibi                                         ││
│  │  • Signal (handshake) iletimi                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                         ws://127.0.0.1:8765                      │
└─────────────────────────────────────────────────────────────────┘
```

### Veri Akışı

```
1. Bağlantı Kurulumu
   İstemci ──[join]──> Sunucu ──[broadcast]──> Diğer İstemciler

2. Anahtar Dağıtımı (RSA Örneği)
   Alice ──[RSA Public Key]──> Sunucu ──> Bob
   Bob ──[RSA Public Key]──> Sunucu ──> Alice
   Alice: AES Key üret ──[RSA ile şifrele]──> Bob
   Bob: RSA ile çöz ──> Ortak AES Anahtarı ✓

3. Mesaj Gönderimi
   Alice: "Merhaba" ──[AES Encrypt]──> Base64 ──> Sunucu ──> Bob
   Bob: Base64 ──[AES Decrypt]──> "Merhaba" ✓
```

---

## 🚀 Kurulum

### Gereksinimler

- **Python 3.8+** (Sunucu için)
- **Modern Web Tarayıcısı** (Chrome, Firefox, Edge)
- **pip** (Python paket yöneticisi)

### Adım 1: Depoyu Klonlayın

```bash
git clone https://github.com/kullanici/Cryptology.git
cd Cryptology
```

### Adım 2: Python Bağımlılıklarını Yükleyin

```bash
pip install websockets
```

### Adım 3: Sunucuyu Başlatın

```bash
cd server
python server.py
```

Başarılı çıktı:
```
[2024-XX-XX XX:XX:XX] INFO: WS relay starting at ws://127.0.0.1:8765
```

### Adım 4: İstemciyi Açın

`web/index.html` dosyasını tarayıcınızda açın:

```bash
# macOS
open web/index.html

# Linux
xdg-open web/index.html

# Windows
start web/index.html
```

> **İpucu:** Çoklu kullanıcı testi için birden fazla tarayıcı sekmesi açın.

---

## 📖 Kullanım

### 1. Bağlantı Kurma

1. **Kullanıcı Adı** girin
2. **Oda** seçin (varsayılan: "general")
3. **Bağlan** butonuna tıklayın

### 2. Algoritma Seçimi

Dropdown menüden şifreleme algoritmasını seçin:
- `AES-128 (Pure - Manuel)` - Eğitimsel, sıfırdan kodlanmış
- `AES-256 (CryptoJS Lib)` - Üretim kalitesi
- `DES (Pure Implementation)` - Manuel Feistel ağı
- `DES (CryptoJS Library)` - Hızlı kütüphane

### 3. Anahtar Yönetimi

**Manuel Anahtar:**
- Anahtar kutusuna istediğiniz anahtarı yazın
- AES için 16+ karakter önerilir
- DES için 8+ karakter önerilir

**Otomatik Güvenli Anahtar Dağıtımı:**
- 🟣 **RSA Handshake:** Klasik public-key yöntemi
- 🟠 **ECDH Handshake:** Modern eliptik eğri anahtar anlaşması
- 🔵 **ECIES Paketleme:** Hibrit şifreleme

### 4. Mesaj Gönderme

1. Mesaj kutusuna yazın
2. **Gönder** veya Enter tuşuna basın
3. Mesaj şifrelenerek karşı tarafa iletilir

### 5. Dosya Gönderme

1. **Dosya Seç** ile dosya seçin
2. **Dosya Şifrele & Yolla** butonuna tıklayın
3. Karşı taraf dosyayı çözüp indirebilir

> ⚠️ **Not:** Dosya şifreleme için AES veya DES algoritmaları kullanın. Klasik şifreler (Caesar, Vigenere vb.) binary veri için uygun değildir.

---

## 🔬 Algoritma Detayları

### AES-128 Manuel İmplementasyon

```javascript
// web/js/ciphers/aes_pure.js

// 1. S-Box (Substitution Box) - 256 elemanlı lookup tablosu
const SBOX = [0x63, 0x7c, 0x77, 0x7b, ...];

// 2. Anahtar Genişletme (Key Expansion)
expandKey(key) {
  // 16 byte anahtar → 44 kelime (176 byte) round key
  // RotWord, SubWord, Rcon işlemleri
}

// 3. AES Round İşlemleri (10 Round)
Round 0:    AddRoundKey
Round 1-9:  SubBytes → ShiftRows → MixColumns → AddRoundKey
Round 10:   SubBytes → ShiftRows → AddRoundKey (MixColumns yok)

// 4. Galois Field Multiplication (MixColumns için)
gmul(a, b) {
  // GF(2^8) üzerinde çarpma
  // Rijndael polinomu: x^8 + x^4 + x^3 + x + 1
}
```

**Kritik Kavramlar:**

| İşlem | Açıklama |
|-------|----------|
| **SubBytes** | Her byte S-Box'tan geçirilir (non-linear confusion) |
| **ShiftRows** | Satırlar farklı miktarlarda sola kaydırılır (diffusion) |
| **MixColumns** | Sütunlar GF(2^8)'de matris çarpımı ile karıştırılır |
| **AddRoundKey** | State, round key ile XOR'lanır |

### DES Manuel İmplementasyon

```javascript
// web/js/ciphers/des_pure.js

// 1. Permütasyon Tabloları
const IP = [...];   // Initial Permutation (64 bit)
const FP = [...];   // Final Permutation
const E = [...];    // Expansion (32→48 bit)
const P = [...];    // P-Box Permutation

// 2. 8 adet S-Box (6 bit → 4 bit)
const S_BOXES = [S1, S2, S3, S4, S5, S6, S7, S8];

// 3. Feistel Ağı (16 Round)
for (let i = 0; i < 16; i++) {
  let temp = R;
  R = L XOR F(R, K[i]);
  L = temp;
}

// 4. Feistel Fonksiyonu F(R, K)
F(R, K) {
  1. R'yi 32→48 bit genişlet (E tablosu)
  2. K ile XOR
  3. 8 adet S-Box'tan geçir (48→32 bit)
  4. P-Box permütasyonu
}
```

**DES Yapısı:**

```
Plaintext (64 bit)
       │
       ▼
┌─────────────┐
│ Initial     │
│ Permutation │
└──────┬──────┘
       │
       ▼
   ┌───────┐
   │L₀ │ R₀│  (32 bit + 32 bit)
   └───┼───┘
       │
   ┌───┴───┐
   │ 16    │ ◄─── K₁, K₂, ... K₁₆ (48 bit subkeys)
   │Rounds │
   │Feistel│
   └───┬───┘
       │
       ▼
   ┌───────┐
   │R₁₆│L₁₆│
   └───┼───┘
       │
       ▼
┌─────────────┐
│ Final       │
│ Permutation │
└──────┬──────┘
       │
       ▼
Ciphertext (64 bit)
```

---

## 🔑 Anahtar Dağıtım Mekanizmaları

### 1. RSA Handshake

```
Alice                           Bob
  │                              │
  │──── RSA Public Key ─────────►│
  │◄─── RSA Public Key ──────────│
  │                              │
  │ AES Key = "KEY-123456"       │
  │ Encrypted = RSA(Key, Bob_Pub)│
  │                              │
  │──── Encrypted Key ──────────►│
  │                              │
  │                    Decrypt with Bob_Priv
  │                    AES Key = "KEY-123456" ✓
```

### 2. ECDH (Elliptic Curve Diffie-Hellman)

```
Alice                           Bob
  │                              │
  │ a (private), A = a·G        │ b (private), B = b·G
  │                              │
  │──── A (public point) ───────►│
  │◄─── B (public point) ────────│
  │                              │
  │ Shared = a·B = a·b·G        │ Shared = b·A = b·a·G
  │         ▲                    │         ▲
  │         └────── AYNI ────────┴─────────┘
```

**Avantajları:**
- RSA'dan daha küçük anahtar boyutu (256 bit vs 2048 bit)
- Perfect Forward Secrecy (PFS)
- Daha hızlı hesaplama

### 3. ECIES (Elliptic Curve Integrated Encryption Scheme)

```
Alice → Bob'a mesaj göndermek istiyor

1. Alice:
   - Ephemeral (geçici) keypair üret: (e, E = e·G)
   - Shared Secret = e · Bob_Public
   - Ciphertext = AES(message, Shared Secret)
   - Paket = {E, Ciphertext}

2. Bob:
   - Shared Secret = Bob_Private · E
   - Message = AES_Decrypt(Ciphertext, Shared Secret)
```

---

## 🔍 Wireshark Analizi

### Yakalama Adımları

1. Wireshark'ı başlatın
2. Loopback interface'i seçin (127.0.0.1)
3. Filtre: `tcp.port == 8765`
4. Uygulamayı kullanarak mesaj gönderin

### Beklenen Gözlemler

#### TCP Paket Yapısı (WebSocket)

```
Frame X: WebSocket Text [FIN]
    Masked payload
    Payload: {"type":"chat","payload":"U2FsdGVkX1...","cipher":{...}}
              ▲
              └── Base64 encoded encrypted data (OKUNAMAZ)
```

#### Paket Boyutu Karşılaştırması

| Algoritma | Orijinal Mesaj | Şifreli Boyut | Artış |
|-----------|----------------|---------------|-------|
| **Plaintext** | 10 byte | 10 byte | - |
| **AES-128** | 10 byte | 16 byte | +60% (padding) |
| **AES-256 (CryptoJS)** | 10 byte | ~44 byte | +340% (salt+IV+padding) |
| **DES** | 10 byte | 16 byte | +60% (padding) |
| **RSA-1024** | 10 byte | 128 byte | +1180% |

#### RSA'da Neden Büyük Çıktı?

```
RSA Şifreleme:
- Modulus boyutu: 1024 bit = 128 byte
- HER şifreleme, modulus boyutunda çıktı üretir
- 1 byte bile şifreleseniz → 128 byte çıktı

Bu nedenle RSA doğrudan veri şifrelemek için KULLANILMAZ,
sadece simetrik anahtarı (16-32 byte) şifrelemek için kullanılır.
```

### Wireshark Ekran Görüntüsü Kontrol Listesi

- [ ] TCP handshake (SYN, SYN-ACK, ACK)
- [ ] WebSocket upgrade (HTTP 101 Switching Protocols)
- [ ] Şifreli payload görünümü (Base64 string)
- [ ] Farklı algoritmalarla paket boyutu karşılaştırması
- [ ] RSA handshake sinyalleri

---

## 📁 Proje Yapısı

```
Cryptology/
├── README.md                 # Bu dosya
├── LICENSE                   # MIT Lisansı
│
├── server/
│   └── server.py             # Python WebSocket sunucusu
│                             # - Oda yönetimi
│                             # - Mesaj/sinyal iletimi
│                             # - Bağlantı takibi
│
└── web/
    ├── index.html            # Ana uygulama arayüzü
    │
    ├── css/
    │   └── styles.css        # Uygulama stilleri
    │
    └── js/
        ├── app.js            # Ana uygulama mantığı (429 satır)
        ├── ui.js             # DOM manipülasyonu
        ├── ws.js             # WebSocket yönetimi
        ├── util.js           # Yardımcı fonksiyonlar (Base64, encoding)
        │
        ├── rsa.js            # RSA anahtar yönetimi (JSEncrypt)
        ├── ecdh.js           # ECDH anahtar değişimi (elliptic.js)
        ├── ecies.js          # ECIES hibrit şifreleme
        │
        └── ciphers/
            ├── registry.js   # Algoritma kayıt sistemi
            ├── base.js       # Temel cipher sınıfı
            │
            ├── aes_lib.js    # AES (CryptoJS)
            ├── aes_pure.js   # AES-128 Manuel (195 satır)
            ├── des_lib.js    # DES (CryptoJS)
            ├── des_pure.js   # DES Manuel (169 satır)
            │
            ├── caesar.js     # Caesar şifresi
            ├── vigenere.js   # Vigenere şifresi
            ├── hill.js       # Hill matris şifresi
            ├── columnar.js   # Sütunlu transpozisyon
            ├── railfence.js  # Rail Fence şifresi
            ├── polybius.js   # Polybius grid
            ├── pigpen.js     # Pigpen (Mason) şifresi
            └── rotate.js     # Bitwise rotasyon
```

---

## 📊 Teknik Karşılaştırmalar

### AES vs DES

| Özellik | AES-128 | DES |
|---------|---------|-----|
| **Blok Boyutu** | 128 bit | 64 bit |
| **Anahtar Boyutu** | 128/192/256 bit | 56 bit (efektif) |
| **Round Sayısı** | 10/12/14 | 16 |
| **Yapı** | SPN (Substitution-Permutation Network) | Feistel Network |
| **Güvenlik** | ✅ Güvenli | ❌ Kırılmış (brute-force) |
| **Hız** | Hızlı | Orta |

### Kütüphane vs Manuel İmplementasyon

| Özellik | Kütüphane (CryptoJS) | Manuel |
|---------|----------------------|--------|
| **Güvenlik** | ✅ Üretim kalitesi | ⚠️ Eğitimsel |
| **Performans** | Optimize edilmiş | Yavaş |
| **Padding** | PKCS7 + Salt + IV | Basit PKCS |
| **Çıktı Boyutu** | Daha büyük | Daha küçük |
| **Öğrenme** | Kara kutu | ✅ Şeffaf |

### Simetrik vs Asimetrik

| Özellik | Simetrik (AES/DES) | Asimetrik (RSA/ECDH) |
|---------|--------------------|-----------------------|
| **Anahtar Sayısı** | 1 (paylaşılan) | 2 (public/private) |
| **Hız** | Çok hızlı | Yavaş |
| **Kullanım** | Veri şifreleme | Anahtar değişimi, imza |
| **Anahtar Dağıtımı** | Zor (güvenli kanal gerek) | Kolay (public key paylaşılır) |

---

## 🛡️ Güvenlik Notları

> ⚠️ **UYARI:** Bu proje EĞİTİM amaçlıdır. Üretim ortamında kullanmayın!

**Bilinen Sınırlamalar:**

1. **DES zayıftır** - 56 bit anahtar brute-force'a açıktır
2. **Manuel implementasyonlar** - Side-channel saldırılara karşı korumasızdır
3. **RSA-1024** - Modern standartlar için yetersizdir (2048+ önerilir)
4. **WebSocket güvensiz** - Üretimde WSS (TLS) kullanılmalıdır
5. **Anahtar saklama** - Tarayıcı belleğinde tutulur, kalıcı değildir

---

## 📚 Kaynaklar

- [NIST FIPS 197 - AES Standardı](https://csrc.nist.gov/publications/detail/fips/197/final)
- [NIST FIPS 46-3 - DES Standardı](https://csrc.nist.gov/publications/detail/fips/46-3/archive/1999-10-25)
- [RFC 8017 - PKCS #1 RSA](https://datatracker.ietf.org/doc/html/rfc8017)
- [SEC 1: Elliptic Curve Cryptography](https://www.secg.org/sec1-v2.pdf)

---

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

<p align="center">
  <b>🔐 Kriptoloji Dersi Projesi</b><br>
  <i>Şifreleme, Şifre Çözme ve Güvenli İletişim</i>
</p>
