import { signToken } from './_shared/auth.js';

const TOKEN_TTL_DAYS = 7;

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const { password } = await req.json();
  if (password !== process.env.EDITOR_PASSWORD) {
    return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const exp = Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  const token = signToken({ exp }, process.env.EDITOR_TOKEN_SECRET);
  return new Response(JSON.stringify({ ok: true, token, exp }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
