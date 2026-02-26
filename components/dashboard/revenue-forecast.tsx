"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { calculateWeightedPipeline, getForecastSummary } from "@/lib/forecast-utils";
import { revenueByMonth } from "@/lib/mock-analytics";
import type { Deal } from "@/lib/types";

// Revenue forecast section with summary cards + forecast vs. actual bar chart.

// Placeholder deals for the forecast calculation
const placeholderDeals: Deal[] = [
  { id: "d1", client_id: "4", title: "Umbrella Co — Initial Assessment", stage: "lead", amount: 15000, close_date: "2026-03-15", notes: null, created_by: null, created_at: "", updated_at: "" },
  { id: "d2", client_id: "2", title: "Globex Q3 Strategy Package", stage: "proposal", amount: 45000, close_date: "2026-03-01", notes: null, created_by: null, created_at: "", updated_at: "" },
  { id: "d3", client_id: "1", title: "Acme Corp — Expanded Scope", stage: "proposal", amount: 80000, close_date: "2026-04-01", notes: null, created_by: null, created_at: "", updated_at: "" },
  { id: "d4", client_id: "1", title: "Acme Corp — Annual Retainer", stage: "active", amount: 120000, close_date: "2026-06-01", notes: null, created_by: null, created_at: "", updated_at: "" },
  { id: "d5", client_id: "3", title: "Initech — Onboarding Support", stage: "active", amount: 25000, close_date: "2026-05-01", notes: null, created_by: null, created_at: "", updated_at: "" },
  { id: "d6", client_id: "2", title: "Globex Q1 Sprint", stage: "closed_won", amount: 30000, close_date: "2026-01-15", notes: null, created_by: null, created_at: "", updated_at: "" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RevenueForecast() {
  const summary = getForecastSummary(placeholderDeals);
  const weighted = calculateWeightedPipeline(placeholderDeals);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weighted Pipeline</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(summary.totalWeighted)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pipeline</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(summary.totalPipeline)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Closed Won</CardDescription>
            <CardTitle className="text-2xl text-green-600">{formatCurrency(summary.closedWonTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Deals</CardDescription>
            <CardTitle className="text-2xl">{summary.dealCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Weighted pipeline breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weighted Pipeline Breakdown</CardTitle>
          <CardDescription>Each deal weighted by stage probability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weighted.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="truncate">{deal.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {deal.stage.replace("_", " ")} ({Math.round(deal.probability * 100)}%)
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-medium">{formatCurrency(deal.weighted_amount)}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(deal.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Forecast vs Actual chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue: Projected vs Actual</CardTitle>
          <CardDescription>Monthly comparison of forecast and actual revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(value) => [formatCurrency(Number(value))]}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="projected" name="Projected" fill="#818cf8" />
              <Bar dataKey="actual" name="Actual" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
