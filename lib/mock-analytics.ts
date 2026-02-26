import type {
  PipelineVelocityPoint,
  WinRatePoint,
  HealthTrendPoint,
  TeamWorkloadPoint,
} from "./types";

// Sample data for all analytics charts.
// Each dataset covers 6 months of data for trend visualization.

export const pipelineVelocityData: PipelineVelocityPoint[] = [
  { month: "Sep", lead: 3, proposal: 1, active: 2, closed_won: 1 },
  { month: "Oct", lead: 4, proposal: 2, active: 2, closed_won: 1 },
  { month: "Nov", lead: 2, proposal: 3, active: 3, closed_won: 2 },
  { month: "Dec", lead: 3, proposal: 2, active: 3, closed_won: 1 },
  { month: "Jan", lead: 2, proposal: 3, active: 2, closed_won: 2 },
  { month: "Feb", lead: 1, proposal: 2, active: 2, closed_won: 1 },
];

export const winRateData: WinRatePoint[] = [
  { month: "Sep", rate: 45, deals_won: 2, deals_lost: 2 },
  { month: "Oct", rate: 55, deals_won: 3, deals_lost: 2 },
  { month: "Nov", rate: 60, deals_won: 3, deals_lost: 2 },
  { month: "Dec", rate: 50, deals_won: 2, deals_lost: 2 },
  { month: "Jan", rate: 67, deals_won: 4, deals_lost: 2 },
  { month: "Feb", rate: 50, deals_won: 1, deals_lost: 1 },
];

export const healthTrendData: HealthTrendPoint[] = [
  { month: "Sep", healthy: 3, at_risk: 1, churning: 0 },
  { month: "Oct", healthy: 3, at_risk: 1, churning: 0 },
  { month: "Nov", healthy: 4, at_risk: 1, churning: 0 },
  { month: "Dec", healthy: 4, at_risk: 0, churning: 1 },
  { month: "Jan", healthy: 3, at_risk: 1, churning: 1 },
  { month: "Feb", healthy: 3, at_risk: 1, churning: 1 },
];

export const teamWorkloadData: TeamWorkloadPoint[] = [
  { member_name: "Sarah Chen", todo: 2, in_progress: 1, done: 3 },
  { member_name: "Mike Torres", todo: 1, in_progress: 0, done: 2 },
];

// Revenue data for the analytics overview
export const revenueByMonth = [
  { month: "Sep", actual: 25000, projected: 30000 },
  { month: "Oct", actual: 35000, projected: 32000 },
  { month: "Nov", actual: 42000, projected: 40000 },
  { month: "Dec", actual: 30000, projected: 38000 },
  { month: "Jan", actual: 55000, projected: 45000 },
  { month: "Feb", actual: 30000, projected: 50000 },
];
