export type MailThreadStatus = "queued" | "sent" | "reply_received";

export type ExistingReminder = {
  payloadFingerprint: string;
  outboundId: string;
};

export function stableDigest(value: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (code + index), 0x27d4eb2d) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

export function existingOutboundId(
  existing: ExistingReminder | null,
  payloadFingerprint: string,
): string | null {
  if (!existing) return null;
  if (existing.payloadFingerprint !== payloadFingerprint) {
    throw new Error("Reminder idempotency collision");
  }
  return existing.outboundId;
}

export function statusAfterThreadLink(status: MailThreadStatus): MailThreadStatus {
  return status === "reply_received" ? "reply_received" : "sent";
}

export function isDuplicateWebhookEvent(
  lastEventId: string | undefined,
  eventId: string,
): boolean {
  return lastEventId === eventId;
}
