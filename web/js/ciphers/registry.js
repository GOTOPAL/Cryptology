import { CaesarCipher } from './caesar.js';

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