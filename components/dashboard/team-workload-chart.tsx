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
import { teamWorkloadData } from "@/lib/mock-analytics";

// Tasks per team member (horizontal bar chart showing workload distribution).

export function TeamWorkloadChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team Workload</CardTitle>
        <CardDescription>Task distribution by team member</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={teamWorkloadData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" />
            <YAxis dataKey="member_name" type="category" width={100} className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="todo" name="To Do" fill="#94a3b8" stackId="stack" />
            <Bar dataKey="in_progress" name="In Progress" fill="#818cf8" stackId="stack" />
            <Bar dataKey="done" name="Done" fill="#22c55e" stackId="stack" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
