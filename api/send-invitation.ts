import { handleSendInvitation } from '../server/send-invitation.js';

export async function POST(request: Request): Promise<Response> {
  return handleSendInvitation(request, { gmailAppPassword: process.env.GMAIL_APP_PASSWORD });
}
