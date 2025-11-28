/**
 * CREATE PRODUCT MODAL
 *
 * Modal for creating new products (destination URL groups).
 */
"use client";

import { useState } from "react";
import {
  X,
  Package,
  Loader2,
  AlertCircle,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: any) => void;
}

export function CreateProductModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProductModalProps) {
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError("Please enter a product name");
      return;
    }

    if (!shortCode.trim()) {
      setError("Please enter a short code");
      return;
    }

    if (shortCode.length < 2 || shortCode.length > 20) {
      setError("Short code must be 2-20 characters");
      return;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(shortCode)) {
      setError("Short code can only contain letters, numbers, and hyphens");
      return;
    }

    if (!destinationUrl.trim()) {
      setError("Please enter a destination URL");
      return;
    }

    try {
      new URL(destinationUrl);
    } catch {
      setError("Please enter a valid URL (including https://)");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          shortCode: shortCode.toLowerCase().trim(),
          destinationUrl: destinationUrl.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      onSuccess(data.product);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setShortCode("");
    setDestinationUrl("");
    setDescription("");
    setError(null);
    onClose();
  };

  // Auto-generate short code from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!shortCode || shortCode === generateShortCode(name)) {
      setShortCode(generateShortCode(value));
    }
  };

  const generateShortCode = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 20);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-background border rounded-xl shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Create Product</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Name</label>
            <input
              type="text"
              placeholder="e.g., Amazon Fire Stick"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isLoading}
              className="h-11 w-full px-3 rounded-md border border-input bg-background text-sm"
            />
            <p className="text-xs text-muted-foreground">
              A friendly name to identify this product
            </p>
          </div>

          {/* Short Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Short Code</label>
            <input
              type="text"
              placeholder="e.g., fire-stick"
              value={shortCode}
              onChange={(e) =>
                setShortCode(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                )
              }
              disabled={isLoading}
              className="h-11 w-full px-3 rounded-md border border-input bg-background text-sm font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Used in link slugs: <code className="bg-muted px-1 rounded">fire-tw-001</code>, <code className="bg-muted px-1 rounded">fire-ig-002</code>
            </p>
          </div>

          {/* Destination URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination URL</label>
            <input
              type="text"
              placeholder="https://amazon.com/dp/B08..."
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              disabled={isLoading}
              className="h-11 w-full px-3 rounded-md border border-input bg-background text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Your affiliate link or product page
            </p>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              placeholder="Notes about this product..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              Once created, you can click any platform button to instantly generate
              a unique tracking link. Each link gets a sequential slug like{" "}
              <code className="bg-muted px-1 rounded text-xs">{shortCode || "code"}-tw-001</code>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Product"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
