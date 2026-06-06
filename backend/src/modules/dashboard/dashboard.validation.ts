import { z } from "zod";

import { uuidSchema } from "../../shared/validation/common-schemas.js";

export const dashboardQuerySchema = z.object({
  placeId: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), uuidSchema.optional())
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
