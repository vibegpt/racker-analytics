"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CreditCard, Link2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNav = [
  { label: "Profile", href: "/dashboard/settings", icon: User },
  { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
  { label: "Connected Accounts", href: "/dashboard/settings/connections", icon: Link2 },
  { label: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-white/60 mt-1">Manage your account and preferences</p>
        </div>

        {/* Settings Navigation */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 mb-8">
          {settingsNav.map((item) => {
            const isActive =
              item.href === "/dashboard/settings"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Settings Content */}
        {children}
      </div>
    </div>
  );
}
