import { redirect } from "next/navigation";

// The root page redirects to the dashboard.
// Once auth is wired up, this will check login status first.
export default function Home() {
  redirect("/dashboard");
}
