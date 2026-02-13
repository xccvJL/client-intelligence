import { google } from "googleapis";

// Set up OAuth2 authentication for Gmail API.
// The refresh token lets us access Gmail without the user being present
// (needed for cron jobs that run on a schedule).
function getGmailAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth credentials. " +
        "Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in .env.local."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export interface ParsedEmail {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  snippet: string;
}

// Fetch emails received since `afterTimestamp` (Unix epoch in seconds).
// Returns simplified email objects with the fields we need for AI processing.
export async function fetchNewEmails(
  afterTimestamp: number
): Promise<ParsedEmail[]> {
  const auth = getGmailAuth();
  const gmail = google.gmail({ version: "v1", auth });

  // Search for emails after the given timestamp
  const query = `after:${afterTimestamp}`;
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 50,
  });

  const messageIds = listResponse.data.messages ?? [];
  const emails: ParsedEmail[] = [];

  for (const msg of messageIds) {
    if (!msg.id) continue;

    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full",
    });

    const parsed = parseEmailMessage(msg.id, detail.data);
    if (parsed) {
      emails.push(parsed);
    }
  }

  return emails;
}

// Extract useful fields from a raw Gmail API message object
function parseEmailMessage(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any
): ParsedEmail | null {
  try {
    const headers = message.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h: { name: string }) =>
        h.name.toLowerCase() === name.toLowerCase()
      )?.value ?? "";

    // Get the plain-text body (prefer plain text over HTML for AI processing)
    let body = "";
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    } else if (message.payload?.parts) {
      const textPart = message.payload.parts.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p.mimeType === "text/plain"
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    }

    return {
      id,
      threadId: message.threadId ?? "",
      from: getHeader("From"),
      to: getHeader("To"),
      subject: getHeader("Subject"),
      date: getHeader("Date"),
      body,
      snippet: message.snippet ?? "",
    };
  } catch {
    console.error(`Failed to parse email ${id}`);
    return null;
  }
}
