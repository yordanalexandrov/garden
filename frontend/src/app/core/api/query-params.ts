type QueryParamValue = string | number | boolean;

export type QueryParamsInput = object;

export type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>;

export const buildQueryParams = (input: QueryParamsInput): QueryParams => {
  const params: QueryParams = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    if (Array.isArray(value)) {
      params[key] = value.filter(isQueryParamValue);
      continue;
    }

    if (isQueryParamValue(value)) {
      params[key] = value;
    }
  }

  return params;
};

const isQueryParamValue = (value: unknown): value is QueryParamValue =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
