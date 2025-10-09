// utils/decrypt.js
import CryptoJS from "crypto-js";

export function decryptData(encryptedString, keyBase64, ivBase64) {
  try {
    const [encryptedData, ivString] = encryptedString.split(".");
    const iv = CryptoJS.enc.Base64.parse(ivBase64 || ivString);
    const key = CryptoJS.enc.Base64.parse(keyBase64);

    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, { iv });
    const jsonStr = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("❌ Failed to decrypt QR:", err);
    throw new Error("Invalid QR or key");
  }
}