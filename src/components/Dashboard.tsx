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
  Plus,
  Palette,
  ArrowRight,
  ExternalLink,
  FileText,
  Clock,
  Sparkles,
  RotateCcw,
  Info,
} from 'lucide-react';

interface DashboardProps {
  currentOrg: Organization;
  lang: Language;
  certificates: Certificate[];
  templates: CertificateTemplate[];
  auditLogs: AuditLogEntry[];
  isDemoActive?: boolean;
  onNavigate: (tab: string) => void;
  onSelectForVerification: (certId: string) => void;
  onLoadDemoData?: () => void;
  onClearData?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentOrg,
  lang,
  certificates,
  templates,
  auditLogs,
  isDemoActive = false,
  onNavigate,
  onSelectForVerification,
  onLoadDemoData,
  onClearData,
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
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-white text-neutral-900">
      {/* Storage & Environment Notice Banner */}
      <div className={`p-4 rounded border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isDemoActive
          ? 'bg-amber-50/60 border-amber-200 text-amber-900'
          : 'bg-neutral-50 border-neutral-200 text-neutral-700'
      }`}>
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-neutral-900">
              {isDemoActive ? t.common.demoDataActive : t.common.localStorageNotice}
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {isDemoActive
                ? (lang === 'ar'
                    ? 'يتم حالياً عرض سجلات ونماذج تجريبية للمعاينة والاختبار. يمكنك مسح البيانات للبدء بسجل حقيقي فارغ.'
                    : 'Sample records are loaded for testing and workflow demonstration. You can reset to a clean, empty state at any time.')
                : (lang === 'ar'
                    ? 'يتم تخزين جميع السجلات والشهادات محلياً في هذا المتصفح. يمكنك تحميل بيانات تجريبية لاختبار المنظومة.'
                    : 'All records and templates are stored locally in this browser. You can load sample demo data to test workflows.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDemoActive ? (
            <button
              onClick={onClearData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 text-xs font-medium rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
              {t.common.clearData}
            </button>
          ) : (
            <button
              onClick={onLoadDemoData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 text-xs font-medium rounded transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
              {t.common.loadDemoData}
            </button>
          )}
        </div>
      </div>

      {/* Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="flex items-center gap-3.5">
          {currentOrg.logoUrl ? (
            <img
              src={currentOrg.logoUrl}
              alt={currentOrg.name}
              className="w-10 h-10 rounded object-contain bg-white border border-neutral-200 shrink-0"
            />
          ) : null}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-neutral-950">
                {t.dashboard.title}
              </h1>
              <span className="text-[11px] text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded font-mono">
                {currentOrg.slug}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {t.dashboard.subtitle}{' '}
              <span className="font-semibold text-neutral-900">{currentOrg.name}</span>{' '}
              ({currentOrg.nameAr})
            </p>
          </div>
        </div>

        {/* Primary Operations Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('issue')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.dashboard.quickIssue}
          </button>
          <button
            onClick={() => onNavigate('designer')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-medium rounded transition-colors"
          >
            <Palette className="w-3.5 h-3.5 text-neutral-600" />
            {t.dashboard.quickDesign}
          </button>
        </div>
      </div>

      {/* Four Compact Statistical Summaries (White surfaces, subtle borders) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Issued */}
        <div className="bg-white border border-neutral-200 rounded p-4 space-y-1">
          <div className="text-xs font-medium text-neutral-500">
            {t.dashboard.statTotal}
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 tabular-nums">
            {totalIssued}
          </div>
          <div className="text-[11px] text-neutral-400">
            {totalIssued === 0 ? 'No records issued yet' : 'Real local storage records'}
          </div>
        </div>

        {/* Metric 2: Active & Verified */}
        <div className="bg-white border border-neutral-200 rounded p-4 space-y-1">
          <div className="text-xs font-medium text-neutral-500 flex items-center justify-between">
            <span>{t.dashboard.statValid}</span>
            <span className={`w-2 h-2 rounded-full inline-block ${validCount > 0 ? 'bg-emerald-600' : 'bg-neutral-300'}`} />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 tabular-nums">
            {validCount}
          </div>
          <div className="text-[11px] text-neutral-400">
            {validCount === 0 ? 'None active currently' : 'Verified credentials in registry'}
          </div>
        </div>

        {/* Metric 3: Revoked */}
        <div className="bg-white border border-neutral-200 rounded p-4 space-y-1">
          <div className="text-xs font-medium text-neutral-500 flex items-center justify-between">
            <span>{t.dashboard.statRevoked}</span>
            <span className={`w-2 h-2 rounded-full inline-block ${revokedCount > 0 ? 'bg-rose-600' : 'bg-neutral-300'}`} />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 tabular-nums">
            {revokedCount}
          </div>
          <div className="text-[11px] text-neutral-400">
            {revokedCount === 0 ? 'Zero revocations' : 'Officially revoked records'}
          </div>
        </div>

        {/* Metric 4: Approved Templates */}
        <div className="bg-white border border-neutral-200 rounded p-4 space-y-1">
          <div className="text-xs font-medium text-neutral-500">
            {t.dashboard.statTemplates}
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 tabular-nums">
            {orgTemplatesCount}
          </div>
          <div className="text-[11px] text-neutral-400">
            Active versioned specifications
          </div>
        </div>
      </div>

      {/* Main Operational Split: Recent Certificates Table + Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Minimalist Recent Certificates Table */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              {t.dashboard.recentCertificates}
            </h2>
            {orgCerts.length > 0 && (
              <button
                onClick={() => onNavigate('certificates')}
                className="text-xs text-neutral-600 hover:text-neutral-950 font-medium flex items-center gap-1 transition-colors"
              >
                {t.dashboard.viewAll} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            )}
          </div>

          {orgCerts.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-3">
              <div className="w-9 h-9 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto text-neutral-400">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-neutral-900">
                {t.dashboard.noCertificates}
              </div>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                {lang === 'ar'
                  ? 'لم يتم إصدار شهادات بعد لهذه المؤسسة. ابدأ بإصدار شهادتك الأولى أو رفع ملف CSV.'
                  : 'No credentials have been issued yet. Issue your first credential or import via CSV to populate this list.'}
              </p>
              <button
                onClick={() => onNavigate('issue')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                {t.dashboard.quickIssue}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {orgCerts.slice(0, 5).map((cert) => (
                <div
                  key={cert.id}
                  className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-neutral-900">
                        {cert.id}
                      </span>
                      {cert.status === 'valid' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {t.common.valid}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          {t.common.revoked}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-neutral-950">
                      {cert.recipientName}
                      {cert.recipientNameAr && (
                        <span className="text-neutral-500 font-normal mr-2 ml-2 font-cairo">
                          ({cert.recipientNameAr})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate max-w-sm">
                      {cert.title}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectForVerification(cert.id)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                    title={t.common.copyLink}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clean, Readable Audit Activity List */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              {t.dashboard.recentActivity}
            </h2>
            {orgAudits.length > 0 && (
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs text-neutral-600 hover:text-neutral-950 font-medium flex items-center gap-1 transition-colors"
              >
                {t.dashboard.viewAllAudit} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            )}
          </div>

          {orgAudits.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2">
              <div className="w-9 h-9 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto text-neutral-400">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-neutral-900">
                {t.dashboard.noActivity}
              </div>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                {lang === 'ar'
                  ? 'لم يتم تسجيل أي عمليات إدارية بعد في هذا المتصفح. العمليات ستسجل هنا تلقائياً.'
                  : 'Administrative actions such as issuance, template updates, and revocations will be tracked here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orgAudits.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-neutral-50/70 border border-neutral-200 rounded space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span className="font-semibold text-neutral-800">{log.actorName}</span>
                    <span className="font-mono text-neutral-400">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-neutral-700">
                    {lang === 'ar' && log.detailsAr ? log.detailsAr : log.details}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-tight">
                    {log.action} · {log.targetId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
