/**
 * PRODUCTS DASHBOARD PAGE
 *
 * Manage products and generate per-post tracking links.
 * Click any platform button to instantly create a unique link.
 */
"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { CreateProductModal } from "@/components/products/CreateProductModal";

interface SmartLink {
  id: string;
  slug: string;
  platform: string;
  linkNumber: number;
  createdAt: string;
  _count: {
    clicks: number;
  };
}

interface Product {
  id: string;
  name: string;
  shortCode: string;
  destinationUrl: string;
  routerType: string;
  active: boolean;
  createdAt: string;
  links: SmartLink[];
  totalClicks: number;
  platformCounts: Record<string, number>;
  _count: {
    links: number;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductCreated = (product: Product) => {
    // Add the new product with default values for computed fields
    const newProduct = {
      ...product,
      links: [],
      totalClicks: 0,
      platformCounts: {},
      _count: { links: 0 },
    };
    setProducts([newProduct, ...products]);
  };

  const handleLinkGenerated = (product: Product, link: any) => {
    // Update the product in the list with the new link
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== product.id) return p;

        // Add the new link to the product
        const newLinks = [
          {
            ...link,
            _count: { clicks: 0 },
          },
          ...p.links,
        ];

        // Update platform counts
        const newPlatformCounts = { ...p.platformCounts };
        newPlatformCounts[link.platform] = (newPlatformCounts[link.platform] || 0) + 1;

        return {
          ...p,
          links: newLinks,
          platformCounts: newPlatformCounts,
          _count: { links: p._count.links + 1 },
        };
      })
    );
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-muted-foreground">
              Create products and generate unique links for each platform post
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {/* Stats Summary */}
        {products.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border bg-card">
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <p className="text-sm text-muted-foreground">Total Links</p>
              <p className="text-2xl font-bold">
                {products.reduce((sum, p) => sum + p._count.links, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="text-2xl font-bold">
                {products.reduce((sum, p) => sum + p.totalClicks, 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Products List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-card">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Create your first product to start generating unique tracking links
              for each platform post.
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onLinkGenerated={handleLinkGenerated}
              />
            ))}
          </div>
        )}

        {/* How It Works */}
        {products.length > 0 && (
          <div className="p-4 rounded-xl bg-muted/30 border">
            <h3 className="font-medium mb-2">How Per-Post Tracking Works</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Click a platform button to generate a unique link</li>
              <li>The link is automatically copied to your clipboard</li>
              <li>Paste it in your social media post</li>
              <li>Each post gets a unique slug (e.g., product-tw-001, product-tw-002)</li>
              <li>Track exactly which post drove each sale</li>
            </ol>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProductCreated}
      />
    </div>
  );
}
