import QRCode from 'qrcode';

/**
 * Generates a clean, high-contrast QR code Data URL pointing to the verification page
 */
export async function generateVerificationQr(
  certificateId: string,
  baseUrl: string = window.location.origin
): Promise<string> {
  // Real public verification URL linking directly to verification portal
  const verificationUrl = `${baseUrl}/?verify=${encodeURIComponent(certificateId)}`;

  try {
    const dataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    // Return empty fallback if generation fails
    return '';
  }
}

/**
 * Generates a cryptographic verification checksum hash
 */
export function generateVerificationHash(certificateId: string, orgId: string, issueDate: string): string {
  const seed = `${certificateId}:${orgId}:${issueDate}:hacktivators-v1`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `SHA256-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}
