'use client';

import { DealerInfo } from '@/types';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Globe, 
  Star,
  ExternalLink,
  Store,
  Instagram,
  Facebook,
  Shield
} from 'lucide-react';

interface DealerInfoSectionProps {
  dealerInfo: DealerInfo;
}

const DEALERSHIP_TYPE_LABELS: Record<string, string> = {
  'USED': 'Used Car Dealership',
  'NEW': 'New Car Dealership',
  // Legacy support (will be migrated)
  'local_used': 'Used Car Dealership',
  'branded_new': 'New Car Dealership',
  'independent_mixed': 'Used Car Dealership',
};

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function DealerInfoSection({ dealerInfo }: DealerInfoSectionProps) {
  const getTodayStatus = () => {
    const today = DAYS_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const isOpen = dealerInfo.daysOfOperation.includes(today);
    
    return {
      isOpen,
      message: isOpen 
        ? `Open today ${formatTime(dealerInfo.openingTime)} - ${formatTime(dealerInfo.closingTime)}`
        : 'Closed today'
    };
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const todayStatus = getTodayStatus();

  return (
    <Card className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-2xl font-light mb-1">{dealerInfo.dealershipName}</h2>
              <p className="text-sm text-muted-foreground mb-3">
                {DEALERSHIP_TYPE_LABELS[dealerInfo.dealershipType]}
              </p>
              
              {/* Reputation Display */}
              {dealerInfo.averageRating && dealerInfo.totalReviews ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold">{dealerInfo.averageRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({dealerInfo.totalReviews} reviews)
                    </span>
                  </div>
                  
                  {dealerInfo.carlyRating && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-accent/10 text-accent border-accent/20 cursor-help"
                          >
                            Carly {dealerInfo.carlyRating}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium">Carly Rating</p>
                            <p className="text-xs text-muted-foreground">
                              Based on response time, customer satisfaction, inventory accuracy, and platform engagement.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {dealerInfo.verified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Shield className="w-4 h-4 text-accent" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Verified dealer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">New dealer on Carly</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 ml-4">
              <Store className="w-6 h-6 text-accent" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Hours Status */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className={`font-medium ${todayStatus.isOpen ? 'text-green-600' : 'text-muted-foreground'}`}>
              {todayStatus.message}
            </p>
            {dealerInfo.specialNotes && (
              <p className="text-xs text-muted-foreground mt-1">{dealerInfo.specialNotes}</p>
            )}
          </div>
        </div>

        {/* Operating Hours */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Operating Hours</h3>
          <div className="space-y-2">
            {DAYS_ORDER.map(day => {
              const isOperating = dealerInfo.daysOfOperation.includes(day);
              return (
                <div key={day} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{day}</span>
                  <span className={isOperating ? 'text-foreground' : 'text-muted-foreground'}>
                    {isOperating 
                      ? `${formatTime(dealerInfo.openingTime)} - ${formatTime(dealerInfo.closingTime)}`
                      : 'Closed'
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Contact Information */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
          <div className="space-y-3">
            <a 
              href={`tel:${dealerInfo.contactPhone}`}
              className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
            >
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{dealerInfo.contactPhone}</span>
            </a>
            <a 
              href={`mailto:${dealerInfo.contactEmail}`}
              className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
            >
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{dealerInfo.contactEmail}</span>
            </a>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p>{dealerInfo.address}</p>
                <p className="text-muted-foreground">
                  {dealerInfo.city}, {dealerInfo.region} {dealerInfo.country}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Online Presence */}
        {(dealerInfo.websiteUrl || dealerInfo.instagramUrl || dealerInfo.facebookUrl || 
          dealerInfo.tiktokUrl || dealerInfo.googleBusinessUrl) && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-3">Find Us Online</h3>
              <div className="flex flex-wrap gap-2">
                {dealerInfo.websiteUrl && (
                  <a
                    href={dealerInfo.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">Website</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                )}
                {dealerInfo.instagramUrl && (
                  <a
                    href={dealerInfo.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    <span className="text-sm">Instagram</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                )}
                {dealerInfo.facebookUrl && (
                  <a
                    href={dealerInfo.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                    <span className="text-sm">Facebook</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                )}
                {dealerInfo.tiktokUrl && (
                  <a
                    href={dealerInfo.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span className="text-sm">TikTok</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                )}
                {dealerInfo.googleBusinessUrl && (
                  <a
                    href={dealerInfo.googleBusinessUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-sm">Google</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
