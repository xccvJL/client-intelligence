"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { winRateData } from "@/lib/mock-analytics";

// Deal win rate over time (line chart showing percentage).

export function WinRateChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Win Rate</CardTitle>
        <CardDescription>Deal close rate over the past 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={winRateData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis
              className="text-xs"
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value}%`, "Win Rate"]}
            />
            <Line
              type="monotone"
              dataKey="rate"
              name="Win Rate"
              stroke="#818cf8"
              strokeWidth={2}
              dot={{ fill: "#818cf8", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
