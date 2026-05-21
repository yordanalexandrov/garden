#!/usr/bin/env node
import { createHmac, randomUUID } from 'node:crypto';

const secret = process.env.SUPABASE_JWT_SECRET ?? process.argv[2];

if (!secret || secret.length < 32) {
  console.error('Set SUPABASE_JWT_SECRET or pass it as the first argument.');
  process.exit(1);
}

const accountId = process.env.GARDEN_ACCOUNT_ID ?? '00000000-0000-0000-0000-000000000001';
const userId = process.env.SUPABASE_USER_ID ?? accountId;
const email = process.env.SUPABASE_USER_EMAIL ?? 'demo@example.com';
const issuer = process.env.SUPABASE_AUTH_EXTERNAL_URL ?? 'http://localhost:8000/auth/v1';
const expiresInSeconds = Number(process.env.JWT_EXPIRY ?? '3600');
const nowSeconds = Math.floor(Date.now() / 1000);

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

const header = { alg: 'HS256', typ: 'JWT' };
const payload = {
  aud: 'authenticated',
  exp: nowSeconds + expiresInSeconds,
  iat: nowSeconds,
  iss: issuer,
  nbf: nowSeconds,
  sub: userId === 'random' ? randomUUID() : userId,
  email,
  role: 'authenticated',
  app_metadata: {
    account_id: accountId,
  },
};

const signingInput = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;
const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

console.log(`${signingInput}.${signature}`);
