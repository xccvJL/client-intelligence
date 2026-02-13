import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HealthBadge } from "./health-badge";
import type { Client, HealthStatus } from "@/lib/types";

// A compact card for displaying a client in the grid view.
// Shows the client name, domain, health badge, contact count, and tags.

interface ClientCardProps {
  client: Client;
  intelligenceCount?: number;
  healthStatus?: HealthStatus;
}

export function ClientCard({ client, intelligenceCount, healthStatus }: ClientCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{client.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{client.domain}</p>
          </div>
          {healthStatus && <HealthBadge status={healthStatus} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {client.contacts.length} contact
            {client.contacts.length !== 1 ? "s" : ""}
          </span>
          {intelligenceCount !== undefined && (
            <span>{intelligenceCount} entries</span>
          )}
        </div>
        {client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {client.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
