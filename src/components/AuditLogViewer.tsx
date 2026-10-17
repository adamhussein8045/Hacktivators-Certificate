import React, { useState } from 'react';
import { AuditLogEntry, Language, Organization } from '../types';
import { translations } from '../i18n/translations';
import { ShieldCheck } from 'lucide-react';

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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-white text-neutral-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-neutral-700" />
            {t.audit.title}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {t.audit.subtitle} <span className="text-neutral-900 font-semibold">{currentOrg.name}</span>
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500">{t.audit.filterAction}:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-900 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
          >
            <option value="all">{t.common.all}</option>
            <option value="CERTIFICATE_ISSUED">CERTIFICATE_ISSUED</option>
            <option value="CERTIFICATE_REVOKED">CERTIFICATE_REVOKED</option>
            <option value="BATCH_CSV_ISSUED">BATCH_CSV_ISSUED</option>
            <option value="TEMPLATE_CREATED">TEMPLATE_CREATED</option>
            <option value="TEMPLATE_UPDATED">TEMPLATE_UPDATED</option>
            <option value="MEMBER_INVITED">MEMBER_INVITED</option>
  <option value="MEMBER_DELETED">MEMBER_DELETED</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-neutral-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">{t.audit.thTimestamp}</th>
                <th className="py-3 px-4">{t.audit.thActor}</th>
                <th className="py-3 px-4">{t.audit.thAction}</th>
                <th className="py-3 px-4">{t.audit.thTarget}</th>
                <th className="py-3 px-4">{t.audit.thDetails}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-neutral-950">{log.actorName}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{log.actorEmail}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-100 font-mono text-neutral-800 font-medium">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-neutral-900 font-mono font-medium text-[11px] whitespace-nowrap">
                      {log.targetId}
                    </td>

                    <td className="py-3 px-4 text-neutral-700 max-w-md leading-relaxed">
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
