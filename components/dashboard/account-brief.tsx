"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { BriefSectionType, BriefSection, BriefEntry, AccountBrief as AccountBriefType } from "@/lib/types";

// Human-readable labels for each section type
const sectionLabels: Record<BriefSectionType, string> = {
  key_context: "Key Context",
  decisions: "Decisions",
  budgets: "Budgets",
  key_people: "Key People",
  risks: "Risks",
};

// The fixed order sections always appear in
const sectionOrder: BriefSectionType[] = [
  "key_context",
  "decisions",
  "budgets",
  "key_people",
  "risks",
];

// Creates an empty brief structure for a new account
function createEmptyBrief(clientId: string, clientName: string): AccountBriefType {
  return {
    client_id: clientId,
    client_name: clientName,
    sections: sectionOrder.map((type) => ({ type, entries: [] })),
    updated_at: new Date().toISOString(),
  };
}

// Generates clean Markdown from a brief (empty sections are omitted)
function briefToMarkdown(brief: AccountBriefType): string {
  const date = new Date(brief.updated_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let md = `# Account Brief: ${brief.client_name}\n_Last updated: ${date}_\n`;

  for (const section of brief.sections) {
    if (section.entries.length === 0) continue;
    md += `\n## ${sectionLabels[section.type]}\n`;
    for (const entry of section.entries) {
      md += `- ${entry.content}\n`;
      if (entry.source_label) {
        md += `  _Source: ${entry.source_label}_\n`;
      }
    }
  }

  return md;
}

// Generates a formatted PDF and triggers a download
async function briefToPdf(brief: AccountBriefType) {
  // Dynamic import so jsPDF is only loaded when the user actually clicks "Download PDF"
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const usableWidth = pageWidth - margin * 2;
  let y = margin;

  const dateStr = new Date(brief.updated_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Helper: add a new page if we're near the bottom
  function checkPage(needed: number) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Account Brief: ${brief.client_name}`, margin, y);
  y += 8;

  // Date subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text(`Last updated: ${dateStr}`, margin, y);
  y += 10;

  // Sections
  for (const section of brief.sections) {
    if (section.entries.length === 0) continue;

    checkPage(20);

    // Section header
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(sectionLabels[section.type], margin, y);
    y += 7;

    // Entries
    doc.setFontSize(10);
    for (const entry of section.entries) {
      checkPage(14);

      // Bullet + content (may wrap across multiple lines)
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(`\u2022  ${entry.content}`, usableWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5;

      // Source attribution
      if (entry.source_label) {
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120, 120, 120);
        doc.text(`Source: ${entry.source_label}`, margin + 5, y);
        doc.setTextColor(0, 0, 0);
        y += 5;
      }

      y += 2;
    }

    y += 4;
  }

  // Trigger browser download
  const safeName = brief.client_name.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Account_Brief_${safeName}.pdf`);
}

// Describes which entry the user is editing (section type + index within that section)
interface EditTarget {
  sectionType: BriefSectionType;
  entryIndex: number;
}

export function AccountBrief({ clientId }: { clientId: string }) {
  const { accountBriefs, setAccountBriefs } = useTeamContext();

  // Add-entry dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSection, setNewSection] = useState<BriefSectionType>("key_context");
  const [newContent, setNewContent] = useState("");
  const [newSourceLabel, setNewSourceLabel] = useState("");

  // Edit-entry dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSourceLabel, setEditSourceLabel] = useState("");

  // Feedback states for copy / PDF buttons
  const [copied, setCopied] = useState(false);

  // Find the brief for this account (may be undefined for accounts without one yet)
  const brief = accountBriefs.find((b) => b.client_id === clientId);

  const totalEntries = brief
    ? brief.sections.reduce((sum, s) => sum + s.entries.length, 0)
    : 0;

  // Get sections in canonical order, filling in any missing ones with empty arrays
  function getSections(): BriefSection[] {
    if (!brief) {
      return sectionOrder.map((type) => ({ type, entries: [] }));
    }
    return sectionOrder.map(
      (type) => brief.sections.find((s) => s.type === type) ?? { type, entries: [] }
    );
  }

  // ---------- helpers that mutate the briefs in shared context ----------

  // Applies a transform function to the brief for this client, auto-updating the timestamp.
  // If no brief exists yet, creates one first.
  function updateBrief(
    transform: (brief: AccountBriefType) => AccountBriefType
  ) {
    setAccountBriefs((prev) => {
      const existing = prev.find((b) => b.client_id === clientId);
      if (existing) {
        return prev.map((b) =>
          b.client_id === clientId
            ? transform({ ...b, updated_at: new Date().toISOString() })
            : b
        );
      }
      // Auto-create an empty brief, then apply the transform
      const empty = createEmptyBrief(clientId, `Account ${clientId}`);
      return [...prev, transform(empty)];
    });
  }

  // ---------- action handlers ----------

  async function handleCopy() {
    if (!brief) return;
    const md = briefToMarkdown(brief);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadPdf() {
    if (!brief) return;
    await briefToPdf(brief);
  }

  function handleAddEntry() {
    if (!newContent.trim()) return;

    updateBrief((b) => ({
      ...b,
      sections: b.sections.map((s) => {
        if (s.type !== newSection) return s;
        return {
          ...s,
          entries: [
            ...s.entries,
            {
              content: newContent.trim(),
              source_label: newSourceLabel.trim() || "Manual entry",
              intelligence_id: null,
            },
          ],
        };
      }),
    }));

    setNewContent("");
    setNewSourceLabel("");
    setNewSection("key_context");
    setAddDialogOpen(false);
  }

  function handleDeleteEntry(sectionType: BriefSectionType, entryIndex: number) {
    updateBrief((b) => ({
      ...b,
      sections: b.sections.map((s) => {
        if (s.type !== sectionType) return s;
        return {
          ...s,
          entries: s.entries.filter((_, i) => i !== entryIndex),
        };
      }),
    }));
  }

  function openEditDialog(sectionType: BriefSectionType, entryIndex: number, entry: BriefEntry) {
    setEditTarget({ sectionType, entryIndex });
    setEditContent(entry.content);
    setEditSourceLabel(entry.source_label);
    setEditDialogOpen(true);
  }

  function handleSaveEdit() {
    if (!editTarget || !editContent.trim()) return;

    updateBrief((b) => ({
      ...b,
      sections: b.sections.map((s) => {
        if (s.type !== editTarget.sectionType) return s;
        return {
          ...s,
          entries: s.entries.map((entry, i) => {
            if (i !== editTarget.entryIndex) return entry;
            return {
              ...entry,
              content: editContent.trim(),
              source_label: editSourceLabel.trim() || entry.source_label,
            };
          }),
        };
      }),
    }));

    setEditTarget(null);
    setEditContent("");
    setEditSourceLabel("");
    setEditDialogOpen(false);
  }

  // ---------- render ----------

  return (
    <div className="space-y-4">
      {/* Header row: entry count + action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {totalEntries} {totalEntries === 1 ? "entry" : "entries"} across{" "}
            {brief ? brief.sections.filter((s) => s.entries.length > 0).length : 0} sections
          </p>
          {brief && (
            <p className="text-xs text-muted-foreground">
              Last updated:{" "}
              {new Date(brief.updated_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={totalEntries === 0}
          >
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={totalEntries === 0}
          >
            Download PDF
          </Button>

          {/* Add Entry dialog */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Brief Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Section</label>
                  <Select
                    value={newSection}
                    onValueChange={(v) => setNewSection(v as BriefSectionType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sectionOrder.map((type) => (
                        <SelectItem key={type} value={type}>
                          {sectionLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="What did you learn?"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Source (optional)</label>
                  <Input
                    placeholder='e.g. "Email — Feb 10, 2026"'
                    value={newSourceLabel}
                    onChange={(e) => setNewSourceLabel(e.target.value)}
                  />
                </div>

                <Button onClick={handleAddEntry} disabled={!newContent.trim()} className="w-full">
                  Add Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Entry dialog (controlled, not trigger-based) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <Input
                value={editSourceLabel}
                onChange={(e) => setEditSourceLabel(e.target.value)}
              />
            </div>

            <Button onClick={handleSaveEdit} disabled={!editContent.trim()} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Section cards — always show all 5 */}
      {getSections().map((section) => (
        <Card key={section.type}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{sectionLabels[section.type]}</CardTitle>
              <Badge variant="secondary">{section.entries.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {section.entries.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No entries yet</p>
            ) : (
              <ul className="space-y-3">
                {section.entries.map((entry, i) => (
                  <li key={i} className="text-sm group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p>{entry.content}</p>
                        {entry.source_label && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Source: {entry.source_label}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => openEditDialog(section.type, i, entry)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEntry(section.type, i)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
