#!/usr/bin/env node
import { createHmac } from 'node:crypto';

const secret = process.argv[2];

if (!secret || secret.length < 32) {
  console.error('Usage: node scripts/generate-supabase-jwts.mjs <jwt-secret-at-least-32-chars>');
  process.exit(1);
}

const nowSeconds = Math.floor(Date.now() / 1000);
const tenYearsSeconds = 10 * 365 * 24 * 60 * 60;

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const signingInput = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

  return `${signingInput}.${signature}`;
}

const commonPayload = {
  iss: 'supabase',
  iat: nowSeconds,
  exp: nowSeconds + tenYearsSeconds,
};

console.log(`SUPABASE_JWT_SECRET=${secret}`);
console.log(`SUPABASE_ANON_KEY=${sign({ ...commonPayload, role: 'anon' })}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY=${sign({ ...commonPayload, role: 'service_role' })}`);
