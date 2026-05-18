import { z } from "zod";

export const uuidSchema = z.string().uuid();

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
