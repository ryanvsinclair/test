"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TrendingUp, TrendingDown, Eye, Heart, MessageSquare, AlertTriangle, Loader2, CalendarIcon, BarChart2, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';

interface ListingInsight {
  listingId: string;
  title?: string;
  price?: number;
  views: number;
  saves: number;
  messages: number;
  engagementScore: number;
  priceSignal?: 'at' | 'below' | 'above';
  trend?: {
    views: number;
    saves: number;
    messages: number;
  };
}

interface InsightsData {
  listings: ListingInsight[];
  totals: {
    views: number;
    saves: number;
    messages: number;
    listingCount: number;
  };
  range: {
    preset: string;
    startDate: string | null;
    endDate: string;
    days: number;
  };
}

type SortField = 'engagementScore' | 'views' | 'saves' | 'messages' | 'price';
type SortDirection = 'asc' | 'desc';

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData>({
    listings: [],
    totals: {
      views: 0,
      saves: 0,
      messages: 0,
      listingCount: 0,
    },
    range: {
      preset: '30d',
      startDate: null,
      endDate: new Date().toISOString(),
      days: 30,
    },
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [preset, setPreset] = useState<'7d' | '30d' | '60d' | '90d' | 'ytd' | 'lifetime'>('30d');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [sortField, setSortField] = useState<SortField>('engagementScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    // Render page shell immediately, fetch data after mount
    const timer = setTimeout(() => {
      async function fetchInsights() {
        setIsFetching(true);
        try {
          // TODO: Replace with actual dealerId from auth context
          const dealerId = 'dealer-001';
          
          let url = `/api/dealer/insights?dealerId=${dealerId}`;
          
          if (showCustomDate && customDateRange.from && customDateRange.to) {
            url += `&startDate=${format(customDateRange.from, 'yyyy-MM-dd')}&endDate=${format(customDateRange.to, 'yyyy-MM-dd')}`;
          } else {
            url += `&preset=${preset}`;
          }
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error('Failed to fetch insights');
          }

          const result: InsightsData = await response.json();
          setData(result);
        } catch (error) {
          console.error('Failed to load insights:', error);
          // Only set empty data on initial load error
          if (isInitialLoad) {
            setData({
              listings: [],
              totals: {
                views: 0,
                saves: 0,
                messages: 0,
                listingCount: 0,
              },
              range: {
                preset: preset,
                startDate: null,
                endDate: new Date().toISOString(),
                days: 0,
              },
            });
          }
        } finally {
          setIsFetching(false);
          setIsInitialLoad(false);
        }
      }

      fetchInsights();
    }, 0);
    return () => clearTimeout(timer);
  }, [preset, showCustomDate, customDateRange]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedListings = data.listings ? [...data.listings].sort((a, b) => {
    const aValue = a[sortField] ?? 0;
    const bValue = b[sortField] ?? 0;
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  }) : [];

  const topPerformers = sortedListings.slice(0, 5).filter(i => i.engagementScore > 0);
  const missedOpportunities = data.listings.filter(i => i.views > 50 && i.messages < 3);

  // Show initial loading state only on first load
  if (isInitialLoad && isFetching) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 dark:text-purple-400" />
          <p className="text-neutral-500 dark:text-neutral-400">Loading insights...</p>
        </div>
      </div>
    );
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />;
    if (value < 0) return <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />;
    return null;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-50">Insights</h1>
              {isFetching && (
                <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Performance metrics and demand signals</p>
          </div>
        </div>

        {/* Date Range Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {['7d', '30d', '60d', '90d', 'ytd', 'lifetime'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setShowCustomDate(false);
                  setPreset(p as typeof preset);
                }}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  !showCustomDate && preset === p
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {p === '7d' && 'Last 7 days'}
                {p === '30d' && 'Last 30 days'}
                {p === '60d' && 'Last 60 days'}
                {p === '90d' && 'Last 90 days'}
                {p === 'ytd' && 'Year to date'}
                {p === 'lifetime' && 'Lifetime'}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`justify-start text-left font-normal ${
                  showCustomDate ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30' : ''
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {showCustomDate && customDateRange.from ? (
                  customDateRange.to ? (
                    <>
                      {format(customDateRange.from, 'LLL dd, y')} - {format(customDateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(customDateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Custom range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={customDateRange.from}
                selected={{ from: customDateRange.from, to: customDateRange.to }}
                onSelect={(range) => {
                  setCustomDateRange({ from: range?.from, to: range?.to });
                  if (range?.from && range?.to) {
                    setShowCustomDate(true);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className={`grid grid-cols-4 gap-4 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-blue-600/70 dark:text-blue-400/80 text-sm mb-1">
            <Eye className="w-4 h-4" />
            Total Views
          </div>
          <p className="text-3xl font-light text-blue-900 dark:text-blue-300">{data.totals.views.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-purple-600/70 dark:text-purple-400/80 text-sm mb-1">
            <Heart className="w-4 h-4" />
            Total Saves
          </div>
          <p className="text-3xl font-light text-purple-900 dark:text-purple-300">{data.totals.saves.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-blue-600/70 dark:text-blue-400/80 text-sm mb-1">
            <MessageSquare className="w-4 h-4" />
            Total Messages
          </div>
          <p className="text-3xl font-light text-blue-900 dark:text-blue-300">{data.totals.messages.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-neutral-600/70 dark:text-neutral-400/80 text-sm mb-1">
            <BarChart2 className="w-4 h-4" />
            Active Listings
          </div>
          <p className="text-3xl font-light text-neutral-900 dark:text-neutral-50">{data.totals.listingCount}</p>
        </Card>
      </div>

      {/* Top Performing Listings */}
      {topPerformers.length > 0 && (
        <div className={`space-y-4 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-50">Top Performing Listings</h2>
            <Badge variant="outline" className="ml-2">{topPerformers.length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {topPerformers.map((insight) => (
              <Card key={insight.listingId} className="border-purple-200 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/20">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
                          {insight.title || `Listing ${insight.listingId.slice(0, 8)}`}
                        </h3>
                        {insight.priceSignal && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              insight.priceSignal === 'below' 
                                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                : insight.priceSignal === 'at'
                                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                            }`}
                          >
                            {insight.priceSignal} market
                          </Badge>
                        )}
                      </div>
                      {insight.price && (
                        <p className="text-2xl font-light text-neutral-900 dark:text-neutral-100 mt-1">
                          ${insight.price.toLocaleString()}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                          Score: {insight.engagementScore}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center gap-2 text-blue-600/70 dark:text-blue-400/80 text-sm mb-1">
                        <Eye className="w-4 h-4" />
                        Views
                        {insight.trend && getTrendIcon(insight.trend.views)}
                      </div>
                      <p className="text-2xl font-light text-blue-900 dark:text-blue-300">{insight.views.toLocaleString()}</p>
                      {insight.trend && insight.trend.views !== 0 && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {insight.trend.views > 0 ? '+' : ''}{insight.trend.views} vs previous
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-purple-600/70 dark:text-purple-400/80 text-sm mb-1">
                        <Heart className="w-4 h-4" />
                        Saves
                        {insight.trend && getTrendIcon(insight.trend.saves)}
                      </div>
                      <p className="text-2xl font-light text-purple-900 dark:text-purple-300">{insight.saves.toLocaleString()}</p>
                      {insight.trend && insight.trend.saves !== 0 && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {insight.trend.saves > 0 ? '+' : ''}{insight.trend.saves} vs previous
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-blue-600/70 dark:text-blue-400/80 text-sm mb-1">
                        <MessageSquare className="w-4 h-4" />
                        Messages
                        {insight.trend && getTrendIcon(insight.trend.messages)}
                      </div>
                      <p className="text-2xl font-light text-blue-900 dark:text-blue-300">{insight.messages.toLocaleString()}</p>
                      {insight.trend && insight.trend.messages !== 0 && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {insight.trend.messages > 0 ? '+' : ''}{insight.trend.messages} vs previous
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      <strong>Strong engagement:</strong> This listing is performing well with high buyer interest.
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Missed Opportunities */}
      {missedOpportunities.length > 0 && (
        <div className={`space-y-4 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-50">Missed Opportunities</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {missedOpportunities.map((insight) => (
              <Card key={insight.listingId} className="border-orange-200 dark:border-orange-900/40 border-l-4">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
                        Listing {insight.listingId.slice(0, 8)}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm mb-1">
                        <Eye className="w-4 h-4" />
                        Views
                      </div>
                      <p className="text-2xl font-light text-neutral-900 dark:text-neutral-50">{insight.views}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm mb-1">
                        <Heart className="w-4 h-4" />
                        Saves
                      </div>
                      <p className="text-2xl font-light text-neutral-900 dark:text-neutral-50">{insight.saves}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm mb-1">
                        <MessageSquare className="w-4 h-4" />
                        Messages
                      </div>
                      <p className="text-2xl font-light text-orange-600 dark:text-orange-400">{insight.messages}</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      <strong>Low conversion:</strong> High views but few messages. Consider reviewing photos,
                      description, or price to improve engagement.
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Listings Performance Table */}
      <div className={`space-y-4 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-50">All Listings</h2>
            <Badge variant="outline">{sortedListings.length} total</Badge>
          </div>
          {sortedListings.length > 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Click column headers to sort
            </p>
          )}
        </div>

        {sortedListings.length === 0 ? (
          <Card className="p-12 text-center">
            <BarChart2 className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">No listing data yet</h3>
            <p className="text-neutral-500 dark:text-neutral-400">
              Performance data will appear here once your listings receive engagement.
            </p>
          </Card>
        ) : (
          <Card className="border-neutral-200 dark:border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">Listing</th>
                    {data.listings.some(l => l.price) && (
                      <th 
                        className="text-right p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Price
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                    )}
                    <th 
                      className="text-right p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition"
                      onClick={() => handleSort('views')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Views
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="text-right p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition"
                      onClick={() => handleSort('saves')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Saves
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="text-right p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition"
                      onClick={() => handleSort('messages')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Messages
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="text-right p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition"
                      onClick={() => handleSort('engagementScore')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Score
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    {data.listings.some(l => l.priceSignal) && (
                      <th className="text-center p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">Price Signal</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {sortedListings.map((insight) => (
                    <tr key={insight.listingId} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition">
                      <td className="p-4">
                        <p className="font-medium text-neutral-900 dark:text-neutral-50">
                          {insight.title || `${insight.listingId.slice(0, 12)}...`}
                        </p>
                      </td>
                      {data.listings.some(l => l.price) && (
                        <td className="p-4 text-right text-neutral-900 dark:text-neutral-50">
                          {insight.price ? `$${insight.price.toLocaleString()}` : '—'}
                        </td>
                      )}
                      <td className="p-4 text-right text-neutral-600 dark:text-neutral-400">{insight.views.toLocaleString()}</td>
                      <td className="p-4 text-right text-neutral-600 dark:text-neutral-400">{insight.saves.toLocaleString()}</td>
                      <td className="p-4 text-right text-neutral-600 dark:text-neutral-400">{insight.messages.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <span className={insight.engagementScore > 200 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}>
                          {insight.engagementScore}
                        </span>
                      </td>
                      {data.listings.some(l => l.priceSignal) && (
                        <td className="p-4">
                          {insight.priceSignal ? (
                            <div className="flex justify-center">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  insight.priceSignal === 'below' 
                                    ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                    : insight.priceSignal === 'at'
                                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                    : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                                }`}
                              >
                                {insight.priceSignal}
                              </Badge>
                            </div>
                          ) : (
                            <div className="text-center text-neutral-400">—</div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Trends & Context Placeholder */}
      <div className={`space-y-4 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
        <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-50">Performance Trends</h2>
        <Card className="p-12 text-center border-dashed">
          <BarChart2 className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">Charts coming soon</h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            Trend visualizations will be available here once sufficient historical data is collected.
          </p>
        </Card>
      </div>
    </div>
  );
}
