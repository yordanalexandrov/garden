import { z } from "zod";

export const POSTGRES_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuidSchema = z.string().regex(POSTGRES_UUID_PATTERN, "Invalid UUID");

export const SANE_YEAR_MIN = 1900;
export const SANE_YEAR_MAX = 3000;

export const saneYearSchema = z.number().int().min(SANE_YEAR_MIN).max(SANE_YEAR_MAX);
export const saneYearQuerySchema = z.preprocess(
  (value) => (value === undefined || value === "" ? undefined : value),
  z.coerce.number().int().min(SANE_YEAR_MIN).max(SANE_YEAR_MAX).optional()
);
export const positiveNumberSchema = z.number().positive();
export const nonNegativeNumberSchema = z.number().min(0);

export const optionalSearchQuerySchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional()
);

export const includeArchivedQuerySchema = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return false;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return value;
}, z.boolean());

export const paginationQuerySchema = z.object({
  page: z.preprocess(
    (value) => (value === undefined || value === "" ? undefined : value),
    z.coerce.number().int().min(1).default(1)
  ),
  pageSize: z.preprocess(
    (value) => (value === undefined || value === "" ? undefined : value),
    z.coerce.number().int().min(1).max(100).default(20)
  )
});
