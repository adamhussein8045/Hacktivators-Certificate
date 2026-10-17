export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export type UserRole = 'platform_owner' | 'org_admin' | 'issuer' | 'auditor' | 'public_visitor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  logoUrl: string;
  verified: boolean;
  website: string;
  createdAt: string;
  totalCertificates: number;
}

export type ElementType =
  | 'title'
  | 'recipient'
  | 'description'
  | 'issuer_name'
  | 'issuer_title'
  | 'org_name'
  | 'issue_date'
  | 'cert_id'
  | 'qr_code'
  | 'logo'
  | 'signature'
  | 'badge'
  | 'custom_text';

export interface CertificateElement {
  id: string;
  type: ElementType;
  text?: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width?: number; // percentage (0 - 100)
  height?: number; // percentage (0 - 100)
  fontSize: number; // px at standard scale
  fontFamily: string; // 'Plus Jakarta Sans' | 'Cairo' | 'Amiri' | 'Playfair Display' | 'Cinzel' | 'Alexandria'
  fontWeight: 'normal' | '500' | '600' | 'bold' | '800';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  src?: string; // image data or url
  visible: boolean;
  isRtl?: boolean;
}

export type TemplateOrientation = 'landscape' | 'portrait';
export type TemplateBorder =
  | 'classic_gold'
  | 'modern_minimal'
  | 'cyber_tech'
  | 'ornate_diploma'
  | 'arabic_geometric'
  | 'none';

export type TemplateBackground =
  | 'clean_white'
  | 'cream_parchment'
  | 'dark_slate'
  | 'royal_navy'
  | 'soft_emerald';

export interface CertificateTemplate {
  id: string;
  orgId: string;
  title: string;
  titleAr: string;
  description: string;
  version: number;
  orientation: TemplateOrientation;
  backgroundColor: TemplateBackground;
  borderColor: string;
  accentColor: string;
  borderStyle: TemplateBorder;
  elements: CertificateElement[];
  createdAt: string;
  updatedAt: string;
}

export type CertificateStatus = 'valid' | 'revoked' | 'expired';

export interface Certificate {
  id: string; // e.g. 'HCK-2026-89A4B1'
  orgId: string;
  templateId: string;
  templateSnapshot: CertificateTemplate; // Immutable snapshot
  recipientName: string;
  recipientEmail: string;
  recipientNameAr?: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  issueDate: string;
  expiryDate?: string;
  issuerName: string;
  issuerTitle: string;
  status: CertificateStatus;
  revokedReason?: string;
  revokedAt?: string;
  revokedBy?: string;
  qrCodeDataUrl?: string;
  verificationHash: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  orgId: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  action:
    | 'CERTIFICATE_ISSUED'
    | 'CERTIFICATE_REVOKED'
    | 'TEMPLATE_CREATED'
    | 'TEMPLATE_UPDATED'
    | 'BATCH_CSV_ISSUED'
    | 'ROLE_UPDATED'
    | 'MEMBER_INVITED'
  | 'MEMBER_DELETED'
    | 'ORG_SETTINGS_UPDATED';
  targetId: string;
  details: string;
  detailsAr?: string;
  timestamp: string;
}

export interface OrgMember {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'invited';
  joinedAt: string;
  inviteToken?: string;
  inviteLink?: string;
  invitedAt?: string;
}

export interface CsvParsedRow {
  rowNumber: number;
  recipientName: string;
  recipientEmail: string;
  recipientNameAr?: string;
  issueDate?: string;
  customField?: string;
  isValid: boolean;
  errors: string[];
  isDuplicateCandidate?: boolean;
}
