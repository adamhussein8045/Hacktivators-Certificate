import React, { useState, useEffect } from 'react';
import {
  Language,
  Organization,
  UserRole,
  CertificateTemplate,
  Certificate,
  AuditLogEntry,
  OrgMember,
} from './types';
import {
  initialOrganizations,
  initialTemplates,
  initialCertificates,
  initialAuditLogs,
  initialMembers,
} from './data/initialData';
import { translations } from './i18n/translations';
import { Dashboard } from './components/Dashboard';
import { Designer } from './components/Designer';
import { IssuanceHub } from './components/IssuanceHub';
import { CertificatesRegistry } from './components/CertificatesRegistry';
import { PublicVerification } from './components/PublicVerification';
import { TeamMembers } from './components/TeamMembers';
import { AuditLogViewer } from './components/AuditLogViewer';
import { ArchitectureView } from './components/ArchitectureView';
import {
  Award,
  Globe,
  Building2,
  Shield,
  Layers,
  FileText,
  UserCheck,
  CheckCircle2,
  History,
  Database,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'designer' | 'issue' | 'certificates' | 'members' | 'audit' | 'verify' | 'architecture'
  >('dashboard');

  // Multi-tenant organization state
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [currentOrgId, setCurrentOrgId] = useState<string>('org-hacktivators');

  // Role simulation state (Platform Owner, Org Admin, Issuer, Auditor)
  const [currentRole, setCurrentRole] = useState<UserRole>('platform_owner');

  // State entities
  const [templates, setTemplates] = useState<CertificateTemplate[]>(initialTemplates);
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);
  const [members, setMembers] = useState<OrgMember[]>(initialMembers);

  // Verification state for direct URL lookup
  const [activeVerifyId, setActiveVerifyId] = useState<string>('');

  const t = translations[lang];
  const isRtl = lang === 'ar';

  const currentOrg =
    organizations.find((o) => o.id === currentOrgId) || organizations[0];

  // Inspect URL parameters for ?verify=ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyParam = params.get('verify');
    if (verifyParam) {
      setActiveVerifyId(verifyParam);
      setCurrentTab('verify');
    }
  }, []);

  // Update HTML document dir and lang attributes
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [lang, isRtl]);

  // Handlers for state updates
  const handleSaveTemplate = (savedTemplate: CertificateTemplate) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((tpl) => tpl.id === savedTemplate.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedTemplate;
        return copy;
      }
      return [savedTemplate, ...prev];
    });

    // Append to audit log
    const audit: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      orgId: currentOrgId,
      actorName: 'Adam Hussein',
      actorEmail: 'adamhussein8045@gmail.com',
      actorRole: currentRole,
      action: 'TEMPLATE_UPDATED',
      targetId: savedTemplate.id,
      details: `Saved template '${savedTemplate.title}' (version ${savedTemplate.version})`,
      detailsAr: `حفظ القالب '${savedTemplate.titleAr || savedTemplate.title}' (إصدار ${savedTemplate.version})`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const handleCertificateIssued = (cert: Certificate, audit: AuditLogEntry) => {
    setCertificates((prev) => [cert, ...prev]);
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const handleBatchIssued = (newCerts: Certificate[], audit: AuditLogEntry) => {
    setCertificates((prev) => [...newCerts, ...prev]);
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const handleRevokeCertificate = (
    certId: string,
    reason: string,
    audit: AuditLogEntry
  ) => {
    setCertificates((prev) =>
      prev.map((c) =>
        c.id === certId
          ? {
              ...c,
              status: 'revoked',
              revokedReason: reason,
              revokedAt: new Date().toISOString(),
              revokedBy: 'Sarah Al-Mansoor (Org Admin)',
            }
          : c
      )
    );
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const handleInviteMember = (newMember: OrgMember) => {
    setMembers((prev) => [...prev, newMember]);
    const audit: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      orgId: currentOrgId,
      actorName: 'Adam Hussein',
      actorEmail: 'adamhussein8045@gmail.com',
      actorRole: currentRole,
      action: 'MEMBER_INVITED',
      targetId: newMember.email,
      details: `Invited ${newMember.name} (${newMember.email}) as ${newMember.role}`,
      detailsAr: `دعوة العضو ${newMember.name} بدور ${newMember.role}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const handleOpenVerification = (certId: string) => {
    setActiveVerifyId(certId);
    setCurrentTab('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${
        isRtl ? 'font-cairo' : 'font-jakarta'
      }`}
    >
      {/* Top Navigation Bar: Strictly compliant with 3-zone contract */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white hover:text-indigo-400 transition-colors whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Award className="w-5 h-5" />
            </div>
            <span>{t.brand}</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (concise, single-line) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentTab === 'dashboard'
                ? 'text-indigo-400 border-b-2 border-indigo-400 pb-0.5'
                : ''
            }`}
          >
            {t.nav.dashboard}
          </button>

          <button
            onClick={() => setCurrentTab('designer')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentTab === 'designer'
                ? 'text-indigo-400 border-b-2 border-indigo-400 pb-0.5'
                : ''
            }`}
          >
            {t.nav.designer}
          </button>

          <button
            onClick={() => setCurrentTab('issue')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentTab === 'issue'
                ? 'text-indigo-400 border-b-2 border-indigo-400 pb-0.5'
                : ''
            }`}
          >
            {t.nav.issue}
          </button>

          <button
            onClick={() => setCurrentTab('certificates')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentTab === 'certificates'
                ? 'text-indigo-400 border-b-2 border-indigo-400 pb-0.5'
                : ''
            }`}
          >
            {t.nav.certificates}
          </button>

          <button
            onClick={() => setCurrentTab('members')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentTab === 'members'
                ? 'text-indigo-400 border-b-2 border-indigo-400 pb-0.5'
                : ''
            }`}
          >
            {t.nav.members}
          </button>

          <button
            onClick={() => setCurrentTab('audit')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentTab === 'audit'
                ? 'text-indigo-400 border-b-2 border-indigo-400 pb-0.5'
                : ''
            }`}
          >
            {t.nav.audit}
          </button>

          <button
            onClick={() => setCurrentTab('verify')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentTab === 'verify'
                ? 'text-indigo-400 border-b-2 border-indigo-400 pb-0.5'
                : ''
            }`}
          >
            {t.nav.publicVerify}
          </button>

          <button
            onClick={() => setCurrentTab('architecture')}
            className={`whitespace-nowrap transition-colors hover:text-white flex items-center gap-1 ${
              currentTab === 'architecture'
                ? 'text-indigo-400 border-b-2 border-indigo-400 pb-0.5'
                : 'text-amber-400/90'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            {t.nav.architecture}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & Utility Controls (Language + Org Switcher) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Organization Switcher (Multi-Tenant demonstration) */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={currentOrgId}
              onChange={(e) => setCurrentOrgId(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id} className="bg-slate-900 text-slate-100">
                  {lang === 'ar' ? org.nameAr : org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bilingual Language Switcher */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                lang === 'en'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ar')}
              className={`px-2.5 py-1 rounded font-medium font-cairo transition-colors ${
                lang === 'ar'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              العربية
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation strip */}
      <div className="lg:hidden flex overflow-x-auto bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs gap-3 font-semibold text-slate-300">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={currentTab === 'dashboard' ? 'text-indigo-400 font-bold' : ''}
        >
          {t.nav.dashboard}
        </button>
        <button
          onClick={() => setCurrentTab('designer')}
          className={currentTab === 'designer' ? 'text-indigo-400 font-bold' : ''}
        >
          {t.nav.designer}
        </button>
        <button
          onClick={() => setCurrentTab('issue')}
          className={currentTab === 'issue' ? 'text-indigo-400 font-bold' : ''}
        >
          {t.nav.issue}
        </button>
        <button
          onClick={() => setCurrentTab('certificates')}
          className={currentTab === 'certificates' ? 'text-indigo-400 font-bold' : ''}
        >
          {t.nav.certificates}
        </button>
        <button
          onClick={() => setCurrentTab('members')}
          className={currentTab === 'members' ? 'text-indigo-400 font-bold' : ''}
        >
          {t.nav.members}
        </button>
        <button
          onClick={() => setCurrentTab('audit')}
          className={currentTab === 'audit' ? 'text-indigo-400 font-bold' : ''}
        >
          {t.nav.audit}
        </button>
        <button
          onClick={() => setCurrentTab('verify')}
          className={currentTab === 'verify' ? 'text-indigo-400 font-bold' : ''}
        >
          {t.nav.publicVerify}
        </button>
        <button
          onClick={() => setCurrentTab('architecture')}
          className={currentTab === 'architecture' ? 'text-indigo-400 font-bold' : ''}
        >
          {t.nav.architecture}
        </button>
      </div>

      {/* Main View Port */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <Dashboard
            currentOrg={currentOrg}
            lang={lang}
            certificates={certificates}
            templates={templates}
            auditLogs={auditLogs}
            onNavigate={(tab) => setCurrentTab(tab as any)}
            onSelectForVerification={handleOpenVerification}
          />
        )}

        {currentTab === 'designer' && (
          <Designer
            currentOrgId={currentOrgId}
            lang={lang}
            templates={templates.filter((tpl) => tpl.orgId === currentOrgId)}
            onSaveTemplate={handleSaveTemplate}
          />
        )}

        {currentTab === 'issue' && (
          <IssuanceHub
            currentOrgId={currentOrgId}
            lang={lang}
            templates={templates.filter((tpl) => tpl.orgId === currentOrgId)}
            existingCertificates={certificates.filter((c) => c.orgId === currentOrgId)}
            onCertificateIssued={handleCertificateIssued}
            onBatchIssued={handleBatchIssued}
            onNavigateToRegistry={() => setCurrentTab('certificates')}
          />
        )}

        {currentTab === 'certificates' && (
          <CertificatesRegistry
            currentOrgId={currentOrgId}
            lang={lang}
            userRole={currentRole}
            certificates={certificates}
            onRevokeCertificate={handleRevokeCertificate}
            onSelectForVerification={handleOpenVerification}
          />
        )}

        {currentTab === 'members' && (
          <TeamMembers
            currentOrg={currentOrg}
            lang={lang}
            currentRole={currentRole}
            members={members}
            onInviteMember={handleInviteMember}
            onSimulateRoleChange={(role) => setCurrentRole(role)}
          />
        )}

        {currentTab === 'audit' && (
          <AuditLogViewer
            currentOrg={currentOrg}
            lang={lang}
            auditLogs={auditLogs}
          />
        )}

        {currentTab === 'verify' && (
          <PublicVerification
            initialCertId={activeVerifyId}
            certificates={certificates}
            organizations={organizations}
            lang={lang}
          />
        )}

        {currentTab === 'architecture' && (
          <ArchitectureView lang={lang} />
        )}
      </main>

      {/* Quiet, Anti-Slop Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Hacktivators Certificates © 2026</span>
          <span aria-hidden="true">·</span>
          <span>Bilingual Multi-Tenant Credential Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentTab('architecture')}
            className="hover:text-slate-300 transition-colors"
          >
            Supabase Architecture & Cloudflare Specs
          </button>
          <span>·</span>
          <button
            onClick={() => setCurrentTab('verify')}
            className="hover:text-slate-300 transition-colors"
          >
            Public Credential Verification
          </button>
        </div>
      </footer>
    </div>
  );
}
