"use client";

import { useState } from "react";
import { Bell, Mail, TrendingUp, DollarSign, AlertCircle, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
}

const DEFAULT_SETTINGS: NotificationSetting[] = [
  {
    id: "weekly_report",
    title: "Weekly Reports",
    description: "Receive a summary of your link performance every Monday",
    icon: TrendingUp,
    email: true,
    push: false,
  },
  {
    id: "milestone",
    title: "Milestones",
    description: "Get notified when you reach click or revenue milestones",
    icon: Bell,
    email: true,
    push: true,
  },
  {
    id: "revenue",
    title: "Revenue Alerts",
    description: "Get notified when you make a sale through your links",
    icon: DollarSign,
    email: true,
    push: true,
  },
  {
    id: "anomaly",
    title: "Traffic Anomalies",
    description: "Alert when there's unusual activity on your links",
    icon: AlertCircle,
    email: false,
    push: true,
  },
];

export default function NotificationsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleSetting = (id: string, type: "email" | "push") => {
    setSettings(
      settings.map((s) =>
        s.id === id ? { ...s, [type]: !s[type] } : s
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement actual save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Notification Preferences */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Notification Preferences</h2>
            <p className="text-sm text-white/60 mt-0.5">
              Choose how you want to be notified
            </p>
          </div>
          <div className="flex items-center gap-8 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Push
            </div>
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {settings.map((setting) => {
            const Icon = setting.icon;
            return (
              <div
                key={setting.id}
                className="p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white/60" />
                </div>

                <div className="flex-1">
                  <h3 className="font-medium">{setting.title}</h3>
                  <p className="text-sm text-white/60">{setting.description}</p>
                </div>

                <div className="flex items-center gap-8">
                  {/* Email Toggle */}
                  <button
                    onClick={() => toggleSetting(setting.id, "email")}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative",
                      setting.email ? "bg-[#13eca4]" : "bg-white/20"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                        setting.email ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>

                  {/* Push Toggle */}
                  <button
                    onClick={() => toggleSetting(setting.id, "push")}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative",
                      setting.push ? "bg-[#13eca4]" : "bg-white/20"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                        setting.push ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Email Frequency */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold mb-4">Email Digest Frequency</h2>
        <div className="space-y-2">
          {["Daily", "Weekly", "Monthly", "Never"].map((frequency) => (
            <label
              key={frequency}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5"
            >
              <input
                type="radio"
                name="frequency"
                defaultChecked={frequency === "Weekly"}
                className="w-4 h-4 accent-[#13eca4]"
              />
              <span>{frequency}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          {saveSuccess && (
            <span className="text-sm text-[#13eca4]">Preferences saved!</span>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#13eca4] text-[#0a0a0a] hover:bg-[#0fd492]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
