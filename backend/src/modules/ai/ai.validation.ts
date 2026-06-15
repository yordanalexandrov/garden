import { z } from "zod";

import { uuidSchema } from "../../shared/validation/common-schemas.js";

export const suggestionParamsSchema = z.object({
  suggestionId: uuidSchema
});

export const productIngestionBodySchema = z
  .object({
    productName: z.string().trim().min(1).optional(),
    labelText: z.string().trim().min(1).optional()
  })
  .refine((value) => value.productName !== undefined || value.labelText !== undefined, {
    message: "At least one of productName or labelText is required"
  });

export const bedPlanningBodySchema = z.object({
  bedId: uuidSchema,
  year: z.number().int().min(1900).max(3000),
  candidatePlantIds: z.array(uuidSchema).min(1),
  notes: z.string().trim().min(1).optional()
});

export const problemAssistBodySchema = z
  .object({
    problemId: uuidSchema.optional(),
    text: z.string().trim().min(1).optional()
  })
  .refine((value) => value.problemId !== undefined || value.text !== undefined, {
    message: "Either problemId or text is required"
  });

export const plantIngestionBodySchema = z.object({
  plantName: z.string().trim().min(1),
  notes: z.string().trim().min(1).optional()
});

export const acceptSuggestionBodySchema = z.object({
  editedPayload: z.record(z.string(), z.unknown()).optional()
});

export const rejectSuggestionBodySchema = z.object({});

export type SuggestionParams = z.infer<typeof suggestionParamsSchema>;
export type ProductIngestionBody = z.infer<typeof productIngestionBodySchema>;
export type BedPlanningBody = z.infer<typeof bedPlanningBodySchema>;
export type ProblemAssistBody = z.infer<typeof problemAssistBodySchema>;
export type PlantIngestionBody = z.infer<typeof plantIngestionBodySchema>;
export type AcceptSuggestionBody = z.infer<typeof acceptSuggestionBodySchema>;
