interface OpsAlertPayload {
  event: string;
  severity: "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
}

export async function sendOpsAlert(payload: OpsAlertPayload): Promise<void> {
  const webhookUrl = process.env.OPS_ALERT_WEBHOOK_URL;

  // Always log locally so failures are visible even without a webhook sink.
  const logPrefix = payload.severity === "error" ? "[OPS-ERROR]" : "[OPS-WARN]";
  console.error(logPrefix, payload.event, payload.message, payload.details ?? {});

  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    });
  } catch (err) {
    console.error("Failed to send ops alert webhook:", err);
  }
}
