import type { AuthenticatedActor } from "./auth.types.js";

export interface AuthPort {
  verifyAccessToken(token: string): Promise<AuthenticatedActor>;
}
