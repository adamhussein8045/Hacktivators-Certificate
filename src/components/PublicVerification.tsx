import React, { useState, useEffect } from 'react';
import { Certificate, Organization, Language } from '../types';
import { translations } from '../i18n/translations';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
  Lock,
  Building,
  Calendar,
  Award,
  Hash,
  ExternalLink,
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
    <div className="min-h-[calc(100vh-4.5rem)] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header & Verification search box */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Hacktivators Official Verification Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            {t.verification.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {t.verification.subtitle}
          </p>

          {/* Search Input Bar */}
          <form onSubmit={handleSearch} className="pt-4 max-w-xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder={t.verification.placeholder}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              {t.verification.verifyBtn}
            </button>
          </form>

          {/* Quick example badges */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
            <span>Try sample credentials:</span>
            <button
              onClick={() => {
                setSearchId('HCK-2026-CHAMP-01');
                const f = certificates.find((c) => c.id === 'HCK-2026-CHAMP-01');
                setActiveResult(f || 'NOT_FOUND');
              }}
              className="hover:text-indigo-400 font-mono underline"
            >
              HCK-2026-CHAMP-01 (Valid)
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setSearchId('HCK-2026-REVOKED-TEST');
                const f = certificates.find((c) => c.id === 'HCK-2026-REVOKED-TEST');
                setActiveResult(f || 'NOT_FOUND');
              }}
              className="hover:text-rose-400 font-mono underline"
            >
              HCK-2026-REVOKED-TEST (Revoked)
            </button>
          </div>
        </div>

        {/* Verification Result Card */}
        {activeResult === 'NOT_FOUND' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-200">
              {t.verification.notFoundStatus}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {t.verification.notFoundDesc}
            </p>
            <div className="text-[11px] font-mono text-slate-500">
              Query ID: <span className="text-slate-300">{searchId}</span>
            </div>
          </div>
        )}

        {activeResult && activeResult !== 'NOT_FOUND' && (
          <div className="space-y-6 animate-fade-in">
            {/* Status Announcement Banner */}
            {activeResult.status === 'valid' ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                    {t.verification.verifiedStatus}
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    {t.verification.verifiedDesc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold tracking-wider text-rose-400 uppercase">
                    {t.verification.revokedStatus}
                  </div>
                  <p className="text-xs text-rose-200/90">
                    {t.verification.revokedDesc}
                  </p>
                  {activeResult.revokedReason && (
                    <div className="mt-2 text-xs bg-rose-900/30 border border-rose-800/60 p-2.5 rounded-lg text-rose-300">
                      <span className="font-semibold block text-rose-200">
                        {t.verification.revocationReason}:
                      </span>
                      {activeResult.revokedReason}
                      {activeResult.revokedAt && (
                        <span className="block text-[10px] text-rose-400/80 mt-1">
                          {t.verification.revokedAt}: {new Date(activeResult.revokedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Credential Attributes Grid (Privacy-Clean: NO Emails or Private Notes) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t.verification.credentialDetails}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{getOrg(activeResult.orgId).name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    {t.verification.recipient}
                  </span>
                  <div className="text-lg font-bold text-slate-100">
                    {activeResult.recipientName}
                  </div>
                  {activeResult.recipientNameAr && (
                    <div className="text-sm font-semibold text-slate-300 font-cairo mt-0.5">
                      {activeResult.recipientNameAr}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    {t.verification.awardTitle}
                  </span>
                  <div className="text-base font-semibold text-slate-200">
                    {activeResult.title}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    {t.verification.dateIssued}
                  </span>
                  <div className="text-sm font-medium text-slate-300 flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {activeResult.issueDate}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    {t.verification.issuingOrg}
                  </span>
                  <div className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                    <span className="text-indigo-400 font-semibold">
                      {getOrg(activeResult.orgId).name}
                    </span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
                      Verified Issuer
                    </span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Identifiers */}
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">
                    {t.verification.verificationId}
                  </span>
                  <span className="font-bold text-indigo-400">{activeResult.id}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">
                    {t.verification.securityHash}
                  </span>
                  <span className="text-emerald-400">{activeResult.verificationHash}</span>
                </div>
              </div>
            </div>

            {/* Privacy Pledge Banner */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-400">
              <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block mb-0.5">
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
