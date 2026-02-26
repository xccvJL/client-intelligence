"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { pipelineVelocityData } from "@/lib/mock-analytics";

// Deals moving through pipeline stages over time (stacked bar chart).

export function PipelineVelocityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline Velocity</CardTitle>
        <CardDescription>Deals by stage over the past 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pipelineVelocityData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="lead" name="Lead" fill="#94a3b8" stackId="stack" />
            <Bar dataKey="proposal" name="Proposal" fill="#818cf8" stackId="stack" />
            <Bar dataKey="active" name="Active" fill="#34d399" stackId="stack" />
            <Bar dataKey="closed_won" name="Won" fill="#22c55e" stackId="stack" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
