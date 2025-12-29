"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { dealerBrandingService } from '@/lib/api/dealer-branding';
import { DealerBranding } from '@/types/dealer-branding';

interface DealerBrandingSettingsProps {
  dealerId: string;
  currentBranding?: DealerBranding | null;
}

export function DealerBrandingSettings({
  dealerId,
  currentBranding,
}: DealerBrandingSettingsProps) {
  const [branding, setBranding] = useState<DealerBranding | null>(currentBranding || null);
  const [bannerUrl, setBannerUrl] = useState(currentBranding?.bannerImage || '');
  const [logoUrl, setLogoUrl] = useState(currentBranding?.logoImage || '');
  const [brandColor, setBrandColor] = useState(currentBranding?.brandColor || '#1E40AF');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    if (!bannerUrl.trim()) {
      setError('Banner image URL is required');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await dealerBrandingService.uploadDealerBanner(
        dealerId,
        bannerUrl,
        logoUrl || undefined,
        brandColor
      );

      setBranding(result);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = () => {
    if (!branding) {
      return (
        <Badge variant="outline" className="text-neutral-600 dark:text-neutral-400">
          <AlertCircle className="w-3 h-3 mr-1" />
          No Banner
        </Badge>
      );
    }

    if (branding.approved) {
      return (
        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }

    if (branding.rejectionReason) {
      return (
        <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Pending Review
      </Badge>
    );
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
            Dealer Branding
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Upload your banner to appear on all your vehicle listings
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Banner Requirements */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Banner Requirements
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Aspect ratio: 16:3 (e.g., 800x150px)</li>
              <li>• Format: SVG or PNG with transparency</li>
              <li>• No QR codes, pricing, or promotional text</li>
              <li>• Max visual height: 10% of listing image</li>
              <li>• Banners are applied as overlays, not baked into photos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Rejection Reason */}
      {branding?.rejectionReason && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Rejected:</strong> {branding.rejectionReason}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="banner">Banner Image URL *</Label>
          <div className="flex gap-2">
            <Input
              id="banner"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://example.com/banner.png"
              className="flex-1"
            />
            {bannerUrl && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(bannerUrl, '_blank')}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            SVG or PNG with transparency recommended
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Logo Image URL (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="flex-1"
            />
            {logoUrl && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(logoUrl, '_blank')}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Brand Color</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="color"
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-20 h-10 p-1"
            />
            <Input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              placeholder="#1E40AF"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Error/Success */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            Banner uploaded successfully! It will appear on your listings after approval.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleUpload} disabled={uploading || !bannerUrl.trim()}>
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Banner
            </>
          )}
        </Button>
      </div>

      {/* Preview */}
      {branding?.bannerImage && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="relative w-full aspect-[16/3] bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
            <img
              src={branding.bannerImage}
              alt="Banner preview"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
