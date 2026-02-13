"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { DraftResponse, Intelligence } from "@/lib/types";

interface DraftResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  entryId: string;
  intelligence: Intelligence[];
}

export function DraftResponseDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  entryId,
  intelligence,
}: DraftResponseDialogProps) {
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch(`/api/clients/${clientId}/draft-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intelligence, entryId, clientName }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to generate draft");
        return;
      }

      setDraft(json.data);
      setEditedBody(json.data.body);
    } catch {
      setError("Failed to reach the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate when dialog opens (if no draft yet)
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen && !draft && !loading) {
      generate();
    }
    if (!nextOpen) {
      // Reset state when closing
      setDraft(null);
      setEditedBody("");
      setError(null);
      setCopied(false);
    }
    onOpenChange(nextOpen);
  }

  async function copyToClipboard() {
    const text = draft ? `Subject: ${draft.subject}\n\n${editedBody}` : "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Draft Email Response</DialogTitle>
          <DialogDescription>
            AI-generated reply for {clientName}. Edit as needed before sending.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3 py-4">
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            <div className="h-32 w-full bg-muted rounded animate-pulse" />
          </div>
        )}

        {error && (
          <div className="py-4">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button onClick={generate} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        )}

        {draft && !loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{draft.subject}</p>
              <Badge variant="outline" className="text-xs">
                {draft.tone}
              </Badge>
            </div>

            <Textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="min-h-[200px] text-sm"
            />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={generate}>
                Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? "Copied!" : "Copy to clipboard"}
              </Button>
              <Button size="sm" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
