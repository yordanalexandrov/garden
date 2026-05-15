import { AppError } from "../../shared/errors/app-error.js";

const BEARER_PREFIX = "Bearer ";

export function unauthorizedError(): AppError {
  return new AppError("UNAUTHORIZED", "Unauthorized");
}

export function parseBearerToken(authorizationHeader: string | string[] | undefined): string {
  if (typeof authorizationHeader !== "string") {
    throw unauthorizedError();
  }

  if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
    throw unauthorizedError();
  }

  const token = authorizationHeader.slice(BEARER_PREFIX.length);

  if (token.trim() !== token || token.length === 0 || /\s/.test(token)) {
    throw unauthorizedError();
  }

  return token;
}
