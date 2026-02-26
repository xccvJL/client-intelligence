import type { Deal, DealStage } from "./types";

// Pure functions for revenue forecasting.
// Each deal's value is weighted by its stage probability.

const stageProbabilities: Record<DealStage, number> = {
  lead: 0.1,
  proposal: 0.3,
  active: 0.7,
  closed_won: 1.0,
  closed_lost: 0,
};

export interface WeightedDeal {
  id: string;
  title: string;
  stage: DealStage;
  amount: number;
  probability: number;
  weighted_amount: number;
}

export interface ForecastMonth {
  month: string;
  projected: number;
  actual: number;
}

// Multiplies each deal's value by its stage probability
export function calculateWeightedPipeline(deals: Deal[]): WeightedDeal[] {
  return deals
    .filter((d) => d.amount && d.stage !== "closed_lost")
    .map((d) => ({
      id: d.id,
      title: d.title,
      stage: d.stage,
      amount: d.amount ?? 0,
      probability: stageProbabilities[d.stage],
      weighted_amount: (d.amount ?? 0) * stageProbabilities[d.stage],
    }));
}

// Groups deals by their close_date month and sums weighted values
export function calculateForecastByMonth(deals: Deal[]): ForecastMonth[] {
  const months: Record<string, { projected: number; actual: number }> = {};

  for (const deal of deals) {
    if (!deal.close_date || !deal.amount) continue;
    const date = new Date(deal.close_date);
    const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    if (!months[monthKey]) {
      months[monthKey] = { projected: 0, actual: 0 };
    }

    if (deal.stage === "closed_won") {
      months[monthKey].actual += deal.amount;
    }
    // All non-lost deals contribute to projected revenue
    if (deal.stage !== "closed_lost") {
      months[monthKey].projected += deal.amount * stageProbabilities[deal.stage];
    }
  }

  return Object.entries(months)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

// Summary stats for the forecast
export function getForecastSummary(deals: Deal[]) {
  const weighted = calculateWeightedPipeline(deals);
  const totalWeighted = weighted.reduce((sum, d) => sum + d.weighted_amount, 0);
  const totalPipeline = weighted.reduce((sum, d) => sum + d.amount, 0);
  const closedWonTotal = deals
    .filter((d) => d.stage === "closed_won")
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);

  return {
    totalWeighted,
    totalPipeline,
    closedWonTotal,
    dealCount: weighted.length,
  };
}
