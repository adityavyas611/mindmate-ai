import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "stable";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">{title}</CardTitle>
        <Icon className="h-4 w-4 text-violet-600" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-violet-900 dark:text-violet-100">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-violet-950 dark:text-violet-50">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{description}</p>
      )}
    </header>
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent motion-reduce:animate-none motion-reduce:border-violet-600"
        aria-hidden="true"
      />
      <p className="mt-4 text-sm text-zinc-500">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent
        className="flex flex-col items-center py-12 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-lg font-medium text-violet-900 dark:text-violet-100">{title}</p>
        <p className="mt-2 max-w-md text-sm text-zinc-500">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </CardContent>
    </Card>
  );
}

export function AlertBanner({
  message,
  severity = "warning",
}: {
  message: string;
  severity?: "info" | "warning" | "critical";
}) {
  const styles = {
    info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-100",
    warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
    critical: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100",
  };

  return (
    <div
      className={cn("rounded-xl border p-4 text-sm leading-relaxed", styles[severity])}
      role="alert"
    >
      {message}
    </div>
  );
}

export function QueryErrorState({
  message = "Something went wrong while loading your data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-red-200 dark:border-red-900">
      <CardContent className="py-8 text-center" role="alert" aria-live="assertive">
        <p className="font-medium text-red-700 dark:text-red-300">Unable to load data</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Try again
          </button>
        )}
      </CardContent>
    </Card>
  );
}
