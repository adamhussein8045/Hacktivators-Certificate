import React, { useState, useRef } from 'react';
import { Certificate, AuditLogEntry, Language, UserRole, Organization } from '../types';
import { CertificateRenderer } from './CertificateRenderer';
import { exportElementToPdf, exportElementToPng } from '../utils/exportEngine';
import { translations } from '../i18n/translations';
import {
  Search,
  Download,
  Copy,
  ExternalLink,
  Slash,
  Eye,
  Check,
  X,
  FileText,
  ShieldAlert,
} from 'lucide-react';

interface CertificatesRegistryProps {
  currentOrg: Organization;
  lang: Language;
  userRole: UserRole;
  certificates: Certificate[];
  onRevokeCertificate: (certId: string, reason: string, audit: AuditLogEntry) => void;
  onSelectForVerification: (certId: string) => void;
  onNavigateToIssue?: () => void;
}

export const CertificatesRegistry: React.FC<CertificatesRegistryProps> = ({
  currentOrg,
  lang,
  userRole,
  certificates,
  onRevokeCertificate,
  onSelectForVerification,
  onNavigateToIssue,
}) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'revoked'>('all');
  const [activeModalCert, setActiveModalCert] = useState<Certificate | null>(null);
  const [activeRevokeCert, setActiveRevokeCert] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  const modalPrintRef = useRef<HTMLDivElement>(null);

  // Tenant-scoped filtering
  const orgCertificates = certificates.filter((c) => c.orgId === currentOrg.id);

  const filteredCertificates = orgCertificates.filter((cert) => {
    const matchesSearch =
      cert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cert.recipientNameAr && cert.recipientNameAr.includes(searchTerm)) ||
      cert.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : cert.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCopyLink = (certId: string) => {
    const origin = typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
      ? window.location.origin
      : '';
    const url = `${origin}/?verify=${certId}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleConfirmRevoke = () => {
    if (!activeRevokeCert || !revokeReason.trim()) {
      alert('Please state a reason for revocation.');
      return;
    }

    const audit: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      orgId: currentOrg.id,
      actorName: 'Adam Hussein',
      actorEmail: 'hacktivators5@gmail.com',
      actorRole: userRole,
      action: 'CERTIFICATE_REVOKED',
      targetId: activeRevokeCert.id,
      details: `Revoked certificate ${activeRevokeCert.id} (${activeRevokeCert.recipientName}): ${revokeReason}`,
      detailsAr: `إلغاء الشهادة ${activeRevokeCert.id} للمستلم ${activeRevokeCert.recipientName}: ${revokeReason}`,
      timestamp: new Date().toISOString(),
    };

    onRevokeCertificate(activeRevokeCert.id, revokeReason, audit);
    setActiveRevokeCert(null);
    setRevokeReason('');
  };

  const handleDownloadPdf = async (cert: Certificate) => {
    if (!modalPrintRef.current) return;
    try {
      setDownloadingCertId(cert.id);
      await exportElementToPdf(modalPrintRef.current, {
        fileName: `${cert.id}-${cert.recipientName.replace(/\s+/g, '_')}.pdf`,
        orientation: cert.templateSnapshot?.orientation || 'landscape',
        scale: 2.5,
      });
    } catch (e) {
      console.error('PDF export error', e);
    } finally {
      setDownloadingCertId(null);
    }
  };

  const handleDownloadPng = async (cert: Certificate) => {
    if (!modalPrintRef.current) return;
    try {
      setDownloadingCertId(cert.id);
      await exportElementToPng(modalPrintRef.current, {
        fileName: `${cert.id}-${cert.recipientName.replace(/\s+/g, '_')}.png`,
        scale: 2.5,
      });
    } catch (e) {
      console.error('PNG export error', e);
    } finally {
      setDownloadingCertId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-white text-neutral-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950 flex items-center gap-2">
            <FileText className="w-5 h-5 text-neutral-700" />
            {t.registry.title}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {t.registry.subtitle}{' '}
            <span className="text-neutral-900 font-semibold">
              {lang === 'ar' ? currentOrg.nameAr : currentOrg.name}
            </span>{' '}
            ({orgCertificates.length} credentials)
          </p>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder={t.registry.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-neutral-200 rounded px-3 py-1.5 pl-8 rtl:pl-3 rtl:pr-8 text-xs text-neutral-900 placeholder-neutral-400 w-64 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div className="flex items-center bg-neutral-100 p-0.5 rounded border border-neutral-200 text-xs">
            {(['all', 'valid', 'revoked'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded capitalize font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {t.common[st]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Registry Table */}
      <div className="bg-white border border-neutral-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">{t.registry.thId}</th>
                <th className="py-3 px-4">{t.registry.thRecipient}</th>
                <th className="py-3 px-4">{t.registry.thTitle}</th>
                <th className="py-3 px-4">{t.registry.thDate}</th>
                <th className="py-3 px-4">{t.registry.thStatus}</th>
                <th className="py-3 px-4 text-right rtl:text-left">{t.registry.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    <div className="space-y-2 max-w-sm mx-auto">
                      <div className="w-8 h-8 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto text-neutral-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-semibold text-neutral-900">
                        {orgCertificates.length === 0
                          ? (lang === 'ar' ? 'لا توجد شهادات مسجلة لهذه المؤسسة بعد' : 'No certificates issued yet for this organization')
                          : (lang === 'ar' ? 'لا توجد نتائج تطابق بحثك' : 'No matching certificates found')}
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        {orgCertificates.length === 0
                          ? (lang === 'ar' ? 'ابدأ بإصدار شهادتك الأولى أو استيراد جماعي عبر CSV لبدء السجل.' : 'Issue your first credential or perform a bulk CSV import to create registry records.')
                          : (lang === 'ar' ? 'جرب البحث باسم آخر أو التحقق من صحة الرقم المرجعي.' : 'Try adjusting your search criteria or resetting status filters.')}
                      </p>
                      {orgCertificates.length === 0 && onNavigateToIssue && (
                        <div className="pt-2">
                          <button
                            onClick={onNavigateToIssue}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded transition-colors"
                          >
                            {lang === 'ar' ? 'إصدار شهادة الآن' : 'Issue Certificate Now'}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                      {cert.id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-950">{cert.recipientName}</div>
                      {cert.recipientNameAr && (
                        <div className="text-[11px] text-neutral-500 font-cairo">
                          {cert.recipientNameAr}
                        </div>
                      )}
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {cert.recipientEmail}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="truncate font-medium text-neutral-900">{cert.title}</div>
                      <div className="text-[11px] text-neutral-500 truncate">
                        {cert.templateSnapshot?.title}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-neutral-500">
                      {cert.issueDate}
                    </td>

                    <td className="py-3 px-4">
                      {cert.status === 'valid' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {t.common.valid}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          {t.common.revoked}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right rtl:text-left">
                      <div className="flex items-center justify-end rtl:justify-start gap-1">
                        {/* View Preview */}
                        <button
                          onClick={() => setActiveModalCert(cert)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors"
                          title="View Certificate"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy Link */}
                        <button
                          onClick={() => handleCopyLink(cert.id)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors"
                          title={t.common.copyLink}
                        >
                          {copiedId === cert.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Direct Verify */}
                        <button
                          onClick={() => onSelectForVerification(cert.id)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors"
                          title="Open Verification Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {/* Revoke (If permitted and not already revoked) */}
                        {cert.status === 'valid' && (userRole === 'platform_owner' || userRole === 'org_admin') && (
                          <button
                            onClick={() => setActiveRevokeCert(cert)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded transition-colors"
                            title="Revoke Certificate"
                          >
                            <Slash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {activeModalCert && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded max-w-5xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <h3 className="text-sm font-bold text-neutral-950">
                  {activeModalCert.title}
                </h3>
                <p className="text-xs text-neutral-500">
                  Credential ID: <span className="font-mono text-neutral-900 font-medium">{activeModalCert.id}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(activeModalCert)}
                  disabled={downloadingCertId === activeModalCert.id}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> {downloadingCertId === activeModalCert.id ? 'Exporting...' : 'PDF'}
                </button>
                <button
                  onClick={() => handleDownloadPng(activeModalCert)}
                  disabled={downloadingCertId === activeModalCert.id}
                  className="px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> PNG
                </button>
                <button
                  onClick={() => setActiveModalCert(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-900 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate render container */}
            <div className="flex items-center justify-center py-4 overflow-x-auto bg-neutral-50 border border-neutral-200 rounded p-4">
              <div className="scale-[0.58] sm:scale-[0.72] origin-top">
                <CertificateRenderer
                  innerRef={modalPrintRef}
                  template={activeModalCert.templateSnapshot}
                  recipientName={activeModalCert.recipientName}
                  recipientNameAr={activeModalCert.recipientNameAr}
                  titleOverride={activeModalCert.title}
                  descriptionOverride={activeModalCert.description}
                  issueDateOverride={activeModalCert.issueDate}
                  certificateId={activeModalCert.id}
                  qrCodeUrl={activeModalCert.qrCodeDataUrl}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revocation Reason Confirmation Modal */}
      {activeRevokeCert && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-rose-600">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-neutral-950">
                {t.registry.revokeTitle}
              </h3>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {t.registry.revokeDesc}
            </p>

            <div className="bg-neutral-50 p-3 rounded border border-neutral-200 text-xs space-y-1">
              <div>
                <span className="text-neutral-500">Recipient:</span>{' '}
                <span className="font-semibold text-neutral-900">
                  {activeRevokeCert.recipientName}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Cert ID:</span>{' '}
                <span className="font-mono text-neutral-900 font-medium">{activeRevokeCert.id}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                {t.registry.revokeReason} *
              </label>
              <textarea
                rows={3}
                required
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder={t.registry.reasonPlaceholder}
                className="w-full bg-white border border-neutral-200 rounded p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveRevokeCert(null)}
                className="px-3.5 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs rounded transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmRevoke}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
              >
                {t.registry.revokeConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
