"use client";

import { useState } from "react";
import { User, Mail, Globe, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHORT_DOMAIN } from "@/lib/config";

// TODO: Get from Clerk user context
const MOCK_USER = {
  name: "Creator",
  email: "creator@example.com",
  username: "creator123",
  bio: "",
  website: "",
  avatarUrl: null,
};

export default function ProfileSettingsPage() {
  const [formData, setFormData] = useState({
    name: MOCK_USER.name,
    username: MOCK_USER.username,
    bio: MOCK_USER.bio,
    website: MOCK_USER.website,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement actual save to Clerk/database
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Profile Picture */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold mb-4">Profile Picture</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold">
              {formData.name[0]?.toUpperCase() || "U"}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#13eca4] text-[#0a0a0a] flex items-center justify-center hover:bg-[#0fd492] transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <p className="text-sm text-white/60 mb-2">
              Upload a profile picture. JPG, PNG or GIF. Max 2MB.
            </p>
            <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
              Upload Image
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#13eca4]/50"
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">@</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#13eca4]/50"
                placeholder="username"
              />
            </div>
            <p className="text-xs text-white/40 mt-1">{SHORT_DOMAIN}/@{formData.username || "username"}</p>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#13eca4]/50 resize-none"
              rows={3}
              placeholder="Tell us about yourself..."
              maxLength={160}
            />
            <p className="text-xs text-white/40 mt-1">{formData.bio.length}/160 characters</p>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#13eca4]/50"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Email (Read-only from Clerk) */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold mb-4">Email Address</h2>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="email"
            value={MOCK_USER.email}
            disabled
            className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2.5 text-white/60 cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-white/40 mt-2">
          Email is managed through your authentication provider
        </p>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          {saveSuccess && (
            <span className="text-sm text-[#13eca4]">Changes saved successfully!</span>
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
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-white/60 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10">
          Delete Account
        </Button>
      </div>
    </div>
  );
}
