import { z } from "zod";

import { uuidSchema } from "../../shared/validation/common-schemas.js";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date");
const optionalUuidQuerySchema = z.preprocess((value) => (value === undefined || value === "" ? undefined : value), uuidSchema.optional());

export const calendarQuerySchema = z
  .object({
    from: dateOnlySchema,
    to: dateOnlySchema,
    placeId: optionalUuidQuerySchema
  })
  .superRefine((query, ctx) => {
    if (query.from > query.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["from"],
        message: "must be on or before to"
      });
    }
  });

export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
