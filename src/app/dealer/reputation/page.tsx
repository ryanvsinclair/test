"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Star, 
  TrendingUp, 
  Lock, 
  CheckCircle, 
  Clock, 
  Calendar, 
  MessageSquare,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
  Trophy
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ReputationData {
  score: {
    overallScore: number | null;
    grade: 'A' | 'B' | 'C' | 'D' | 'E' | null;
    googleRating: number | null;
    totalVerifiedReviews: number;
    trustSignals: number;
  };
  factors: {
    responseTime: number | null;
    appointmentCompletionRate: number | null;
    buyerFollowThrough: number | null;
    listingAccuracy: number | null;
    disputeRate: number | null;
    reviewConsistency: number | null;
    interactionsRequired: number;
    currentInteractions: number;
  };
  events: Array<{
    id: string;
    type: string;
    timestamp: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  reviewSources: Array<{
    name: string;
    active: boolean;
    count: number;
    requirementsToActivate?: string;
  }>;
}

export default function ReputationPage() {
  const [data, setData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [educationOpen, setEducationOpen] = useState(false);

  useEffect(() => {
    // Render page shell immediately, fetch data after mount
    const timer = setTimeout(() => {
      fetchReputationData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function fetchReputationData() {
    setLoading(true);
    try {
      const dealerId = 'dealer-001';
      const response = await fetch(`/api/dealer/reputation?dealerId=${dealerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reputation data');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to load reputation data:', error);
      setData({
        score: {
          overallScore: null,
          grade: null,
          googleRating: null,
          totalVerifiedReviews: 0,
          trustSignals: 0,
        },
        factors: {
          responseTime: null,
          appointmentCompletionRate: null,
          buyerFollowThrough: null,
          listingAccuracy: null,
          disputeRate: null,
          reviewConsistency: null,
          interactionsRequired: 10,
          currentInteractions: 0,
        },
        events: [],
        reviewSources: [
          { name: 'Carly Verified Reviews', active: false, count: 0 },
          { name: 'Google Reviews', active: false, count: 0 },
          { name: 'External Platforms', active: false, count: 0 },
        ],
      });
    } finally {
      setLoading(false);
    }
  }

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'text-neutral-400 dark:text-neutral-600';
    switch (grade) {
      case 'A': return 'text-green-600 dark:text-green-400';
      case 'B': return 'text-blue-600 dark:text-blue-400';
      case 'C': return 'text-yellow-600 dark:text-yellow-400';
      case 'D': return 'text-orange-600 dark:text-orange-400';
      case 'E': return 'text-red-600 dark:text-red-400';
      default: return 'text-neutral-400 dark:text-neutral-600';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      default: return 'text-neutral-600 dark:text-neutral-400';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 dark:text-purple-400" />
          <p className="text-neutral-500 dark:text-neutral-400">Loading reputation data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
            Unable to load reputation data
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            Please try again later
          </p>
          <Button onClick={fetchReputationData}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-50">
          Reputation
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Your reputation intelligence hub
        </p>
      </div>

      {/* Reputation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Carly Reputation Score */}
        <Card className={`p-6 ${data.score.overallScore ? 'border-purple-200 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/20' : 'border-neutral-200 dark:border-neutral-800'}`}>
          <div className="flex items-start justify-between mb-2">
            <Shield className={`w-6 h-6 ${data.score.grade ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400 dark:text-neutral-600'}`} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Your Carly Reputation Score is built from verified interactions: appointments, test drives, completed deals, and response times. It unlocks after 10 verified interactions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Carly Reputation</p>
          {data.score.overallScore !== null ? (
            <>
              <p className={`text-4xl font-light ${getGradeColor(data.score.grade)}`}>
                {data.score.grade}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Score: {data.score.overallScore}/100
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl font-light text-neutral-300 dark:text-neutral-700">
                —
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Not yet earned
              </p>
            </>
          )}
        </Card>

        {/* Google Rating */}
        <Card className="p-6 border-neutral-200 dark:border-neutral-800 opacity-50">
          <div className="flex items-start justify-between mb-2">
            <Star className="w-6 h-6 text-neutral-400 dark:text-neutral-600" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Google Rating is imported from your Google Business Profile (read-only). Connect your profile to display your Google rating here.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Google Rating</p>
          <p className="text-4xl font-light text-neutral-300 dark:text-neutral-700">—</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Not connected
          </p>
        </Card>

        {/* Verified Reviews */}
        <Card className="p-6 border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between mb-2">
            <CheckCircle className={`w-6 h-6 ${data.score.totalVerifiedReviews > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-600'}`} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Verified reviews are earned after completed transactions. Buyers who test drive or purchase a vehicle can leave verified feedback.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Verified Reviews</p>
          <p className={`text-4xl font-light ${data.score.totalVerifiedReviews > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-300 dark:text-neutral-700'}`}>
            {data.score.totalVerifiedReviews}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Total verified
          </p>
        </Card>

        {/* Trust Signals */}
        <Card className="p-6 border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between mb-2">
            <Trophy className={`w-6 h-6 ${data.score.trustSignals > 0 ? 'text-green-600 dark:text-green-400' : 'text-neutral-400 dark:text-neutral-600'}`} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Trust signals include: fast response times, appointment completion, listing accuracy, and dispute resolution. Each contributes to your overall reputation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Trust Signals</p>
          <p className={`text-4xl font-light ${data.score.trustSignals > 0 ? 'text-green-600 dark:text-green-400' : 'text-neutral-300 dark:text-neutral-700'}`}>
            {data.score.trustSignals}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Active signals
          </p>
        </Card>
      </div>

      {/* Reputation Factors */}
      <Card className="p-6">
        <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-50 mb-4">
          Reputation Breakdown
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          {data.factors.currentInteractions < data.factors.interactionsRequired
            ? `Complete ${data.factors.interactionsRequired - data.factors.currentInteractions} more verified interactions to unlock reputation tracking`
            : 'Your reputation is built from these verified factors'}
        </p>

        <div className="space-y-4">
          {/* Response Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Response Time
                </span>
                {data.factors.responseTime === null && (
                  <Lock className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
                )}
              </div>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {data.factors.responseTime !== null ? `${data.factors.responseTime}%` : '—'}
              </span>
            </div>
            <Progress value={data.factors.responseTime || 0} className="h-1.5" />
            {data.factors.responseTime === null && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Unlocked after {data.factors.interactionsRequired} verified interactions
              </p>
            )}
          </div>

          {/* Appointment Completion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Appointment Completion Rate
                </span>
                {data.factors.appointmentCompletionRate === null && (
                  <Lock className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
                )}
              </div>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {data.factors.appointmentCompletionRate !== null ? `${data.factors.appointmentCompletionRate}%` : '—'}
              </span>
            </div>
            <Progress value={data.factors.appointmentCompletionRate || 0} className="h-1.5" />
          </div>

          {/* Buyer Follow-Through */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Buyer Follow-Through
                </span>
                {data.factors.buyerFollowThrough === null && (
                  <Lock className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
                )}
              </div>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {data.factors.buyerFollowThrough !== null ? `${data.factors.buyerFollowThrough}%` : '—'}
              </span>
            </div>
            <Progress value={data.factors.buyerFollowThrough || 0} className="h-1.5" />
          </div>

          {/* Listing Accuracy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Listing Accuracy
                </span>
                {data.factors.listingAccuracy === null && (
                  <Lock className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
                )}
              </div>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {data.factors.listingAccuracy !== null ? `${data.factors.listingAccuracy}%` : '—'}
              </span>
            </div>
            <Progress value={data.factors.listingAccuracy || 0} className="h-1.5" />
          </div>

          {/* Dispute Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Dispute Rate
                </span>
                {data.factors.disputeRate === null && (
                  <Lock className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
                )}
              </div>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {data.factors.disputeRate !== null ? `${data.factors.disputeRate}%` : '—'}
              </span>
            </div>
            <Progress value={data.factors.disputeRate ? 100 - data.factors.disputeRate : 0} className="h-1.5" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Lower is better
            </p>
          </div>

          {/* Review Consistency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Review Consistency
                </span>
                {data.factors.reviewConsistency === null && (
                  <Lock className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
                )}
              </div>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {data.factors.reviewConsistency !== null ? `${data.factors.reviewConsistency}%` : '—'}
              </span>
            </div>
            <Progress value={data.factors.reviewConsistency || 0} className="h-1.5" />
          </div>
        </div>
      </Card>

      {/* Review Sources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.reviewSources.map((source) => (
          <Card 
            key={source.name}
            className={`p-6 ${source.active ? 'border-blue-200 dark:border-blue-900/40' : 'border-neutral-200 dark:border-neutral-800 opacity-50'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {source.name}
              </h3>
              {!source.active && (
                <Lock className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
              )}
            </div>
            <p className={`text-3xl font-light mb-2 ${source.active ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-300 dark:text-neutral-700'}`}>
              {source.count}
            </p>
            {!source.active && source.requirementsToActivate && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {source.requirementsToActivate}
              </p>
            )}
            {source.active && (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                Active
              </Badge>
            )}
          </Card>
        ))}
      </div>

      {/* Event Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-50 mb-4">
          Reputation Events
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Verified interactions that contribute to your reputation
        </p>

        {data.events.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
              No reputation events yet
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              Reputation events appear here once verified interactions occur: completed appointments, test drives, vehicle deliveries, and verified buyer feedback.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.events.map((event) => (
              <div key={event.id} className="flex items-start gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${getImpactColor(event.impact)}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                    {event.description}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {new Date(event.timestamp).toLocaleDateString()} at {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={event.impact === 'positive' ? 'text-green-700 dark:text-green-300' : event.impact === 'negative' ? 'text-red-700 dark:text-red-300' : ''}
                >
                  {event.impact}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* How Reputation Is Built */}
      <Card className="p-6">
        <Collapsible open={educationOpen} onOpenChange={setEducationOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 hover:bg-transparent">
              <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-50">
                How Reputation Is Built
              </h2>
              {educationOpen ? (
                <ChevronUp className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-6 space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  Why Carly doesn't allow unverified reviews
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Carly reputation is built from <strong>verified events</strong>, not raw opinions. Only buyers who complete a verified interaction (appointment, test drive, purchase) can leave feedback. This prevents fake reviews and ensures trust.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  How Google ratings are imported
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Google ratings are imported from your Google Business Profile as <strong>read-only data</strong>. They display alongside your Carly reputation but do not directly affect your Carly score. Connect your profile to display Google ratings.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  How Carly reputation differs from star ratings
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Star ratings are subjective. Carly reputation is <strong>algorithmic</strong> and based on measurable factors: response time, appointment completion, listing accuracy, and dispute resolution. You earn reputation through consistent, verified behavior.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  How disputes affect reputation
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Disputes are rare but impact reputation when unresolved. If a buyer reports an issue (listing inaccuracy, no-show, etc.), your reputation score is affected. However, <strong>resolving disputes</strong> quickly and fairly can restore and even improve your score.
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  What advantages reputation unlocks
                </h3>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1 list-disc list-inside">
                  <li>Higher placement in marketplace search results</li>
                  <li>Verified dealer badge on listings</li>
                  <li>Access to premium features and analytics</li>
                  <li>Increased buyer trust and conversion rates</li>
                  <li>Priority support from Carly team</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
