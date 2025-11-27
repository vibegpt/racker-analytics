"use client";

import { useState } from "react";
import {
  CreditCard,
  Youtube,
  Twitter,
  Instagram,
  Mail,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const IS_FREE_TIER = true;

interface Connection {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  connected: boolean;
  accountName?: string;
  requiresPaid?: boolean;
  comingSoon?: boolean;
}

const CONNECTIONS: Connection[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Connect to track revenue attribution",
    icon: CreditCard,
    iconBg: "bg-purple-500",
    connected: false,
    requiresPaid: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Track video description links",
    icon: Youtube,
    iconBg: "bg-red-500",
    connected: false,
    comingSoon: true,
  },
  {
    id: "twitter",
    name: "Twitter / X",
    description: "Track tweet and bio links",
    icon: Twitter,
    iconBg: "bg-black",
    connected: false,
    comingSoon: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Track bio link clicks",
    icon: Instagram,
    iconBg: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500",
    connected: false,
    comingSoon: true,
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Track email campaign links",
    icon: Mail,
    iconBg: "bg-blue-500",
    connected: false,
    comingSoon: true,
  },
];

export default function ConnectionsPage() {
  const [connections, setConnections] = useState(CONNECTIONS);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnect = async (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId);
    if (!connection) return;

    if (connection.comingSoon) return;

    if (connection.requiresPaid && IS_FREE_TIER) {
      // Redirect to billing
      window.location.href = "/dashboard/settings/billing";
      return;
    }

    setIsConnecting(connectionId);

    // TODO: Implement actual OAuth flow for each platform
    if (connectionId === "stripe") {
      try {
        const response = await fetch("/api/stripe/connect", {
          method: "POST",
        });
        if (response.ok) {
          const { url } = await response.json();
          window.location.href = url;
        }
      } catch (error) {
        console.error("Connection error:", error);
      }
    }

    setIsConnecting(null);
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;

    setIsConnecting(connectionId);

    // TODO: Implement actual disconnect
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setConnections(
      connections.map((c) =>
        c.id === connectionId ? { ...c, connected: false, accountName: undefined } : c
      )
    );

    setIsConnecting(null);
  };

  return (
    <div className="space-y-8">
      {/* Revenue Attribution */}
      <div>
        <h2 className="font-semibold mb-2">Revenue Attribution</h2>
        <p className="text-sm text-white/60 mb-4">
          Connect your payment platform to track which content drives revenue
        </p>

        {connections
          .filter((c) => c.id === "stripe")
          .map((connection) => {
            const Icon = connection.icon;
            const isLocked = connection.requiresPaid && IS_FREE_TIER;

            return (
              <div
                key={connection.id}
                className={cn(
                  "rounded-xl border p-4",
                  isLocked
                    ? "border-white/10 bg-white/5"
                    : connection.connected
                    ? "border-[#13eca4]/30 bg-[#13eca4]/5"
                    : "border-white/10 bg-white/5"
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      connection.iconBg
                    )}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{connection.name}</h3>
                      {connection.connected && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#13eca4]/20 text-[#13eca4] text-xs">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                      {isLocked && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">
                          <Lock className="w-3 h-3" />
                          Creator Plan
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mt-0.5">
                      {connection.description}
                    </p>
                    {connection.connected && connection.accountName && (
                      <p className="text-xs text-white/40 mt-1">
                        Connected as {connection.accountName}
                      </p>
                    )}
                  </div>

                  {connection.connected ? (
                    <Button
                      variant="outline"
                      onClick={() => handleDisconnect(connection.id)}
                      disabled={isConnecting === connection.id}
                      className="text-white border-white/20"
                    >
                      {isConnecting === connection.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Disconnect"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleConnect(connection.id)}
                      disabled={isConnecting === connection.id}
                      className={cn(
                        isLocked
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "bg-[#13eca4] text-[#0a0a0a] hover:bg-[#0fd492]"
                      )}
                    >
                      {isConnecting === connection.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isLocked ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Upgrade
                        </>
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  )}
                </div>

                {isLocked && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-start gap-2 text-sm text-white/60">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>
                        Revenue attribution is available on the Creator plan. See which
                        content drives sales by connecting your Stripe account.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Social Platforms */}
      <div>
        <h2 className="font-semibold mb-2">Social Platforms</h2>
        <p className="text-sm text-white/60 mb-4">
          Connect your social accounts for enhanced analytics (coming soon)
        </p>

        <div className="space-y-3">
          {connections
            .filter((c) => c.id !== "stripe")
            .map((connection) => {
              const Icon = connection.icon;

              return (
                <div
                  key={connection.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        connection.iconBg
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{connection.name}</h3>
                        {connection.comingSoon && (
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/60 mt-0.5">
                        {connection.description}
                      </p>
                    </div>

                    <Button
                      disabled={connection.comingSoon}
                      variant="outline"
                      className="text-white/40 border-white/10 cursor-not-allowed"
                    >
                      Connect
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* How It Works */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold mb-4">How Revenue Attribution Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="w-8 h-8 rounded-full bg-[#13eca4]/20 flex items-center justify-center text-[#13eca4] font-bold mb-3">
              1
            </div>
            <h3 className="font-medium mb-1">Connect Stripe</h3>
            <p className="text-sm text-white/60">
              Link your Stripe account to track sales and revenue automatically
            </p>
          </div>
          <div>
            <div className="w-8 h-8 rounded-full bg-[#13eca4]/20 flex items-center justify-center text-[#13eca4] font-bold mb-3">
              2
            </div>
            <h3 className="font-medium mb-1">Track Clicks</h3>
            <p className="text-sm text-white/60">
              Use your Racker links to track which content gets clicked
            </p>
          </div>
          <div>
            <div className="w-8 h-8 rounded-full bg-[#13eca4]/20 flex items-center justify-center text-[#13eca4] font-bold mb-3">
              3
            </div>
            <h3 className="font-medium mb-1">See Revenue</h3>
            <p className="text-sm text-white/60">
              View exactly which content drives sales with full attribution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
