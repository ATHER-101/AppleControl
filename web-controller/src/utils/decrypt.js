// src/utils/decrypt.js
import CryptoJS from "crypto-js";

/**
 * Decrypt AES-256-CBC ciphertext produced by the Electron app.
 * Format expected: "<cipherTextBase64>.<ivBase64>"
 *
 * Returns an object with detailed stages:
 * {
 *   raw,
 *   hasDot,
 *   cipherText,
 *   ivBase64,
 *   ivHex,
 *   keyHex,
 *   decryptedUtf8,
 *   parsedJSON,
 *   server,
 *   token,
 *   error (if any)
 * }
 *
 * @param {string} encrypted - the string scanned from the QR
 * @param {string} keyStr - 32-char AES key (Utf8)
 */
export function decryptStages(encrypted, keyStr = import.meta.env.VITE_ENCRYPTION_KEY) {
  const out = {
    raw: encrypted,
    hasDot: false,
    cipherText: null,
    ivBase64: null,
    ivHex: null,
    keyHex: null,
    decryptedUtf8: null,
    parsedJSON: null,
    server: null,
    token: null,
    error: null,
  };

  try {
    if (!encrypted || typeof encrypted !== "string") {
      throw new Error("No QR content provided");
    }

    out.hasDot = encrypted.includes(".");

    if (!out.hasDot) throw new Error("Invalid QR format — missing IV separator '.'");

    const parts = encrypted.split(".");
    if (parts.length < 2) throw new Error("Invalid QR format — expected 'cipher.iv'");

    out.cipherText = parts[0];
    out.ivBase64 = parts.slice(1).join("."); // in case ciphertext contained dots (rare)

    // Parse IV and convert to hex for debugging
    const ivWA = CryptoJS.enc.Base64.parse(out.ivBase64);
    out.ivHex = ivWA.toString(CryptoJS.enc.Hex);

    // Key (Utf8 -> WordArray); expose hex (for debugging only)
    if (!keyStr || keyStr.length < 32) {
      // Accept keys shorter/longer but warn
      // In practice key must be exactly 32 bytes for AES-256
      out.keyHex = keyStr ? CryptoJS.enc.Utf8.parse(keyStr).toString(CryptoJS.enc.Hex) : null;
    } else {
      out.keyHex = CryptoJS.enc.Utf8.parse(keyStr).toString(CryptoJS.enc.Hex);
    }

    // Perform AES-256-CBC decrypt
    const keyWA = CryptoJS.enc.Utf8.parse(keyStr);
    const decryptedWA = CryptoJS.AES.decrypt(out.cipherText, keyWA, {
      iv: ivWA,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    out.decryptedUtf8 = decryptedWA.toString(CryptoJS.enc.Utf8);

    if (!out.decryptedUtf8) {
      throw new Error("Decryption succeeded but produced empty plaintext (likely wrong key)");
    }

    // Parse JSON
    try {
      out.parsedJSON = JSON.parse(out.decryptedUtf8);
    } catch (err) {
      throw new Error("Decrypted plaintext is not valid JSON: " + err.message);
    }

    // Build final server and token
    if (out.parsedJSON.ip && out.parsedJSON.port) {
      out.server = `http://${out.parsedJSON.ip}:${out.parsedJSON.port}`;
    }
    out.token = out.parsedJSON.secret || out.parsedJSON.token || null;

    return out;
  } catch (err) {
    out.error = err.message;
    return out;
  }
}