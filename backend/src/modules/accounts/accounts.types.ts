import type { UUID } from "../auth/auth.types.js";

export type Account = {
  id: UUID;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};
