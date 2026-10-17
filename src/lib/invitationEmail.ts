export const OFFICIAL_CONTACT_EMAIL = 'hacktivators5@gmail.com';
export const OFFICIAL_SENDER_NAME = 'Hacktivators Certificates';

export type InvitationRole = 'platform_owner' | 'org_admin' | 'issuer' | 'auditor';
export type InvitationLang = 'en' | 'ar';

export interface InvitationEmailInput {
  name: string;
  email: string;
  role: InvitationRole;
  orgName: string;
  inviteLink: string;
  lang: InvitationLang;
}

const ROLE_LABELS: Record<InvitationLang, Record<InvitationRole, string>> = {
  en: {
    platform_owner: 'Platform Owner',
    org_admin: 'Organization Administrator',
    issuer: 'Certificate Issuer',
    auditor: 'Compliance Auditor',
  },
  ar: {
    platform_owner: 'مالك المنصة',
    org_admin: 'مسؤول المؤسسة',
    issuer: 'مصدر شهادات معتمد',
    auditor: 'مدقق امتثال مستقل',
  },
};

export function isInvitationRole(value: unknown): value is InvitationRole {
  return typeof value === 'string' && value in ROLE_LABELS.en;
}

export function buildInvitationEmail({ name, email, role, orgName, inviteLink, lang }: InvitationEmailInput) {
  const roleLabel = ROLE_LABELS[lang][role] ?? role;
  const subject = `[Hacktivators Certificates] Official Access Invitation - ${orgName}`;

  const text =
    lang === 'ar'
      ? `تفويض رسمي واعتماد وصول - منصة شهادات هاكتيفيتورز

السيد/ة: ${name} المحترم/ة،

تم تفويضكم رسمياً للانضمام إلى فريق عمل "${orgName}" عبر منصة إدارة الشهادات والوثائق الرقمية المعتمدة (Hacktivators Certificates).

بيانات التفويض المؤسسي:
• المؤسسة المانحة: ${orgName}
• البريد الإلكتروني المعتمد: ${email}
• مستوى الصلاحية: ${roleLabel}
• تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')} (UTC)

============================================================
رابط تفعيل الحساب وبدء التشغيل:
${inviteLink}
============================================================

يرجى الضغط على الرابط أعلاه لتفعيل صلاحياتكم والولوج المباشر إلى مساحة العمل التشغيلية لإصدار وتدقيق الاعتمادات الرقمية.

في حال واجهتكم أي استفسارات أو احتجتم إلى تحقق أمني إضافي، يرجى التواصل مع إدارة العمليات: ${OFFICIAL_CONTACT_EMAIL}

مع فائق التقدير،
إدارة العمليات والتحقق الرقمي
فريق هاكتيفيتورز - Hacktivators Team
Innovation Technology Impact`
      : `Official Credential Access Authorization - Hacktivators Certificates

Dear ${name},

You have been formally designated and authorized to join ${orgName} on the Hacktivators Certificates Enterprise Platform.

Designation Details:
• Conferring Institution: ${orgName}
• Authorized Recipient: ${email}
• Assigned Authority Level: ${roleLabel}
• Issuance Timestamp: ${new Date().toUTCString()}

============================================================
OFFICIAL ONBOARDING & ACCESS ACTIVATION LINK:
${inviteLink}
============================================================

Please click the secure link above to activate your administrative privileges, verify your institutional identity, and access your role-specific credential operations workspace.

If you did not request or anticipate this authorization, please contact platform security administration immediately at ${OFFICIAL_CONTACT_EMAIL}.

Sincerely,
Credential Directorate & Security Operations
Hacktivators Team
Innovation Technology Impact`;

  return { subject, text };
}
