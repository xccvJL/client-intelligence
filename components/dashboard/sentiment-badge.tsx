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
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  neutral: {
    label: "Neutral",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  negative: {
    label: "Negative",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
  mixed: {
    label: "Mixed",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
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
