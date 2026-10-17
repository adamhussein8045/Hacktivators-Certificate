import React, { useState } from 'react';
import { OrgMember, UserRole, Language, Organization } from '../types';
import { translations } from '../i18n/translations';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle,
  Mail,
  Calendar,
  Lock,
} from 'lucide-react';

interface TeamMembersProps {
  currentOrg: Organization;
  lang: Language;
  currentRole: UserRole;
  members: OrgMember[];
  onInviteMember: (member: OrgMember) => void;
  onSimulateRoleChange: (role: UserRole) => void;
}

export const TeamMembers: React.FC<TeamMembersProps> = ({
  currentOrg,
  lang,
  currentRole,
  members,
  onInviteMember,
  onSimulateRoleChange,
}) => {
  const t = translations[lang];

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('issuer');

  const orgMembers = members.filter((m) => m.orgId === currentOrg.id);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const newMember: OrgMember = {
      id: `mem-${Date.now()}`,
      orgId: currentOrg.id,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: 'active',
      joinedAt: new Date().toISOString(),
    };

    onInviteMember(newMember);
    setIsInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            {t.members.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.members.subtitle} <span className="text-indigo-400 font-semibold">{currentOrg.name}</span>
          </p>
        </div>

        {/* Role Switcher for RBAC verification */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs">
            <span className="text-slate-400 font-medium">{t.common.switchRole}:</span>
            <select
              value={currentRole}
              onChange={(e) => onSimulateRoleChange(e.target.value as UserRole)}
              className="bg-slate-800 text-indigo-400 font-semibold rounded px-2 py-1 text-xs border border-slate-700 focus:outline-none"
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
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t.members.inviteMember}
            </button>
          )}
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">{t.members.memberName}</th>
                <th className="py-3 px-4">{t.members.memberEmail}</th>
                <th className="py-3 px-4">{t.members.memberRole}</th>
                <th className="py-3 px-4">{t.members.memberStatus}</th>
                <th className="py-3 px-4">{t.members.joined}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {orgMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs uppercase">
                      {member.name.slice(0, 2)}
                    </div>
                    {member.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {member.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-[11px]">
                      {t.roles[member.role] || member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" /> Active
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Explanations Matrix */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          {t.members.roleExplanation}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
            <strong className="text-indigo-400 block">{t.roles.platform_owner}</strong>
            <p className="text-slate-400">{t.members.roleOwnerDesc}</p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
            <strong className="text-indigo-400 block">{t.roles.org_admin}</strong>
            <p className="text-slate-400">{t.members.roleAdminDesc}</p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
            <strong className="text-indigo-400 block">{t.roles.issuer}</strong>
            <p className="text-slate-400">{t.members.roleIssuerDesc}</p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
            <strong className="text-indigo-400 block">{t.roles.auditor}</strong>
            <p className="text-slate-400">{t.members.roleAuditorDesc}</p>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">
              {t.members.inviteMember}
            </h3>

            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.members.memberName} *
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Tariq Ziyad"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.members.memberEmail} *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@hacktivators.org"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.members.memberRole} *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="org_admin">{t.roles.org_admin}</option>
                  <option value="issuer">{t.roles.issuer}</option>
                  <option value="auditor">{t.roles.auditor}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-lg"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                >
                  {t.members.sendInvite}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
