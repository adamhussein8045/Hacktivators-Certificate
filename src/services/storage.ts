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
} from '../data/initialData';

const STORAGE_KEYS = {
  ORGS: 'hck_organizations_v1',
  ACTIVE_ORG: 'hck_active_org_id_v1',
  TEMPLATES: 'hck_templates_v1',
  CERTIFICATES: 'hck_certificates_v1',
  AUDIT_LOGS: 'hck_audit_logs_v1',
  MEMBERS: 'hck_members_v1',
};

// Safe localStorage access helper
function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }

    const item = window.localStorage.getItem(key);

    if (item === null) {
      return fallback;
    }

    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(
      `Error reading localStorage key "${key}":`,
      error
    );

    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(
      `Error writing localStorage key "${key}":`,
      error
    );
  }
}

/**
 * Storage Service
 * Persistent browser storage without demo dataset functionality.
 */
export const StorageService = {
  // Organizations
  getOrganizations(): Organization[] {
    const orgs = safeGet<Organization[]>(
      STORAGE_KEYS.ORGS,
      initialOrganizations
    );

    const sanitized = orgs.filter(
      (org) =>
        org.id !== 'org-cybershield' &&
        org.slug !== 'cybershield'
    );

    return sanitized.length > 0
      ? sanitized
      : initialOrganizations;
  },

  saveOrganizations(orgs: Organization[]): void {
    const sanitized = orgs.filter(
      (org) =>
        org.id !== 'org-cybershield' &&
        org.slug !== 'cybershield'
    );

    safeSet(STORAGE_KEYS.ORGS, sanitized);
  },

  // Active Organization
  getActiveOrgId(): string {
    const active = safeGet<string>(
      STORAGE_KEYS.ACTIVE_ORG,
      'org-hacktivators'
    );

    if (active === 'org-cybershield') {
      return 'org-hacktivators';
    }

    return active;
  },

  setActiveOrgId(orgId: string): void {
    const safeOrgId =
      orgId === 'org-cybershield'
        ? 'org-hacktivators'
        : orgId;

    safeSet(STORAGE_KEYS.ACTIVE_ORG, safeOrgId);
  },

  // Templates
  getTemplates(): CertificateTemplate[] {
    const templates = safeGet<CertificateTemplate[]>(
      STORAGE_KEYS.TEMPLATES,
      initialTemplates
    );

    return templates.map((template) => ({
      ...template,
      elements: template.elements.map((element) => {
        if (
          element.text &&
          (
            element.text.includes('CYBERSHIELD') ||
            element.text.includes('CyberShield') ||
            element.text.includes('ACADEMY OF ADVANCED')
          )
        ) {
          return {
            ...element,
            text: 'HACKTIVATORS ADVANCED COMPUTING DIVISION',
          };
        }

        return element;
      }),
    }));
  },

  saveTemplates(templates: CertificateTemplate[]): void {
    safeSet(STORAGE_KEYS.TEMPLATES, templates);
  },

  // Certificates
  // Returns an empty array when no certificates are stored.
  getCertificates(): Certificate[] {
    const certificates = safeGet<Certificate[]>(
      STORAGE_KEYS.CERTIFICATES,
      []
    );

    return certificates.map((certificate) => ({
      ...certificate,
      templateTitle: certificate.templateTitle?.replace(
        /CyberShield Academy/gi,
        'Hacktivators Team'
      ),
    }));
  },

  saveCertificates(certificates: Certificate[]): void {
    safeSet(STORAGE_KEYS.CERTIFICATES, certificates);
  },

  // Audit Logs
  // Returns an empty array when no audit logs are stored.
  getAuditLogs(): AuditLogEntry[] {
    return safeGet<AuditLogEntry[]>(
      STORAGE_KEYS.AUDIT_LOGS,
      []
    );
  },

  saveAuditLogs(logs: AuditLogEntry[]): void {
    safeSet(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  // Members
  getMembers(): OrgMember[] {
    const stored = safeGet<OrgMember[] | null>(
      STORAGE_KEYS.MEMBERS,
      null
    );

    if (stored !== null) {
      return stored;
    }

    // Default platform administrator.
    const defaultMembers: OrgMember[] = [
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

    return defaultMembers;
  },

  saveMembers(members: OrgMember[]): void {
    safeSet(STORAGE_KEYS.MEMBERS, members);
  },

  /**
   * Permanently removes a member from persistent storage.
   * Reads the latest persisted list and verifies the deletion.
   */
  deleteMember(memberId: string): OrgMember[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('Persistent storage is unavailable.');
    }

    const current = this.getMembers();

    if (!current.some((member) => member.id === memberId)) {
      throw new Error('User not found.');
    }

    const next = current.filter(
      (member) => member.id !== memberId
    );

    window.localStorage.setItem(
      STORAGE_KEYS.MEMBERS,
      JSON.stringify(next)
    );

    const persisted = safeGet<OrgMember[] | null>(
      STORAGE_KEYS.MEMBERS,
      null
    );

    if (
      persisted === null ||
      persisted.some((member) => member.id === memberId)
    ) {
      throw new Error('Deletion could not be persisted.');
    }

    return persisted;
  },

  /**
   * Clears certificates and audit logs.
   * Resets templates to the initial templates.
   * Restores the default platform administrator.
   */
  clearToProductionEmpty(): {
    certificates: Certificate[];
    auditLogs: AuditLogEntry[];
    templates: CertificateTemplate[];
    members: OrgMember[];
  } {
    const certificates: Certificate[] = [];
    const auditLogs: AuditLogEntry[] = [];
    const templates = initialTemplates;

    const members: OrgMember[] = [
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

    safeSet(STORAGE_KEYS.CERTIFICATES, certificates);
    safeSet(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
    safeSet(STORAGE_KEYS.TEMPLATES, templates);
    safeSet(STORAGE_KEYS.MEMBERS, members);

    return {
      certificates,
      auditLogs,
      templates,
      members,
    };
  },
};
