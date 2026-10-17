import nodemailer from 'nodemailer';
import {
  OFFICIAL_CONTACT_EMAIL,
  OFFICIAL_SENDER_NAME,
  buildInvitationEmail,
  isInvitationRole,
} from '../src/lib/invitationEmail.js';

export interface SendInvitationEnv {
  gmailAppPassword?: string;
}

const EMAIL_PATTERN = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/[\r\n\t]+/g, ' ').trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
}

function requestHosts(request: Request): Set<string> {
  const hosts = new Set<string>();
  hosts.add(new URL(request.url).host);
  for (const header of ['host', 'x-forwarded-host']) {
    const value = request.headers.get(header)?.split(',')[0]?.trim();
    if (value) hosts.add(value);
  }
  return hosts;
}

function isValidInviteLink(raw: unknown, request: Request): raw is string {
  if (typeof raw !== 'string' || raw.length > 2000) return false;
  try {
    const url = new URL(raw);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      requestHosts(request).has(url.host) &&
      url.searchParams.has('invite')
    );
  } catch {
    return false;
  }
}

/** Sends an Official Invitation from the official Gmail account via authenticated SMTP. */
export async function handleSendInvitation(request: Request, env: SendInvitationEnv): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const appPassword = env.gmailAppPassword?.replace(/\s+/g, '');
  if (!appPassword) return json(503, { error: 'email_not_configured' });

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const name = cleanText(payload.name, 120);
  const email = cleanText(payload.email, 254);
  const orgName = cleanText(payload.orgName, 160);
  const lang = payload.lang === 'ar' ? 'ar' : 'en';

  if (!name || !email || !EMAIL_PATTERN.test(email) || !orgName || !isInvitationRole(payload.role)) {
    return json(400, { error: 'invalid_fields' });
  }
  if (!isValidInviteLink(payload.inviteLink, request)) {
    return json(400, { error: 'invalid_invite_link' });
  }

  const { subject, text } = buildInvitationEmail({
    name,
    email,
    role: payload.role,
    orgName,
    inviteLink: payload.inviteLink,
    lang,
  });

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: OFFICIAL_CONTACT_EMAIL, pass: appPassword },
  });

  try {
    const info = await transporter.sendMail({
      from: { name: OFFICIAL_SENDER_NAME, address: OFFICIAL_CONTACT_EMAIL },
      replyTo: OFFICIAL_CONTACT_EMAIL,
      to: email,
      subject,
      text,
    });
    return json(200, { ok: true, messageId: info.messageId, from: OFFICIAL_CONTACT_EMAIL });
  } catch (err) {
    const code = (err as { code?: string; responseCode?: number }) ?? {};
    console.error('Invitation email failed', code.code, code.responseCode);
    const authFailed = code.code === 'EAUTH' || code.responseCode === 535;
    return json(502, { error: authFailed ? 'smtp_auth_failed' : 'smtp_send_failed' });
  }
}
