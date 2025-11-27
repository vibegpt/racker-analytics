"use client";

import { useState } from "react";
import {
  BookOpen,
  Link2,
  Globe,
  CreditCard,
  BarChart3,
  CheckCircle2,
  Circle,
  ChevronRight,
  Play,
  ExternalLink,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

// TODO: Get actual completion status from user data
const INITIAL_CHECKLIST = [
  { id: "create_link", label: "Create your first smart link", completed: false },
  { id: "share_link", label: "Share a link on social media", completed: false },
  { id: "view_analytics", label: "View click analytics", completed: false },
  { id: "connect_stripe", label: "Connect Stripe (optional)", completed: false },
];

interface GuideSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  steps: string[];
  cta?: {
    label: string;
    href: string;
  };
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "links",
    title: "Creating Smart Links",
    description: "Learn how to create trackable links that work everywhere",
    icon: Link2,
    steps: [
      "Go to the Links page from the sidebar",
      "Click 'Create Link' and paste your destination URL",
      "Choose a custom slug or use the auto-generated one",
      "Select the platform where you'll share this link",
      "Copy your new rackr.co link and share it",
    ],
    cta: {
      label: "Create Your First Link",
      href: "/dashboard/links",
    },
  },
  {
    id: "geo",
    title: "Geo Routing for Affiliates",
    description: "Send visitors to the right store based on their location",
    icon: Globe,
    steps: [
      "Create a new link and enable Geo Routing",
      "Add your Amazon affiliate links for each country",
      "US visitors go to amazon.com, UK to amazon.co.uk, etc.",
      "Visitors from unlisted countries go to your default link",
      "Track which countries generate the most revenue",
    ],
    cta: {
      label: "Set Up Geo Routing",
      href: "/dashboard/links",
    },
  },
  {
    id: "analytics",
    title: "Understanding Analytics",
    description: "Learn what metrics mean and how to use them",
    icon: BarChart3,
    steps: [
      "Clicks: Total times your link was clicked",
      "Unique visitors: Individual people who clicked",
      "Geo data: Where your audience is located",
      "Device breakdown: Mobile vs desktop traffic",
      "Platform performance: Which sources drive traffic",
    ],
  },
  {
    id: "revenue",
    title: "Revenue Attribution",
    description: "Connect Stripe to see which content makes you money",
    icon: CreditCard,
    steps: [
      "Go to Settings > Connected Accounts",
      "Click 'Connect' next to Stripe",
      "Authorize Racker to read your sales data",
      "Use your Racker links in content that sells products",
      "See exactly which content drives each sale",
    ],
    cta: {
      label: "Connect Stripe",
      href: "/dashboard/settings/connections",
    },
  },
  {
    id: "insights",
    title: "Using Insights",
    description: "Get AI-powered recommendations to improve performance",
    icon: Lightbulb,
    steps: [
      "Racker learns from every click across the platform",
      "See best times to post for your niche",
      "Discover which platforms work best",
      "Get personalized recommendations as you grow",
      "Compare your performance to similar creators",
    ],
    cta: {
      label: "View Insights",
      href: "/dashboard/insights",
    },
  },
];

export default function GuidePage() {
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [expandedSection, setExpandedSection] = useState<string | null>("links");

  const toggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#13eca4]" />
            Getting Started Guide
          </h1>
          <p className="text-white/60 mt-1">
            Learn how to make the most of Racker
          </p>
        </div>

        {/* Progress Checklist */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Quick Start Checklist</h2>
            <span className="text-sm text-white/60">
              {completedCount}/{checklist.length} completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-[#13eca4] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            {checklist.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-[#13eca4] shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-white/40 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    item.completed ? "text-white/60 line-through" : "text-white"
                  )}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Video Tutorial */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold mb-4">Video Tutorial</h2>
          <div className="aspect-video bg-black/50 rounded-lg flex items-center justify-center">
            <button className="w-16 h-16 rounded-full bg-[#13eca4] flex items-center justify-center hover:bg-[#0fd492] transition-colors">
              <Play className="w-6 h-6 text-[#0a0a0a] ml-1" />
            </button>
          </div>
          <p className="text-sm text-white/60 mt-3 text-center">
            Watch a 2-minute overview of Racker
          </p>
        </div>

        {/* Guide Sections */}
        <div className="space-y-4">
          <h2 className="font-semibold">Detailed Guides</h2>

          {GUIDE_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <div
                key={section.id}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedSection(isExpanded ? null : section.id)
                  }
                  className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#13eca4]/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#13eca4]" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">{section.title}</h3>
                    <p className="text-sm text-white/60">{section.description}</p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-5 h-5 text-white/40 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-4">
                    <ol className="space-y-3 mb-4">
                      {section.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-medium">
                            {i + 1}
                          </span>
                          <span className="text-white/80 pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>

                    {section.cta && (
                      <Link href={section.cta.href}>
                        <Button className="bg-[#13eca4] text-[#0a0a0a] hover:bg-[#0fd492]">
                          {section.cta.label}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tips & Best Practices */}
        <div className="rounded-xl border border-[#13eca4]/30 bg-[#13eca4]/5 p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#13eca4]" />
            Pro Tips
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm">
              <span className="text-[#13eca4]">•</span>
              <span className="text-white/80">
                Use descriptive slugs like "summer-drop" instead of random characters
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <span className="text-[#13eca4]">•</span>
              <span className="text-white/80">
                Create separate links for different platforms to see where traffic comes from
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <span className="text-[#13eca4]">•</span>
              <span className="text-white/80">
                Set up geo routing for Amazon links to capture international sales
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <span className="text-[#13eca4]">•</span>
              <span className="text-white/80">
                Check Insights weekly to learn what's working and optimize your strategy
              </span>
            </li>
          </ul>
        </div>

        {/* Help & Support */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold mb-4">Need More Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="mailto:support@racker.io"
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-white/60">support@racker.io</p>
              </div>
            </a>
            <a
              href="https://twitter.com/rackerio"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="font-medium">Twitter / X</p>
                <p className="text-sm text-white/60">@rackerio</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
