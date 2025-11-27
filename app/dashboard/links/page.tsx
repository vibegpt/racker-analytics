/**
 * LINKS DASHBOARD PAGE
 * 
 * View all smart links, create new ones, and see geo routing stats.
 */
"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Link2,
  Globe,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Trash2,
  Edit,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateLinkModal } from "@/components/links/CreateLinkModal";
import { cn } from "@/lib/utils";

interface SmartLink {
  id: string;
  slug: string;
  originalUrl: string;
  platform: string;
  routerType: string;
  routerConfig: any;
  active: boolean;
  createdAt: string;
  _count: {
    clicks: number;
    attributions: number;
  };
}

export default function LinksPage() {
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const shortDomain = "rackr.co";

  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/links");
      const data = await response.json();
      if (response.ok) {
        setLinks(data.links);
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCopy = async (slug: string, id: string) => {
    try {
      await navigator.clipboard.writeText(`https://${shortDomain}/${slug}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = `https://${shortDomain}/${slug}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to archive this link?")) return;

    try {
      const response = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (response.ok) {
        setLinks(links.filter((l) => l.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete link:", error);
    }
    setOpenMenuId(null);
  };

  const handleEdit = (link: SmartLink) => {
    setEditingLink({
      id: link.id,
      slug: link.slug,
      originalUrl: link.originalUrl,
      platform: link.platform,
      routerType: link.routerType,
      geoRoutes: link.routerConfig?.routes || [],
    });
    setShowCreateModal(true);
    setOpenMenuId(null);
  };

  const handleLinkCreated = (link: SmartLink) => {
    if (editingLink) {
      setLinks(links.map((l) => (l.id === link.id ? link : l)));
      setEditingLink(null);
    } else {
      setLinks([link, ...links]);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingLink(null);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "TWITTER":
        return "bg-black";
      case "YOUTUBE":
        return "bg-red-500";
      case "INSTAGRAM":
        return "bg-pink-500";
      case "NEWSLETTER":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Smart Links</h1>
            <p className="text-muted-foreground">
              Create and manage trackable links with geo routing
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Link
          </Button>
        </div>

        {/* Stats Summary */}
        {links.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-card">
              <p className="text-sm text-muted-foreground">Total Links</p>
              <p className="text-2xl font-bold">{links.length}</p>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="text-2xl font-bold">
                {links.reduce((sum, l) => sum + l._count.clicks, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">
                {links.reduce((sum, l) => sum + l._count.attributions, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <p className="text-sm text-muted-foreground">Geo Routed</p>
              <p className="text-2xl font-bold">
                {links.filter((l) => l.routerType === "GEO_AFFILIATE").length}
              </p>
            </div>
          </div>
        )}

        {/* Links List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-card">
            <Link2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No links yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first smart link to start tracking
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="p-4 rounded-xl border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Platform Badge */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                      getPlatformColor(link.platform)
                    )}
                  >
                    <Link2 className="w-5 h-5" />
                  </div>

                  {/* Link Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-medium">
                        {shortDomain}/{link.slug}
                      </code>
                      <button
                        onClick={() => handleCopy(link.slug, link.id)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {copiedId === link.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                      {link.routerType === "GEO_AFFILIATE" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                          <Globe className="w-3 h-3" />
                          Geo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {link.originalUrl}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{link._count.clicks.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{link._count.attributions}</p>
                      <p className="text-xs text-muted-foreground">Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">
                        {link._count.clicks > 0
                          ? ((link._count.attributions / link._count.clicks) * 100).toFixed(1)
                          : "0"}%
                      </p>
                      <p className="text-xs text-muted-foreground">Conv.</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === link.id ? null : link.id)}
                      className="p-2 hover:bg-muted rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuId === link.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 py-1 bg-popover border rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleEdit(link)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <a
                          href={`/api/links/${link.id}`}
                          target="_blank"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          View Stats
                        </a>
                        <a
                          href={`https://${shortDomain}/${link.slug}`}
                          target="_blank"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Link
                        </a>
                        <hr className="my-1" />
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Geo Routes Preview */}
                {link.routerType === "GEO_AFFILIATE" && link.routerConfig?.routes && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="w-3 h-3" />
                    <span>Routes to:</span>
                    {link.routerConfig.routes.slice(0, 5).map((route: any, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-muted font-mono"
                      >
                        {route.country}
                      </span>
                    ))}
                    {link.routerConfig.routes.length > 5 && (
                      <span>+{link.routerConfig.routes.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CreateLinkModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={handleLinkCreated}
        editLink={editingLink}
      />
    </div>
  );
}
