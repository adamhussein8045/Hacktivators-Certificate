import React, { useState } from 'react';
import { AuditLogEntry, Language, Organization } from '../types';
import { translations } from '../i18n/translations';
import { ShieldCheck, Filter, Clock, User, CheckCircle, FileText } from 'lucide-react';

interface AuditLogViewerProps {
  currentOrg: Organization;
  lang: Language;
  auditLogs: AuditLogEntry[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  currentOrg,
  lang,
  auditLogs,
}) => {
  const t = translations[lang];
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const orgLogs = auditLogs.filter((l) => l.orgId === currentOrg.id);

  const filteredLogs = orgLogs.filter((log) => {
    if (selectedAction === 'all') return true;
    return log.action === selectedAction;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CERTIFICATE_ISSUED':
      case 'BATCH_CSV_ISSUED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'CERTIFICATE_REVOKED':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'TEMPLATE_CREATED':
      case 'TEMPLATE_UPDATED':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            {t.audit.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.audit.subtitle} <span className="text-indigo-400 font-semibold">{currentOrg.name}</span>
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">{t.audit.filterAction}:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">{t.common.all}</option>
            <option value="CERTIFICATE_ISSUED">CERTIFICATE_ISSUED</option>
            <option value="CERTIFICATE_REVOKED">CERTIFICATE_REVOKED</option>
            <option value="BATCH_CSV_ISSUED">BATCH_CSV_ISSUED</option>
            <option value="TEMPLATE_CREATED">TEMPLATE_CREATED</option>
            <option value="ROLE_UPDATED">ROLE_UPDATED</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">{t.audit.thTimestamp}</th>
                <th className="py-3 px-4">{t.audit.thActor}</th>
                <th className="py-3 px-4">{t.audit.thAction}</th>
                <th className="py-3 px-4">{t.audit.thTarget}</th>
                <th className="py-3 px-4">{t.audit.thDetails}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 font-mono">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>

                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{log.actorName}</div>
                      <div className="text-[10px] text-slate-500">{log.actorEmail}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-indigo-400 font-semibold text-[11px] whitespace-nowrap">
                      {log.targetId}
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-300 max-w-md">
                      {lang === 'ar' && log.detailsAr ? log.detailsAr : log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
