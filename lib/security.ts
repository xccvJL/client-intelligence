import crypto from "node:crypto";

function normalizeSecret(value: string | null): string {
  return (value ?? "").trim();
}

export function constantTimeEqual(
  providedSecret: string | null,
  expectedSecret: string | undefined
): boolean {
  const provided = normalizeSecret(providedSecret);
  const expected = normalizeSecret(expectedSecret ?? "");

  if (!provided || !expected) return false;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}
