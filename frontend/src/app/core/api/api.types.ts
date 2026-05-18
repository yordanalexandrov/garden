export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'BUSINESS_RULE_VIOLATION',
  'INVENTORY_SHORTAGE',
  'EXTERNAL_SERVICE_ERROR',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiErrorDetails = Record<string, unknown>;

export interface ApiSuccessEnvelope<TData> {
  readonly data: TData;
}

export interface ApiListData<TItem> {
  readonly items: readonly TItem[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export type ApiListEnvelope<TItem> = ApiSuccessEnvelope<ApiListData<TItem>>;

export interface ApiMutationData {
  readonly id: string;
}

export type ApiMutationEnvelope = ApiSuccessEnvelope<ApiMutationData>;

export interface ApiErrorEnvelope {
  readonly error: {
    readonly code: ApiErrorCode;
    readonly message: string;
    readonly details: ApiErrorDetails;
  };
}

export const isApiErrorCode = (value: unknown): value is ApiErrorCode =>
  typeof value === 'string' && API_ERROR_CODES.includes(value as ApiErrorCode);
