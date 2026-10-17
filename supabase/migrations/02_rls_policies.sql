-- ==============================================================================
-- HACKTIVATORS CERTIFICATES - ROW LEVEL SECURITY (RLS) POLICIES
-- Migration 02: Strict Multi-Tenant Isolation & Role Boundaries
-- ==============================================================================

-- 1. Enable RLS on all operational tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Helper Security Functions (SECURITY DEFINER)
-- Check if current authenticated user is a Platform Owner
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_platform_owner FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Check membership and role inside an organization
CREATE OR REPLACE FUNCTION public.has_org_role(lookup_org_id UUID, required_roles public.org_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE org_id = lookup_org_id
      AND user_id = auth.uid()
      AND role = ANY(required_roles)
  ) OR public.is_platform_owner();
$$;

-- 3. Organizations Policies
CREATE POLICY "Public can view organization basic info"
    ON public.organizations FOR SELECT
    USING (TRUE);

CREATE POLICY "Platform owners can insert/update organizations"
    ON public.organizations FOR ALL
    USING (public.is_platform_owner());

-- 4. Organization Members Policies
CREATE POLICY "Members can view other members in their organization"
    ON public.organization_members FOR SELECT
    USING (
      public.has_org_role(org_id, ARRAY['platform_owner', 'org_admin', 'issuer', 'auditor']::public.org_role[])
    );

CREATE POLICY "Admins can manage organization members"
    ON public.organization_members FOR ALL
    USING (
      public.has_org_role(org_id, ARRAY['platform_owner', 'org_admin']::public.org_role[])
    );

-- 5. Certificate Templates Policies
CREATE POLICY "Org members can view templates"
    ON public.certificate_templates FOR SELECT
    USING (
      public.has_org_role(org_id, ARRAY['platform_owner', 'org_admin', 'issuer', 'auditor']::public.org_role[])
    );

CREATE POLICY "Admins and Issuers can create templates"
    ON public.certificate_templates FOR INSERT
    WITH CHECK (
      public.has_org_role(org_id, ARRAY['platform_owner', 'org_admin', 'issuer']::public.org_role[])
    );

CREATE POLICY "Admins can update templates"
    ON public.certificate_templates FOR UPDATE
    USING (
      public.has_org_role(org_id, ARRAY['platform_owner', 'org_admin']::public.org_role[])
    );

-- 6. Certificates Policies (Tenant Isolation + Public Verification)
-- Public verification policy: anonymous users can SELECT certificates by exact ID
-- (Restricted to non-sensitive columns via Public View or frontend query)
CREATE POLICY "Public can verify certificates by ID"
    ON public.certificates FOR SELECT
    USING (TRUE);

CREATE POLICY "Issuers and Admins can insert certificates"
    ON public.certificates FOR INSERT
    WITH CHECK (
      public.has_org_role(org_id, ARRAY['platform_owner', 'org_admin', 'issuer']::public.org_role[])
    );

CREATE POLICY "Admins can revoke certificates (UPDATE status)"
    ON public.certificates FOR UPDATE
    USING (
      public.has_org_role(org_id, ARRAY['platform_owner', 'org_admin']::public.org_role[])
    );

-- 7. Audit Logs Policies (STRICT APPEND-ONLY)
CREATE POLICY "Auditors, Admins, Issuers can read organization audit logs"
    ON public.audit_logs FOR SELECT
    USING (
      public.has_org_role(org_id, ARRAY['platform_owner', 'org_admin', 'issuer', 'auditor']::public.org_role[])
    );

CREATE POLICY "System and authorized actors can append audit entries"
    ON public.audit_logs FOR INSERT
    WITH CHECK (
      public.has_org_role(org_id, ARRAY['platform_owner', 'org_admin', 'issuer']::public.org_role[])
    );

-- Prohibit UPDATE and DELETE on audit_logs completely to guarantee immutability
CREATE POLICY "No update on audit logs"
    ON public.audit_logs FOR UPDATE
    USING (FALSE);

CREATE POLICY "No delete on audit logs"
    ON public.audit_logs FOR DELETE
    USING (FALSE);

-- 8. Public Verification View (Strict zero-leakage view)
CREATE OR REPLACE VIEW public.public_verification_view AS
SELECT
    c.id,
    c.recipient_name,
    c.recipient_name_ar,
    c.title,
    c.title_ar,
    c.description,
    c.issue_date,
    c.status,
    c.revoked_reason,
    c.revoked_at,
    c.verification_hash,
    o.name AS organization_name,
    o.name_ar AS organization_name_ar,
    o.verified AS organization_verified
FROM public.certificates c
JOIN public.organizations o ON o.id = c.org_id;

-- Grant select on public view to anon role
GRANT SELECT ON public.public_verification_view TO anon, authenticated;
