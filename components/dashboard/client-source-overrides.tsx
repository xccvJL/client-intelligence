"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SourceType } from "@/lib/types";

// Shows which knowledge sources are active for a specific client.
// Each source has a toggle that creates/updates a client_source_override
// in the database. When there's no override, the global default applies.

interface SourceOverrideProps {
  clientId: string;
}

interface SourceWithOverride {
  id: string;
  name: string;
  source_type: SourceType;
  globalEnabled: boolean;
  overrideEnabled: boolean | null; // null = no override, use global
}

const sourceTypeLabels: Record<SourceType, string> = {
  gmail: "Email",
  google_drive: "Google Drive",
  manual_note: "Manual",
};

// Placeholder data — will come from API once Supabase is connected
const placeholderSources: SourceWithOverride[] = [
  {
    id: "1",
    name: "Gmail",
    source_type: "gmail",
    globalEnabled: true,
    overrideEnabled: null,
  },
  {
    id: "2",
    name: "Google Drive (Meet Transcripts)",
    source_type: "google_drive",
    globalEnabled: true,
    overrideEnabled: null,
  },
  {
    id: "3",
    name: "Manual Notes",
    source_type: "manual_note",
    globalEnabled: true,
    overrideEnabled: null,
  },
];

export function ClientSourceOverrides({ clientId }: SourceOverrideProps) {
  const [sources, setSources] = useState(placeholderSources);

  // Cycle through: global default -> enabled override -> disabled override -> back to global
  function toggleOverride(sourceId: string) {
    setSources((prev) =>
      prev.map((s) => {
        if (s.id !== sourceId) return s;

        if (s.overrideEnabled === null) {
          // No override -> set to disabled (overriding global on -> off)
          return { ...s, overrideEnabled: false };
        } else if (s.overrideEnabled === false) {
          // Disabled override -> set to enabled
          return { ...s, overrideEnabled: true };
        } else {
          // Enabled override -> remove override (back to global)
          return { ...s, overrideEnabled: null };
        }
      })
    );
    // Will call POST /api/clients/[id]/overrides once connected
    void clientId; // Used when wiring to API
  }

  function getEffectiveState(source: SourceWithOverride): {
    active: boolean;
    label: string;
  } {
    if (source.overrideEnabled === null) {
      return {
        active: source.globalEnabled,
        label: source.globalEnabled ? "On (global)" : "Off (global)",
      };
    }
    return {
      active: source.overrideEnabled,
      label: source.overrideEnabled ? "On (override)" : "Off (override)",
    };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Intelligence Sources</CardTitle>
        <CardDescription>
          Control which sources are active for this client. Click to cycle
          through: global default, enabled, disabled.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map((source) => {
            const state = getEffectiveState(source);

            return (
              <div
                key={source.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleOverride(source.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      state.active ? "bg-primary" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={state.active}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        state.active ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{source.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {sourceTypeLabels[source.source_type]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs ${
                    source.overrideEnabled !== null
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {state.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
