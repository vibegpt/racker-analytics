"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Link2,
  Lightbulb,
  Settings,
  HelpCircle,
  CreditCard,
  LogOut,
  ChevronUp,
  Sparkles,
  Target,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Links", href: "/dashboard/links", icon: Link2 },
  { label: "Conversions", href: "/dashboard/conversions", icon: Target },
  { label: "Insights", href: "/dashboard/insights", icon: Lightbulb, badge: "Pro" },
  { label: "Guide", href: "/dashboard/guide", icon: HelpCircle },
];

const bottomNav: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    tier?: "HUSTLER" | "CREATOR" | "EMPIRE";
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const tier = user?.tier || "HUSTLER";
  const isFreeTier = tier === "HUSTLER";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-[#0a0a0a]">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#13eca4] text-lg">
            🦝
          </div>
          <span className="text-lg font-bold">Rackr</span>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {mainNav.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-[#13eca4]/20 px-2 py-0.5 text-xs font-medium text-[#13eca4]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade Card (for free users) */}
        {isFreeTier && (
          <div className="mx-3 mb-4 rounded-xl border border-[#13eca4]/30 bg-[#13eca4]/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#13eca4]" />
              <span className="font-semibold text-white">Upgrade to Creator</span>
            </div>
            <p className="mb-3 text-xs text-white/60">
              Unlock geo routing, revenue attribution & insights
            </p>
            <Link
              href="/dashboard/settings/billing"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#13eca4] px-3 py-2 text-sm font-bold text-[#0a0a0a] transition-colors hover:bg-[#0fd492]"
            >
              <CreditCard className="h-4 w-4" />
              Upgrade - $15/mo
            </Link>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="border-t border-white/10 px-3 py-4">
          {bottomNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-medium">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || "Creator"}
              </p>
              <p className="truncate text-xs text-white/60">
                {tier === "HUSTLER" ? "Free Plan" : tier === "CREATOR" ? "Creator Plan" : "Pro Plan"}
              </p>
            </div>
            <ChevronUp className="h-4 w-4 text-white/40" />
          </div>
        </div>
      </div>
    </aside>
  );
}
