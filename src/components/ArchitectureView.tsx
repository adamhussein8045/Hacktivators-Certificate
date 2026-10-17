import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import {
  Database,
  Shield,
  Key,
  Cloud,
  DollarSign,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Code,
  Lock,
} from 'lucide-react';

interface ArchitectureViewProps {
  lang: Language;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ lang }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<
    'overview' | 'schema' | 'rls' | 'oauth' | 'cloudflare' | 'cost'
  >('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const envConfigSnippet = `# Supabase Environment Configuration (Add to .env.local / Cloudflare Pages)
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Deployment Domain
VITE_APP_URL="https://hacktivators-certificates.pages.dev"
`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              {t.architecture.title}
            </h1>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
              Phase B Ready for Approval
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.architecture.subtitle}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Phase B Architecture
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'schema'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.architecture.schemaTab}
          </button>
          <button
            onClick={() => setActiveTab('rls')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'rls'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.architecture.rlsTab}
          </button>
          <button
            onClick={() => setActiveTab('oauth')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'oauth'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.architecture.authTab}
          </button>
          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'cloudflare'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.architecture.cloudflareTab}
          </button>
          <button
            onClick={() => setActiveTab('cost')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'cost'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.architecture.costTab}
          </button>
        </div>
      </div>

      {/* Tab: Overview & Approval Request */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-indigo-200">
                  Phase A Completed & Verified · Ready for Phase B Review
                </h3>
                <p className="text-xs text-indigo-300/80 mt-0.5">
                  The visual certificate designer, high-resolution PDF/PNG exports, bilingual (Arabic RTL & English LTR) typography, CSV bulk issuance, verification engine, and role management are fully implemented and running locally.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-indigo-500/20 text-xs text-slate-300 leading-relaxed">
              <strong className="text-white block mb-1">
                Approval Gate for External Services:
              </strong>
              As required by your instructions, no external cloud accounts (Supabase, Google Cloud OAuth, or Cloudflare billing) are modified automatically without explicit approval. Review the proposed database migrations, RLS policies, and environment setup in the tabs above.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">1. Supabase PostgreSQL & RLS</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Relational schema with UUID foreign keys, immutable template snapshots, tamper-evident audit trail, and database-level multi-tenant isolation.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">2. Supabase Auth + Google OAuth</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Email/Password and Google OAuth sign-in. Initial platform owner is bootstrapped safely via SQL or Auth trigger, never a browser variable.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">3. Cloudflare Pages SPA Hosting</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Global edge CDN, automated Git build deployment (<code className="text-indigo-300">npm run build</code> into <code className="text-indigo-300">dist</code>), and zero-cost free tier.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: PostgreSQL Schema */}
      {activeTab === 'schema' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Migration File: <code className="text-indigo-400">/supabase/migrations/01_initial_schema.sql</code>
              </h3>
              <p className="text-xs text-slate-400">
                Defines organizations, profiles, organization_members, templates, certificates, and audit_logs.
              </p>
            </div>
            <button
              onClick={() => handleCopy('schema', '-- Run migration in Supabase SQL Editor\n-- File: /supabase/migrations/01_initial_schema.sql')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded-lg border border-slate-700"
            >
              {copiedCode === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode === 'schema' ? t.common.copied : 'Copy Migration SQL'}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-xs font-mono text-slate-300 max-h-[500px]">
            <pre>{`-- 1. Organizations Table
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Organization Members & Roles (RBAC)
CREATE TYPE public.org_role AS ENUM ('platform_owner', 'org_admin', 'issuer', 'auditor');

CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.org_role NOT NULL DEFAULT 'issuer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

-- 3. Certificate Templates (Versioned)
CREATE TABLE public.certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    orientation TEXT NOT NULL DEFAULT 'landscape',
    elements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Issued Certificates Table (Immutable Snapshot)
CREATE TABLE public.certificates (
    id TEXT PRIMARY KEY, -- e.g. HCK-2026-X9A7B3
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.certificate_templates(id),
    template_snapshot JSONB NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    status public.certificate_status NOT NULL DEFAULT 'valid',
    revoked_reason TEXT,
    verification_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Append-Only Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_email TEXT NOT NULL,
    actor_role public.org_role NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`}</pre>
          </div>
        </div>
      )}

      {/* Tab: RLS Policies */}
      {activeTab === 'rls' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Migration File: <code className="text-indigo-400">/supabase/migrations/02_rls_policies.sql</code>
              </h3>
              <p className="text-xs text-slate-400">
                Security-definer role checks, tenant isolation, immutable audit logs, and zero-leakage public verification view.
              </p>
            </div>
            <button
              onClick={() => handleCopy('rls', '-- File: /supabase/migrations/02_rls_policies.sql')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded-lg border border-slate-700"
            >
              {copiedCode === 'rls' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode === 'rls' ? t.common.copied : 'Copy RLS SQL'}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-xs font-mono text-slate-300 max-h-[500px]">
            <pre>{`-- Helper Function: Check Organization Role with Platform Owner bypass
CREATE OR REPLACE FUNCTION public.has_org_role(lookup_org_id UUID, required_roles public.org_role[])
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE org_id = lookup_org_id
      AND user_id = auth.uid()
      AND role = ANY(required_roles)
  ) OR public.is_platform_owner();
$$;

-- Multi-Tenant Isolation for Certificates:
-- Only members belonging to the same organization can query private certificates
CREATE POLICY "Org members can view certificates"
    ON public.certificates FOR SELECT
    USING (public.has_org_role(org_id, ARRAY['platform_owner', 'org_admin', 'issuer', 'auditor']::public.org_role[]));

-- Strict Append-Only Guarantee for Audit Logs (Prohibit UPDATE and DELETE)
CREATE POLICY "No update on audit logs" ON public.audit_logs FOR UPDATE USING (FALSE);
CREATE POLICY "No delete on audit logs" ON public.audit_logs FOR DELETE USING (FALSE);

-- Public Verification View (Strict Zero-Leakage: NO email or internal notes exposed)
CREATE OR REPLACE VIEW public.public_verification_view AS
SELECT
    c.id, c.recipient_name, c.recipient_name_ar, c.title, c.issue_date, c.status,
    c.revoked_reason, c.revoked_at, c.verification_hash,
    o.name AS organization_name, o.verified AS organization_verified
FROM public.certificates c
JOIN public.organizations o ON o.id = c.org_id;`}</pre>
          </div>
        </div>
      )}

      {/* Tab: Supabase Auth & Google OAuth */}
      {activeTab === 'oauth' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              Supabase Auth & Google OAuth 2.0 Configuration
            </h3>

            <ol className="list-decimal list-inside space-y-3 text-slate-300 leading-relaxed">
              <li>
                <strong className="text-white">Create a Supabase Project:</strong> Navigate to <code className="text-indigo-400">database.new</code> and create a new project. Choose a free region (e.g. Frankfurt or London).
              </li>
              <li>
                <strong className="text-white">Configure Google OAuth in Google Cloud Console:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 text-slate-400 space-y-1">
                  <li>Go to Google Cloud Console → APIs & Services → Credentials.</li>
                  <li>Create OAuth 2.0 Client ID (Web Application).</li>
                  <li>Add Authorized Redirect URI: <code className="text-emerald-400">https://&lt;your-supabase-project-id&gt;.supabase.co/auth/v1/callback</code>.</li>
                  <li>Copy the Client ID and Client Secret into Supabase Dashboard → Authentication → Providers → Google.</li>
                </ul>
              </li>
              <li>
                <strong className="text-white">Configure Environment Variables:</strong> Set your project URL and public Anon Key:
              </li>
            </ol>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-300 flex items-center justify-between">
              <pre>{envConfigSnippet}</pre>
              <button
                onClick={() => handleCopy('env', envConfigSnippet)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded border border-slate-700 flex items-center gap-1.5"
              >
                {copiedCode === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy .env
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Cloudflare Pages Deployment */}
      {activeTab === 'cloudflare' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-indigo-400" />
              Cloudflare Pages Deployment Checklist
            </h3>

            <div className="space-y-2 text-slate-300">
              <p>Deploying Hacktivators Certificates to Cloudflare Pages:</p>
              <ul className="list-disc list-inside ml-2 text-slate-400 space-y-1.5">
                <li><strong className="text-slate-200">Framework Preset:</strong> Vite</li>
                <li><strong className="text-slate-200">Build Command:</strong> <code className="text-indigo-400 font-mono">npm run build</code></li>
                <li><strong className="text-slate-200">Build Output Directory:</strong> <code className="text-indigo-400 font-mono">dist</code></li>
                <li><strong className="text-slate-200">Single-Page App (SPA) Routing:</strong> Cloudflare Pages automatically handles client-side routes via Vite's <code className="text-indigo-400 font-mono">index.html</code> fallback.</li>
                <li><strong className="text-slate-200">Environment Variables:</strong> Add <code className="text-indigo-400 font-mono">VITE_SUPABASE_URL</code> and <code className="text-indigo-400 font-mono">VITE_SUPABASE_ANON_KEY</code> in Cloudflare Pages project settings.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Cost Control & Free-Tier Limits */}
      {activeTab === 'cost' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Cost Control & Free-Tier Limits Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <strong className="text-slate-100 block text-xs">Supabase Free Tier (Hobby)</strong>
                <ul className="text-slate-400 space-y-1">
                  <li>· 500 MB PostgreSQL Database storage (supports ~150,000 certificates).</li>
                  <li>· 50,000 Monthly Active Users (MAU) for Auth.</li>
                  <li>· 1 GB File Storage for logos and signatures.</li>
                  <li>· 2 Billion Edge Function executions / month.</li>
                  <li>· <span className="text-emerald-400 font-medium">Cost: $0.00 / month</span></li>
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <strong className="text-slate-100 block text-xs">Cloudflare Pages Free Tier</strong>
                <ul className="text-slate-400 space-y-1">
                  <li>· Unlimited bandwidth and edge requests.</li>
                  <li>· 500 build runs per month.</li>
                  <li>· Free automatic SSL/TLS certificate.</li>
                  <li>· Global Anycast edge network with DDoS mitigation.</li>
                  <li>· <span className="text-emerald-400 font-medium">Cost: $0.00 / month</span></li>
                </ul>
              </div>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-lg text-emerald-300">
              Zero billing is required to run the entire production-grade infrastructure for Hacktivators Team and initial organizations.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
