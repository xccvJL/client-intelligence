import { Badge } from "@/components/ui/badge";
import type { Sentiment } from "@/lib/types";

// A color-coded badge that shows sentiment at a glance.
// Green = positive, yellow = mixed, red = negative, gray = neutral.

const sentimentConfig: Record<
  Sentiment,
  { label: string; className: string }
> = {
  positive: {
    label: "Positive",
    className: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-950",
  },
  neutral: {
    label: "Neutral",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800",
  },
  negative: {
    label: "Negative",
    className: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-950",
  },
  mixed: {
    label: "Mixed",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300 dark:hover:bg-yellow-950",
  },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const config = sentimentConfig[sentiment];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
