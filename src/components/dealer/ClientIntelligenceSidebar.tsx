"use client";

import { useEffect, useState } from 'react';
import { ClientIntelligence } from '@/types/client-intelligence';
import { getCachedClientIntelligence } from '@/lib/api/client-intelligence';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  MapPin,
  Calendar,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Car,
  Tag,
  Zap,
  Clock,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';

interface ClientIntelligenceSidebarProps {
  userId: string;
  conversationId: string;
}

export function ClientIntelligenceSidebar({ userId, conversationId }: ClientIntelligenceSidebarProps) {
  const [intelligence, setIntelligence] = useState<ClientIntelligence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadIntelligence() {
      setLoading(true);
      try {
        const data = await getCachedClientIntelligence(userId, conversationId);
        if (mounted) {
          setIntelligence(data);
        }
      } catch (error) {
        console.error('Failed to load client intelligence:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadIntelligence();

    return () => {
      mounted = false;
    };
  }, [userId, conversationId]);

  if (loading) {
    return (
      <div className="w-80 border-l border-neutral-200 dark:border-neutral-800 p-4 space-y-4 overflow-y-auto">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!intelligence) {
    return null;
  }

  const getIntentColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="w-80 border-l border-neutral-200 dark:border-neutral-800 bg-card/50 backdrop-blur-sm overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Client Intelligence
          </h2>
        </div>

        {/* Client Snapshot */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <div className="p-3 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {intelligence.userName}
                </span>
              </div>
              {intelligence.verified && (
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              )}
            </div>

            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span>{intelligence.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>Member for {intelligence.accountAge}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{intelligence.lastActive}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Intent Level</span>
                <Badge variant="outline" className={getIntentColor(intelligence.carlyIntentLevel)}>
                  {intelligence.carlyIntentLevel.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Taste Profile */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <div className="p-3 space-y-3">
            <h3 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
              <Tag className="w-3 h-3" />
              Taste Profile
            </h3>

            {/* Budget */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">Budget Range</span>
                <Badge variant="outline" className="text-xs">
                  {intelligence.tasteProfile.budget.confidence} confidence
                </Badge>
              </div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                ${intelligence.tasteProfile.budget.min.toLocaleString()} - ${intelligence.tasteProfile.budget.max.toLocaleString()}
              </div>
            </div>

            {/* Top Tags */}
            <div className="space-y-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Key Preferences</span>
              <div className="flex flex-wrap gap-1.5">
                {intelligence.tasteProfile.tags.slice(0, 5).map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Behavioral Stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Viewed</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {intelligence.tasteProfile.behavioral.vehiclesViewed}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Liked</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {intelligence.tasteProfile.behavioral.vehiclesLiked}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Messaged</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {intelligence.tasteProfile.behavioral.listingsMessaged}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Revisit</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {(intelligence.tasteProfile.behavioral.revisitRate * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {intelligence.tasteProfile.summary}
              </p>
            </div>
          </div>
        </Card>

        {/* Active Context */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <div className="p-3 space-y-3">
            <h3 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" />
              Active Context
            </h3>

            {intelligence.activeContext.currentListing && (
              <div className="space-y-1">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Discussing</span>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {intelligence.activeContext.currentListing.year}{' '}
                  {intelligence.activeContext.currentListing.make}{' '}
                  {intelligence.activeContext.currentListing.model}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  ${intelligence.activeContext.currentListing.price.toLocaleString()}
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Appointment</span>
                <Badge variant="outline" className="text-xs">
                  {intelligence.activeContext.appointmentStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Financing Interest</span>
                <div className="flex items-center gap-1">
                  {intelligence.activeContext.financingInterest.detected && (
                    <Zap className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                  )}
                  <span className="text-neutral-900 dark:text-neutral-50">
                    {intelligence.activeContext.financingInterest.confidence > 0.7 ? 'High' : 'Possible'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Trade-in</span>
                <span className="text-neutral-900 dark:text-neutral-50">
                  {intelligence.activeContext.tradeInMentioned ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Suggested Actions */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <div className="p-3 space-y-3">
            <h3 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Suggested Actions
            </h3>

            <div className="space-y-2">
              {intelligence.suggestedActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2"
                >
                  <div className="flex items-start gap-2 flex-1">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-neutral-900 dark:text-neutral-50">
                        {action.label}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
