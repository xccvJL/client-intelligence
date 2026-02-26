import { google } from "googleapis";

// Reuse the same OAuth2 setup as Gmail — same credentials, different API.
function getDriveAuth() {
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

export interface DriveTranscript {
  id: string;
  name: string;
  createdTime: string;
  content: string;
}

// Fetch Google Docs modified after a given timestamp.
// We look for documents in Drive that are likely meeting transcripts
// (you can filter by folder ID or naming convention).
export async function fetchRecentTranscripts(
  afterTimestamp: number
): Promise<DriveTranscript[]> {
  const auth = getDriveAuth();
  const drive = google.drive({ version: "v3", auth });

  // Convert timestamp to RFC 3339 format that Drive API expects
  const afterDate = new Date(afterTimestamp * 1000).toISOString();

  const listResponse = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.document' and modifiedTime > '${afterDate}'`,
    fields: "files(id, name, createdTime)",
    orderBy: "modifiedTime desc",
    pageSize: 25,
  });

  const files = listResponse.data.files ?? [];
  const transcripts: DriveTranscript[] = [];

  for (const file of files) {
    if (!file.id) continue;

    const content = await readDocContent(auth, file.id);
    if (content) {
      transcripts.push({
        id: file.id,
        name: file.name ?? "Untitled",
        createdTime: file.createdTime ?? new Date().toISOString(),
        content,
      });
    }
  }

  return transcripts;
}

// Read the plain-text content of a Google Doc by exporting it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readDocContent(auth: any, fileId: string): Promise<string | null> {
  try {
    const drive = google.drive({ version: "v3", auth });
    const response = await drive.files.export({
      fileId,
      mimeType: "text/plain",
    });
    return response.data as string;
  } catch {
    console.error(`Failed to read Google Doc ${fileId}`);
    return null;
  }
}
