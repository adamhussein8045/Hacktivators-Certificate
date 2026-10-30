import {
  Organization,
  CertificateTemplate,
  Certificate,
  AuditLogEntry,
  OrgMember,
} from '../types';
import {
  initialOrganizations,
  initialTemplates,
  initialCertificates,
  initialAuditLogs,
  initialMembers,
} from '../data/initialData';

const STORAGE_KEYS = {
  ORGS: 'hck_organizations_v1',
  ACTIVE_ORG: 'hck_active_org_id_v1',
  TEMPLATES: 'hck_templates_v1',
  CERTIFICATES: 'hck_certificates_v1',
  AUDIT_LOGS: 'hck_audit_logs_v1',
  MEMBERS: 'hck_members_v1',
  IS_DEMO: 'hck_is_demo_loaded_v1',
};

// Safe localStorage access helper
function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}":`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.error(`Error writing to localStorage key "${key}":`, e);
  }
}

/**
 * Storage Service for Real Local Browser Persistence
 */
export const StorageService = {
  // Organizations
  getOrganizations(): Organization[] {
    const orgs = safeGet<Organization[]>(STORAGE_KEYS.ORGS, initialOrganizations);
    const sanitized = orgs.filter(
      (o) => o.id !== 'org-cybershield' && o.slug !== 'cybershield'
    );
    return sanitized.length > 0 ? sanitized : initialOrganizations;
  },

  saveOrganizations(orgs: Organization[]): void {
    const sanitized = orgs.filter(
      (o) => o.id !== 'org-cybershield' && o.slug !== 'cybershield'
    );
    safeSet(STORAGE_KEYS.ORGS, sanitized);
  },

  getActiveOrgId(): string {
    const active = safeGet<string>(STORAGE_KEYS.ACTIVE_ORG, 'org-hacktivators');
    if (active === 'org-cybershield') {
      return 'org-hacktivators';
    }
    return active;
  },

  setActiveOrgId(orgId: string): void {
    if (orgId === 'org-cybershield') {
      safeSet(STORAGE_KEYS.ACTIVE_ORG, 'org-hacktivators');
    } else {
      safeSet(STORAGE_KEYS.ACTIVE_ORG, orgId);
    }
  },

  // Templates
  getTemplates(): CertificateTemplate[] {
    const templates = safeGet<CertificateTemplate[]>(STORAGE_KEYS.TEMPLATES, initialTemplates);
    return templates.map((tpl) => ({
      ...tpl,
      elements: tpl.elements.map((el) => {
        if (el.text && (el.text.includes('CYBERSHIELD') || el.text.includes('CyberShield') || el.text.includes('ACADEMY OF ADVANCED'))) {
          return { ...el, text: 'HACKTIVATORS ADVANCED COMPUTING DIVISION' };
        }
        return el;
      }),
    }));
  },

  saveTemplates(templates: CertificateTemplate[]): void {
    safeSet(STORAGE_KEYS.TEMPLATES, templates);
  },

  // Certificates: By default, start with real empty dataset unless user loaded demo data
  getCertificates(): Certificate[] {
    const isDemo = this.isDemoDataLoaded();
    const stored = safeGet<Certificate[] | null>(STORAGE_KEYS.CERTIFICATES, null);
    const certs = stored !== null ? stored : (isDemo ? initialCertificates : []);
    return certs.map((c) => ({
      ...c,
      recipientName: c.recipientName,
      templateTitle: c.templateTitle?.replace(/CyberShield Academy/gi, 'Hacktivators Team'),
    }));
  },

  saveCertificates(certs: Certificate[]): void {
    safeSet(STORAGE_KEYS.CERTIFICATES, certs);
  },

  // Audit Logs
  getAuditLogs(): AuditLogEntry[] {
    const isDemo = this.isDemoDataLoaded();
    const stored = safeGet<AuditLogEntry[] | null>(STORAGE_KEYS.AUDIT_LOGS, null);
    if (stored !== null) {
      return stored;
    }
    return isDemo ? initialAuditLogs : [];
  },

  saveAuditLogs(logs: AuditLogEntry[]): void {
    safeSet(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  // Members
  getMembers(): OrgMember[] {
    const isDemo = this.isDemoDataLoaded();
    const stored = safeGet<OrgMember[] | null>(STORAGE_KEYS.MEMBERS, null);
    if (stored !== null) {
      return stored;
    }
    if (isDemo) {
      return initialMembers;
    }
    // Clean initial administrator
    return [
      {
        id: 'mem-admin-01',
        orgId: 'org-hacktivators',
        name: 'Adam Hussein',
        email: 'adamhussein0215@gmail.com',
        role: 'platform_owner',
        status: 'active',
        joinedAt: new Date().toISOString(),
      },
    ];
  },

  saveMembers(members: OrgMember[]): void {
    safeSet(STORAGE_KEYS.MEMBERS, members);
  },

  /**
   * Permanently removes a single member from persistent storage.
   * Reads the latest persisted list (not stale UI state), writes it back,
   * and verifies the write. Throws if the member can't be removed.
   */
  deleteMember(memberId: string): OrgMember[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('Persistent storage is unavailable.');
    }
    const current = this.getMembers();
    if (!current.some((m) => m.id === memberId)) {
      throw new Error('User not found.');
    }
    const next = current.filter((m) => m.id !== memberId);
    window.localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(next));

    const persisted = safeGet<OrgMember[] | null>(STORAGE_KEYS.MEMBERS, null);
    if (!persisted || persisted.some((m) => m.id === memberId)) {
      throw new Error('Deletion could not be persisted.');
    }
    return persisted;
  },

  // Demo Data State
  isDemoDataLoaded(): boolean {
    return safeGet<boolean>(STORAGE_KEYS.IS_DEMO, false);
  },

  loadDemoDataset(): {
    certificates: Certificate[];
    auditLogs: AuditLogEntry[];
    templates: CertificateTemplate[];
    members: OrgMember[];
  } {
    safeSet(STORAGE_KEYS.IS_DEMO, true);
    safeSet(STORAGE_KEYS.CERTIFICATES, initialCertificates);
    safeSet(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    safeSet(STORAGE_KEYS.TEMPLATES, initialTemplates);
    safeSet(STORAGE_KEYS.MEMBERS, initialMembers);

    return {
      certificates: initialCertificates,
      auditLogs: initialAuditLogs,
      templates: initialTemplates,
      members: initialMembers,
    };
  },

  clearToProductionEmpty(): {
    certificates: Certificate[];
    auditLogs: AuditLogEntry[];
    templates: CertificateTemplate[];
    members: OrgMember[];
  } {
    safeSet(STORAGE_KEYS.IS_DEMO, false);
    safeSet(STORAGE_KEYS.CERTIFICATES, []);
    safeSet(STORAGE_KEYS.AUDIT_LOGS, []);
    safeSet(STORAGE_KEYS.TEMPLATES, initialTemplates);

    const defaultMembers: OrgMember[] = [
      {
        id: 'mem-admin-01',
        orgId: 'org-hacktivators',
        name: 'Adam Hussein',
        email: 'adamhussein8045@gmail.com',
        role: 'platform_owner',
        status: 'active',
        joinedAt: new Date().toISOString(),
      },
    ];
    safeSet(STORAGE_KEYS.MEMBERS, defaultMembers);

    return {
      certificates: [],
      auditLogs: [],
      templates: initialTemplates,
      members: defaultMembers,
    };
  },
};
