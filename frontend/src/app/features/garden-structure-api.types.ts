export interface ArchiveResult {
  readonly archived: boolean;
}

export interface MutationResult {
  readonly id: string;
}

export interface PagedFilter {
  readonly page?: number;
  readonly pageSize?: number;
}
