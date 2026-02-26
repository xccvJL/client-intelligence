"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SearchDialog } from "@/components/dashboard/search-dialog";

// DashboardShell manages the sidebar open/close state on mobile and
// provides the Cmd+K search shortcut. On desktop (>=1024px), the
// sidebar is always visible. On mobile, it slides in as an overlay.

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Close sidebar when resizing to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cmd+K / Ctrl+K keyboard shortcut for global search
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — always visible on lg+ screens */}
      <div className="hidden lg:block">
        <Sidebar onSearchClick={() => setSearchOpen(true)} />
      </div>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Slide-in sidebar */}
          <div className="absolute inset-y-0 left-0 w-64 animate-in slide-in-from-left duration-200">
            <Sidebar
              onSearchClick={() => {
                setSidebarOpen(false);
                setSearchOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar with hamburger menu */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 backdrop-blur px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Open navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold">Client Intelligence</span>
          <div className="flex-1" />
          <button
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Search"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Search bar for desktop — sits at top of main content */}
        <div className="hidden lg:block px-6 pt-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 w-full max-w-md rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search accounts, deals, tasks...</span>
            <kbd className="ml-auto inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-xs text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        <div className="p-4 sm:p-6">{children}</div>
      </main>

      {/* Global search dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
