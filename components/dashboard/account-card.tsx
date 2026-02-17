"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HealthBadge } from "./health-badge";
import type { AccountStatus, HealthStatus } from "@/lib/types";

// Card for the Accounts list view.
// Shows account name, domain, health status, and deal value.

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

interface AccountCardProps {
  name: string;
  domain: string;
  status: AccountStatus;
  healthStatus?: HealthStatus;
  dealValue: number;
}

export function AccountCard({
  name,
  domain,
  status,
  healthStatus,
  dealValue,
}: AccountCardProps) {
  return (
    <Card className="cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">{domain}</p>
          </div>
          <div className="flex items-center gap-2">
            {status === "archived" && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-xs">
                Archived
              </Badge>
            )}
            {healthStatus && <HealthBadge status={healthStatus} />}
          </div>
        </div>
      </CardHeader>
      {dealValue > 0 && (
        <CardContent>
          <span className="text-xs font-medium text-foreground">
            {formatCurrency(dealValue)}
          </span>
        </CardContent>
      )}
    </Card>
  );
}
