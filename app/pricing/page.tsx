/**
 * PRICING PAGE
 *
 * Displays the three subscription tiers with features and pricing.
 * Uses the centralized tier configuration from lib/tiers.ts
 */
import Link from "next/link";
import { Check, X } from "lucide-react";
import { TIER_CONFIG } from "@/lib/tiers";
import { SubscriptionTier } from "@prisma/client";

const tiers: SubscriptionTier[] = ["HUSTLER", "CREATOR", "EMPIRE"];

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}

function formatAnnualPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}/yr`;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#10221c] text-white">
      {/* Header */}
      <header className="border-b border-[#283933]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 text-[#13eca4]">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="font-bold text-lg">Rackr</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm text-white/70 hover:text-white">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-[#13eca4] text-[#10221c] rounded-lg font-semibold text-sm hover:bg-[#0fd492]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Start free and upgrade as you grow. Track which posts drive your revenue.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tierKey) => {
            const tier = TIER_CONFIG[tierKey];
            const isHighlighted = tier.highlighted;

            return (
              <div
                key={tierKey}
                className={`rounded-2xl p-8 ${
                  isHighlighted
                    ? "bg-[#13eca4]/10 border-2 border-[#13eca4] relative"
                    : "bg-[#1c2e28] border border-[#283933]"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#13eca4] text-[#10221c] text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{tier.displayName}</h3>
                  <p className="text-sm text-white/60">{tier.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {formatPrice(tier.pricing.monthlyPriceCents)}
                    </span>
                    {tier.pricing.monthlyPriceCents > 0 && (
                      <span className="text-white/60">/month</span>
                    )}
                  </div>
                  {tier.pricing.annualPriceCents > 0 && (
                    <p className="text-sm text-[#13eca4] mt-1">
                      {formatAnnualPrice(tier.pricing.annualPriceCents)} billed annually (20% off)
                    </p>
                  )}
                </div>

                <Link
                  href="/sign-up"
                  className={`block w-full py-3 rounded-lg font-semibold text-center mb-8 transition-colors ${
                    isHighlighted
                      ? "bg-[#13eca4] text-[#10221c] hover:bg-[#0fd492]"
                      : "bg-[#283933] text-white hover:bg-[#3b544b]"
                  }`}
                >
                  {tier.pricing.monthlyPriceCents === 0 ? "Start Free" : "Get Started"}
                </Link>

                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="w-5 h-5 text-[#13eca4] flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">Compare all features</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#283933]">
                  <th className="text-left py-4 px-4 text-white/60 font-medium">Feature</th>
                  {tiers.map((tierKey) => (
                    <th key={tierKey} className="text-center py-4 px-4 font-bold">
                      {TIER_CONFIG[tierKey].displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#283933]/50">
                  <td className="py-4 px-4 text-white/80">Products</td>
                  <td className="py-4 px-4 text-center">3</td>
                  <td className="py-4 px-4 text-center">25</td>
                  <td className="py-4 px-4 text-center text-[#13eca4]">Unlimited</td>
                </tr>
                <tr className="border-b border-[#283933]/50">
                  <td className="py-4 px-4 text-white/80">Links per month</td>
                  <td className="py-4 px-4 text-center">25</td>
                  <td className="py-4 px-4 text-center">500</td>
                  <td className="py-4 px-4 text-center text-[#13eca4]">Unlimited</td>
                </tr>
                <tr className="border-b border-[#283933]/50">
                  <td className="py-4 px-4 text-white/80">Click tracking</td>
                  <td className="py-4 px-4 text-center">Basic</td>
                  <td className="py-4 px-4 text-center">Full (geo/device)</td>
                  <td className="py-4 px-4 text-center">Full + API</td>
                </tr>
                <tr className="border-b border-[#283933]/50">
                  <td className="py-4 px-4 text-white/80">Conversion tracking</td>
                  <td className="py-4 px-4 text-center">
                    <X className="w-5 h-5 text-white/30 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-[#13eca4] mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-[#13eca4] mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-[#283933]/50">
                  <td className="py-4 px-4 text-white/80">Per-post attribution</td>
                  <td className="py-4 px-4 text-center">
                    <X className="w-5 h-5 text-white/30 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-[#13eca4] mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-[#13eca4] mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-[#283933]/50">
                  <td className="py-4 px-4 text-white/80">Data retention</td>
                  <td className="py-4 px-4 text-center">30 days</td>
                  <td className="py-4 px-4 text-center">1 year</td>
                  <td className="py-4 px-4 text-center">3 years</td>
                </tr>
                <tr className="border-b border-[#283933]/50">
                  <td className="py-4 px-4 text-white/80">Custom domain</td>
                  <td className="py-4 px-4 text-center">
                    <X className="w-5 h-5 text-white/30 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">Subdomain</td>
                  <td className="py-4 px-4 text-center text-[#13eca4]">Full vanity</td>
                </tr>
                <tr className="border-b border-[#283933]/50">
                  <td className="py-4 px-4 text-white/80">API access</td>
                  <td className="py-4 px-4 text-center">
                    <X className="w-5 h-5 text-white/30 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <X className="w-5 h-5 text-white/30 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-[#13eca4] mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-[#283933]/50">
                  <td className="py-4 px-4 text-white/80">Support</td>
                  <td className="py-4 px-4 text-center">Community</td>
                  <td className="py-4 px-4 text-center">Email (24h)</td>
                  <td className="py-4 px-4 text-center text-[#13eca4]">Priority (2h)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>

          <div className="space-y-6">
            <div className="bg-[#1c2e28] rounded-xl p-6">
              <h3 className="font-semibold mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-white/70 text-sm">
                Yes! You can upgrade anytime and the change takes effect immediately.
                Downgrades take effect at the end of your current billing period.
              </p>
            </div>

            <div className="bg-[#1c2e28] rounded-xl p-6">
              <h3 className="font-semibold mb-2">What happens if I exceed my link limit?</h3>
              <p className="text-white/70 text-sm">
                On the Creator plan, you can purchase additional links at $5 per 1,000 clicks.
                On the Pro plan, there are no limits. On the free plan, you&apos;ll need to upgrade.
              </p>
            </div>

            <div className="bg-[#1c2e28] rounded-xl p-6">
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-white/70 text-sm">
                Yes, we offer a 14-day money-back guarantee if you&apos;re not satisfied.
                Just contact support and we&apos;ll process your refund.
              </p>
            </div>

            <div className="bg-[#1c2e28] rounded-xl p-6">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-white/70 text-sm">
                We accept all major credit cards through Stripe. For Enterprise customers,
                we can also arrange invoicing.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to know what&apos;s working?</h2>
          <p className="text-white/70 mb-8">
            Start tracking your affiliate revenue today. No credit card required.
          </p>
          <Link
            href="/sign-up"
            className="inline-block px-8 py-4 bg-[#13eca4] text-[#10221c] rounded-lg font-bold text-lg hover:bg-[#0fd492] transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#283933] mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} Rackr Analytics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
