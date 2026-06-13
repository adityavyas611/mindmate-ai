"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Heart,
  LayoutDashboard,
  MessageCircle,
  PenLine,
  Sparkles,
  TrendingUp,
  Wind,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SAFETY_DISCLAIMER } from "@/lib/utils";

const navItems = [
  { href: "/check-in", label: "Daily Check-In", icon: PenLine },
  { href: "/analysis", label: "AI Analysis", icon: Brain },
  { href: "/insights", label: "Emotional Insights", icon: TrendingUp },
  { href: "/dashboard", label: "Wellness Dashboard", icon: LayoutDashboard },
  { href: "/mood-history", label: "Mood History", icon: Heart },
  { href: "/mindfulness", label: "Mindfulness Coach", icon: Wind },
  { href: "/motivation", label: "Motivation Center", icon: Sparkles },
  { href: "/burnout", label: "Burnout Monitor", icon: AlertTriangle },
  { href: "/chat", label: "AI Companion", icon: MessageCircle },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-violet-950/20">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-violet-100 bg-white/95 backdrop-blur dark:border-violet-900/50 dark:bg-zinc-950/95 transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-violet-100 px-6 py-5 dark:border-violet-900/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-violet-900 dark:text-violet-100">MindMate AI</p>
              <p className="text-xs text-zinc-500">Your exam wellness companion</p>
            </div>
            <button
              className="ml-auto lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === href
                        ? "bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-100"
                        : "text-zinc-600 hover:bg-violet-50 hover:text-violet-900 dark:text-zinc-400 dark:hover:bg-violet-950 dark:hover:text-violet-100"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-violet-100 p-4 dark:border-violet-900/50">
            <p className="text-xs leading-relaxed text-zinc-500">{SAFETY_DISCLAIMER}</p>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-violet-100 bg-white/80 px-4 py-3 backdrop-blur dark:border-violet-900/50 dark:bg-zinc-950/80 lg:px-8">
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="font-semibold text-violet-900 dark:text-violet-100 lg:hidden">
            MindMate AI
          </Link>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
