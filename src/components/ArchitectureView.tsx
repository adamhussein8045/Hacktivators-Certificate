import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import {
  Database,
  Key,
  Cloud,
  DollarSign,
  Copy,
  Check,
  CheckCircle2,
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
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-white text-neutral-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-950 flex items-center gap-2">
              <Database className="w-5 h-5 text-neutral-700" />
              {t.architecture.title}
            </h1>
            <span className="text-[10px] bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-0.5 rounded font-mono">
              Phase B Ready for Review
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {t.architecture.subtitle}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center bg-neutral-100 p-0.5 rounded border border-neutral-200 text-xs gap-0.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'schema'
                ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t.architecture.schemaTab}
          </button>
          <button
            onClick={() => setActiveTab('rls')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'rls'
                ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t.architecture.rlsTab}
          </button>
          <button
            onClick={() => setActiveTab('oauth')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'oauth'
                ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t.architecture.authTab}
          </button>
          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'cloudflare'
                ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t.architecture.cloudflareTab}
          </button>
          <button
            onClick={() => setActiveTab('cost')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'cost'
                ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t.architecture.costTab}
          </button>
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-neutral-800 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-neutral-950">
                  Phase A Verified & Operational · Multi-Tenant Architecture Ready
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  The visual certificate designer, high-resolution PDF/PNG exports, bilingual (Arabic RTL & English LTR) typography, CSV bulk issuance, verification engine, and role management are fully implemented and running locally in memory.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 text-xs text-neutral-600 leading-relaxed">
              <strong className="text-neutral-900 block mb-1 font-semibold">
                Approval Gate for External Services:
              </strong>
              In accordance with your security protocol, no external cloud accounts (Supabase, Google Cloud OAuth, or Cloudflare billing) are modified automatically without explicit approval. Review the proposed database migrations, RLS policies, and environment setup in the tabs above.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-neutral-200 rounded p-5 space-y-3">
              <div className="w-8 h-8 rounded bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-neutral-950">1. Supabase PostgreSQL & RLS</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Relational schema with UUID foreign keys, immutable template snapshots, tamper-evident audit trail, and database-level multi-tenant isolation.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded p-5 space-y-3">
              <div className="w-8 h-8 rounded bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-neutral-950">2. Supabase Auth + Google OAuth</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Email/Password and Google OAuth sign-in. Initial platform owner is bootstrapped safely via SQL or Auth trigger, never a browser variable.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded p-5 space-y-3">
              <div className="w-8 h-8 rounded bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-neutral-950">3. Cloudflare Pages SPA Hosting</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Global edge CDN, automated Git build deployment (<code className="font-mono text-neutral-900">npm run build</code> into <code className="font-mono text-neutral-900">dist</code>), and zero-cost free tier.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: PostgreSQL Schema */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-950">
                Migration File: <code className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">/supabase/migrations/01_initial_schema.sql</code>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Defines organizations, profiles, organization_members, templates, certificates, and audit_logs.
              </p>
            </div>
            <button
              onClick={() => handleCopy('schema', '-- Run migration in Supabase SQL Editor\n-- File: /supabase/migrations/01_initial_schema.sql')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs rounded border border-neutral-200 transition-colors"
            >
              {copiedCode === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode === 'schema' ? t.common.copied : 'Copy Migration SQL'}
            </button>
          </div>

          <div className="bg-neutral-50 p-4 rounded border border-neutral-200 overflow-x-auto text-xs font-mono text-neutral-800 max-h-[500px]">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-950">
                Migration File: <code className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">/supabase/migrations/02_rls_policies.sql</code>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Security-definer role checks, tenant isolation, immutable audit logs, and zero-leakage public verification view.
              </p>
            </div>
            <button
              onClick={() => handleCopy('rls', '-- File: /supabase/migrations/02_rls_policies.sql')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs rounded border border-neutral-200 transition-colors"
            >
              {copiedCode === 'rls' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode === 'rls' ? t.common.copied : 'Copy RLS SQL'}
            </button>
          </div>

          <div className="bg-neutral-50 p-4 rounded border border-neutral-200 overflow-x-auto text-xs font-mono text-neutral-800 max-h-[500px]">
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
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-neutral-950 flex items-center gap-2">
              <Key className="w-4 h-4 text-neutral-700" />
              Supabase Auth & Google OAuth 2.0 Configuration
            </h3>

            <ol className="list-decimal list-inside space-y-3 text-neutral-700 leading-relaxed">
              <li>
                <strong className="text-neutral-950">Create a Supabase Project:</strong> Navigate to <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200">database.new</code> and create a new project. Choose a free region (e.g. Frankfurt or London).
              </li>
              <li>
                <strong className="text-neutral-950">Configure Google OAuth in Google Cloud Console:</strong>
                <ul className="list-disc list-inside ml-4 mt-1.5 text-neutral-600 space-y-1">
                  <li>Go to Google Cloud Console → APIs & Services → Credentials.</li>
                  <li>Create OAuth 2.0 Client ID (Web Application).</li>
                  <li>Add Authorized Redirect URI: <code className="font-mono text-neutral-900 bg-neutral-100 px-1 py-0.5 rounded">https://&lt;your-supabase-project-id&gt;.supabase.co/auth/v1/callback</code>.</li>
                  <li>Copy the Client ID and Client Secret into Supabase Dashboard → Authentication → Providers → Google.</li>
                </ul>
              </li>
              <li>
                <strong className="text-neutral-950">Configure Environment Variables:</strong> Set your project URL and public Anon Key:
              </li>
            </ol>

            <div className="bg-neutral-50 p-3.5 rounded border border-neutral-200 font-mono text-neutral-800 flex items-center justify-between">
              <pre className="text-xs">{envConfigSnippet}</pre>
              <button
                onClick={() => handleCopy('env', envConfigSnippet)}
                className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 text-xs rounded border border-neutral-200 flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedCode === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                Copy .env
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Cloudflare Pages Deployment */}
      {activeTab === 'cloudflare' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-neutral-950 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-neutral-700" />
              Cloudflare Pages Deployment Checklist
            </h3>

            <div className="space-y-2 text-neutral-700 leading-relaxed">
              <p>Deploying Hacktivators Certificates to Cloudflare Pages:</p>
              <ul className="list-disc list-inside ml-2 text-neutral-600 space-y-2">
                <li><strong className="text-neutral-950">Framework Preset:</strong> Vite</li>
                <li><strong className="text-neutral-950">Build Command:</strong> <code className="font-mono text-neutral-900 bg-neutral-100 px-1 py-0.5 rounded">npm run build</code></li>
                <li><strong className="text-neutral-950">Build Output Directory:</strong> <code className="font-mono text-neutral-900 bg-neutral-100 px-1 py-0.5 rounded">dist</code></li>
                <li><strong className="text-neutral-950">Single-Page App (SPA) Routing:</strong> Cloudflare Pages automatically handles client-side routes via Vite's <code className="font-mono text-neutral-900 bg-neutral-100 px-1 py-0.5 rounded">index.html</code> fallback.</li>
                <li><strong className="text-neutral-950">Environment Variables:</strong> Add <code className="font-mono text-neutral-900 bg-neutral-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono text-neutral-900 bg-neutral-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> in Cloudflare Pages project settings.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Cost Control & Free-Tier Limits */}
      {activeTab === 'cost' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-neutral-950 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-neutral-700" />
              Cost Control & Free-Tier Limits Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-50 p-4 rounded border border-neutral-200 space-y-2">
                <strong className="text-neutral-950 block text-xs font-semibold">Supabase Free Tier (Hobby)</strong>
                <ul className="text-neutral-600 space-y-1.5">
                  <li>· 500 MB PostgreSQL Database storage (supports ~150,000 certificates).</li>
                  <li>· 50,000 Monthly Active Users (MAU) for Auth.</li>
                  <li>· 1 GB File Storage for logos and signatures.</li>
                  <li>· 2 Billion Edge Function executions / month.</li>
                  <li>· <span className="text-emerald-700 font-semibold">Cost: $0.00 / month</span></li>
                </ul>
              </div>

              <div className="bg-neutral-50 p-4 rounded border border-neutral-200 space-y-2">
                <strong className="text-neutral-950 block text-xs font-semibold">Cloudflare Pages Free Tier</strong>
                <ul className="text-neutral-600 space-y-1.5">
                  <li>· Unlimited bandwidth and edge requests.</li>
                  <li>· 500 build runs per month.</li>
                  <li>· Free automatic SSL/TLS certificate.</li>
                  <li>· Global Anycast edge network with DDoS mitigation.</li>
                  <li>· <span className="text-emerald-700 font-semibold">Cost: $0.00 / month</span></li>
                </ul>
              </div>
            </div>

            <div className="bg-neutral-100 border border-neutral-200 p-3 rounded text-neutral-800 font-medium">
              Zero billing is required to run the entire production-grade infrastructure for Hacktivators Team and initial organizations.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
