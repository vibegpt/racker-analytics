"use client";

import Link from "next/link";
import { DollarSign, Link2, TrendingUp, BarChart3 } from "lucide-react";

// Mascot Avatar component
function MascotAvatar() {
  return (
    <div className="relative">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#13eca4] to-[#0ba678] flex items-center justify-center text-2xl">
        🦝
      </div>
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#161B22]"></div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f6f8f7] dark:bg-[#10221c] font-sans text-white">
      {/* Top Banner */}
      <div className="w-full bg-[#1c2e28] py-2">
        <p className="text-center text-sm font-normal leading-normal text-[#9db9b0]">
          User_123 just made $50 from a Tweet.
        </p>
      </div>

      <div className="relative flex w-full flex-col items-center">
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#283933] py-4">
            <div className="flex items-center gap-4 text-white">
              <div className="size-6 text-[#13eca4]">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </div>
              <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                Racker Analytics
              </h2>
            </div>
            <div className="hidden items-center gap-9 md:flex">
              <Link href="#features" className="text-white/80 hover:text-white text-sm font-medium leading-normal transition-colors">Features</Link>
              <Link href="#pricing" className="text-white/80 hover:text-white text-sm font-medium leading-normal transition-colors">Pricing</Link>
              <Link href="#" className="text-white/80 hover:text-white text-sm font-medium leading-normal transition-colors">Docs</Link>
              <Link href="#" className="text-white/80 hover:text-white text-sm font-medium leading-normal transition-colors">API</Link>
            </div>
            <div className="flex gap-2">
              <Link href="/sign-in">
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#283933] text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#3b544b]">
                  <span className="truncate">Login</span>
                </button>
              </Link>
              <Link href="/sign-up">
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#13eca4] text-[#10221c] text-sm font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#0fd492]">
                  <span className="truncate">Sign Up</span>
                </button>
              </Link>
            </div>
          </header>

          <main className="py-16 text-center md:py-24">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-4xl font-black leading-tight tracking-tighter text-white sm:text-5xl md:text-6xl">
                Stop Guessing. Start Knowing.
              </h1>
              <h2 className="mt-4 text-base font-normal leading-normal text-white/80 sm:text-lg">
                The first platform that correlates your Content directly to your Revenue. Stop posting into the void.
              </h2>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/sign-up">
                  <button
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#13eca4] text-[#10221c] text-base font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105"
                    style={{ boxShadow: "0 0 15px rgba(19, 236, 164, 0.5), 0 0 30px rgba(19, 236, 164, 0.3)" }}
                  >
                    <span className="truncate">Create Free Smart Link</span>
                  </button>
                </Link>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-transparent border-2 border-[#283933] text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#283933]">
                  <span className="truncate">View Demo</span>
                </button>
              </div>
            </div>

            {/* Dashboard-style Demo Card */}
            <div className="mt-16 w-full [perspective:1000px]">
              <div className="relative mx-auto w-full max-w-2xl rounded-xl border border-[#283933] bg-[#161B22]/80 p-6 shadow-2xl shadow-[#13eca4]/10 [transform:rotateX(15deg)]">
                {/* Header with Mascot */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <MascotAvatar />
                    <div className="text-left">
                      <p className="font-bold text-white">Ricky Racker</p>
                      <p className="text-xs text-white/60">@rickyracker • Creator</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                    <span>↑</span>
                    <span>+40% this week</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-1 text-white/60 mb-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="text-xs">Revenue</span>
                    </div>
                    <p className="text-lg font-bold text-white">$2,650</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-1 text-white/60 mb-1">
                      <Link2 className="w-3 h-3" />
                      <span className="text-xs">Clicks</span>
                    </div>
                    <p className="text-lg font-bold text-white">2,595</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-1 text-white/60 mb-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs">Sales</span>
                    </div>
                    <p className="text-lg font-bold text-white">53</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-1 text-white/60 mb-1">
                      <BarChart3 className="w-3 h-3" />
                      <span className="text-xs">Rate</span>
                    </div>
                    <p className="text-lg font-bold text-white">2.04%</p>
                  </div>
                </div>

                {/* Platform Breakdown */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-white/80 mb-3 text-left">Revenue by Platform</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">Twitter</span>
                          <span className="text-[#13eca4] font-bold">$1,192</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1DA1F2] rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FF0000]/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">YouTube</span>
                          <span className="text-[#13eca4] font-bold">$795</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#FF0000] rounded-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#13eca4]/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#13eca4]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">Newsletter</span>
                          <span className="text-[#13eca4] font-bold">$663</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#13eca4] rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <section id="features" className="py-16 md:py-24">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-6 lg:col-span-3">
                <h3 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                  One Link. Infinite Tracking.
                </h3>
                <p className="max-w-3xl text-base font-normal leading-normal text-white/70">
                  Forget UTMs. Generate platform-specific tracking links in one click. We tell you exactly which tweet paid the rent.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-lg border border-[#3b544b] bg-[#10221c] p-4">
                    <p className="text-sm text-white/60">Before: Messy Links</p>
                    <div className="mt-3 space-y-2 text-sm text-gray-400">
                      <p className="truncate rounded bg-[#283933] p-2">bit.ly/3xYqZ1b</p>
                      <p className="truncate rounded bg-[#283933] p-2">bit.ly/4aCdE2f</p>
                      <p className="truncate rounded bg-[#283933] p-2">bit.ly/3VwX4gH</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#13eca4]/50 bg-[#13eca4]/10 p-4">
                    <p className="text-sm text-white/80">After: Racker Link</p>
                    <div className="mt-3 space-y-2 text-sm text-white">
                      <div className="flex items-center justify-between rounded bg-[#283933] p-2">
                        <div className="flex items-center gap-2">
                          <span>🐦</span>
                          <span>Twitter</span>
                        </div>
                        <span className="rounded-full bg-[#13eca4]/80 px-2 py-0.5 text-xs font-bold text-[#10221c]">$50</span>
                      </div>
                      <div className="flex items-center gap-2 rounded bg-[#283933] p-2">
                        <span>▶️</span>
                        <span>YouTube</span>
                      </div>
                      <div className="flex items-center gap-2 rounded bg-[#283933] p-2">
                        <span>📸</span>
                        <span>Instagram</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-6 lg:col-span-2">
                <h3 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                  Filter the Noise. Measure the Hype.
                </h3>
                <p className="max-w-2xl text-base font-normal leading-normal text-white/70">
                  1,000 comments means nothing if they are all bots. Our AI filters the spam and correlates genuine excitement with sales.
                </p>
                <div className="mt-4 h-48 w-full rounded-lg bg-gradient-to-br from-[#1c2e28] to-[#283933] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-white/60 text-sm">Sentiment Analysis Dashboard</p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-6 lg:col-span-1">
                <h3 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                  Know Your True Audience.
                </h3>
                <p className="text-base font-normal leading-normal text-white/70">
                  Pinpoint exactly where your fans are and where your revenue is coming from with geo-attribution.
                </p>
                <div className="mt-4 flex-grow w-full rounded-lg bg-gradient-to-br from-[#1c2e28] to-[#283933] flex items-center justify-center min-h-[150px]">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🌍</div>
                    <p className="text-white/60 text-sm">Geo Analytics</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="pricing" className="py-16 text-center md:py-24">
            <div className="mx-auto mb-12 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Pricing Plans</h2>
              <p className="mt-4 text-white/70">Start free. Upgrade when you&apos;re ready to see the money.</p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Hustler - Free */}
              <div className="flex flex-col rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-8 text-left">
                <h3 className="text-lg font-semibold text-white">Hustler</h3>
                <p className="mt-1 text-sm text-white/60">Perfect for getting started</p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-white">
                  $0<span className="text-base font-medium text-white/50">/forever</span>
                </p>
                <ul className="mt-6 flex-grow space-y-3 text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> Unlimited smart links
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> Click tracking & analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> Basic geo analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> 30-day data retention
                  </li>
                </ul>
                <Link href="/sign-up">
                  <button className="mt-8 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#283933] text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#3b544b]">
                    <span className="truncate">Start Free</span>
                  </button>
                </Link>
              </div>

              {/* Creator - $29/mo */}
              <div className="relative flex flex-col rounded-xl border-2 border-[#13eca4] bg-[#1c2e28] p-8 text-left shadow-2xl shadow-[#13eca4]/20">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#13eca4] px-3 py-1 text-xs font-bold text-[#10221c]">
                  MOST POPULAR
                </div>
                <h3 className="text-lg font-semibold text-white">Creator</h3>
                <p className="mt-1 text-sm text-white/60">For serious content creators</p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-white">
                  $15<span className="text-base font-medium text-white/50">/mo</span>
                </p>
                <ul className="mt-6 flex-grow space-y-3 text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> Everything in Hustler
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> <strong className="text-white">Geo routing for affiliates</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> <strong className="text-white">Revenue attribution</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> <strong className="text-white">AI-powered insights</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> 12-month data retention
                  </li>
                </ul>
                <Link href="/sign-up">
                  <button className="mt-8 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#13eca4] text-[#10221c] text-sm font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105">
                    <span className="truncate">Upgrade to Creator</span>
                  </button>
                </Link>
              </div>

              {/* Empire - $299/mo */}
              <div className="flex flex-col rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-8 text-left">
                <h3 className="text-lg font-semibold text-white">Empire</h3>
                <p className="mt-1 text-sm text-white/60">For teams and agencies</p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-white">
                  $49<span className="text-base font-medium text-white/50">/mo</span>
                </p>
                <ul className="mt-6 flex-grow space-y-3 text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> Everything in Creator
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> Up to 10 team members
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> White-label links
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> API access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> Unlimited data retention
                  </li>
                </ul>
                <a href="mailto:hello@racker.io?subject=Empire Plan Inquiry">
                  <button className="mt-8 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#283933] text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#3b544b]">
                    <span className="truncate">Contact Sales</span>
                  </button>
                </a>
              </div>
            </div>
          </section>

          <footer className="border-t border-solid border-[#283933] py-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <p className="text-sm text-white/60">Built for Creators, by Creators.</p>
              <div className="flex items-center gap-6">
                <Link href="#" className="text-sm text-white/80 transition-colors hover:text-white">Docs</Link>
                <Link href="#" className="text-sm text-white/80 transition-colors hover:text-white">API</Link>
                <Link href="/sign-in" className="text-sm text-white/80 transition-colors hover:text-white">Login</Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
