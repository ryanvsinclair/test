'use client';

import { useEffect, useState } from 'react';

interface HotListing {
  id: string;
  title: string;
  price: number;
  recentViews: number;
  recentSaves: number;
  recentInquiries: number;
  uniqueBuyers: number;
  highIntentBuyers: number;
  heatScore: number;
}

export default function HotListingsPage() {
  const [hotListings, setHotListings] = useState<HotListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchHotListings();
  }, [days]);

  const fetchHotListings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dealer/dashboard/hot-listings?days=${days}&limit=20`);
      const data = await res.json();
      setHotListings(data.hotListings || []);
    } catch (error) {
      console.error('Error fetching hot listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHeatColor = (score: number) => {
    if (score >= 100) return 'bg-red-100 border-red-500 text-red-700';
    if (score >= 50) return 'bg-orange-100 border-orange-500 text-orange-700';
    if (score >= 20) return 'bg-yellow-100 border-yellow-500 text-yellow-700';
    return 'bg-gray-100 border-gray-500 text-gray-700';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hot Listings 🔥</h1>
          <p className="text-gray-600 mt-1">
            Listings with high buyer engagement and purchase intent
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="border rounded px-4 py-2"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Heat Score Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">Heat Score Formula:</h3>
        <p className="text-sm text-gray-700">
          Heat Score = (Views × 1) + (Saves × 5) + (Inquiries × 10) + (Total Engagement × 0.5)
        </p>
        <div className="flex gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-500 rounded"></div>
            <span>Very Hot (≥100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-500 rounded"></div>
            <span>Hot (50-99)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded"></div>
            <span>Warm (20-49)</span>
          </div>
        </div>
      </div>

      {/* Hot Listings */}
      {hotListings.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-gray-600">No hot listings found in the selected period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hotListings.map((listing, index) => (
            <div
              key={listing.id}
              className={`border-2 rounded-lg p-6 ${getHeatColor(listing.heatScore)}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold">#{index + 1}</span>
                    <h3 className="text-xl font-semibold">{listing.title}</h3>
                  </div>
                  <p className="text-lg font-semibold">
                    ${listing.price.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium mb-1">Heat Score</div>
                  <div className="text-3xl font-bold">{listing.heatScore.toFixed(0)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Recent Views</div>
                  <div className="text-2xl font-bold">{listing.recentViews}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Recent Saves</div>
                  <div className="text-2xl font-bold">{listing.recentSaves}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Recent Inquiries</div>
                  <div className="text-2xl font-bold">{listing.recentInquiries}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Unique Buyers</div>
                  <div className="text-2xl font-bold">{listing.uniqueBuyers}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">High Intent</div>
                  <div className="text-2xl font-bold text-green-600">
                    {listing.highIntentBuyers}
                  </div>
                </div>
              </div>

              {listing.highIntentBuyers > 0 && (
                <div className="mt-4 bg-green-50 border border-green-300 rounded p-3">
                  <p className="text-sm font-semibold text-green-800">
                    💡 Action Required: {listing.highIntentBuyers} buyer{listing.highIntentBuyers > 1 ? 's' : ''} with high purchase intent. Consider follow-up.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
