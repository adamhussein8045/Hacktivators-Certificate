/**
 * Server-side password gate shared by Vercel Routing Middleware (production)
 * and the Vite dev/preview server. Never import this from client code.
 */

export interface SiteGateOptions {
  password: string | undefined;
  /** Optional dedicated signing secret; falls back to the password. */
  sessionSecret?: string;
  /** Use SameSite=None + Partitioned so the cookie works inside cross-site iframes (v0 preview). */
  embedded?: boolean;
}

const COOKIE_NAME = '__Host-site_access';
const UNLOCK_PATH = '/__site-gate/unlock';
const LOCK_PATH = '/__site-gate/lock';
const TOKEN_VERSION = 'v1';
/** Hard ceiling in case a browser restores session cookies after a restart. */
const MAX_SESSION_AGE_MS = 12 * 60 * 60 * 1000;
const FAILED_ATTEMPT_DELAY_MS = 750;
const PUBLIC_ASSETS = new Set(['/hacktivators_logo.jpg', '/favicon.ico']);

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`site-gate:${secret}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

async function createToken(secret: string): Promise<string> {
  const issuedAt = Date.now().toString(36);
  const signature = await sign(secret, `${TOKEN_VERSION}.${issuedAt}`);
  return `${TOKEN_VERSION}.${issuedAt}.${signature}`;
}

async function isValidToken(secret: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [version, issuedAt, signature] = token.split('.');
  if (version !== TOKEN_VERSION || !issuedAt || !signature) return false;
  const issuedMs = parseInt(issuedAt, 36);
  if (!Number.isFinite(issuedMs)) return false;
  const age = Date.now() - issuedMs;
  if (age < 0 || age > MAX_SESSION_AGE_MS) return false;
  return constantTimeEqual(signature, await sign(secret, `${version}.${issuedAt}`));
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/** Session cookie: no Expires / Max-Age, so it is dropped when the browser session ends. */
function sessionCookie(value: string, embedded: boolean): string {
  const sameSite = embedded ? 'SameSite=None; Partitioned' : 'SameSite=Lax';
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; ${sameSite}`;
}

function clearedCookie(embedded: boolean): string {
  const sameSite = embedded ? 'SameSite=None; Partitioned' : 'SameSite=Lax';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; ${sameSite}; Max-Age=0`;
}

function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  if (raw.startsWith('/__site-gate')) return '/';
  return raw;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const baseHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function gatePage(nextPath: string, error?: string): string {
  const errorBlock = error
    ? `<p id="gate-error" class="error" role="alert">${escapeHtml(error)}</p>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex, nofollow" />
<meta name="theme-color" content="#ffffff" />
<title>Protected · Hacktivators Certificates</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;min-height:100%}
  body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#fafafa;color:#171717;-webkit-font-smoothing:antialiased;display:flex;min-height:100vh;min-height:100dvh;align-items:center;justify-content:center;padding:24px 16px}
  .card{width:100%;max-width:400px;background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:32px 28px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.04)}
  .brand{display:flex;align-items:center;gap:12px;margin-bottom:28px}
  .brand img{width:40px;height:40px;border-radius:10px;object-fit:cover;border:1px solid #e5e5e5}
  .brand span{font-weight:600;font-size:15px;letter-spacing:-.01em}
  h1{font-size:22px;line-height:1.3;font-weight:700;letter-spacing:-.02em;margin:0 0 6px}
  .sub{margin:0;font-size:14px;line-height:1.6;color:#525252}
  .ar{font-family:'Cairo',sans-serif;margin-top:2px;color:#737373}
  form{margin-top:24px;display:flex;flex-direction:column;gap:8px}
  label{font-size:13px;font-weight:600;color:#262626}
  input[type=password]{width:100%;height:44px;padding:0 14px;font:inherit;font-size:15px;color:#171717;background:#fff;border:1px solid #d4d4d4;border-radius:10px;outline:none;transition:border-color .15s,box-shadow .15s}
  input[type=password]:focus{border-color:#171717;box-shadow:0 0 0 3px rgba(23,23,23,.08)}
  input[aria-invalid=true]{border-color:#dc2626}
  input[aria-invalid=true]:focus{box-shadow:0 0 0 3px rgba(220,38,38,.12)}
  .error{margin:0;font-size:13px;color:#dc2626}
  button{margin-top:8px;height:44px;border:0;border-radius:10px;background:#171717;color:#fff;font:inherit;font-size:15px;font-weight:600;cursor:pointer;transition:background .15s}
  button:hover{background:#262626}
  button:focus-visible{outline:2px solid #171717;outline-offset:2px}
  .foot{margin:20px 0 0;font-size:12px;color:#a3a3a3;line-height:1.5}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  @media (max-width:420px){.card{padding:28px 20px;border-radius:14px}h1{font-size:20px}}
</style>
</head>
<body>
<main class="card" aria-labelledby="gate-title">
  <div class="brand">
    <img src="/hacktivators_logo.jpg" alt="" width="40" height="40" />
    <span>Hacktivators Certificates</span>
  </div>
  <h1 id="gate-title">This site is protected</h1>
  <p class="sub">Enter the access password to continue.</p>
  <p class="sub ar" dir="rtl" lang="ar">هذا الموقع محمي. أدخل كلمة المرور للمتابعة.</p>
  <form method="post" action="${UNLOCK_PATH}">
    <input type="hidden" name="next" value="${escapeHtml(nextPath)}" />
    <label for="password">Password <span class="sr-only">(required)</span></label>
    <input id="password" name="password" type="password" autocomplete="current-password" required autofocus${
      error ? ' aria-invalid="true" aria-describedby="gate-error"' : ''
    } />
    ${errorBlock}
    <button type="submit">Unlock</button>
  </form>
  <p class="foot">Access lasts until you close your browser.</p>
</main>
</body>
</html>`;
}

function htmlResponse(body: string, status: number, extra: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: { ...baseHeaders, 'Content-Type': 'text/html; charset=utf-8', ...extra },
  });
}

function wantsHtml(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  const accept = request.headers.get('accept') ?? '';
  const dest = request.headers.get('sec-fetch-dest');
  return dest === 'document' || dest === 'iframe' || accept.includes('text/html');
}

/**
 * Returns a Response when the request must be handled/blocked by the gate,
 * or `null` when the visitor holds a valid session and the request may continue.
 */
export async function handleSiteGate(request: Request, options: SiteGateOptions): Promise<Response | null> {
  const url = new URL(request.url);
  const embedded = options.embedded ?? false;
  const password = options.password;

  if ((request.method === 'GET' || request.method === 'HEAD') && PUBLIC_ASSETS.has(url.pathname)) {
    return null;
  }

  if (!password) {
    return htmlResponse(
      gatePage('/', 'Site access is not configured. Please contact the site administrator.'),
      503,
    );
  }

  const secret = options.sessionSecret || password;

  if (url.pathname === UNLOCK_PATH) {
    if (request.method !== 'POST') {
      return new Response(null, { status: 303, headers: { ...baseHeaders, Location: '/' } });
    }
    let submitted = '';
    let nextPath = '/';
    try {
      const form = await request.formData();
      submitted = String(form.get('password') ?? '');
      nextPath = safeNextPath(String(form.get('next') ?? '/'));
    } catch {
      // Malformed body is treated as an incorrect password.
    }

    const [submittedHash, expectedHash] = await Promise.all([sha256Hex(submitted), sha256Hex(password)]);
    if (submitted && constantTimeEqual(submittedHash, expectedHash)) {
      return new Response(null, {
        status: 303,
        headers: {
          ...baseHeaders,
          Location: nextPath,
          'Set-Cookie': sessionCookie(await createToken(secret), embedded),
        },
      });
    }

    await new Promise((resolve) => setTimeout(resolve, FAILED_ATTEMPT_DELAY_MS));
    return htmlResponse(gatePage(nextPath, 'Incorrect password. Please try again.'), 401);
  }

  if (url.pathname === LOCK_PATH) {
    return new Response(null, {
      status: 303,
      headers: { ...baseHeaders, Location: '/', 'Set-Cookie': clearedCookie(embedded) },
    });
  }

  if (await isValidToken(secret, readCookie(request, COOKIE_NAME))) {
    return null;
  }

  if (wantsHtml(request)) {
    return htmlResponse(gatePage(safeNextPath(url.pathname + url.search)), 401);
  }

  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...baseHeaders, 'Content-Type': 'application/json' },
  });
}
