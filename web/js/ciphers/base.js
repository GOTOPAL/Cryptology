export class BaseCipher {
  /** @param {any} key */
  constructor(key) { this.key = key; }
  /** @param {Uint8Array} plaintext @param {number} counter */
  encrypt(plaintext, counter=0) { throw new Error("not implemented"); }
  /** @param {Uint8Array} ciphertext @param {number} counter */
  decrypt(ciphertext, counter=0) { throw new Error("not implemented"); }
}