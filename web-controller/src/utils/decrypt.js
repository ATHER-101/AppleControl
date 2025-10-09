// src/utils/decrypt.js
export function decryptQRContent(encoded) {
  try {
    const jsonStr = atob(encoded);            // Base64 → string
    const parsed = JSON.parse(jsonStr);       // string → JSON
    return {
      server: `http://${parsed.ip}:${parsed.port}`,
      token: parsed.secret
    };
  } catch (err) {
    console.error("Failed to decode QR:", err);
    return null;
  }
}