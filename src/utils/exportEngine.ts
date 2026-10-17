import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { TemplateOrientation } from '../types';

// The on-screen preview is CSS-scaled to fit its container; exports must always
// render the certificate at its native A4 pixel size.
function resetPreviewTransform(clonedDoc: Document) {
  const surface = clonedDoc.getElementById('certificate-print-surface');
  if (surface) {
    surface.style.transform = 'none';
  }
}

export interface ExportOptions {
  fileName?: string;
  orientation?: TemplateOrientation;
  scale?: number;
}

/**
 * Exports an HTML element directly to high-resolution PNG
 */
export async function exportElementToPng(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<string> {
  const { fileName = 'certificate.png', scale = 2.5 } = options;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    imageTimeout: 15000,
    onclone: resetPreviewTransform,
  });

  const dataUrl = canvas.toDataURL('image/png', 1.0);

  // Trigger browser download
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();

  return dataUrl;
}

/**
 * Exports an HTML element to an authentic standard A4 PDF (Landscape or Portrait)
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const {
    fileName = 'certificate.pdf',
    orientation = 'landscape',
    scale = 2.5,
  } = options;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15000,
    onclone: resetPreviewTransform,
  });

  const imgData = canvas.toDataURL('image/png', 1.0);

  // Standard A4 dimensions in mm: 297 x 210 (landscape), 210 x 297 (portrait)
  const isLandscape = orientation === 'landscape';
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = isLandscape ? 297 : 210;
  const pdfHeight = isLandscape ? 210 : 297;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  pdf.save(fileName);
}
