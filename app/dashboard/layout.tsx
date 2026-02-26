import { TeamProvider } from "@/components/dashboard/team-context";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

// Dashboard layout wraps all /dashboard/* pages with the sidebar navigation.
// DashboardShell handles mobile responsiveness (hamburger menu, overlay sidebar)
// and the global Cmd+K search shortcut.
// TeamProvider gives every page access to the "current user" selection.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TeamProvider>
      <DashboardShell>{children}</DashboardShell>
    </TeamProvider>
  );
}
