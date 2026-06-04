import { AppError } from "../../shared/errors/app-error.js";

export type ValidatedProblemPhotoFile = {
  body: Buffer;
  originalFilename: string | null;
  mimeType: string;
  fileSizeBytes: number;
};

export type ProblemPhotoValidationOptions = {
  allowedMimeTypes: readonly string[];
  maxBytes: number;
};

type Part = {
  name: string | null;
  filename: string | null;
  contentType: string | null;
  body: Buffer;
};

export function validateProblemPhotoMultipart(
  contentType: string | undefined,
  body: unknown,
  options: ProblemPhotoValidationOptions
): ValidatedProblemPhotoFile {
  if (typeof contentType !== "string" || !contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw new AppError("VALIDATION_ERROR", "Problem photo upload must use multipart/form-data");
  }

  if (!Buffer.isBuffer(body)) {
    throw new AppError("VALIDATION_ERROR", "Malformed multipart request");
  }

  const boundary = boundaryFromContentType(contentType);

  if (boundary === null) {
    throw new AppError("VALIDATION_ERROR", "Malformed multipart request");
  }

  const parts = parseMultipartBody(body, boundary);
  const fileParts = parts.filter((part) => part.name === "file" && part.filename !== null);
  const unsupportedParts = parts.filter((part) => part.name !== "file" || part.filename === null);

  if (fileParts.length !== 1 || unsupportedParts.length > 0) {
    throw new AppError("VALIDATION_ERROR", "Problem photo upload requires exactly one file field");
  }

  const file = fileParts[0]!;
  const mimeType = mediaTypeFromContentType(file.contentType);

  if (!options.allowedMimeTypes.map((item) => item.toLowerCase()).includes(mimeType)) {
    throw new AppError("VALIDATION_ERROR", "Unsupported problem photo MIME type", { file: ["Only configured image MIME types are allowed"] });
  }

  if (file.body.length === 0) {
    throw new AppError("VALIDATION_ERROR", "Problem photo file is empty");
  }

  if (file.body.length > options.maxBytes) {
    throw new AppError("VALIDATION_ERROR", "Problem photo file is too large", { file: [`Maximum size is ${options.maxBytes} bytes`] });
  }

  return {
    body: file.body,
    originalFilename: file.filename,
    mimeType,
    fileSizeBytes: file.body.length
  };
}

function mediaTypeFromContentType(contentType: string | null): string {
  return contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
}

function boundaryFromContentType(contentType: string): string | null {
  const match = /(?:^|;)\s*boundary=(?:(?:"([^"]+)")|([^;]+))/i.exec(contentType);
  const boundary = match?.[1] ?? match?.[2]?.trim();

  return boundary === undefined || boundary.length === 0 ? null : boundary;
}

function parseMultipartBody(body: Buffer, boundary: string): Part[] {
  const marker = `--${boundary}`;
  const raw = body.toString("latin1");
  const sections = raw.split(marker).slice(1, -1);

  if (sections.length === 0) {
    throw new AppError("VALIDATION_ERROR", "Malformed multipart request");
  }

  return sections.map((section) => parsePart(section));
}

function parsePart(rawSection: string): Part {
  const section = rawSection.startsWith("\r\n") ? rawSection.slice(2) : rawSection;
  const headerEnd = section.indexOf("\r\n\r\n");

  if (headerEnd === -1) {
    throw new AppError("VALIDATION_ERROR", "Malformed multipart request");
  }

  const headerText = section.slice(0, headerEnd);
  const bodyText = section.slice(headerEnd + 4).replace(/\r\n$/, "");
  const headers = parseHeaders(headerText);
  const disposition = headers.get("content-disposition") ?? "";

  return {
    name: dispositionValue(disposition, "name"),
    filename: dispositionValue(disposition, "filename"),
    contentType: headers.get("content-type") ?? null,
    body: Buffer.from(bodyText, "latin1")
  };
}

function parseHeaders(headerText: string): Map<string, string> {
  const headers = new Map<string, string>();

  for (const line of headerText.split("\r\n")) {
    const separator = line.indexOf(":");

    if (separator === -1) {
      continue;
    }

    headers.set(line.slice(0, separator).trim().toLowerCase(), line.slice(separator + 1).trim());
  }

  return headers;
}

function dispositionValue(disposition: string, key: string): string | null {
  const match = new RegExp(`${key}="([^"]*)"`, "i").exec(disposition);

  if (match === null) {
    return null;
  }

  return match[1] ?? null;
}
