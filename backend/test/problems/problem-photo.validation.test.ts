import { describe, expect, it } from "vitest";

import { validateProblemPhotoMultipart } from "../../src/modules/problems/problem-photo.validation.js";

describe("problem photo multipart validation", () => {
  it("validates only the media type portion of part Content-Type headers", () => {
    const multipart = multipartPayload({ filename: "leaf.jpg", contentType: "image/jpeg; charset=binary", body: Buffer.from("jpeg") });

    expect(
      validateProblemPhotoMultipart(multipart.contentType, multipart.body, {
        allowedMimeTypes: ["image/jpeg"],
        maxBytes: 1024
      })
    ).toMatchObject({
      originalFilename: "leaf.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 4
    });
  });
});

function multipartPayload(input: { filename: string; contentType: string; body: Buffer }): { contentType: string; body: Buffer } {
  const boundary = "----garden-review-fix";
  const prefix = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${input.filename}"\r\nContent-Type: ${input.contentType}\r\n\r\n`,
    "latin1"
  );
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`, "latin1");

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat([prefix, input.body, suffix])
  };
}
