import React, { useState, useRef } from 'react';
import { Certificate, AuditLogEntry, Language, UserRole } from '../types';
import { CertificateRenderer } from './CertificateRenderer';
import { exportElementToPdf, exportElementToPng } from '../utils/exportEngine';
import { translations } from '../i18n/translations';
import {
  Search,
  Filter,
  Download,
  Copy,
  ExternalLink,
  Slash,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  FileText,
  ShieldAlert,
} from 'lucide-react';

interface CertificatesRegistryProps {
  currentOrgId: string;
  lang: Language;
  userRole: UserRole;
  certificates: Certificate[];
  onRevokeCertificate: (certId: string, reason: string, audit: AuditLogEntry) => void;
  onSelectForVerification: (certId: string) => void;
}

export const CertificatesRegistry: React.FC<CertificatesRegistryProps> = ({
  currentOrgId,
  lang,
  userRole,
  certificates,
  onRevokeCertificate,
  onSelectForVerification,
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
  const orgCertificates = certificates.filter((c) => c.orgId === currentOrgId);

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
    const url = `${window.location.origin}/?verify=${certId}`;
    navigator.clipboard.writeText(url);
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
      orgId: currentOrgId,
      actorName: 'Adam Hussein',
      actorEmail: 'adamhussein8045@gmail.com',
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
    setActiveModalCert(cert);
    setDownloadingCertId(cert.id);
    setTimeout(async () => {
      if (modalPrintRef.current) {
        await exportElementToPdf(modalPrintRef.current, {
          fileName: `${cert.id}-${cert.recipientName.replace(/\s+/g, '_')}.pdf`,
          orientation: cert.templateSnapshot.orientation,
        });
      }
      setDownloadingCertId(null);
    }, 200);
  };

  const handleDownloadPng = async (cert: Certificate) => {
    setActiveModalCert(cert);
    setDownloadingCertId(cert.id);
    setTimeout(async () => {
      if (modalPrintRef.current) {
        await exportElementToPng(modalPrintRef.current, {
          fileName: `${cert.id}-${cert.recipientName.replace(/\s+/g, '_')}.png`,
        });
      }
      setDownloadingCertId(null);
    }, 200);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            {t.registry.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.registry.subtitle} <span className="text-indigo-400 font-medium">Hacktivators Team</span> ({orgCertificates.length} credentials)
          </p>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t.registry.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            {(['all', 'valid', 'revoked'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-800 text-indigo-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.common[st]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Registry Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">{t.registry.thId}</th>
                <th className="py-3 px-4">{t.registry.thRecipient}</th>
                <th className="py-3 px-4">{t.registry.thTitle}</th>
                <th className="py-3 px-4">{t.registry.thDate}</th>
                <th className="py-3 px-4">{t.registry.thStatus}</th>
                <th className="py-3 px-4 text-right">{t.registry.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching certificates found.
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                      {cert.id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-100">{cert.recipientName}</div>
                      {cert.recipientNameAr && (
                        <div className="text-[11px] text-slate-400 font-cairo">
                          {cert.recipientNameAr}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 font-mono">
                        {cert.recipientEmail}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="truncate font-medium text-slate-200">{cert.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {cert.templateSnapshot?.title}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400">
                      {cert.issueDate}
                    </td>

                    <td className="py-3 px-4">
                      {cert.status === 'valid' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t.common.valid}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium">
                          <XCircle className="w-3.5 h-3.5" /> {t.common.revoked}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Preview */}
                        <button
                          onClick={() => setActiveModalCert(cert)}
                          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                          title="View Certificate"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Download PDF */}
                        <button
                          onClick={() => handleDownloadPdf(cert)}
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy Link */}
                        <button
                          onClick={() => handleCopyLink(cert.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                          title="Copy Public Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Direct Verify */}
                        <button
                          onClick={() => onSelectForVerification(cert.id)}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition-colors"
                          title="Open Verification Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {/* Revoke (If permitted and not already revoked) */}
                        {cert.status === 'valid' && (userRole === 'platform_owner' || userRole === 'org_admin') && (
                          <button
                            onClick={() => setActiveRevokeCert(cert)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {activeModalCert.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Credential ID: <span className="font-mono text-indigo-400">{activeModalCert.id}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(activeModalCert)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => handleDownloadPng(activeModalCert)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> PNG
                </button>
                <button
                  onClick={() => setActiveModalCert(null)}
                  className="p-1 text-slate-400 hover:text-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate render container */}
            <div className="flex items-center justify-center py-4 overflow-x-auto bg-slate-950 rounded-xl p-4">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-sm font-bold text-slate-100">
                {t.registry.revokeTitle}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t.registry.revokeDesc}
            </p>

            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Recipient:</span>{' '}
                <span className="font-semibold text-slate-200">
                  {activeRevokeCert.recipientName}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Cert ID:</span>{' '}
                <span className="font-mono text-slate-200">{activeRevokeCert.id}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.registry.revokeReason} *
              </label>
              <textarea
                rows={3}
                required
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder={t.registry.reasonPlaceholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveRevokeCert(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-lg"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmRevoke}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm"
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
