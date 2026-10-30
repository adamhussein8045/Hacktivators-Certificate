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
import { StorageService } from './services/storage';
import { translations } from './i18n/translations';
import { Dashboard } from './components/Dashboard';
import { Designer } from './components/Designer';
import { IssuanceHub } from './components/IssuanceHub';
import { CertificatesRegistry } from './components/CertificatesRegistry';
import { PublicVerification } from './components/PublicVerification';
import { TeamMembers } from './components/TeamMembers';
import { AuditLogViewer } from './components/AuditLogViewer';
import { ArchitectureView } from './components/ArchitectureView';
import { CustomCursor } from './components/CustomCursor';
import {
  LayoutDashboard,
  Palette,
  Award,
  FileText,
  Users,
  ShieldCheck,
  CheckCircle,
  Database,
  Building2,
  Menu,
  X,
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'designer' | 'issue' | 'certificates' | 'members' | 'audit' | 'verify' | 'architecture'
  >('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Multi-tenant organization state loaded from StorageService
  const [organizations, setOrganizations] = useState<Organization[]>(() =>
    StorageService.getOrganizations()
  );
  const [currentOrgId, setCurrentOrgId] = useState<string>(() =>
    StorageService.getActiveOrgId()
  );

  // Role simulation state (For UI testing only)
  const [currentRole, setCurrentRole] = useState<UserRole>('platform_owner');

  // Real Persistent State Entities
  const [templates, setTemplates] = useState<CertificateTemplate[]>(() =>
    StorageService.getTemplates()
  );
  const [certificates, setCertificates] = useState<Certificate[]>(() =>
    StorageService.getCertificates()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    StorageService.getAuditLogs()
  );
  const [members, setMembers] = useState<OrgMember[]>(() =>
    StorageService.getMembers()
  );
  const [isDemoActive, setIsDemoActive] = useState<boolean>(() =>
    StorageService.isDemoDataLoaded()
  );

  // Verification state for direct URL lookup
  const [activeVerifyId, setActiveVerifyId] = useState<string>('');

  const t = translations[lang];
  const isRtl = lang === 'ar';

  const currentOrg =
    organizations.find((o) => o.id === currentOrgId) || organizations[0];

  // Inspect URL parameters for ?verify=ID safely
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location?.search) {
        const params = new URLSearchParams(window.location.search);
        const verifyParam = params.get('verify');
        if (verifyParam) {
          setActiveVerifyId(verifyParam);
          setCurrentTab('verify');
        }
      }
    } catch (e) {
      console.warn('Could not read URL search params:', e);
    }
  }, []);

  // Update HTML document dir and lang attributes
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [lang, isRtl]);

  // Handle Org switch
  const handleSelectOrg = (newOrgId: string) => {
    setCurrentOrgId(newOrgId);
    StorageService.setActiveOrgId(newOrgId);
  };

  // Handlers for real state updates with localStorage synchronization
  const handleSaveTemplate = (savedTemplate: CertificateTemplate) => {
    let nextTemplates: CertificateTemplate[];
    const idx = templates.findIndex((tpl) => tpl.id === savedTemplate.id);
    if (idx >= 0) {
      nextTemplates = [...templates];
      nextTemplates[idx] = savedTemplate;
    } else {
      nextTemplates = [savedTemplate, ...templates];
    }
    setTemplates(nextTemplates);
    StorageService.saveTemplates(nextTemplates);

    const audit: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      orgId: currentOrgId,
      actorName: 'Adam Hussein',
      actorEmail: 'adamhussein0215@gmail.com',
      actorRole: currentRole,
      action: idx >= 0 ? 'TEMPLATE_UPDATED' : 'TEMPLATE_CREATED',
      targetId: savedTemplate.id,
      details: `Saved template specification '${savedTemplate.title}' (version ${savedTemplate.version})`,
      detailsAr: `حفظ مواصفة النموذج '${savedTemplate.titleAr || savedTemplate.title}' (إصدار ${savedTemplate.version})`,
      timestamp: new Date().toISOString(),
    };
    const nextAudits = [audit, ...auditLogs];
    setAuditLogs(nextAudits);
    StorageService.saveAuditLogs(nextAudits);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const nextTemplates = templates.filter((tpl) => tpl.id !== templateId);
    setTemplates(nextTemplates);
    StorageService.saveTemplates(nextTemplates);
  };

  const handleCertificateIssued = (cert: Certificate, audit: AuditLogEntry) => {
    const nextCerts = [cert, ...certificates];
    const nextAudits = [audit, ...auditLogs];
    setCertificates(nextCerts);
    setAuditLogs(nextAudits);
    StorageService.saveCertificates(nextCerts);
    StorageService.saveAuditLogs(nextAudits);
  };

  const handleBatchIssued = (newCerts: Certificate[], audit: AuditLogEntry) => {
    const nextCerts = [...newCerts, ...certificates];
    const nextAudits = [audit, ...auditLogs];
    setCertificates(nextCerts);
    setAuditLogs(nextAudits);
    StorageService.saveCertificates(nextCerts);
    StorageService.saveAuditLogs(nextAudits);
  };

  const handleRevokeCertificate = (
    certId: string,
    reason: string,
    audit: AuditLogEntry
  ) => {
    const nextCerts = certificates.map((c) =>
      c.id === certId
        ? {
            ...c,
            status: 'revoked' as const,
            revokedReason: reason,
            revokedAt: new Date().toISOString(),
            revokedBy: `Adam Hussein (${currentRole})`,
          }
        : c
    );
    const nextAudits = [audit, ...auditLogs];
    setCertificates(nextCerts);
    setAuditLogs(nextAudits);
    StorageService.saveCertificates(nextCerts);
    StorageService.saveAuditLogs(nextAudits);
  };

  const handleInviteMember = (newMember: OrgMember) => {
    const nextMembers = [...members, newMember];
    const audit: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      orgId: currentOrgId,
      actorName: 'Adam Hussein',
      actorEmail: 'adamhussein8045@gmail.com',
      actorRole: currentRole,
      action: 'MEMBER_INVITED',
      targetId: newMember.email,
      details: `Authorized invitation transmitted to ${newMember.name} (${newMember.email}) as ${newMember.role}`,
      detailsAr: `إرسال دعوة تفويض رسمية للمسؤول ${newMember.name} بمستوى صلاحية ${newMember.role}`,
      timestamp: new Date().toISOString(),
    };
    const nextAudits = [audit, ...auditLogs];
    setMembers(nextMembers);
    setAuditLogs(nextAudits);
    StorageService.saveMembers(nextMembers);
    StorageService.saveAuditLogs(nextAudits);
  };

  const handleDeleteMember = (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) {
      throw new Error('User not found.');
    }
    const remaining = StorageService.deleteMember(memberId);
    const audit: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      orgId: target.orgId,
      actorName: 'Adam Hussein',
      actorEmail: 'adamhussein8045@gmail.com',
      actorRole: currentRole,
      action: 'MEMBER_DELETED',
      targetId: target.email,
      details: `User ${target.name} (${target.email}) permanently deleted from the organization`,
      detailsAr: `حذف المستخدم ${target.name} (${target.email}) نهائياً من المؤسسة`,
      timestamp: new Date().toISOString(),
    };
    const nextAudits = [audit, ...auditLogs];
    setMembers(remaining);
    setAuditLogs(nextAudits);
    StorageService.saveAuditLogs(nextAudits);
  };

  // Demo Dataset Controls
  const handleLoadDemoData = () => {
    const dataset = StorageService.loadDemoDataset();
    setCertificates(dataset.certificates);
    setAuditLogs(dataset.auditLogs);
    setTemplates(dataset.templates);
    setMembers(dataset.members);
    setIsDemoActive(true);
  };

  const handleClearData = () => {
    const dataset = StorageService.clearToProductionEmpty();
    setCertificates(dataset.certificates);
    setAuditLogs(dataset.auditLogs);
    setTemplates(dataset.templates);
    setMembers(dataset.members);
    setIsDemoActive(false);
  };

  const handleOpenVerification = (certId: string) => {
    setActiveVerifyId(certId);
    setCurrentTab('verify');
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'designer', label: t.nav.designer, icon: Palette },
    { id: 'issue', label: t.nav.issue, icon: Award },
    { id: 'certificates', label: t.nav.certificates, icon: FileText },
    { id: 'members', label: t.nav.members, icon: Users },
    { id: 'audit', label: t.nav.audit, icon: ShieldCheck },
    { id: 'verify', label: t.nav.publicVerify, icon: CheckCircle },
    { id: 'architecture', label: t.nav.architecture, icon: Database },
  ] as const;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-white text-neutral-900 flex flex-col ${
        isRtl ? 'font-cairo' : 'font-jakarta'
      }`}
    >
      {/* Special Shape Precision Cursor Follower */}
      <CustomCursor />

      {/* Top Navigation Bar: Minimal Enterprise Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-6 py-2.5 flex items-center justify-between gap-6">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="md:hidden p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-neutral-900 hover:text-neutral-700 transition-colors whitespace-nowrap"
          >
            <img
              src="/hacktivators_logo.jpg"
              alt="Hacktivators Logo"
              className="w-7 h-7 rounded object-contain bg-white border border-neutral-200 shrink-0"
            />
            <span className="font-semibold text-neutral-950">{t.brand}</span>
            {isDemoActive ? (
              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-medium">
                Demo Data
              </span>
            ) : (
              <span className="text-[10px] bg-neutral-100 text-neutral-600 border border-neutral-200 px-1.5 py-0.5 rounded font-mono">
                Local Storage
              </span>
            )}
          </button>
        </div>

        {/* Center/Right Zone: Organization Selector + Language Switcher */}
        <div className="flex items-center gap-4 shrink-0 text-xs">
          {/* Organization Selector */}
          <div className="hidden sm:flex items-center gap-2 border border-neutral-200 bg-white px-2.5 py-1 rounded text-xs text-neutral-700">
            <Building2 className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={currentOrgId}
              onChange={(e) => handleSelectOrg(e.target.value)}
              className="bg-transparent text-neutral-900 font-medium focus:outline-none cursor-pointer"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {lang === 'ar' ? org.nameAr : org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Minimal Language Switcher */}
          <div className="flex items-center border border-neutral-200 rounded p-0.5 bg-white">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                lang === 'en'
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ar')}
              className={`px-2 py-0.5 text-xs font-medium rounded font-cairo transition-colors ${
                lang === 'ar'
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              العربية
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar: Clean, Compact White Sidebar */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-neutral-200 shrink-0">
          <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left rtl:text-right transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-950 font-semibold border-l-2 rtl:border-l-0 rtl:border-r-2 border-neutral-900'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Honest System Info */}
          <div className="p-3 border-t border-neutral-200 text-[11px] text-neutral-500 space-y-0.5">
            <div className="font-medium text-neutral-800">{t.parentOrg}</div>
            <div className="text-[10px] text-neutral-500">
              Storage: Local Browser
            </div>
            <div className="text-[9px] text-neutral-400">
              Supabase RLS Pending
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-xs flex">
            <div className="w-64 bg-white border-r border-neutral-200 h-full p-4 flex flex-col justify-between shadow-xl animate-fade-in">
              <nav className="space-y-1 text-xs">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left rtl:text-right transition-colors ${
                        isActive
                          ? 'bg-neutral-100 text-neutral-950 font-semibold'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-500">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded font-medium"
                >
                  {t.common.close}
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 bg-white overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              currentOrg={currentOrg}
              lang={lang}
              certificates={certificates}
              templates={templates}
              auditLogs={auditLogs}
              isDemoActive={isDemoActive}
              onNavigate={(tab) => setCurrentTab(tab as any)}
              onSelectForVerification={handleOpenVerification}
              onLoadDemoData={handleLoadDemoData}
              onClearData={handleClearData}
            />
          )}

          {currentTab === 'designer' && (
            <Designer
              currentOrgId={currentOrgId}
              lang={lang}
              templates={templates.filter((tpl) => tpl.orgId === currentOrgId)}
              onSaveTemplate={handleSaveTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          )}

          {currentTab === 'issue' && (
            <IssuanceHub
              currentOrgId={currentOrgId}
              lang={lang}
              currentRole={currentRole}
              templates={templates.filter((tpl) => tpl.orgId === currentOrgId)}
              existingCertificates={certificates.filter((c) => c.orgId === currentOrgId)}
              onCertificateIssued={handleCertificateIssued}
              onBatchIssued={handleBatchIssued}
              onNavigateToRegistry={() => setCurrentTab('certificates')}
            />
          )}

          {currentTab === 'certificates' && (
            <CertificatesRegistry
              currentOrg={currentOrg}
              lang={lang}
              userRole={currentRole}
              certificates={certificates}
              onRevokeCertificate={handleRevokeCertificate}
              onSelectForVerification={handleOpenVerification}
              onNavigateToIssue={() => setCurrentTab('issue')}
            />
          )}

          {currentTab === 'members' && (
            <TeamMembers
              currentOrg={currentOrg}
              lang={lang}
              currentRole={currentRole}
              members={members}
              onInviteMember={handleInviteMember}
              onDeleteMember={handleDeleteMember}
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
      </div>

      {/* Understated Minimal Enterprise Footer */}
      <footer className="border-t border-neutral-200 bg-white px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-700">Hacktivators Certificates</span>
          <span aria-hidden="true">·</span>
          <span>{t.tagline}</span>
        </div>
        <div className="flex items-center gap-4 text-neutral-600">
          <button
            onClick={() => setCurrentTab('architecture')}
            className="hover:text-neutral-900 transition-colors"
          >
            Supabase & Cloudflare Architecture
          </button>
          <span>·</span>
          <button
            onClick={() => setCurrentTab('verify')}
            className="hover:text-neutral-900 transition-colors"
          >
            Public Verification Portal
          </button>
        </div>
      </footer>
    </div>
  );
}
