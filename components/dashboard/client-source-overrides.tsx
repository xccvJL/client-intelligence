"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { SourceType, KnowledgeSource } from "@/lib/types";

interface SourceOverrideProps {
  clientId: string;
}

interface SourceWithOverride {
  id: string;
  name: string;
  source_type: SourceType;
  globalEnabled: boolean;
  overrideEnabled: boolean | null;
}

interface ClientSourceOverrideApiRow {
  knowledge_source_id: string;
  enabled: boolean;
}

const sourceTypeLabels: Record<SourceType, string> = {
  gmail: "Email",
  google_drive: "Google Drive",
  manual_note: "Manual",
};

export function ClientSourceOverrides({ clientId }: SourceOverrideProps) {
  const { getRequestHeaders } = useTeamContext();
  const [sources, setSources] = useState<SourceWithOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [sourcesRes, overridesRes] = await Promise.all([
          fetch("/api/sources", { headers: getRequestHeaders() }),
          fetch(`/api/clients/${clientId}/overrides`, { headers: getRequestHeaders() }),
        ]);

        const sourcesJson = (await sourcesRes.json()) as { data?: KnowledgeSource[]; error?: string };
        const overridesJson = (await overridesRes.json()) as { data?: ClientSourceOverrideApiRow[]; error?: string };

        if (!sourcesRes.ok) {
          throw new Error(sourcesJson.error ?? "Failed to load sources");
        }
        if (!overridesRes.ok) {
          throw new Error(overridesJson.error ?? "Failed to load overrides");
        }

        const overridesMap = new Map(
          (overridesJson.data ?? []).map((item) => [item.knowledge_source_id, item.enabled])
        );

        const merged: SourceWithOverride[] = (sourcesJson.data ?? []).map((source) => ({
          id: source.id,
          name: source.name,
          source_type: source.source_type,
          globalEnabled: source.enabled,
          overrideEnabled: overridesMap.has(source.id) ? overridesMap.get(source.id)! : null,
        }));

        setSources(merged);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load source overrides");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [clientId, getRequestHeaders]);

  const stateById = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);

  async function toggleOverride(sourceId: string) {
    setError(null);
    const previous = sources;

    const source = stateById.get(sourceId);
    if (!source) return;

    const nextOverride =
      source.overrideEnabled === null
        ? false
        : source.overrideEnabled === false
          ? true
          : null;

    setSources((prev) =>
      prev.map((item) =>
        item.id === sourceId ? { ...item, overrideEnabled: nextOverride } : item
      )
    );

    try {
      if (nextOverride === null) {
        const params = new URLSearchParams({ knowledge_source_id: sourceId });
        const res = await fetch(`/api/clients/${clientId}/overrides?${params.toString()}`, {
          method: "DELETE",
          headers: getRequestHeaders(),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to remove override");
        }
      } else {
        const res = await fetch(`/api/clients/${clientId}/overrides`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getRequestHeaders(),
          },
          body: JSON.stringify({
            knowledge_source_id: sourceId,
            enabled: nextOverride,
          }),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to update override");
        }
      }
    } catch (err) {
      setSources(previous);
      setError(err instanceof Error ? err.message : "Failed to update override");
    }
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
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading sources...</p>
        ) : (
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
                      onClick={() => {
                        void toggleOverride(source.id);
                      }}
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
        )}
      </CardContent>
    </Card>
  );
}
