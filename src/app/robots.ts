/**
 * robots.txt configuration
 * Country-aware SEO for CA and US
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carly.build';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/cars/',
          '/browse',
          '/marketplace',
          '/meet-carly',
          '/how-carly-works',
          '/trust-and-safety',
          '/carly-verified',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dealer/',
          '/buyer/inquiries',
          '/tempobook/',
          '/auth/',
        ],
          '/*?*', // Disallow query parameters (filter states)
          '/tempobook/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
