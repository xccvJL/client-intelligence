import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Login page — Google OAuth will be connected when Supabase auth is set up.
// For now, this shows the login UI with a placeholder button.

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Client Intelligence</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" size="lg">
            Sign in with Google
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Only authorized team members can access this platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
