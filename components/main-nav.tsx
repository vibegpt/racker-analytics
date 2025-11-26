"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Radio, BarChart3, Settings, Wallet } from "lucide-react";

export function MainNav() {
    const pathname = usePathname();

    const routes = [
        {
            href: "/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            active: pathname === "/dashboard",
        },
        {
            href: "/discover",
            label: "Discover",
            icon: Radio,
            active: pathname === "/discover",
        },
        {
            href: "/insights",
            label: "Insights",
            icon: BarChart3,
            active: pathname === "/insights",
        },
    ];

    return (
        <nav className="flex items-center space-x-4 lg:space-x-6">
            {routes.map((route) => (
                <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                        "flex items-center text-sm font-medium transition-colors hover:text-primary",
                        route.active ? "text-foreground bg-secondary px-3 py-1.5 rounded-full" : "text-muted-foreground"
                    )}
                >
                    <route.icon className={cn("w-4 h-4 mr-2", route.active && "text-primary")} />
                    {route.label}
                </Link>
            ))}
            <div className="h-4 w-px bg-border mx-2" />
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center">
                <Wallet className="w-4 h-4 mr-2" />
                Wallet
            </Link>
        </nav>
    );
}
