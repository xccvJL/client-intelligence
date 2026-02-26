"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createBrowserClient } from "@/lib/supabase";

// Login page — Google OAuth will be connected when Supabase auth is set up.
// For now, this shows the login UI with a placeholder button.

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) throw authError;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to start Google sign-in");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Client Intelligence</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" size="lg" onClick={handleSignIn} disabled={loading}>
            {loading ? "Redirecting..." : "Sign in with Google"}
          </Button>
          {error && <p className="text-xs text-destructive text-center mt-3">{error}</p>}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Only authorized team members can access this platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
