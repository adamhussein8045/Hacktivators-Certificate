import React, { useState, useEffect } from 'react';
import { Certificate, Organization, Language } from '../types';
import { translations } from '../i18n/translations';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle,
  HelpCircle,
  Lock,
  Building,
  Calendar,
} from 'lucide-react';

interface PublicVerificationProps {
  initialCertId?: string;
  certificates: Certificate[];
  organizations: Organization[];
  lang: Language;
}

export const PublicVerification: React.FC<PublicVerificationProps> = ({
  initialCertId = '',
  certificates,
  organizations,
  lang,
}) => {
  const t = translations[lang];
  const [searchId, setSearchId] = useState(initialCertId);
  const [activeResult, setActiveResult] = useState<Certificate | null | 'NOT_FOUND'>(() => {
    if (!initialCertId) return null;
    const found = certificates.find(
      (c) => c.id.trim().toUpperCase() === initialCertId.trim().toUpperCase()
    );
    return found || 'NOT_FOUND';
  });

  useEffect(() => {
    if (initialCertId) {
      setSearchId(initialCertId);
      const found = certificates.find(
        (c) => c.id.trim().toUpperCase() === initialCertId.trim().toUpperCase()
      );
      setActiveResult(found || 'NOT_FOUND');
    }
  }, [initialCertId, certificates]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    const found = certificates.find(
      (c) => c.id.trim().toUpperCase() === searchId.trim().toUpperCase()
    );
    setActiveResult(found || 'NOT_FOUND');
  };

  const getOrg = (orgId: string) => {
    return organizations.find((o) => o.id === orgId) || organizations[0];
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white text-neutral-900 py-10 px-4 sm:px-6 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header & Verification search box */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-neutral-200 bg-neutral-50 text-neutral-700 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
            Hacktivators Official Verification Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
            {t.verification.title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed">
            {t.verification.subtitle}
          </p>

          {/* Search Input Bar */}
          <form onSubmit={handleSearch} className="pt-4 max-w-xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3 rtl:left-auto rtl:right-3.5" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder={t.verification.placeholder}
                className="w-full bg-white border border-neutral-200 rounded pl-10 rtl:pl-3 rtl:pr-10 pr-4 py-2 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs sm:text-sm rounded transition-colors whitespace-nowrap"
            >
              {t.verification.verifyBtn}
            </button>
          </form>

          {/* Dynamic Records from Real Storage */}
          {certificates.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-neutral-500 pt-1">
              <span>{lang === 'ar' ? 'سجلات متاحة في السجل المحلي:' : 'Available in local registry:'}</span>
              {certificates.slice(0, 3).map((c, idx) => (
                <React.Fragment key={c.id}>
                  {idx > 0 && <span>·</span>}
                  <button
                    onClick={() => {
                      setSearchId(c.id);
                      setActiveResult(c);
                    }}
                    className={`font-mono underline ${
                      c.status === 'valid'
                        ? 'text-neutral-800 hover:text-emerald-700'
                        : 'text-neutral-600 hover:text-rose-700'
                    }`}
                  >
                    {c.id} ({c.status === 'valid' ? 'Valid' : 'Revoked'})
                  </button>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-neutral-400 pt-1">
              {lang === 'ar'
                ? 'لا توجد شهادات مسجلة حالياً في هذا المتصفح. قم بإصدار شهادة أولاً للتحقق منها هنا.'
                : 'The registry is currently empty. Issue a credential or load demo data to verify it here.'}
            </div>
          )}
        </div>

        {/* Verification Result: Not Found */}
        {activeResult === 'NOT_FOUND' && (
          <div className="bg-white border border-neutral-200 rounded p-6 sm:p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto text-neutral-500">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-neutral-950">
              {t.verification.notFoundStatus}
            </h2>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              {t.verification.notFoundDesc}
            </p>
            <div className="text-[11px] font-mono text-neutral-400">
              Query ID: <span className="text-neutral-900 font-medium">{searchId}</span>
            </div>
          </div>
        )}

        {/* Verification Result: Found */}
        {activeResult && activeResult !== 'NOT_FOUND' && (
          <div className="space-y-6">
            {/* Status Announcement Banner */}
            {activeResult.status === 'valid' ? (
              <div className="bg-white border border-emerald-200 rounded p-4 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-wider text-emerald-800 uppercase">
                    {t.verification.verifiedStatus}
                  </div>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    {t.verification.verifiedDesc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-rose-200 rounded p-4 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold tracking-wider text-rose-800 uppercase">
                    {t.verification.revokedStatus}
                  </div>
                  <p className="text-xs text-neutral-600">
                    {t.verification.revokedDesc}
                  </p>
                  {activeResult.revokedReason && (
                    <div className="mt-2 text-xs bg-rose-50 border border-rose-200 p-2.5 rounded text-rose-800">
                      <span className="font-semibold block">
                        {t.verification.revocationReason}:
                      </span>
                      {activeResult.revokedReason}
                      {activeResult.revokedAt && (
                        <span className="block text-[10px] text-rose-600 mt-1">
                          {t.verification.revokedAt}: {new Date(activeResult.revokedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Credential Attributes Grid (Privacy-Clean: NO Emails or Private Notes) */}
            <div className="bg-white border border-neutral-200 rounded p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  {t.verification.credentialDetails}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                  <Building className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{getOrg(activeResult.orgId).name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-[11px] text-neutral-500 block mb-1">
                    {t.verification.recipient}
                  </span>
                  <div className="text-lg font-bold text-neutral-950">
                    {activeResult.recipientName}
                  </div>
                  {activeResult.recipientNameAr && (
                    <div className="text-sm font-semibold text-neutral-600 font-cairo mt-0.5">
                      {activeResult.recipientNameAr}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[11px] text-neutral-500 block mb-1">
                    {t.verification.awardTitle}
                  </span>
                  <div className="text-base font-semibold text-neutral-900">
                    {activeResult.title}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-neutral-500 block mb-1">
                    {t.verification.dateIssued}
                  </span>
                  <div className="text-xs font-medium text-neutral-700 flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    {activeResult.issueDate}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-neutral-500 block mb-1">
                    {t.verification.issuingOrg}
                  </span>
                  <div className="text-xs font-medium text-neutral-900 flex items-center gap-2">
                    {getOrg(activeResult.orgId).logoUrl ? (
                      <img
                        src={getOrg(activeResult.orgId).logoUrl}
                        alt="Org Logo"
                        className="w-5 h-5 rounded object-contain bg-white border border-neutral-200 shrink-0"
                      />
                    ) : null}
                    <span className="font-semibold text-neutral-950">
                      {getOrg(activeResult.orgId).name}
                    </span>
                    <span className="text-[10px] bg-neutral-100 text-neutral-700 border border-neutral-200 px-1.5 py-0.5 rounded font-mono">
                      Verified Issuer
                    </span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Identifiers */}
              <div className="pt-4 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-neutral-50 p-3 rounded border border-neutral-200">
                  <span className="text-neutral-500 block text-[10px] uppercase">
                    {t.verification.verificationId}
                  </span>
                  <span className="font-bold text-neutral-950">{activeResult.id}</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded border border-neutral-200">
                  <span className="text-neutral-500 block text-[10px] uppercase">
                    {t.verification.securityHash}
                  </span>
                  <span className="text-neutral-800 break-all">{activeResult.verificationHash}</span>
                </div>
              </div>
            </div>

            {/* Privacy Pledge Banner */}
            <div className="bg-white border border-neutral-200 rounded p-4 flex items-start gap-3 text-xs text-neutral-600">
              <Lock className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-950 block mb-0.5 font-semibold">
                  {t.verification.privacyPledgeTitle}
                </strong>
                <p className="leading-relaxed">{t.verification.privacyPledge}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
