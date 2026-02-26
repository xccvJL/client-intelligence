"use client";

import { Button } from "@/components/ui/button";

// Date range picker with preset buttons.
// Lets users quickly switch between common time ranges for analytics.

const presets = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "This quarter", value: "quarter" },
  { label: "6 months", value: "6m" },
  { label: "This year", value: "year" },
];

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={value === preset.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(preset.value)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
