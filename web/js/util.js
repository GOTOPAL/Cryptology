// web/js/util.js
export const enc = new TextEncoder();
export const dec = new TextDecoder();

export function strToBytes(s) { return enc.encode(s); }
export function bytesToStr(b) { return dec.decode(b); }

// Uint8Array -> base64 (Latin-1 safe)
export function bytesToB64(u8) {
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin);
}
// base64 -> Uint8Array
export function b64ToBytes(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

export function nowTs() { return Date.now(); }