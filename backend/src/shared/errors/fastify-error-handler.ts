import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { errorEnvelope, type ErrorDetails } from "../api/envelope.js";
import { AppError, isAppError } from "./app-error.js";
import { statusForErrorCode } from "./error-codes.js";

function sendAppError(reply: FastifyReply, error: AppError): void {
  reply.status(statusForErrorCode(error.code)).send(errorEnvelope(error.code, error.message, error.details));
}

function isFastifyValidationLikeError(error: FastifyError): boolean {
  return error.statusCode === 400 && (error.validation !== undefined || error.code === "FST_ERR_CTP_INVALID_JSON");
}

function validationDetailsFromFastify(error: FastifyError): ErrorDetails {
  if (error.validation === undefined) {
    return {};
  }

  return {
    validation: error.validation.map((item) => ({
      instancePath: item.instancePath,
      message: item.message,
      params: item.params
    }))
  };
}

function sanitizedUnhandledErrorForLog(error: Error): Record<string, string> {
  return {
    name: error.name || "Error"
  };
}

export function registerErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler((_request: FastifyRequest, reply: FastifyReply) => {
    sendAppError(reply, new AppError("NOT_FOUND", "Route not found"));
  });

  app.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    if (isAppError(error)) {
      sendAppError(reply, error);
      return;
    }

    if (isFastifyValidationLikeError(error as FastifyError)) {
      sendAppError(
        reply,
        new AppError("VALIDATION_ERROR", "Invalid input", validationDetailsFromFastify(error as FastifyError))
      );
      return;
    }

    if ((error as FastifyError).statusCode === 413) {
      sendAppError(reply, new AppError("VALIDATION_ERROR", "Request payload is too large"));
      return;
    }

    request.log.error({ err: sanitizedUnhandledErrorForLog(error) }, "Unhandled request error");
    sendAppError(reply, new AppError("INTERNAL_ERROR", "Unexpected server error"));
  });
}
