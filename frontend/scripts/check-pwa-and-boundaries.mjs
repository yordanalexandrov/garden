import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

const readJson = (relativePath) => JSON.parse(readFileSync(join(root, relativePath), 'utf8'));

const fail = (message) => {
  throw new Error(message);
};

const angular = readJson('angular.json');
const productionBuild = angular.projects?.frontend?.architect?.build?.configurations?.production;

if (productionBuild?.serviceWorker !== 'ngsw-config.json') {
  fail('Production build must generate the Angular service worker from ngsw-config.json.');
}

const manifest = readJson('public/manifest.webmanifest');

if (manifest.name !== 'Gardening Helper' || manifest.short_name !== 'Garden') {
  fail('Manifest must identify the Gardening Helper app.');
}

if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
  fail('Manifest must include app icons.');
}

const ngsw = readJson('ngsw-config.json');

if (!Array.isArray(ngsw.assetGroups) || ngsw.assetGroups.length === 0) {
  fail('Service worker config must define static asset groups.');
}

if ('dataGroups' in ngsw) {
  fail('Service worker config must not cache API/data groups in this phase.');
}

const mutationTerms = [
  /\/api\//i,
  /\bPOST\b/i,
  /\bPUT\b/i,
  /\bPATCH\b/i,
  /\bDELETE\b/i,
  /write[-_ ]?queue/i,
  /sync[-_ ]?queue/i,
];

for (const group of ngsw.assetGroups) {
  const resources = group.resources ?? {};
  const values = Object.values(resources).flatMap((entry) => (Array.isArray(entry) ? entry : []));

  for (const value of values) {
    if (mutationTerms.some((term) => term.test(value))) {
      fail(
        `Service worker static resources must not include API mutation/offline write patterns: ${value}`,
      );
    }
  }
}

const forbiddenFrontendSecretNames = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'DATABASE_URL',
  'POSTGRES_PASSWORD',
  'VAPID_PRIVATE_KEY',
  'AI_API_KEY',
  'AI_MODEL',
  'OPEN_METEO_BASE_URL',
  'SUPABASE_STORAGE_URL',
  'SUPABASE_STORAGE_BUCKET_PROBLEM_PHOTOS',
];

const forbiddenRuntimeExternalAssets = ['fonts.googleapis.com', 'fonts.gstatic.com'];

const scanTargets = [
  'src',
  'angular.json',
  'ngsw-config.json',
  'public/manifest.webmanifest',
  'package.json',
];
const textExtensions = new Set(['.html', '.json', '.scss', '.ts', '.webmanifest']);

const collectTextFiles = (target) => {
  const absolute = join(root, target);

  if (!existsSync(absolute)) {
    return [];
  }

  const stat = statSync(absolute);

  if (stat.isFile()) {
    return textExtensions.has(extname(absolute)) ? [absolute] : [];
  }

  return readdirSync(absolute).flatMap((entry) => collectTextFiles(join(target, entry)));
};

for (const file of scanTargets.flatMap(collectTextFiles)) {
  const content = readFileSync(file, 'utf8');
  const foundSecret = forbiddenFrontendSecretNames.find((name) => content.includes(name));
  const foundExternalAsset = forbiddenRuntimeExternalAssets.find((host) => content.includes(host));

  if (foundSecret) {
    fail(`Frontend code/config must not reference backend-only secret ${foundSecret} in ${file}.`);
  }

  if (foundExternalAsset) {
    fail(
      `PWA app shell assets must be same-origin in this phase; found ${foundExternalAsset} in ${file}.`,
    );
  }
}

console.log('PWA and frontend boundary checks passed.');
