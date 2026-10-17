import { next } from '@vercel/functions';
import { handleSiteGate } from './server/site-gate.ts';

// No matcher: the gate runs on every route, asset, and API request.
export default async function middleware(request: Request) {
  const blocked = await handleSiteGate(request, {
    password: process.env.SITE_PASSWORD,
    sessionSecret: process.env.SITE_SESSION_SECRET,
  });
  return blocked ?? next();
}
