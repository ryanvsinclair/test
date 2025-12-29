"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DealerBranding, BannerOverlayConfig } from '@/types/dealer-branding';
import { dealerBrandingService } from '@/lib/api/dealer-branding';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface DealerBannerOverlayProps {
  dealerId: string;
  position?: BannerOverlayConfig['position'];
  showDefault?: boolean;
}

const defaultConfig: BannerOverlayConfig = {
  position: 'bottom-right',
  padding: { x: 16, y: 16 },
  maxWidth: '200px',
  opacity: 0.95,
  fadeOnHover: true,
  clickable: true,
};

export function DealerBannerOverlay({
  dealerId,
  position = 'bottom-right',
  showDefault = true,
}: DealerBannerOverlayProps) {
  const [branding, setBranding] = useState<DealerBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    async function loadBranding() {
      try {
        const data = await dealerBrandingService.getDealerBranding(dealerId);
        // Only use branding if approved
        if (data?.approved) {
          setBranding(data);
        }
      } catch (error) {
        console.error('Failed to load dealer branding:', error);
      } finally {
        setLoading(false);
      }
    }

    loadBranding();
  }, [dealerId]);

  if (loading) {
    return null;
  }

  // No branding and no default requested
  if (!branding && !showDefault) {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  };

  const content = branding ? (
    // Custom dealer banner
    <div
      className="relative transition-opacity duration-300"
      style={{
        maxWidth: defaultConfig.maxWidth,
        opacity: isHovered && defaultConfig.fadeOnHover ? 0.8 : defaultConfig.opacity,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={branding.bannerImage!}
        alt="Dealer"
        width={200}
        height={38}
        className="w-full h-auto object-contain"
        style={{
          filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))',
        }}
      />
    </div>
  ) : (
    // Default Carly dealer badge
    <Badge
      variant="outline"
      className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-neutral-200 dark:border-neutral-800 shadow-sm transition-opacity duration-300"
      style={{
        opacity: isHovered && defaultConfig.fadeOnHover ? 0.8 : defaultConfig.opacity,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CheckCircle className="w-3 h-3 mr-1.5 text-blue-600 dark:text-blue-400" />
      <span className="text-xs font-medium text-neutral-900 dark:text-neutral-50">
        Verified Dealer
      </span>
    </Badge>
  );

  const Wrapper = defaultConfig.clickable ? Link : 'div';
  const wrapperProps = defaultConfig.clickable
    ? { href: `/dealer/${dealerId}`, className: 'cursor-pointer' }
    : {};

  return (
    <div
      className={`absolute ${positionClasses[position]} pointer-events-none`}
      style={{
        padding: `${defaultConfig.padding.y}px ${defaultConfig.padding.x}px`,
      }}
    >
      <Wrapper {...wrapperProps} className="pointer-events-auto">
        {content}
      </Wrapper>
    </div>
  );
}
