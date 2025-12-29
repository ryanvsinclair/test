/**
 * Server-side vehicle listing page with full SEO support
 * This page is used for SEO and redirects to the client-side listing page
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
// Mock data removed - connect to real database
import { generateListingSEO } from '@/lib/seo/listing-seo';

interface Props {
  params: {
    id: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // TODO: Connect to real database
  const vehicle = null;

  if (!vehicle) {
    return {
      title: 'Listing Not Found | Carly',
      description: 'This vehicle listing is no longer available.',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const seoData = generateListingSEO(vehicle);

  return {
    title: seoData.title,
    description: seoData.description,
    alternates: {
      canonical: seoData.canonicalUrl,
    },
    openGraph: {
      title: seoData.openGraph.title,
      description: seoData.openGraph.description,
      images: [seoData.openGraph.image],
      url: seoData.openGraph.url,
      type: 'website',
      siteName: 'Carly',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.twitter.title,
      description: seoData.twitter.description,
      images: [seoData.twitter.image],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// This is a server component that will be used for SEO
export default function ListingPage({ params }: Props) {
  // TODO: Connect to real database
  const vehicle = null;

  if (!vehicle) {
    notFound();
  }

  const seoData = generateListingSEO(vehicle);

  // Return a basic HTML structure for crawlers
  // The client component will take over for actual user interaction
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.jsonLd) }}
      />
    </>
  );
}
