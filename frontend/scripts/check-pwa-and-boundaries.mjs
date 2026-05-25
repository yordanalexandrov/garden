import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

const readJson = (relativePath) => JSON.parse(readFileSync(join(root, relativePath), 'utf8'));

const fail = (message) => {
  throw new Error(message);
};

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
  'SUPABASE_STUDIO_USERNAME',
  'SUPABASE_STUDIO_PASSWORD',
];

const supabaseTableCallPattern = /(?<!\bArray)\.from\s*(?:<[^>\n]+>)?\s*\(/;
const supabaseStoragePatterns = [/\bsupabase\s*\.\s*storage\b/i, /\.storage\s*\.\s*from\s*\(/i];
const supabaseSdkImportPattern = /from\s+['"]@supabase\/(?:supabase-js|auth-js|postgrest-js|storage-js)['"]/;
const rawHttpClientPatterns = [
  /import\s*\{[^}]*\bHttpClient\b[^}]*\}\s*from\s+['"]@angular\/common\/http['"]/,
  /import\s+\*\s+as\s+\w+\s+from\s+['"]@angular\/common\/http['"]/,
  /import\s*\(\s*['"]@angular\/common\/http['"]\s*\)/,
  /\bHttpClient\b/,
];
const trustedScopeFieldPattern = /\baccountId\b|\baccount_id\b/;
const featureApiDeletePattern = /\bthis\.api\.delete\s*(?:<[^>\n]+>)?\s*\(/;
const frontendInventoryAllocationPatterns = [
  /\bFEFO\b/i,
  /\binventory\s*allocation\b/i,
  /\ballocate[A-Za-z]*Lots\b/,
  /\bquantityRemaining\s*[+\-*/]?=/,
  /\bquantityRemaining\s*:\s*[^,\n]+[+\-*/]\s*[^,\n]+/,
];
const deferredPhase7FeatureDirectories = [
  'activities',
  'ai',
  'calendar',
  'mcp',
  'problems',
  'push',
  'storage',
  'tasks',
  'weather',
];

const isAuthInfrastructureFile = (relativePath) => relativePath.startsWith('src/app/core/auth/');
const isHttpInfrastructureFile = (relativePath) =>
  relativePath.startsWith('src/app/core/api/') ||
  relativePath.startsWith('src/app/core/interceptors/') ||
  relativePath === 'src/app/app.config.ts';
const isFrontendSourceFile = (relativePath) => relativePath.startsWith('src/');
const isFeatureSourceFile = (relativePath) => relativePath.startsWith('src/app/features/');
const isFeatureApiServiceFile = (relativePath) =>
  isFeatureSourceFile(relativePath) && relativePath.endsWith('-api.service.ts');

const findFrontendBoundaryViolations = (relativePath, content) => {
  const violations = [];
  const foundSecret = forbiddenFrontendSecretNames.find((name) => content.includes(name));

  if (foundSecret) {
    violations.push(
      `Frontend code/config must not reference backend-only secret ${foundSecret} in ${relativePath}.`,
    );
  }

  if (supabaseTableCallPattern.test(content)) {
    violations.push(
      `Frontend code must not call Supabase application tables with .from(...) in ${relativePath}.`,
    );
  }

  if (supabaseStoragePatterns.some((pattern) => pattern.test(content))) {
    violations.push(
      `Frontend code must not call Supabase Storage directly for business flows in ${relativePath}.`,
    );
  }

  if (
    isFrontendSourceFile(relativePath) &&
    !isAuthInfrastructureFile(relativePath) &&
    (supabaseSdkImportPattern.test(content) || /\bcreateClient\s*\(/.test(content))
  ) {
    violations.push(
      `@supabase/supabase-js imports and client creation are limited to core/auth in ${relativePath}.`,
    );
  }

  if (
    isFrontendSourceFile(relativePath) &&
    !isHttpInfrastructureFile(relativePath) &&
    rawHttpClientPatterns.some((pattern) => pattern.test(content))
  ) {
    violations.push(
      `Raw HttpClient usage is limited to core API/interceptor infrastructure in ${relativePath}.`,
    );
  }

  if (isFeatureSourceFile(relativePath) && trustedScopeFieldPattern.test(content)) {
    violations.push(
      `Frontend feature code must not accept or send trusted account scope fields in ${relativePath}.`,
    );
  }

  if (isFeatureApiServiceFile(relativePath) && featureApiDeletePattern.test(content)) {
    violations.push(
      `Feature API services must archive historical records through POST /archive, not DELETE, in ${relativePath}.`,
    );
  }

  if (
    (relativePath.startsWith('src/app/features/products/') ||
      relativePath.startsWith('src/app/features/inventory/')) &&
    frontendInventoryAllocationPatterns.some((pattern) => pattern.test(content))
  ) {
    violations.push(
      `Frontend code must not implement inventory allocation or direct stock mutation logic in ${relativePath}.`,
    );
  }

  return violations;
};

const assertBoundarySelfTestRejects = (
  label,
  content,
  expectedMessagePart,
  relativePath = 'src/app/features/example.ts',
) => {
  const violations = findFrontendBoundaryViolations(relativePath, content);

  if (!violations.some((violation) => violation.includes(expectedMessagePart))) {
    fail(`Boundary self-test failed to reject ${label}.`);
  }
};

assertBoundarySelfTestRejects(
  'direct Supabase table calls',
  'const rows = supabase.from(tableName).select("*");',
  '.from(...)',
);
assertBoundarySelfTestRejects(
  'typed direct Supabase table calls',
  "const rows = supabase.from<Row>('plants').select('*');",
  '.from(...)',
);
assertBoundarySelfTestRejects(
  'direct Supabase Storage calls',
  "const upload = supabase.storage.from('problem-photos').upload('photo.jpg', file);",
  'Supabase Storage',
);
assertBoundarySelfTestRejects(
  'backend-only frontend secret names',
  "const secret = 'SUPABASE_STUDIO_PASSWORD';",
  'backend-only secret',
);
assertBoundarySelfTestRejects(
  'Supabase SDK imports outside auth infrastructure',
  "import { SupabaseAuthClient } from '@supabase/auth-js';",
  'limited to core/auth',
);
assertBoundarySelfTestRejects(
  'raw HttpClient usage outside API infrastructure',
  "import { HttpClient } from '@angular/common/http';",
  'Raw HttpClient usage',
);
assertBoundarySelfTestRejects(
  'namespace HttpClient imports outside API infrastructure',
  "import * as ngHttp from '@angular/common/http';",
  'Raw HttpClient usage',
);
assertBoundarySelfTestRejects(
  'dynamic common HTTP imports outside API infrastructure',
  "const http = await import('@angular/common/http');",
  'Raw HttpClient usage',
);
assertBoundarySelfTestRejects(
  'HttpClient identifier usage outside API infrastructure',
  'const http = inject(HttpClient);',
  'Raw HttpClient usage',
);
assertBoundarySelfTestRejects(
  'trusted account scope fields in feature code',
  'export interface Request { accountId: string; }',
  'trusted account scope',
);
assertBoundarySelfTestRejects(
  'trusted snake_case account scope fields in feature code',
  'const body = { account_id: selectedAccount };',
  'trusted account scope',
);
assertBoundarySelfTestRejects(
  'hard delete calls in feature API services',
  "return this.api.delete(`/plants/${id}`);",
  'not DELETE',
  'src/app/features/plants/plants-api.service.ts',
);
assertBoundarySelfTestRejects(
  'frontend inventory allocation logic',
  'const lots = allocateLots(productLots, requestedQuantity);',
  'inventory allocation',
  'src/app/features/inventory/example.ts',
);

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

for (const directory of deferredPhase7FeatureDirectories) {
  const featureDirectory = join(root, 'src/app/features', directory);

  if (existsSync(featureDirectory) && statSync(featureDirectory).isDirectory()) {
    fail(
      `Frontend must not implement deferred feature domain "${directory}" yet; keep it as a placeholder route.`,
    );
  }
}

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
  const relativePath = relative(root, file).replaceAll('\\', '/');
  const content = readFileSync(file, 'utf8');
  const foundExternalAsset = forbiddenRuntimeExternalAssets.find((host) => content.includes(host));
  const boundaryViolations = findFrontendBoundaryViolations(relativePath, content);

  if (boundaryViolations.length > 0) {
    fail(boundaryViolations.join('\n'));
  }

  if (foundExternalAsset) {
    fail(
      `PWA app shell assets must be same-origin in this phase; found ${foundExternalAsset} in ${file}.`,
    );
  }
}

console.log('PWA and frontend boundary checks passed.');
