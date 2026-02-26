"use client";

import { useState } from "react";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { PipelineVelocityChart } from "@/components/dashboard/pipeline-velocity-chart";
import { WinRateChart } from "@/components/dashboard/win-rate-chart";
import { HealthTrendsChart } from "@/components/dashboard/health-trends";
import { TeamWorkloadChart } from "@/components/dashboard/team-workload-chart";
import { RevenueForecast } from "@/components/dashboard/revenue-forecast";

// Analytics page — charts showing pipeline velocity, deal win rates,
// client health trends, team workload, and revenue forecasting.

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("6m");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Pipeline trends, win rates, health distribution, and revenue forecasting
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Charts in a responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineVelocityChart />
        <WinRateChart />
        <HealthTrendsChart />
        <TeamWorkloadChart />
      </div>

      {/* Revenue Forecast — full width section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Revenue Forecast</h2>
        <RevenueForecast />
      </div>
    </div>
  );
}
