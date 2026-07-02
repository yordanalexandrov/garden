import { z } from "zod";

import { uuidSchema } from "../../shared/validation/common-schemas.js";
import { PROBLEM_CATEGORIES } from "../problems/problems.types.js";

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

const followUpAnswersSchema = z
  .array(
    z.object({
      question: z.string().trim().min(1).max(1000),
      answer: z.string().trim().min(1).max(2000),
    }),
  )
  .max(20);

export const problemAssistBodySchema = z
  .object({
    problemId: uuidSchema.optional(),
    text: z.string().trim().min(1).optional(),
    followUpAnswers: followUpAnswersSchema.optional(),
  })
  .refine((value) => value.problemId !== undefined || value.text !== undefined, {
    message: "Either problemId or text is required"
  });

export const PLANT_PHOTO_ALLOWED_MIME_SUBTYPES = ["jpeg", "png", "webp"] as const;

const photoDataUrlPattern = new RegExp(
  `^data:image\\/(${PLANT_PHOTO_ALLOWED_MIME_SUBTYPES.join("|")});base64,[A-Za-z0-9+/]+={0,2}$`
);

export function buildPlantIngestionBodySchema(photoMaxBytes: number) {
  // Base64 inflates the payload by 4/3; validate against the encoded length.
  const maxDataUrlLength = Math.ceil((photoMaxBytes * 4) / 3) + "data:image/jpeg;base64,".length + 4;

  return z
    .object({
      plantName: z.string().trim().min(1).optional(),
      group: z.string().trim().min(1).max(100).optional(),
      variety: z.string().trim().min(1).max(200).optional(),
      notes: z.string().trim().min(1).optional(),
      photoDataUrl: z
        .string()
        .max(maxDataUrlLength, "Photo is too large")
        .regex(photoDataUrlPattern, "Photo must be a base64 data URL of type image/jpeg, image/png or image/webp")
        .optional(),
      followUpAnswers: followUpAnswersSchema.optional(),
    })
    .refine((value) => value.plantName !== undefined || value.photoDataUrl !== undefined, {
      message: "Either plantName or photoDataUrl is required"
    });
}

export const plantIngestionBodySchema = buildPlantIngestionBodySchema(5 * 1024 * 1024);

export const productRuleGenerationBodySchema = z.object({
  productId: uuidSchema
});

export const acceptSuggestionBodySchema = z.object({
  editedPayload: z.record(z.string(), z.unknown()).optional(),
  problemId: uuidSchema.optional(),
  acceptedCategory: z.enum(PROBLEM_CATEGORIES).optional()
});

export const rejectSuggestionBodySchema = z.object({});

export type SuggestionParams = z.infer<typeof suggestionParamsSchema>;
export type ProductIngestionBody = z.infer<typeof productIngestionBodySchema>;
export type BedPlanningBody = z.infer<typeof bedPlanningBodySchema>;
export type ProblemAssistBody = z.infer<typeof problemAssistBodySchema>;
export type PlantIngestionBody = z.infer<typeof plantIngestionBodySchema>;
export type ProductRuleGenerationBody = z.infer<typeof productRuleGenerationBodySchema>;
export type AcceptSuggestionBody = z.infer<typeof acceptSuggestionBodySchema>;
