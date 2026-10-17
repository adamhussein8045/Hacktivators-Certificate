import React, { useEffect, useState } from 'react';
import {
  CertificateTemplate,
  CertificateElement,
  TemplateBorder,
  TemplateBackground,
  Language,
} from '../types';
import { generateVerificationQr } from '../utils/qrGenerator';

interface CertificateRendererProps {
  template: CertificateTemplate;
  recipientName?: string;
  recipientNameAr?: string;
  titleOverride?: string;
  descriptionOverride?: string;
  issueDateOverride?: string;
  certificateId?: string;
  qrCodeUrl?: string;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string) => void;
  onUpdateElementPosition?: (elementId: string, x: number, y: number) => void;
  isInteractive?: boolean;
  scale?: number;
  previewLang?: Language;
  innerRef?: React.Ref<HTMLDivElement>;
}

export const CertificateRenderer: React.FC<CertificateRendererProps> = ({
  template,
  recipientName,
  recipientNameAr,
  titleOverride,
  descriptionOverride,
  issueDateOverride,
  certificateId = 'HCK-2026-DEMO-01',
  qrCodeUrl,
  selectedElementId,
  onSelectElement,
  onUpdateElementPosition,
  isInteractive = false,
  scale = 1,
  previewLang,
  innerRef,
}) => {
  const [internalQr, setInternalQr] = useState<string>(qrCodeUrl || '');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (qrCodeUrl) {
      setInternalQr(qrCodeUrl);
    } else if (certificateId) {
      generateVerificationQr(certificateId).then((url) => {
        setInternalQr(url);
      });
    }
  }, [certificateId, qrCodeUrl]);

  if (!template || !template.elements) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
        No certificate template available.
      </div>
    );
  }

  const isLandscape = template.orientation === 'landscape';
  // Standard A4 aspect ratio dimensions in px (at 96 DPI: 1123 x 794 landscape)
  const baseWidth = isLandscape ? 1123 : 794;
  const baseHeight = isLandscape ? 794 : 1123;

  // Background styling
  const getBackgroundClass = (bg: TemplateBackground) => {
    switch (bg) {
      case 'cream_parchment':
        return 'bg-[#FCF9F2] text-slate-800';
      case 'dark_slate':
        return 'bg-[#0B132B] text-slate-100';
      case 'royal_navy':
        return 'bg-[#0F172A] text-slate-100';
      case 'soft_emerald':
        return 'bg-[#F0FDF4] text-slate-900';
      case 'clean_white':
      default:
        return 'bg-white text-slate-900';
    }
  };

  // Border decorations
  const renderBorder = (borderStyle: TemplateBorder) => {
    switch (borderStyle) {
      case 'classic_gold':
        return (
          <div className="absolute inset-4 sm:inset-6 pointer-events-none border-4 border-[#D4AF37] rounded-sm">
            <div className="absolute inset-1.5 border border-[#B45309]/50" />
            <div className="absolute inset-3 border-2 border-[#D4AF37]/80" />
            {/* Corner flourishes */}
            <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-[#D4AF37] bg-transparent" />
            <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-[#D4AF37] bg-transparent" />
            <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-4 border-l-4 border-[#D4AF37] bg-transparent" />
            <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-[#D4AF37] bg-transparent" />
          </div>
        );
      case 'cyber_tech':
        return (
          <div className="absolute inset-4 sm:inset-6 pointer-events-none border border-cyan-500/40">
            <div className="absolute inset-2 border border-sky-400/20" />
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
            {/* Tech grid markers */}
            <div className="absolute top-2 left-10 text-[9px] font-mono tracking-widest text-cyan-500/60">SEC-AUTH-V4</div>
            <div className="absolute bottom-2 right-10 text-[9px] font-mono tracking-widest text-cyan-500/60">ENCRYPTED-CREDENTIAL</div>
          </div>
        );
      case 'arabic_geometric':
        return (
          <div className="absolute inset-4 sm:inset-6 pointer-events-none border-4 border-emerald-700/80 rounded-sm">
            <div className="absolute inset-2 border-2 border-emerald-600/40" />
            <div className="absolute inset-4 border border-amber-600/40" />
            {/* Geometric star corner motifs */}
            <div className="absolute -top-2 -left-2 w-6 h-6 rotate-45 border-2 border-amber-500 bg-emerald-900/10" />
            <div className="absolute -top-2 -right-2 w-6 h-6 rotate-45 border-2 border-amber-500 bg-emerald-900/10" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 rotate-45 border-2 border-amber-500 bg-emerald-900/10" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 rotate-45 border-2 border-amber-500 bg-emerald-900/10" />
          </div>
        );
      case 'ornate_diploma':
        return (
          <div className="absolute inset-5 sm:inset-8 pointer-events-none border-8 border-double border-slate-700/70">
            <div className="absolute inset-2 border border-slate-400/40" />
            <div className="absolute top-0 left-0 w-4 h-4 bg-slate-700/60" />
            <div className="absolute top-0 right-0 w-4 h-4 bg-slate-700/60" />
            <div className="absolute bottom-0 left-0 w-4 h-4 bg-slate-700/60" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-slate-700/60" />
          </div>
        );
      case 'modern_minimal':
        return (
          <div className="absolute inset-6 pointer-events-none border border-slate-300 dark:border-slate-700">
            <div className="absolute inset-1.5 border border-slate-200 dark:border-slate-800" />
          </div>
        );
      case 'none':
      default:
        return null;
    }
  };

  // Drag handling inside canvas
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (!isInteractive) return;
    e.stopPropagation();
    onSelectElement?.(elementId);
    setDraggingId(elementId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive || !draggingId || !onUpdateElementPosition) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    onUpdateElementPosition(draggingId, Math.round(x), Math.round(y));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Content resolution for dynamic elements
  const getElementContent = (element: CertificateElement) => {
    switch (element.type) {
      case 'recipient':
        if (previewLang === 'ar' && recipientNameAr) return recipientNameAr;
        return recipientName || element.text || 'Recipient Full Name';
      case 'title':
        return titleOverride || element.text || template.title;
      case 'description':
        return descriptionOverride || element.text || template.description;
      case 'issue_date':
        return issueDateOverride ? `Issued: ${issueDateOverride}` : element.text || 'Issued: 2026-10-17';
      case 'cert_id':
        return `ID: ${certificateId}`;
      default:
        return element.text || '';
    }
  };

  return (
    <div
      ref={innerRef}
      id="certificate-print-surface"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        width: `${baseWidth}px`,
        height: `${baseHeight}px`,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
      className={`relative overflow-hidden shadow-2xl select-none transition-colors duration-150 ${getBackgroundClass(
        template.backgroundColor
      )}`}
    >
      {/* Decorative Border Frame */}
      {renderBorder(template.borderStyle)}

      {/* Background Watermark/Seal (Subtle) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <div className="w-[450px] h-[450px] rounded-full border-[18px] border-current flex items-center justify-center">
          <span className="font-bold text-7xl uppercase tracking-widest">HACKTIVATORS</span>
        </div>
      </div>

      {/* Render All Template Elements */}
      {template.elements.map((el) => {
        if (!el.visible) return null;

        const isSelected = selectedElementId === el.id;
        const content = getElementContent(el);

        // Determine if text is Arabic or LTR
        const isArabicText =
          previewLang === 'ar' ||
          /[\u0600-\u06FF]/.test(content);

        return (
          <div
            key={el.id}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectElement?.(el.id);
              }
            }}
            onMouseDown={(e) => handleMouseDown(e, el.id)}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              transform: 'translate(-50%, -50%)',
              color: el.color,
              fontSize: `${el.fontSize}px`,
              fontFamily: el.fontFamily,
              fontWeight: el.fontWeight,
              textAlign: el.textAlign,
              letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
              lineHeight: el.lineHeight || 1.3,
              cursor: isInteractive ? 'move' : 'default',
              direction: isArabicText ? 'rtl' : 'ltr',
            }}
            className={`absolute z-10 transition-all ${
              isSelected && isInteractive
                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent bg-indigo-500/10 px-2 py-0.5 rounded'
                : ''
            } ${isInteractive ? 'hover:outline hover:outline-1 hover:outline-indigo-400' : ''}`}
          >
            {/* QR Code Element */}
            {el.type === 'qr_code' ? (
              <div className="flex flex-col items-center justify-center bg-white p-2 rounded shadow-sm border border-slate-200">
                {internalQr ? (
                  <img
                    src={internalQr}
                    alt="Certificate QR Verification"
                    className="w-20 h-20 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                    QR Code
                  </div>
                )}
                <span className="text-[8px] font-mono tracking-tighter text-slate-500 mt-1 uppercase">
                  Scan to Verify
                </span>
              </div>
            ) : el.type === 'logo' ? (
              // Logo Element
              <div className="flex items-center justify-center">
                {el.src ? (
                  <img
                    src={el.src}
                    alt="Organization Logo"
                    className="max-h-16 max-w-36 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-700">
                    LOGO
                  </div>
                )}
              </div>
            ) : el.type === 'signature' ? (
              // Signature Element
              <div className="flex flex-col items-center">
                {el.src ? (
                  <img
                    src={el.src}
                    alt="Authorized Signature"
                    className="h-12 object-contain"
                  />
                ) : (
                  <div className="font-serif italic text-xl border-b border-slate-400 pb-1 px-4 text-slate-800">
                    Adam Hussein
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-0.5">Authorized Signatory</span>
              </div>
            ) : el.type === 'badge' ? (
              // Medal Seal Badge
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-700 font-semibold tracking-wider text-xs">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{content}</span>
              </div>
            ) : (
              // Standard Text Elements
              <div className="max-w-2xl px-2">{content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
