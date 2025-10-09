export function decryptQRContent(encrypted) {
  try {
    // If using Base64, simple decode:
    const decoded = atob(encrypted);
    const [server, token] = decoded.split("|");
    if (!server || !token) throw new Error("Invalid QR content");
    return { server, token };
  } catch (err) {
    console.error("Failed to decrypt QR:", err);
    return null;
  }
}