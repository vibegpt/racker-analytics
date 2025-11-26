
"use client";

import Link from "next/link";

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
                            <Link href="#" className="text-white/80 hover:text-white text-sm font-medium leading-normal transition-colors">Features</Link>
                            <Link href="#" className="text-white/80 hover:text-white text-sm font-medium leading-normal transition-colors">Pricing</Link>
                            <Link href="#" className="text-white/80 hover:text-white text-sm font-medium leading-normal transition-colors">Docs</Link>
                            <Link href="#" className="text-white/80 hover:text-white text-sm font-medium leading-normal transition-colors">API</Link>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#283933] text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#3b544b]">
                                <span className="truncate">Login</span>
                            </button>
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
                                <button
                                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#13eca4] text-[#10221c] text-base font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105"
                                    style={{ boxShadow: "0 0 15px rgba(19, 236, 164, 0.5), 0 0 30px rgba(19, 236, 164, 0.3)" }}
                                >
                                    <span className="truncate">Create Free Smart Link</span>
                                </button>
                                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-transparent border-2 border-[#283933] text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#283933]">
                                    <span className="truncate">View Demo</span>
                                </button>
                            </div>
                        </div>

                        <div className="mt-16 w-full [perspective:1000px]">
                            <div className="relative mx-auto h-auto w-full max-w-2xl rounded-xl border border-[#283933] bg-[#161B22]/50 p-6 shadow-2xl shadow-[#13eca4]/10 [transform:rotateX(20deg)]">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-white/80">Revenue Sources</p>
                                    <div className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
                                        <span className="text-sm">↑</span>
                                        <span>+40%</span>
                                    </div>
                                </div>
                                {/* Pie Chart Section */}
                                <div className="mt-4 grid grid-cols-2 gap-6 items-center">
                                    <div className="aspect-square pie-chart rounded-full"></div>
                                    <div className="flex flex-col gap-3 text-left text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="size-3 rounded-full bg-[#13eca4]"></div>
                                            <span className="text-white/90">Twitter</span>
                                            <span className="ml-auto text-white/70">45%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="size-3 rounded-full bg-[#3b544b]"></div>
                                            <span className="text-white/90">YouTube</span>
                                            <span className="ml-auto text-white/70">30%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="size-3 rounded-full bg-[#283933]"></div>
                                            <span className="text-white/90">Newsletter</span>
                                            <span className="ml-auto text-white/70">25%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    <section className="py-16 md:py-24">
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
                                <div
                                    className="mt-4 w-full bg-center bg-no-repeat aspect-video bg-contain rounded-lg"
                                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA36LID8Dh2yaz5Wk0-eRU_AJ8PHxpS-1RHGIZKVarFaQFeq3zDw8uQvNOfUzgcyJ12qtSJAvYA-WEX5fuXmsR0LGdk7--5uw5SCRob_eE8ZyO1l4Xqvt3zlrG79qmIYyY7IR2uMUN66oplSLRxaeSKHi1mM5JY2SVclQw_mZlNzamPEXSYGnLRlaD_yNXcPtHP7L7jnKxrse_5_FGzDqecwDSw5Idl9KaqK8hkzLqWP5UdzFNzqeoF_IcY4t-iGkOIe-D7NXdpHm9G")' }}
                                ></div>
                            </div>

                            {/* Feature 3 */}
                            <div className="flex flex-col gap-4 rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-6 lg:col-span-1">
                                <h3 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                                    Know Your True Audience.
                                </h3>
                                <p className="text-base font-normal leading-normal text-white/70">
                                    Pinpoint exactly where your fans are and where your revenue is coming from with geo-attribution.
                                </p>
                                <div
                                    className="mt-4 flex-grow w-full bg-center bg-no-repeat aspect-square bg-contain rounded-lg"
                                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB-ge9sOtBuBlYBPnoSf9yIEJdVntbk7viIVA4DUjALqfSj5Y7d8gv5lTpr6oSnZvzJeKVpQLxjfPLfJrvoK2JIgTvnZsAEcoGweuyecSmhu-mem3BKPROnDiXNGEdg75_ztfSbI8_crgUruiRAcSp61QOM8NGcsdnRc4fb0YmArL0l0zjMpw64-FHK_6SQ34ViLL-nq9zxVT-xzpkJUSzJg5v0oq1Vrv2BiZNcnUDISoSmt-1JaDPVL2fwEDSWOlMa8uPvfgTCPoa6")' }}
                                ></div>
                            </div>
                        </div>
                    </section>

                    <section className="py-16 text-center md:py-24">
                        <div className="mx-auto mb-12 max-w-2xl">
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Pricing Plans</h2>
                            <p className="mt-4 text-white/70">Choose the plan that's right for your hustle.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                            {/* Plan 1 */}
                            <div className="flex flex-col rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-8 text-left">
                                <h3 className="text-lg font-semibold text-white">The Hustler</h3>
                                <p className="mt-4 text-4xl font-bold tracking-tight text-white">$0</p>
                                <ul className="mt-6 flex-grow space-y-3 text-white/70">
                                    <li className="flex items-center gap-2">
                                        <span className="text-[#13eca4]">✓</span> Unlimited Smart Links
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-[#13eca4]">✓</span> Stripe Integration
                                    </li>
                                </ul>
                                <button className="mt-8 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#283933] text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#3b544b]">
                                    <span className="truncate">Get Started</span>
                                </button>
                            </div>

                            {/* Plan 2 */}
                            <div className="relative flex flex-col rounded-xl border-2 border-[#13eca4] bg-[#1c2e28] p-8 text-left shadow-2xl shadow-[#13eca4]/20">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#13eca4] px-3 py-1 text-xs font-bold text-[#10221c]">
                                    MOST POPULAR
                                </div>
                                <h3 className="text-lg font-semibold text-white">The Creator</h3>
                                <p className="mt-4 text-4xl font-bold tracking-tight text-white">
                                    $29<span className="text-base font-medium text-white/70">/mo</span>
                                </p>
                                <ul className="mt-6 flex-grow space-y-3 text-white/70">
                                    <li className="flex items-center gap-2">
                                        <span className="text-[#13eca4]">✓</span> Sentiment Analysis
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-[#13eca4]">✓</span> Advanced Correlation
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-[#13eca4]">✓</span> All Platforms
                                    </li>
                                </ul>
                                <button className="mt-8 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#13eca4] text-[#10221c] text-sm font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105">
                                    <span className="truncate">Start Pro Trial</span>
                                </button>
                            </div>

                            {/* Plan 3 */}
                            <div className="flex flex-col rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-8 text-left">
                                <h3 className="text-lg font-semibold text-white">The Empire</h3>
                                <p className="mt-4 text-4xl font-bold tracking-tight text-white">
                                    $299<span className="text-base font-medium text-white/70">/mo</span>
                                </p>
                                <ul className="mt-6 flex-grow space-y-3 text-white/70">
                                    <li className="flex items-center gap-2">
                                        <span className="text-[#13eca4]">✓</span> White Label
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-[#13eca4]">✓</span> Team Seats
                                    </li>
                                </ul>
                                <button className="mt-8 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#283933] text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#3b544b]">
                                    <span className="truncate">Contact Sales</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    <footer className="border-t border-solid border-[#283933] py-8">
                        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                            <p className="text-sm text-white/60">Built for Creators, by Creators.</p>
                            <div className="flex items-center gap-6">
                                <Link href="#" className="text-sm text-white/80 transition-colors hover:text-white">Docs</Link>
                                <Link href="#" className="text-sm text-white/80 transition-colors hover:text-white">API</Link>
                                <Link href="#" className="text-sm text-white/80 transition-colors hover:text-white">Login</Link>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
