import { Sidebar } from "@/components/dashboard/sidebar";
import { TeamProvider } from "@/components/dashboard/team-context";

// Dashboard layout wraps all /dashboard/* pages with the sidebar navigation.
// The sidebar stays visible on every dashboard page.
// TeamProvider gives every page access to the "current user" selection.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TeamProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </TeamProvider>
  );
}
