import QRCode from "qrcode";

/**
 * Constructs the canonical destination URL for a given item's static QR UUID.
 */
export function getItemUrl(qrUuid: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/inventory/item/${qrUuid}`;
}

/**
 * Generates a high-contrast, scalable Data URL representation of the QR code
 * embedding the item's static URL.
 */
export async function generateQrDataUrl(qrUuid: string): Promise<string> {
  const targetUrl = getItemUrl(qrUuid);
  try {
    return await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 2,
      width: 400,
      color: {
        dark: "#0f172a", // slate-900 for sharp print quality
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Failed to generate QR Data URL for UUID:", qrUuid, error);
    throw new Error(`QR generation failed: ${(error as Error).message}`);
  }
}

/**
 * Generates an SVG string representation of the QR code (ideal for vector printing/asset labels).
 */
export async function generateQrSvg(qrUuid: string): Promise<string> {
  const targetUrl = getItemUrl(qrUuid);
  try {
    return await QRCode.toString(targetUrl, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Failed to generate QR SVG for UUID:", qrUuid, error);
    throw new Error(`QR SVG generation failed: ${(error as Error).message}`);
  }
}
