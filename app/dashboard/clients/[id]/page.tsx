import { redirect } from "next/navigation";

// Redirect from the old /dashboard/clients/[id] path to the new
// /dashboard/accounts/[id] path so existing links don't break.

export default async function ClientDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/accounts/${id}`);
}
