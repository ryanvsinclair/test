import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace - Find Your Next Vehicle',
  description: 'Browse verified vehicles from trusted dealerships.',
};

export default async function MarketplacePage() {
  const supabase = createClient();

  // Get listings from public_listings view
  const { data: listings } = await supabase
    .from('public_listings')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(20);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Vehicles</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings?.map((listing) => {
          // Generate SEO-friendly slug
          const slug = `${listing.year}-${listing.make}-${listing.model}-${listing.dealership_city}-${listing.id}`
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

          return (
            <a
              key={listing.id}
              href={`/cars/${slug}`}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {listing.primary_image_url && (
                <img
                  src={listing.primary_image_url}
                  alt={`${listing.year} ${listing.make} ${listing.model}`}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">
                  {listing.year} {listing.make} {listing.model}
                </h2>
                <p className="text-2xl font-bold text-green-600 mb-2">
                  ${listing.price.toLocaleString()}
                </p>
                <p className="text-gray-600 text-sm">
                  {listing.mileage.toLocaleString()} km
                </p>
                <p className="text-gray-600 text-sm">
                  {listing.dealership_city}, {listing.dealership_region}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}
