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
        <Icon className="h-4 w-4 text-violet-600" />
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
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-violet-950 dark:text-violet-50">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{description}</p>
      )}
    </div>
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
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
      <CardContent className="flex flex-col items-center py-12 text-center">
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
    <div className={cn("rounded-xl border p-4 text-sm leading-relaxed", styles[severity])}>
      {message}
    </div>
  );
}
