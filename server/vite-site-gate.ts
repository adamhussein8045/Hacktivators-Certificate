import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';
import { handleSiteGate, type SiteGateOptions } from './site-gate';

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ?? 'http';
  const url = `${proto}://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value !== undefined) headers.set(key, value);
  }
  let body: Buffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    body = Buffer.concat(chunks);
  }
  return new Request(url, { method: req.method, headers, body });
}

async function sendWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key !== 'set-cookie') res.setHeader(key, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) res.setHeader('Set-Cookie', cookies);
  res.end(Buffer.from(await response.arrayBuffer()));
}

/** Runs the same server-side gate as `middleware.ts` inside `vite dev` and `vite preview`. */
export function siteGatePlugin(options: SiteGateOptions): Plugin {
  const gate: Connect.NextHandleFunction = (req, res, next) => {
    toWebRequest(req)
      .then((request) => handleSiteGate(request, options))
      .then((response) => (response ? sendWebResponse(res, response) : next()))
      .catch(next);
  };
  return {
    name: 'site-password-gate',
    configureServer(server) {
      server.middlewares.use(gate);
    },
    configurePreviewServer(server) {
      server.middlewares.use(gate);
    },
  };
}
