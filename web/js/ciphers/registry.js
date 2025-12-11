import { CaesarCipher } from './caesar.js';
import { VigenereCipher } from './vigenere.js';
import { RotateCipher } from './rotate.js';
import { HillCipher } from './hill.js';
import { ColumnarCipher } from './columnar.js';
import { RailFenceCipher } from './railfence.js';
export class CipherRegistry {
  constructor() { this.map = new Map(); }
  register(name, factory) { this.map.set(name, factory); }
  /** @returns {import('./base.js').BaseCipher} */
  get(name, key) {
    const f = this.map.get(name);
    if (!f) throw new Error(`Cipher yok: ${name}`);
    return f(key);
  }
}

export const registry = new CipherRegistry();
registry.register('caesar', (key) => new CaesarCipher(key));
registry.register('vigenere', (key) => new VigenereCipher(key));
registry.register('rotate', (key) => new RotateCipher(key));
registry.register('hill', (key) => new HillCipher(key));
registry.register('columnar', (key) => new ColumnarCipher(key));
registry.register('railfence', (key) => new RailFenceCipher(key));