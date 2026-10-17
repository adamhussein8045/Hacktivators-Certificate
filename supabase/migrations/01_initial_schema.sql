-- ==============================================================================
-- HACKTIVATORS CERTIFICATES - MULTI-TENANT POSTGRESQL SCHEMA (SUPABASE)
-- Migration 01: Core Entities & Relational Schema
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for slug lookup
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- 2. Platform User Profiles Table (syncs with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    is_platform_owner BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Organization Members & Roles (RBAC)
CREATE TYPE public.org_role AS ENUM (
    'platform_owner',
    'org_admin',
    'issuer',
    'auditor'
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.org_role NOT NULL DEFAULT 'issuer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_user ON public.organization_members(org_id, user_id);

-- 4. Organization Invitations
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.org_role NOT NULL DEFAULT 'issuer',
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Certificate Templates
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    orientation TEXT NOT NULL DEFAULT 'landscape' CHECK (orientation IN ('landscape', 'portrait')),
    background_color TEXT NOT NULL DEFAULT 'clean_white',
    border_style TEXT NOT NULL DEFAULT 'classic_gold',
    elements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_org ON public.certificate_templates(org_id);

-- 6. Issued Certificates Table
CREATE TYPE public.certificate_status AS ENUM ('valid', 'revoked', 'expired');

CREATE TABLE IF NOT EXISTS public.certificates (
    id TEXT PRIMARY KEY, -- Unique, non-guessable alphanumeric ID (e.g. HCK-2026-X9A7B3)
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.certificate_templates(id),
    template_snapshot JSONB NOT NULL, -- Immutable snapshot preserving exact historical look
    recipient_name TEXT NOT NULL,
    recipient_name_ar TEXT,
    recipient_email TEXT NOT NULL,
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT NOT NULL,
    description_ar TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issuer_name TEXT NOT NULL,
    issuer_title TEXT NOT NULL,
    status public.certificate_status NOT NULL DEFAULT 'valid',
    revoked_reason TEXT,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),
    verification_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_org ON public.certificates(org_id);
CREATE INDEX IF NOT EXISTS idx_certificates_email ON public.certificates(recipient_email);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);

-- 7. Tamper-Evident Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    actor_email TEXT NOT NULL,
    actor_role public.org_role NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details TEXT NOT NULL,
    details_ar TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON public.audit_logs(org_id, timestamp DESC);
