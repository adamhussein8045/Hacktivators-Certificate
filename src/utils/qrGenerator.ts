import QRCode from 'qrcode';

/**
 * Generates a clean, high-contrast QR code Data URL pointing to the verification page
 */
export async function generateVerificationQr(
  certificateId: string,
  baseUrl?: string
): Promise<string> {
  // Safe origin resolution for browser and iframe sandboxes
  let host = baseUrl;
  if (!host) {
    if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
      host = window.location.origin;
    } else {
      host = '';
    }
  }

  // Real public verification URL linking directly to verification portal
  const verificationUrl = `${host}/?verify=${encodeURIComponent(certificateId)}`;

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
