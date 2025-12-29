'use client';

import { useEffect, useState } from 'react';

interface DashboardOverview {
  listingCounts: {
    active: number;
    draft: number;
    sold: number;
    total: number;
  };
  analytics: {
    views: number;
    saves: number;
    inquiries: number;
    conversionRate: number;
  };
  inquirySla: {
    openInquiries: number;
    totalInquiries: number;
    responseRate: number;
    avgResponseTimeMinutes: number;
  };
  topListings: Array<{
    id: string;
    title: string;
    price: number;
    views: number;
    inquiries: number;
    totalEngagement: number;
    conversionRate: string;
  }>;
}

export default function DealerDashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchDashboard();
  }, [days]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dealer/dashboard/overview?days=${days}`);
      const data = await res.json();
      setOverview(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">Error loading dashboard</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dealer Dashboard</h1>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="border rounded px-4 py-2"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Listing Counts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-white shadow">
          <div className="text-gray-600 text-sm mb-1">Active Listings</div>
          <div className="text-3xl font-bold text-green-600">
            {overview.listingCounts.active}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow">
          <div className="text-gray-600 text-sm mb-1">Draft Listings</div>
          <div className="text-3xl font-bold text-yellow-600">
            {overview.listingCounts.draft}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow">
          <div className="text-gray-600 text-sm mb-1">Sold Listings</div>
          <div className="text-3xl font-bold text-blue-600">
            {overview.listingCounts.sold}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow">
          <div className="text-gray-600 text-sm mb-1">Total Listings</div>
          <div className="text-3xl font-bold">{overview.listingCounts.total}</div>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-white shadow">
          <div className="text-gray-600 text-sm mb-1">Total Views</div>
          <div className="text-3xl font-bold">{overview.analytics.views.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow">
          <div className="text-gray-600 text-sm mb-1">Total Saves</div>
          <div className="text-3xl font-bold">{overview.analytics.saves.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow">
          <div className="text-gray-600 text-sm mb-1">Total Inquiries</div>
          <div className="text-3xl font-bold">{overview.analytics.inquiries.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow">
          <div className="text-gray-600 text-sm mb-1">Conversion Rate</div>
          <div className="text-3xl font-bold text-green-600">
            {overview.analytics.conversionRate.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Inquiry SLA */}
      <div className="bg-white border rounded-lg p-6 mb-8 shadow">
        <h2 className="text-xl font-semibold mb-4">Inquiry Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-gray-600 text-sm mb-1">Open Inquiries</div>
            <div className="text-2xl font-bold text-orange-600">
              {overview.inquirySla.openInquiries}
            </div>
          </div>
          <div>
            <div className="text-gray-600 text-sm mb-1">Total Inquiries</div>
            <div className="text-2xl font-bold">
              {overview.inquirySla.totalInquiries}
            </div>
          </div>
          <div>
            <div className="text-gray-600 text-sm mb-1">Response Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {overview.inquirySla.responseRate.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-gray-600 text-sm mb-1">Avg Response Time</div>
            <div className="text-2xl font-bold">
              {overview.inquirySla.avgResponseTimeMinutes} min
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Listings */}
      <div className="bg-white border rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Top Performing Listings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Listing</th>
                <th className="text-right py-2 px-4">Price</th>
                <th className="text-right py-2 px-4">Views</th>
                <th className="text-right py-2 px-4">Inquiries</th>
                <th className="text-right py-2 px-4">Engagement</th>
                <th className="text-right py-2 px-4">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {overview.topListings.map((listing) => (
                <tr key={listing.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{listing.title}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    ${listing.price.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">{listing.views}</td>
                  <td className="py-3 px-4 text-right">{listing.inquiries}</td>
                  <td className="py-3 px-4 text-right">
                    {listing.totalEngagement.toFixed(0)}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600 font-semibold">
                    {listing.conversionRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
