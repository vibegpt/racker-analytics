"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, Link2, TrendingUp, Loader2, CheckCircle, ArrowRight, Zap } from "lucide-react";
import { RevenuePieChart } from "@/components/revenue-pie-chart";

// Live notification data
const LIVE_NOTIFICATIONS = [
  { user: "@techreviewer", amount: 127, platform: "YouTube", product: "Notion Template" },
  { user: "@fitnessguru", amount: 89, platform: "Instagram", product: "Workout Guide" },
  { user: "@designpro", amount: 249, platform: "Twitter", product: "Figma Kit" },
  { user: "@contentcreator", amount: 67, platform: "TikTok", product: "Lightroom Presets" },
  { user: "@bizcoach", amount: 312, platform: "Newsletter", product: "Business Course" },
];

// Live notification ticker
function LiveNotificationBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % LIVE_NOTIFICATIONS.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const notification = LIVE_NOTIFICATIONS[currentIndex];

  return (
    <div className="w-full bg-[#1c2e28] py-2 overflow-hidden">
      <div className={`flex items-center justify-center gap-2 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13eca4] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#13eca4]"></span>
        </span>
        <p className="text-sm font-normal leading-normal text-[#9db9b0]">
          <span className="text-white font-medium">{notification.user}</span> just made{" "}
          <span className="text-[#13eca4] font-bold">${notification.amount}</span> from {notification.platform}
        </p>
      </div>
    </div>
  );
}

// How it works step with visual diagram
function HowItWorksStep({
  step,
  title,
  description,
  icon: Icon,
  diagram,
  isLast = false
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  diagram: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-[#13eca4]/20 border-2 border-[#13eca4] flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-[#13eca4]" />
          </div>
          {!isLast && <div className="w-0.5 h-8 bg-gradient-to-b from-[#13eca4]/50 to-transparent mt-2" />}
        </div>
        <div className="pt-1 min-w-0">
          <p className="text-xs text-[#13eca4] font-medium mb-0.5">Step {step}</p>
          <h4 className="text-base font-bold text-white mb-0.5">{title}</h4>
          <p className="text-xs text-white/60">{description}</p>
        </div>
      </div>
      {/* Visual Diagram */}
      <div className="ml-14">
        {diagram}
      </div>
    </div>
  );
}

// Global animation styles for all steps - ensures sync
function AnimationStyles() {
  return (
    <style jsx global>{`
      /* Step 1: 8-28% of 10s cycle */
      @keyframes cursorClick1 {
        0%, 8% { transform: scale(1); opacity: 0; }
        9% { transform: scale(1); opacity: 1; }
        14% { transform: scale(0.8); opacity: 1; }
        17% { transform: scale(1); opacity: 1; }
        22%, 100% { opacity: 0; }
      }
      @keyframes iconPulse1 {
        0%, 8% { box-shadow: 0 0 0 0 rgba(29, 161, 242, 0); }
        14%, 19% { box-shadow: 0 0 0 4px rgba(29, 161, 242, 0.4); }
        24%, 100% { box-shadow: 0 0 0 0 rgba(29, 161, 242, 0); }
      }
      @keyframes fadeIn1 {
        0%, 17% { opacity: 0; }
        22%, 32% { opacity: 1; }
        36%, 100% { opacity: 0.3; }
      }

      /* Step 2: 28-50% of 10s cycle */
      @keyframes typeLink2 {
        0%, 30% { width: 0; opacity: 0; }
        36% { opacity: 1; }
        40%, 100% { width: 100%; opacity: 1; }
      }
      @keyframes cursorPaste2 {
        0%, 28% { opacity: 0; }
        30% { transform: scale(1); opacity: 1; }
        33% { transform: scale(0.8); opacity: 1; }
        36% { transform: scale(1); opacity: 1; }
        42%, 100% { opacity: 0; }
      }
      @keyframes cursorPost2 {
        0%, 44% { opacity: 0; }
        46% { transform: scale(1); opacity: 1; }
        49% { transform: scale(0.8); opacity: 1; }
        52% { transform: scale(1); opacity: 1; }
        56%, 100% { opacity: 0; }
      }
      @keyframes buttonPulse2 {
        0%, 46% { box-shadow: 0 0 0 0 rgba(29, 161, 242, 0); }
        49%, 54% { box-shadow: 0 0 0 4px rgba(29, 161, 242, 0.4); }
        58%, 100% { box-shadow: 0 0 0 0 rgba(29, 161, 242, 0); }
      }

      /* Step 3: 52-72% of 10s cycle */
      @keyframes pulseMoney3 {
        0%, 52% { transform: scale(1); opacity: 0.5; }
        55% { transform: scale(1.15); opacity: 1; }
        58% { transform: scale(1); opacity: 1; }
        61% { transform: scale(1.1); opacity: 1; }
        64% { transform: scale(1); opacity: 1; }
        67% { transform: scale(1.05); opacity: 1; }
        72%, 100% { transform: scale(1); opacity: 0.7; }
      }
      @keyframes iconGlow3 {
        0%, 52% { box-shadow: 0 0 0 0 rgba(19, 236, 164, 0); }
        55%, 67% { box-shadow: 0 0 8px 2px rgba(19, 236, 164, 0.5); }
        72%, 100% { box-shadow: 0 0 0 0 rgba(19, 236, 164, 0); }
      }

      /* Flying money animation: 60-72% - flies left to pie chart */
      @keyframes flyMoney {
        0%, 60% {
          opacity: 0;
          transform: translateX(0) translateY(0) scale(1);
        }
        62% {
          opacity: 1;
          transform: translateX(0) translateY(0) scale(1);
        }
        69% {
          opacity: 1;
          transform: translateX(-350px) translateY(-150px) scale(0.7);
        }
        72% {
          opacity: 0;
          transform: translateX(-380px) translateY(-160px) scale(0.5);
        }
        100% {
          opacity: 0;
          transform: translateX(-380px) translateY(-160px) scale(0.5);
        }
      }

      /* Twitter slice pulse when money lands: 69-77% */
      @keyframes twitterPulse {
        0%, 69% {
          filter: brightness(1);
          transform: scale(1);
        }
        72% {
          filter: brightness(1.5);
          transform: scale(1.02);
        }
        75% {
          filter: brightness(1.2);
          transform: scale(1);
        }
        77%, 100% {
          filter: brightness(1);
          transform: scale(1);
        }
      }

      /* Twitter $1480 - visible until money lands at 72%, then hidden for rest of cycle */
      @keyframes dollarOld {
        0%, 73% { opacity: 1; }
        75%, 100% { opacity: 0; }
      }

      /* Twitter $1528 - shows at 75%, stays visible until 100% (~2.5s visibility) */
      @keyframes dollarNew {
        0%, 73% { opacity: 0; }
        75% { opacity: 1; transform: scale(1.15); }
        78% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 1; transform: scale(1); }
      }
    `}</style>
  );
}

// Step 1 Diagram: Create Your Rackr Smart Link
// Total cycle: 8s (Step1: 0-30%, Step2: 30-60%, Step3: 65-85%, pause: 85-100%)
function Step1Diagram() {
  return (
    <div className="bg-[#1c2e28]/50 rounded-lg p-3 border border-[#283933]">
      {/* Platform icons with animated cursor */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button className="w-8 h-8 rounded-lg bg-[#1DA1F2]/30 border border-[#1DA1F2] flex items-center justify-center text-[#1DA1F2] text-sm font-bold animate-[iconPulse1_10s_ease-in-out_infinite]">𝕏</button>
          {/* Animated cursor */}
          <span className="absolute -right-1 -bottom-1 text-white text-sm animate-[cursorClick1_10s_ease-in-out_infinite]">👆</span>
        </div>
        <button className="w-8 h-8 rounded-lg bg-pink-500/30 border border-pink-500 flex items-center justify-center text-pink-400 text-sm">📷</button>
        <button className="w-8 h-8 rounded-lg bg-red-500/30 border border-red-500 flex items-center justify-center text-red-400 text-sm">▶</button>
        {/* Copied link result */}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-[#13eca4] text-sm animate-[fadeIn1_10s_ease-in-out_infinite]">→</span>
          <span className="text-[11px] text-[#13eca4] font-mono animate-[fadeIn1_10s_ease-in-out_infinite]">rackr.co/notion-123</span>
          <span className="text-[10px] text-white/50 animate-[fadeIn1_10s_ease-in-out_infinite]">copied!</span>
        </div>
      </div>
    </div>
  );
}

// Step 2 Diagram: Create Your Post
// Plays during 30-60% of 8s cycle
function Step2Diagram() {
  return (
    <div className="bg-[#1c2e28]/50 rounded-lg p-3 border border-[#283933]">
      {/* Post with link being pasted */}
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-[#1DA1F2]/20 border border-[#1DA1F2]/50 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] text-[#1DA1F2]">𝕏</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-[#10221c] rounded-lg p-2.5 border border-white/10 relative">
            <p className="text-[11px] text-white leading-relaxed">
              Just dropped my Notion template and it&apos;s amazing!
            </p>
            <div className="relative mt-1.5">
              <p className="text-[11px] text-[#13eca4] overflow-hidden">
                <span className="inline-block animate-[typeLink2_10s_ease-in-out_infinite]">rackr.co/notion-123</span>
              </p>
              {/* Hand cursor that clicks to paste */}
              <span className="absolute -left-1 -top-1 text-sm animate-[cursorPaste2_10s_ease-in-out_infinite]">👆</span>
            </div>
          </div>
          <div className="relative inline-block">
            <button className="mt-2 px-3 py-1.5 rounded-lg bg-[#1DA1F2] text-white text-[10px] font-bold animate-[buttonPulse2_10s_ease-in-out_infinite]">
              Post
            </button>
            {/* Hand cursor that clicks Post button */}
            <span className="absolute -right-2 -top-1 text-sm animate-[cursorPost2_10s_ease-in-out_infinite]">👆</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3 Diagram: Revenue attribution
// Plays during 65-85% of 8s cycle
function Step3Diagram() {
  return (
    <div className="bg-[#1c2e28]/50 rounded-lg p-3 border border-[#13eca4]/30 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#13eca4]/20 flex items-center justify-center animate-[iconGlow3_10s_ease-in-out_infinite]">
            <DollarSign className="w-3 h-3 text-[#13eca4]" />
          </div>
          <div>
            <p className="text-[10px] text-white">Sale from Twitter</p>
            <p className="text-sm font-bold text-[#13eca4] animate-[pulseMoney3_10s_ease-in-out_infinite]">+$47.99</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/40">Notion Template</p>
          <p className="text-[10px] text-white/40">2m ago</p>
        </div>
      </div>
      {/* Flying money starts here - this is the source */}
      <div className="step3-money-source absolute left-12 top-6" />
    </div>
  );
}

// Animated Landing Page Pie Chart with dollar amounts
function AnimatedPieChart() {
  const sources = [
    { platform: "Twitter", dollars: 1480, color: "#1DA1F2", icon: "𝕏" },
    { platform: "YouTube", dollars: 797, color: "#FF0000", icon: "▶" },
    { platform: "TikTok", dollars: 228, color: "#ffffff", icon: "♪" },
    { platform: "Instagram", dollars: 342, color: "#E4405F", icon: "📷" },
  ];

  const total = sources.reduce((sum, s) => sum + s.dollars, 0);

  // Calculate percentages for the pie
  const sourcesWithPercent = sources.map(s => ({
    ...s,
    percentage: (s.dollars / total) * 100
  }));

  // Generate conic gradient
  let currentAngle = 0;
  const stops: string[] = [];
  sourcesWithPercent.forEach((source) => {
    const startAngle = currentAngle;
    const endAngle = currentAngle + source.percentage;
    stops.push(`${source.color} ${startAngle}% ${endAngle}%`);
    currentAngle = endAngle;
  });
  const gradient = `conic-gradient(${stops.join(", ")})`;

  // Calculate label positions
  const getLabelPosition = (index: number) => {
    let cumulativePercent = 0;
    for (let i = 0; i < index; i++) {
      cumulativePercent += sourcesWithPercent[i].percentage;
    }
    const midPercent = cumulativePercent + sourcesWithPercent[index].percentage / 2;
    const angle = (midPercent / 100) * 360 - 90;
    const radius = 170;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { x, y, isLeft: x < 0 };
  };

  return (
    <div className="w-full rounded-xl bg-[#0a0a0a] p-6 sm:p-8">
      {/* Pie Chart Container */}
      <div className="hidden sm:flex relative justify-center items-center min-h-[400px]">
        {/* External Labels with dollar amounts */}
        {sourcesWithPercent.map((source, index) => {
          const pos = getLabelPosition(index);
          const isTwitter = source.platform === "Twitter";

          return (
            <div
              key={`label-${source.platform}`}
              className="absolute whitespace-nowrap"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              }}
            >
              <div className={`flex flex-col ${pos.isLeft ? 'items-end text-right' : 'items-start text-left'}`}>
                <span className="text-white/80 text-sm font-medium">{source.platform}</span>
                {isTwitter ? (
                  <span
                    className="font-black text-xl relative inline-block"
                    style={{ color: source.color }}
                  >
                    {/* $1,480 - shows most of time, hides when money lands */}
                    <span className="inline-block animate-[dollarOld_10s_linear_infinite]">$1,480</span>
                    {/* $1,528 - hidden, shows briefly when money lands */}
                    <span className="absolute left-0 top-0 inline-block animate-[dollarNew_10s_linear_infinite] text-[#13eca4]">$1,528</span>
                  </span>
                ) : (
                  <span className="font-black text-xl" style={{ color: source.color }}>
                    ${source.dollars.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Pie Chart */}
        <div
          className="rounded-full relative animate-[twitterPulse_10s_ease-in-out_infinite]"
          style={{
            width: 260,
            height: 260,
            background: gradient,
            boxShadow: '0 0 80px rgba(19, 236, 164, 0.15)'
          }}
        >
          {/* Inner circle */}
          <div
            className="absolute rounded-full bg-[#0a0a0a] flex items-center justify-center"
            style={{
              width: 160,
              height: 160,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-32 h-32 rounded-full bg-[#1c2e28] flex items-center justify-center">
              <span className="text-4xl font-bold text-white/60">U</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile version - simplified */}
      <div className="sm:hidden flex flex-col items-center gap-4">
        <div
          className="w-48 h-48 rounded-full relative"
          style={{ background: gradient }}
        >
          <div className="absolute inset-10 rounded-full bg-[#0a0a0a] flex items-center justify-center">
            <span className="text-2xl font-bold text-white/60">U</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          {sources.map((source) => (
            <div key={source.platform} className="flex items-center gap-2 p-2 rounded bg-[#111]/50">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
              <span className="text-xs text-white/70">{source.platform}</span>
              <span className="text-xs font-bold" style={{ color: source.color }}>${source.dollars}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitlistCount] = useState(247);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#10221c] font-sans text-white">
      {/* Global Animation Styles */}
      <AnimationStyles />
      {/* Live Notification Banner */}
      <LiveNotificationBanner />

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
                Rackr
              </h2>
            </div>
            <div className="hidden items-center gap-9 md:flex">
              <Link href="#how-it-works" className="text-white/80 hover:text-white text-sm font-medium leading-normal transition-colors">How it Works</Link>
              <Link href="#features" className="text-white/80 hover:text-white text-sm font-medium leading-normal transition-colors">Features</Link>
              <Link href="#pricing" className="text-white/80 hover:text-white text-sm font-medium leading-normal transition-colors">Pricing</Link>
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
              <div className="inline-flex items-center gap-2 rounded-full bg-[#13eca4]/10 border border-[#13eca4]/30 px-4 py-1.5 mb-6">
                <Zap className="w-4 h-4 text-[#13eca4]" />
                <span className="text-sm text-[#13eca4] font-medium">Now in Early Access</span>
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tighter text-white sm:text-5xl md:text-6xl">
                <span className="text-[#13eca4]">Post Smarter.</span>
              </h1>
              <h2 className="mt-4 text-base font-normal leading-normal text-white/70 sm:text-lg max-w-xl mx-auto">
                Rackr&apos;s Smart Links show exactly which post made each sale.
              </h2>

              {/* Waitlist Signup */}
              <div className="mt-8 mx-auto max-w-md">
                {status === "success" ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-[#13eca4]/20 border border-[#13eca4]/50 p-4">
                    <CheckCircle className="w-5 h-5 text-[#13eca4]" />
                    <p className="text-[#13eca4] font-medium">You&apos;re on the list! We&apos;ll be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="flex-1 h-12 px-4 rounded-lg bg-[#1c2e28] border border-[#283933] text-white placeholder:text-white/40 focus:outline-none focus:border-[#13eca4] focus:ring-1 focus:ring-[#13eca4] transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-[#13eca4] text-[#10221c] font-bold tracking-[0.015em] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(19,236,164,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {status === "loading" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>Join Waitlist <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>
                )}
                {status === "error" && (
                  <p className="mt-2 text-red-400 text-sm text-center">Something went wrong. Please try again.</p>
                )}
                <p className="mt-4 text-sm text-white/50 text-center">
                  {waitlistCount.toLocaleString()}+ creators already on the waitlist
                </p>
              </div>
            </div>

          </main>

          {/* Pie Chart + How It Works - Combined Card */}
          <section id="how-it-works" className="py-16 md:py-24 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-[#0a0a0a] rounded-2xl p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto">
              {/* Aligned Titles Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-6">
                {/* Left Title: YOUR BRAND / REVENUE BY PLATFORM */}
                <div className="text-center">
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase">Your Brand</h2>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#13eca4] tracking-tight uppercase whitespace-nowrap">Revenue by Platform</h3>
                </div>

                {/* Right Title: RACKR.CO / HOW SMART LINKS WORK */}
                <div className="text-center">
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase">Rackr.co</h2>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#13eca4] tracking-tight uppercase">How Smart Links Work</h3>
                </div>
              </div>

              {/* Content Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start relative">
                {/* Left: Animated Pie Chart with dollar amounts */}
                <div className="flex justify-center">
                  <AnimatedPieChart />
                </div>

                {/* Right: How It Works Steps */}
                <div className="space-y-4 text-left relative">
                  {/* Flying Money Animation - starts from Step 3 area */}
                  <div className="hidden lg:block absolute z-10 left-[15%] bottom-[8%] animate-[flyMoney_10s_ease-in-out_infinite]">
                    <div className="bg-[#13eca4] text-[#10221c] px-3 py-1.5 rounded-full font-bold text-sm shadow-lg shadow-[#13eca4]/50">
                      +$47.99
                    </div>
                  </div>
                  <HowItWorksStep
                    step={1}
                    title="Create Your Rackr Smart Link"
                    description="One click to copy your unique tracking link."
                    icon={Link2}
                    diagram={<Step1Diagram />}
                  />
                  <HowItWorksStep
                    step={2}
                    title="Create Your Post"
                    description="On your platform of choice, write your post and paste your link."
                    icon={TrendingUp}
                    diagram={<Step2Diagram />}
                  />
                  <HowItWorksStep
                    step={3}
                    title="See Your Revenue"
                    description="Connect Stripe and know exactly which post links to each sale."
                    icon={DollarSign}
                    diagram={<Step3Diagram />}
                    isLast
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Built for Creators</h2>
              <p className="mt-4 text-white/60">Everything you need to turn content into revenue</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-6 lg:col-span-2 hover:border-[#13eca4]/30 transition-colors">
                <h3 className="text-xl font-bold leading-tight tracking-tight text-white">
                  One Link Per Post.
                </h3>
                <p className="text-sm text-white/60">
                  Every post gets its own link. We track each click from post to payment so you know exactly what is converting.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Quick Create Flow */}
                  <div className="rounded-lg border border-white/10 bg-[#10221c] p-4">
                    <p className="text-xs text-white/40 mb-3">Create in seconds</p>
                    <div className="space-y-3">
                      {/* Platform Presets */}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <button className="w-8 h-8 rounded-lg bg-[#1DA1F2]/20 border border-[#1DA1F2]/50 flex items-center justify-center text-[#1DA1F2] text-xs">𝕏</button>
                          <button className="w-8 h-8 rounded-lg bg-[#283933] border border-white/10 flex items-center justify-center text-red-500 text-xs">▶</button>
                          <button className="w-8 h-8 rounded-lg bg-[#283933] border border-white/10 flex items-center justify-center text-pink-500 text-xs">📷</button>
                          <button className="w-8 h-8 rounded-lg bg-[#283933] border border-white/10 flex items-center justify-center text-white text-xs">🎵</button>
                        </div>
                        <span className="text-[10px] text-white/40">← tap platform</span>
                      </div>
                      {/* Auto-generated link */}
                      <div className="flex items-center gap-2 rounded bg-[#283933] p-2">
                        <span className="text-[#1DA1F2] text-xs">𝕏</span>
                        <span className="text-white font-mono text-xs">rackr.co/notion-Nov30-2pm</span>
                      </div>
                      {/* Copy button */}
                      <button className="w-full py-2 rounded-lg bg-[#13eca4] text-[#10221c] text-xs font-bold flex items-center justify-center gap-1.5">
                        <span>✓</span> Copied to clipboard!
                      </button>
                    </div>
                  </div>
                  {/* Result: Know what works */}
                  <div className="rounded-lg border border-[#13eca4]/30 bg-[#13eca4]/5 p-4">
                    <p className="text-xs text-[#13eca4] mb-3">Know exactly what works</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between py-1 border-b border-white/5">
                        <span className="text-white/80 text-xs">Nov30-2pm tweet</span>
                        <span className="text-[#13eca4] font-bold text-xs">$127</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-white/5">
                        <span className="text-white/80 text-xs">Nov29-9am reel</span>
                        <span className="text-[#13eca4] font-bold text-xs">$89</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-white/5">
                        <span className="text-white/80 text-xs">Nov28-6pm story</span>
                        <span className="text-[#13eca4] font-bold text-xs">$43</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-white/80 text-xs">Nov27-12pm tiktok</span>
                        <span className="text-[#13eca4] font-bold text-xs">$67</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 - Geo Routing */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-6 hover:border-[#13eca4]/30 transition-colors">
                <h3 className="text-xl font-bold leading-tight tracking-tight text-white">
                  Geo Routing
                </h3>
                <p className="text-sm text-white/60">
                  Send visitors to the right Amazon store. US clicks → amazon.com, UK → amazon.co.uk. Maximize affiliate commissions.
                </p>
                <div className="mt-4 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-3">🌍</div>
                    <div className="space-y-1 text-sm">
                      <p className="text-white/60">🇺🇸 → amazon.com</p>
                      <p className="text-white/60">🇬🇧 → amazon.co.uk</p>
                      <p className="text-white/60">🇩🇪 → amazon.de</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3 - AI Insights */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-6 hover:border-[#13eca4]/30 transition-colors">
                <h3 className="text-xl font-bold leading-tight tracking-tight text-white">
                  AI-Powered Insights
                </h3>
                <p className="text-sm text-white/60">
                  Learn the best times to post, which platforms convert best for your niche, and get personalized recommendations.
                </p>
                <div className="mt-4 flex-grow bg-gradient-to-br from-[#1c2e28] to-[#283933] rounded-lg p-4">
                  <p className="text-xs text-[#13eca4] mb-2">💡 Insight</p>
                  <p className="text-sm text-white/80">&quot;Your Tuesday tweets convert 3x better than weekends. Consider posting product links mid-week.&quot;</p>
                </div>
              </div>

              {/* Feature 4 - Real-time */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-6 lg:col-span-2 hover:border-[#13eca4]/30 transition-colors">
                <h3 className="text-xl font-bold leading-tight tracking-tight text-white">
                  Real-time Everything
                </h3>
                <p className="text-sm text-white/60">
                  Watch clicks flow in as your content goes viral. Get instant notifications when sales are attributed.
                </p>
                <div className="mt-4 bg-[#10221c] rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13eca4] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#13eca4]"></span>
                    </span>
                    <span>Live activity</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                      <span className="text-white/80">Click from 🇺🇸 San Francisco</span>
                      <span className="text-white/40">just now</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                      <span className="text-[#13eca4] font-medium">Sale attributed: $47.99</span>
                      <span className="text-white/40">2m ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-2">
                      <span className="text-white/80">Click from 🇬🇧 London</span>
                      <span className="text-white/40">5m ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="py-16 text-center md:py-24">
            <div className="mx-auto mb-12 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Simple Pricing</h2>
              <p className="mt-4 text-white/60">Start free. Upgrade when you&apos;re ready to see the money.</p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Hustler - Free */}
              <div className="flex flex-col rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-8 text-left hover:border-white/20 transition-colors">
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

              {/* Creator - $15/mo */}
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
                    <span className="text-[#13eca4]">✓</span> <strong className="text-white">Revenue attribution</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#13eca4]">✓</span> <strong className="text-white">Geo routing for affiliates</strong>
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
                    <span className="truncate">Get Creator</span>
                  </button>
                </Link>
              </div>

              {/* Pro - $49/mo */}
              <div className="flex flex-col rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-8 text-left hover:border-white/20 transition-colors">
                <h3 className="text-lg font-semibold text-white">Pro</h3>
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
                <a href="mailto:hello@rackr.co?subject=Pro Plan Inquiry">
                  <button className="mt-8 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#283933] text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-[#3b544b]">
                    <span className="truncate">Contact Sales</span>
                  </button>
                </a>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-16 md:py-24">
            <div className="rounded-2xl border border-[#13eca4]/30 bg-gradient-to-br from-[#13eca4]/10 to-transparent p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                Ready to know what works?
              </h2>
              <p className="text-white/60 mb-8 max-w-xl mx-auto">
                Join {waitlistCount.toLocaleString()}+ creators who are tired of guessing which content drives revenue.
              </p>
              <div className="max-w-md mx-auto">
                {status === "success" ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-[#13eca4]/20 border border-[#13eca4]/50 p-4">
                    <CheckCircle className="w-5 h-5 text-[#13eca4]" />
                    <p className="text-[#13eca4] font-medium">You&apos;re on the list!</p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="flex-1 h-12 px-4 rounded-lg bg-[#1c2e28] border border-[#283933] text-white placeholder:text-white/40 focus:outline-none focus:border-[#13eca4] focus:ring-1 focus:ring-[#13eca4] transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-[#13eca4] text-[#10221c] font-bold tracking-[0.015em] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(19,236,164,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {status === "loading" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>Join Waitlist <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

          <footer className="border-t border-solid border-[#283933] py-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-2">
                <div className="size-5 text-[#13eca4]">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
                <span className="text-sm text-white/60">Rackr © 2024</span>
              </div>
              <div className="flex items-center gap-6">
                <Link href="#" className="text-sm text-white/60 transition-colors hover:text-white">Privacy</Link>
                <Link href="#" className="text-sm text-white/60 transition-colors hover:text-white">Terms</Link>
                <Link href="/sign-in" className="text-sm text-white/60 transition-colors hover:text-white">Login</Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
