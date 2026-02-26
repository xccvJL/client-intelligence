"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { mockSearchIndex } from "@/lib/mock-search-index";
import type { SearchResult, SearchResultType } from "@/lib/types";

// Global search dialog — opens with Cmd+K. Searches across accounts,
// deals, tasks, contacts, and intelligence. Recent searches saved to localStorage.

const typeConfig: Record<SearchResultType, { label: string; color: string }> = {
  account: { label: "Account", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  deal: { label: "Deal", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  task: { label: "Task", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  contact: { label: "Contact", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300" },
  intelligence: { label: "Intel", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
};

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("ci-recent-searches") || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  localStorage.setItem("ci-recent-searches", JSON.stringify(recent.slice(0, 5)));
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = query.length > 0
    ? mockSearchIndex.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  const flatResults = Object.values(grouped).flat();

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    onOpenChange(nextOpen);
  }

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatResults[selectedIndex]) {
      e.preventDefault();
      navigateTo(flatResults[selectedIndex]);
    }
  }

  function navigateTo(result: SearchResult) {
    saveRecentSearch(result.title);
    onOpenChange(false);
    router.push(result.href);
  }

  const recentSearches = getRecentSearches();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3">
          <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search accounts, deals, tasks..."
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            Esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-muted-foreground mb-2">Recent</p>
              {recentSearches.map((search) => (
                <button
                  key={search}
                  className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-left hover:bg-muted transition-colors"
                  onClick={() => setQuery(search)}
                >
                  <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {search}
                </button>
              ))}
            </div>
          )}

          {query.length > 0 && flatResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="mb-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                {typeConfig[type as SearchResultType]?.label ?? type}
              </p>
              {items.map((item) => {
                const idx = flatResults.indexOf(item);
                return (
                  <button
                    key={item.id}
                    className={`flex items-center gap-3 w-full rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      idx === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                    onClick={() => navigateTo(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <Badge variant="secondary" className={`${typeConfig[item.type].color} text-xs shrink-0`}>
                      {typeConfig[item.type].label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {flatResults.length > 0 && (
          <div className="border-t px-3 py-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span><kbd className="rounded border px-1">↑↓</kbd> Navigate</span>
            <span><kbd className="rounded border px-1">↵</kbd> Open</span>
            <span><kbd className="rounded border px-1">Esc</kbd> Close</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
