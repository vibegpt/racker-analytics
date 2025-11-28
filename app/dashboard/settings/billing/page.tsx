"use client";

import { useState } from "react";
import {
  Check,
  CreditCard,
  Sparkles,
  Zap,
  Building2,
  Globe,
  BarChart3,
  Users,
  Lock,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const CURRENT_TIER = "HUSTLER";

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  icon: React.ElementType;
  features: PlanFeature[];
  popular?: boolean;
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: "HUSTLER",
    name: "Hustler",
    price: 0,
    period: "forever",
    description: "Perfect for getting started",
    icon: Zap,
    cta: "Current Plan",
    features: [
      { text: "3 products", included: true },
      { text: "25 links/month", included: true },
      { text: "Basic click tracking", included: true },
      { text: "30-day data retention", included: true },
      { text: "Conversion tracking", included: false },
      { text: "Per-post attribution", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "CREATOR",
    name: "Creator",
    price: 15,
    period: "month",
    description: "For growing creators",
    icon: Sparkles,
    popular: true,
    cta: "Upgrade to Creator",
    features: [
      { text: "25 products", included: true },
      { text: "500 links/month", included: true, highlight: true },
      { text: "Full click tracking (geo/device)", included: true },
      { text: "Conversion tracking", included: true, highlight: true },
      { text: "Per-post attribution", included: true, highlight: true },
      { text: "1-year data retention", included: true },
      { text: "Email support (24h)", included: true },
    ],
  },
  {
    id: "EMPIRE",
    name: "Empire",
    price: 49,
    period: "month",
    description: "For full-time creators & agencies",
    icon: Building2,
    cta: "Upgrade to Empire",
    features: [
      { text: "Unlimited products", included: true, highlight: true },
      { text: "Unlimited links", included: true, highlight: true },
      { text: "Full click tracking + API", included: true },
      { text: "Conversion tracking", included: true },
      { text: "Per-post attribution", included: true },
      { text: "3-year data retention", included: true },
      { text: "Priority support (2h)", included: true },
    ],
  },
];

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === CURRENT_TIER) return;

    setIsLoading(planId);

    if (planId === "EMPIRE") {
      // Open contact form or email
      window.open("mailto:hello@racker.io?subject=Empire Plan Inquiry", "_blank");
      setIsLoading(null);
      return;
    }

    // TODO: Implement Stripe checkout
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Subscription */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold mb-1">Current Plan</h2>
            <p className="text-white/60">
              You&apos;re on the{" "}
              <span className="text-[#13eca4] font-medium">
                {PLANS.find((p) => p.id === CURRENT_TIER)?.name}
              </span>{" "}
              plan
            </p>
          </div>
          {CURRENT_TIER !== "HUSTLER" && (
            <Button variant="outline" className="text-white border-white/20">
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="font-semibold mb-4">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.id === CURRENT_TIER;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-xl border p-6 transition-colors",
                  plan.popular
                    ? "border-[#13eca4]/50 bg-[#13eca4]/5"
                    : "border-white/10 bg-white/5",
                  isCurrent && "ring-2 ring-[#13eca4]"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#13eca4] text-[#0a0a0a] text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      plan.popular ? "bg-[#13eca4]/20" : "bg-white/10"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        plan.popular ? "text-[#13eca4]" : "text-white/60"
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-xs text-white/60">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-white/60">/{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check
                          className={cn(
                            "w-4 h-4 mt-0.5 shrink-0",
                            feature.highlight ? "text-[#13eca4]" : "text-white/60"
                          )}
                        />
                      ) : (
                        <Lock className="w-4 h-4 mt-0.5 shrink-0 text-white/30" />
                      )}
                      <span
                        className={cn(
                          feature.included
                            ? feature.highlight
                              ? "text-white"
                              : "text-white/80"
                            : "text-white/40"
                        )}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || isLoading === plan.id}
                  className={cn(
                    "w-full",
                    plan.popular
                      ? "bg-[#13eca4] text-[#0a0a0a] hover:bg-[#0fd492]"
                      : "bg-white/10 text-white hover:bg-white/20",
                    isCurrent && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    plan.cta
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold">Feature Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="text-left text-white/60 text-sm">
                <th className="px-4 py-3">Feature</th>
                <th className="px-4 py-3 text-center">Hustler</th>
                <th className="px-4 py-3 text-center">Creator</th>
                <th className="px-4 py-3 text-center">Empire</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/10">
                <td className="px-4 py-3 text-sm">Products</td>
                <td className="px-4 py-3 text-center text-sm">3</td>
                <td className="px-4 py-3 text-center text-sm">25</td>
                <td className="px-4 py-3 text-center text-sm text-[#13eca4]">Unlimited</td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-4 py-3 text-sm">Links/month</td>
                <td className="px-4 py-3 text-center text-sm">25</td>
                <td className="px-4 py-3 text-center text-sm">500</td>
                <td className="px-4 py-3 text-center text-sm text-[#13eca4]">Unlimited</td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-4 py-3 text-sm">Click Tracking</td>
                <td className="px-4 py-3 text-center text-sm">Basic</td>
                <td className="px-4 py-3 text-center text-sm">Full (geo/device)</td>
                <td className="px-4 py-3 text-center text-sm">Full + API</td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-4 py-3 text-sm">Conversion Tracking</td>
                <td className="px-4 py-3 text-center">
                  <Lock className="w-4 h-4 mx-auto text-white/30" />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check className="w-4 h-4 mx-auto text-[#13eca4]" />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check className="w-4 h-4 mx-auto text-[#13eca4]" />
                </td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-4 py-3 text-sm">Per-post Attribution</td>
                <td className="px-4 py-3 text-center">
                  <Lock className="w-4 h-4 mx-auto text-white/30" />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check className="w-4 h-4 mx-auto text-[#13eca4]" />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check className="w-4 h-4 mx-auto text-[#13eca4]" />
                </td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-4 py-3 text-sm">Data Retention</td>
                <td className="px-4 py-3 text-center text-sm">30 days</td>
                <td className="px-4 py-3 text-center text-sm">1 year</td>
                <td className="px-4 py-3 text-center text-sm">3 years</td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-4 py-3 text-sm">API Access</td>
                <td className="px-4 py-3 text-center">
                  <Lock className="w-4 h-4 mx-auto text-white/30" />
                </td>
                <td className="px-4 py-3 text-center">
                  <Lock className="w-4 h-4 mx-auto text-white/30" />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check className="w-4 h-4 mx-auto text-[#13eca4]" />
                </td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-4 py-3 text-sm">Support</td>
                <td className="px-4 py-3 text-center text-sm">Community</td>
                <td className="px-4 py-3 text-center text-sm">Email (24h)</td>
                <td className="px-4 py-3 text-center text-sm text-[#13eca4]">Priority (2h)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods */}
      {CURRENT_TIER !== "HUSTLER" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold mb-4">Payment Method</h2>
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-6 rounded bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div>
                <p className="text-sm font-medium">**** **** **** 4242</p>
                <p className="text-xs text-white/60">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-white border-white/20">
              Update
            </Button>
          </div>
        </div>
      )}

      {/* Billing History */}
      {CURRENT_TIER !== "HUSTLER" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Billing History</h2>
            <Button variant="link" className="text-[#13eca4] p-0 h-auto">
              Download All
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="text-sm text-white/60 text-center py-8">
            No billing history yet
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Can I cancel anytime?</h3>
            <p className="text-sm text-white/60">
              Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1">What payment methods do you accept?</h3>
            <p className="text-sm text-white/60">
              We accept all major credit cards through Stripe, including Visa, Mastercard, and American Express.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1">Do you offer refunds?</h3>
            <p className="text-sm text-white/60">
              We offer a 14-day money-back guarantee on all paid plans. Just reach out to support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
