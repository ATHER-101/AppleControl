// src/utils/decrypt.js
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = "12345678901234567890123456789012"; // same as .env key in Electron app

export function decryptQRContent(encrypted) {
  try {
    if (!encrypted.includes(".")) throw new Error("Invalid QR format");

    const [cipherText, ivBase64] = encrypted.split(".");
    const iv = CryptoJS.enc.Base64.parse(ivBase64);
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const json = decrypted.toString(CryptoJS.enc.Utf8);
    const parsed = JSON.parse(json);

    // Build the full server URL
    const server = `http://${parsed.ip}:${parsed.port}`;
    const token = parsed.secret;

    return { server, token };
  } catch (err) {
    console.error("Failed to decrypt QR:", err);
    return null;
  }
}