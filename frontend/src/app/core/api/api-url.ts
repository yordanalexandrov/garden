import { normalizeApiBaseUrl } from '../config/api-base-url';

const DEFAULT_ORIGIN = 'http://localhost';

const currentOrigin = (): string => globalThis.location?.origin ?? DEFAULT_ORIGIN;

const removeTrailingSlash = (value: string): string =>
  value.endsWith('/') && value.length > 1 ? value.slice(0, -1) : value;

const toUrl = (value: string): URL => new URL(value, currentOrigin());

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const matchesPathPrefix = (pathname: string, basePathname: string): boolean => {
  const normalizedPathname = removeTrailingSlash(pathname);
  const normalizedBasePathname = removeTrailingSlash(basePathname);

  return (
    normalizedPathname === normalizedBasePathname ||
    normalizedPathname.startsWith(`${normalizedBasePathname}/`)
  );
};

export const joinApiUrl = (apiBaseUrl: string, path: string): string => {
  const normalizedBaseUrl = normalizeApiBaseUrl(apiBaseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
};

export const isApiRequestUrl = (requestUrl: string, apiBaseUrl: string): boolean => {
  const normalizedBaseUrl = normalizeApiBaseUrl(apiBaseUrl);
  const resolvedRequestUrl = toUrl(requestUrl);

  if (isAbsoluteUrl(normalizedBaseUrl)) {
    const resolvedBaseUrl = toUrl(normalizedBaseUrl);

    return (
      resolvedRequestUrl.origin === resolvedBaseUrl.origin &&
      matchesPathPrefix(resolvedRequestUrl.pathname, resolvedBaseUrl.pathname)
    );
  }

  return (
    resolvedRequestUrl.origin === currentOrigin() &&
    matchesPathPrefix(resolvedRequestUrl.pathname, normalizedBaseUrl)
  );
};
