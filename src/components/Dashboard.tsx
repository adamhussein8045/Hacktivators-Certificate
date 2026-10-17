import React from 'react';
import {
  Certificate,
  CertificateTemplate,
  AuditLogEntry,
  Organization,
  Language,
} from '../types';
import { translations } from '../i18n/translations';
import {
  Award,
  CheckCircle2,
  XCircle,
  FileCode,
  ShieldCheck,
  Plus,
  FileSpreadsheet,
  Palette,
  ArrowUpRight,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface DashboardProps {
  currentOrg: Organization;
  lang: Language;
  certificates: Certificate[];
  templates: CertificateTemplate[];
  auditLogs: AuditLogEntry[];
  onNavigate: (tab: string) => void;
  onSelectForVerification: (certId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentOrg,
  lang,
  certificates,
  templates,
  auditLogs,
  onNavigate,
  onSelectForVerification,
}) => {
  const t = translations[lang];

  // Organization-scoped metrics
  const orgCerts = certificates.filter((c) => c.orgId === currentOrg.id);
  const totalIssued = orgCerts.length;
  const validCount = orgCerts.filter((c) => c.status === 'valid').length;
  const revokedCount = orgCerts.filter((c) => c.status === 'revoked').length;
  const orgTemplatesCount = templates.filter((tpl) => tpl.orgId === currentOrg.id).length;
  const orgAudits = auditLogs.filter((l) => l.orgId === currentOrg.id);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome & Organization Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">
              {t.dashboard.title}
            </h1>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-medium">
              Multi-Tenant Isolated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.dashboard.subtitle}{' '}
            <span className="text-indigo-400 font-semibold">{currentOrg.name}</span>{' '}
            ({currentOrg.nameAr})
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('issue')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.dashboard.quickIssue}
          </button>
          <button
            onClick={() => onNavigate('designer')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            <Palette className="w-4 h-4 text-indigo-400" />
            {t.dashboard.quickDesign}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>{t.dashboard.statTotal}</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
            {totalIssued}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>{t.dashboard.statValid}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {validCount}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>{t.dashboard.statRevoked}</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
            {revokedCount}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>{t.dashboard.statTemplates}</span>
            <FileCode className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
            {orgTemplatesCount}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1 col-span-2 lg:col-span-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>{t.dashboard.statAudits}</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
            {orgAudits.length}
          </div>
        </div>
      </div>

      {/* Main Content: Recent Certificates + Audit Log Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recently Issued Certificates */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.dashboard.recentCertificates}
            </h2>
            <button
              onClick={() => onNavigate('certificates')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {orgCerts.slice(0, 5).map((cert) => (
              <div
                key={cert.id}
                className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {cert.id}
                    </span>
                    {cert.status === 'valid' ? (
                      <span className="text-[10px] text-emerald-400 font-medium">
                        · Valid
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-400 font-medium">
                        · Revoked
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-slate-100">
                    {cert.recipientName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs">
                    {cert.title}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectForVerification(cert.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                    title="Public Verification"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Trail Preview */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.dashboard.recentActivity}
            </h2>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Full Trail <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {orgAudits.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1 text-xs"
              >
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="font-semibold text-slate-300">{log.actorName}</span>
                  <span className="font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-slate-300">
                  {lang === 'ar' && log.detailsAr ? log.detailsAr : log.details}
                </div>
                <div className="text-[10px] font-mono text-indigo-400">
                  ACTION: {log.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
