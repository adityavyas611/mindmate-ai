export function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
      {label}: {value}
    </span>
  );
}
