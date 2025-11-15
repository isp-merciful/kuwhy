import { prisma } from '../../../lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const login_name = (searchParams.get('login_name') || '').trim().toLowerCase();
    if (!login_name) {
      return new Response(JSON.stringify({ ok: false, error: 'MISSING_LOGIN_NAME' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const dup = await prisma.users.findUnique({ where: { login_name } });
    return new Response(JSON.stringify({ ok: true, exists: !!dup }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('check-username error:', e);
    return new Response(JSON.stringify({ ok: false, exists: false, error: 'SERVER_ERROR' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }
}
