import React, { useState } from 'react';
import { OrgMember, UserRole, Language, Organization } from '../types';
import { translations } from '../i18n/translations';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle,
  X,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Send,
  ArrowRight,
  Clock,
  Trash2,
} from 'lucide-react';

interface TeamMembersProps {
  currentOrg: Organization;
  lang: Language;
  currentRole: UserRole;
  members: OrgMember[];
  onInviteMember: (member: OrgMember) => void;
  onDeleteMember?: (memberId: string) => void;
  onSimulateRoleChange: (role: UserRole) => void;
  onUpdateMemberStatus?: (memberId: string, status: 'active' | 'invited') => void;
}

export const TeamMembers: React.FC<TeamMembersProps> = ({
  currentOrg,
  lang,
  currentRole,
  members,
  onInviteMember,
  onDeleteMember,
  onSimulateRoleChange,
  onUpdateMemberStatus,
}) => {
  const t = translations[lang];

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('issuer');
  const [memberToDelete, setMemberToDelete] = useState<OrgMember | null>(null);

  // Delivery confirmation modal state
  const [deliveryResult, setDeliveryResult] = useState<{
    member: OrgMember;
    gmailUrl: string;
    mailtoUrl: string;
    inviteLink: string;
    emailBody: string;
    subject: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedTableLinkId, setCopiedTableLinkId] = useState<string | null>(null);

  const orgMembers = members.filter((m) => m.orgId === currentOrg.id);

  // Helper to construct invitation details
  const buildInvitation = (name: string, email: string, role: UserRole) => {
    const inviteToken = `inv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const origin = window.location.origin;
    const path = window.location.pathname;
    const inviteLink = `${origin}${path}?invite=${inviteToken}&email=${encodeURIComponent(
      email.trim()
    )}&role=${encodeURIComponent(role)}&org=${encodeURIComponent(
      currentOrg.id
    )}&name=${encodeURIComponent(name.trim())}`;

    const roleLabelEn = {
      platform_owner: 'Platform Owner',
      org_admin: 'Organization Administrator',
      issuer: 'Certificate Issuer',
      auditor: 'Compliance Auditor',
    }[role] || role;

    const roleLabelAr = {
      platform_owner: 'مالك المنصة',
      org_admin: 'مسؤول المؤسسة',
      issuer: 'مصدر شهادات معتمد',
      auditor: 'مدقق امتثال مستقل',
    }[role] || role;

    const roleLabel = lang === 'ar' ? roleLabelAr : roleLabelEn;

    const subject = `[Hacktivators Certificates] Official Access Invitation - ${currentOrg.name}`;

    const emailBody = lang === 'ar'
      ? `تفويض رسمي واعتماد وصول - منصة شهادات هاكتيفيتورز

السيد/ة: ${name} المحترم/ة،

تم تفويضكم رسمياً للانضمام إلى فريق عمل "${currentOrg.name}" عبر منصة إدارة الشهادات والوثائق الرقمية المعتمدة (Hacktivators Certificates).

بيانات التفويض المؤسسي:
• المؤسسة المانحة: ${currentOrg.name}
• البريد الإلكتروني المعتمد: ${email}
• مستوى الصلاحية: ${roleLabel}
• تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')} (UTC)

============================================================
رابط تفعيل الحساب وبدء التشغيل:
${inviteLink}
============================================================

يرجى الضغط على الرابط أعلاه لتفعيل صلاحياتكم والولوج المباشر إلى مساحة العمل التشغيلية لإصدار وتدقيق الاعتمادات الرقمية.

في حال واجهتكم أي استفسارات أو احتجتم إلى تحقق أمني إضافي، يرجى التواصل مع إدارة العمليات: support@hacktivators.org

مع فائق التقدير،
إدارة العمليات والتحقق الرقمي
فريق هاكتيفيتورز - Hacktivators Team
https://hacktivators.org`
      : `Official Credential Access Authorization - Hacktivators Certificates

Dear ${name},

You have been formally designated and authorized to join ${currentOrg.name} on the Hacktivators Certificates Enterprise Platform.

Designation Details:
• Conferring Institution: ${currentOrg.name}
• Authorized Recipient: ${email}
• Assigned Authority Level: ${roleLabel}
• Issuance Timestamp: ${new Date().toUTCString()}

============================================================
OFFICIAL ONBOARDING & ACCESS ACTIVATION LINK:
${inviteLink}
============================================================

Please click the secure link above to activate your administrative privileges, verify your institutional identity, and access your role-specific credential operations workspace.

If you did not request or anticipate this authorization, please contact platform security administration immediately at support@hacktivators.org.

Sincerely,
Credential Directorate & Security Operations
Hacktivators Team
https://hacktivators.org`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      email.trim()
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    const mailtoUrl = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(emailBody)}`;

    return {
      inviteToken,
      inviteLink,
      subject,
      emailBody,
      gmailUrl,
      mailtoUrl,
    };
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const trimmedEmail = inviteEmail.trim();
    const trimmedName = inviteName.trim();

    const inviteDetails = buildInvitation(trimmedName, trimmedEmail, inviteRole);

    const newMember: OrgMember = {
      id: `mem-${Date.now()}`,
      orgId: currentOrg.id,
      name: trimmedName,
      email: trimmedEmail,
      role: inviteRole,
      status: 'invited',
      joinedAt: new Date().toISOString(),
      inviteToken: inviteDetails.inviteToken,
      inviteLink: inviteDetails.inviteLink,
      invitedAt: new Date().toISOString(),
    };

    // Save to storage
    onInviteMember(newMember);

    // Attempt to open Gmail compose automatically in a new tab
    try {
      window.open(inviteDetails.gmailUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Browser popup blocker might intervene; the delivery modal will provide direct buttons
    }

    // Set delivery confirmation result modal
    setDeliveryResult({
      member: newMember,
      gmailUrl: inviteDetails.gmailUrl,
      mailtoUrl: inviteDetails.mailtoUrl,
      inviteLink: inviteDetails.inviteLink,
      emailBody: inviteDetails.emailBody,
      subject: inviteDetails.subject,
    });

    setIsInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyTableLink = async (member: OrgMember) => {
    const link =
      member.inviteLink ||
      buildInvitation(member.name, member.email, member.role).inviteLink;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedTableLinkId(member.id);
      setTimeout(() => setCopiedTableLinkId(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyMessage = async (msg: string) => {
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenGmailForMember = (member: OrgMember) => {
    const invite = buildInvitation(member.name, member.email, member.role);
    window.open(invite.gmailUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-white text-neutral-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950 flex items-center gap-2">
            <Users className="w-5 h-5 text-neutral-700" />
            {t.members.title}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {t.members.subtitle}{' '}
            <span className="text-neutral-900 font-semibold">{currentOrg.name}</span>
          </p>
        </div>

        {/* Role Simulation Switcher & Invite Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-neutral-200 px-2.5 py-1.5 rounded text-xs">
            <span className="text-neutral-500 font-medium">{t.common.switchRole}:</span>
            <select
              value={currentRole}
              onChange={(e) => onSimulateRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-neutral-900 font-semibold cursor-pointer focus:outline-none"
            >
              <option value="platform_owner">{t.roles.platform_owner}</option>
              <option value="org_admin">{t.roles.org_admin}</option>
              <option value="issuer">{t.roles.issuer}</option>
              <option value="auditor">{t.roles.auditor}</option>
            </select>
          </div>

          {(currentRole === 'platform_owner' || currentRole === 'org_admin') && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t.members.inviteMember}
            </button>
          )}
        </div>
      </div>

      {/* Role Simulator Information */}
      <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-600 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-neutral-900 block font-semibold">
            {t.common.roleSimWarning}
          </strong>
          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
            {lang === 'ar'
              ? 'التبديل بين الأدوار يتيح اختبار مستويات الصلاحيات وواجهات الاستخدام التشغيلية للمنصة.'
              : 'Switching roles in this interface allows testing client-side UI workflows and authority levels.'}
          </p>
        </div>
      </div>

      {/* Roster Table with Gmail and Delete Actions */}
      <div className="bg-white border border-neutral-200 rounded overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">{t.members.memberName}</th>
                <th className="py-3 px-4">{t.members.memberEmail}</th>
                <th className="py-3 px-4">{t.members.memberRole}</th>
                <th className="py-3 px-4">{t.members.memberStatus}</th>
                <th className="py-3 px-4">{t.members.joined}</th>
                <th className="py-3 px-4 text-center">{t.registry.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              {orgMembers.map((member) => {
                const isInvited = member.status === 'invited';
                return (
                  <tr key={member.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-950 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {member.name.slice(0, 2)}
                      </div>
                      <span>{member.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      {member.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-neutral-800 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-[11px]">
                        {t.roles[member.role] || member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isInvited ? (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium text-[10px]">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {t.members.invitedStatus}
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {t.members.activeStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Send via Gmail Button */}
                        <button
                          onClick={() => handleOpenGmailForMember(member)}
                          title={`${t.members.sendViaGmail} (${member.email})`}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-700 text-[11px] rounded transition-colors cursor-pointer"
                        >
                          <Mail className="w-3 h-3 text-red-600" />
                          <span className="font-medium">{t.members.sendViaGmail}</span>
                        </button>

                        {/* Copy Link Button */}
                        <button
                          onClick={() => handleCopyTableLink(member)}
                          title={t.members.copyInviteLink}
                          className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                        >
                          {copiedTableLinkId === member.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* If invited, quick activate toggle */}
                        {isInvited && onUpdateMemberStatus && (
                          <button
                            onClick={() => onUpdateMemberStatus(member.id, 'active')}
                            title="Mark Active"
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete User Button next to every user */}
                        {onDeleteMember && (
                          <button
                            onClick={() => setMemberToDelete(member)}
                            title={`${t.members.deleteMember} (${member.name})`}
                            className="flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 border border-red-200/60 rounded text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{t.members.deleteMember}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Explanations Matrix */}
      <div className="bg-white border border-neutral-200 rounded p-5 space-y-4">
        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-neutral-700" />
          {t.members.roleExplanation}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-neutral-50 rounded border border-neutral-200 space-y-1">
            <strong className="text-neutral-950 block font-semibold">{t.roles.platform_owner}</strong>
            <p className="text-neutral-600 leading-relaxed">{t.members.roleOwnerDesc}</p>
          </div>
          <div className="p-3.5 bg-neutral-50 rounded border border-neutral-200 space-y-1">
            <strong className="text-neutral-950 block font-semibold">{t.roles.org_admin}</strong>
            <p className="text-neutral-600 leading-relaxed">{t.members.roleAdminDesc}</p>
          </div>
          <div className="p-3.5 bg-neutral-50 rounded border border-neutral-200 space-y-1">
            <strong className="text-neutral-950 block font-semibold">{t.roles.issuer}</strong>
            <p className="text-neutral-600 leading-relaxed">{t.members.roleIssuerDesc}</p>
          </div>
          <div className="p-3.5 bg-neutral-50 rounded border border-neutral-200 space-y-1">
            <strong className="text-neutral-950 block font-semibold">{t.roles.auditor}</strong>
            <p className="text-neutral-600 leading-relaxed">{t.members.roleAuditorDesc}</p>
          </div>
        </div>
      </div>

      {/* Step 1: Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-neutral-800" />
                <h3 className="text-sm font-bold text-neutral-950">
                  {t.members.inviteMember}
                </h3>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-900 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {t.members.memberName} *
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Tariq Ziyad"
                  className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {t.members.memberEmail} *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
                />
                <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                  {t.members.gmailNote}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {t.members.memberRole} *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
                >
                  <option value="org_admin">{t.roles.org_admin}</option>
                  <option value="issuer">{t.roles.issuer}</option>
                  <option value="auditor">{t.roles.auditor}</option>
                </select>
              </div>

              {/* Notice that Gmail will open */}
              <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded text-[11px] text-neutral-600 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>
                  {lang === 'ar'
                    ? 'سيتم استخدام البريد المدخل أعلاه كوجهة إرسال في Gmail مع رابط الدعوة المعتمد.'
                    : 'The exact email specified above will be used to send the onboarding invitation via Gmail.'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs rounded transition-colors cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  {t.members.sendInvite}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: Delivery & Gmail Dispatch Confirmation Center Modal */}
      {deliveryResult && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded max-w-xl w-full p-6 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-950">
                    {t.members.inviteSuccess}
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {t.members.recipientLabel}:{' '}
                    <span className="font-mono font-semibold text-neutral-900">
                      {deliveryResult.member.email}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeliveryResult(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Dispatch Primary Actions */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Send via Gmail Button */}
                <a
                  href={deliveryResult.gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded transition-colors shadow-sm"
                >
                  <Mail className="w-4 h-4 text-red-400" />
                  <span>{t.members.openInGmail}</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                {/* Open Mailto */}
                <a
                  href={deliveryResult.mailtoUrl}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-medium rounded transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{t.members.openMailto}</span>
                </a>
              </div>

              {/* Direct Invitation Link Box */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-600 font-medium">
                  <span>{t.members.inviteLinkGenerated}:</span>
                  <button
                    onClick={() => handleCopyLink(deliveryResult.inviteLink)}
                    className="flex items-center gap-1 text-neutral-900 hover:text-black font-semibold cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">{t.members.linkCopied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t.members.copyInviteLink}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 bg-white border border-neutral-200 rounded font-mono text-[11px] text-neutral-800 break-all select-all">
                  {deliveryResult.inviteLink}
                </div>
              </div>
            </div>

            {/* Email Preview & Copy Message */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-neutral-700">
                  {lang === 'ar' ? 'معاينة نص الرسالة الصادرة:' : 'Transmitted Message Preview:'}
                </span>
                <button
                  onClick={() => handleCopyMessage(deliveryResult.emailBody)}
                  className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">{t.members.messageCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{t.members.copyMessage}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-[11px] text-neutral-700 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                {deliveryResult.emailBody}
              </div>
            </div>

            {/* Test Portal Simulation */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-xs">
              <a
                href={deliveryResult.inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-neutral-700 hover:text-neutral-950 font-medium underline underline-offset-4"
              >
                <span>{t.members.testPortal}</span>
                <ArrowRight className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => setDeliveryResult(null)}
                className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded transition-colors cursor-pointer"
              >
                {t.common.done}
              </button>
            </div>
          </div>
        </div>
        )}
      {/* Step 3: Delete User Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-950">
                    {t.members.deleteConfirmTitle}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {currentOrg.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMemberToDelete(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {t.members.deleteConfirmDesc}
            </p>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs space-y-1">
              <div className="font-semibold text-neutral-950">{memberToDelete.name}</div>
              <div className="font-mono text-[11px] text-neutral-600">{memberToDelete.email}</div>
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                {t.roles[memberToDelete.role] || memberToDelete.role}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-3.5 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs rounded transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteMember) {
                    onDeleteMember(memberToDelete.id);
                  }
                  setMemberToDelete(null);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors shadow-xs cursor-pointer"
              >
                {t.members.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
