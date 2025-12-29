/**
 * Canonical Listing Detail Page
 * Route: /listings/[id]
 * 
 * NOTE: This is the PRIMARY listing route, NOT a legacy route.
 * The SEO route /cars/[country]/[region]/[city]/[slug] redirects HERE.
 * 
 * Used by:
 * - Vehicle cards throughout the app
 * - Buyer messaging
 * - Direct navigation
 * - SEO URLs (via redirect from /cars/.../[slug])
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Vehicle } from '@/types';
// Mock data removed - connect to real database
import { analyticsAPI } from '@/lib/api/analytics';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatVehicleMileage } from '@/lib/units';
import { generateVehicleTags, getTagStyle } from '@/lib/smart-tags';
import { TestDriveModal } from '@/components/test-drive/TestDriveModal';
import { MessagePopup } from '@/components/messaging/MessagePopup';
import { DealerProfilePopup } from '@/components/listings/DealerProfilePopup';
import { DealerReputationDisplay } from '@/components/listings/DealerReputationDisplay';
import { WarrantyDisplay } from '@/components/cards/warranty-display';
import { ImageCarouselPopup } from '@/components/ui/image-carousel-popup';
import { generateListingSEO, generateImageAlt } from '@/lib/seo/listing-seo';
import Head from 'next/head';
import {
  Heart,
  Share2,
  MapPin,
  Gauge,
  Calendar,
  Fuel,
  Cog,
  Car,
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isBuyer, isLoading, isUnauthenticated, isAuthenticated, isSaved, saveVehicle, unsaveVehicle } = useAuth();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showTestDriveModal, setShowTestDriveModal] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [showDealerPopup, setShowDealerPopup] = useState(false);
  const [dealerPopupTab, setDealerPopupTab] = useState<'profile' | 'reputation'>('profile');
  const [showImageCarousel, setShowImageCarousel] = useState(false);

  const vehicleId = params.id as string;
  const saved = vehicle ? isSaved(vehicleId) : false;

  useEffect(() => {
    // Simulate data loading
    const loadVehicle = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // TODO: Connect to real database
      const foundVehicle = null;
      
      if (foundVehicle) {
        // Load analytics data
        const analytics = await analyticsAPI.getListingAnalytics(foundVehicle.id);
        
        // Merge analytics into vehicle
        const vehicleWithAnalytics: Vehicle = {
          ...foundVehicle,
          viewCount: analytics.viewCount,
          saveCount: analytics.saveCount,
        };
        
        setVehicle(vehicleWithAnalytics);
        
        // Record view (with session tracking to prevent duplicates)
        const sessionId = sessionStorage.getItem('sessionId') || 
          `session_${Date.now()}_${Math.random().toString(36)}`;
        sessionStorage.setItem('sessionId', sessionId);
        
        await analyticsAPI.recordView(
          foundVehicle.id, 
          user?.id, 
          sessionId
        );
      } else {
        setVehicle(null);
      }
      
      setLoading(false);
    };

    loadVehicle();
  }, [params.id, user]);

  const handleSave = async () => {
    // Tri-state guard: never redirect during loading
    if (isLoading) return;
    
    if (isUnauthenticated) {
      router.push(`/?redirect=/listings/${vehicleId}`);
      return;
    }
    
    if (!isBuyer) {
      return; // Dealers cannot save vehicles
    }

    try {
      if (saved) {
        await unsaveVehicle(vehicleId);
        await analyticsAPI.unsaveListing(vehicleId, user!.id);
        
        // Update local vehicle state
        if (vehicle) {
          setVehicle({
            ...vehicle,
            saveCount: Math.max(0, (vehicle.saveCount || 0) - 1),
          });
        }
      } else {
        await saveVehicle(vehicleId);
        await analyticsAPI.saveListing(vehicleId, user!.id);
        
        // Update local vehicle state
        if (vehicle) {
          setVehicle({
            ...vehicle,
            saveCount: (vehicle.saveCount || 0) + 1,
          });
        }
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  const handleMessage = () => {
    // Tri-state guard: never redirect during loading
    if (isLoading) return;
    
    if (!user) {
      router.push('/auth/buyer');
      return;
    }
    setShowMessagePopup(true);
  };

  const handleSendMessage = (messageContent: string) => {
    if (!isAuthenticated || !user || !vehicle) return;

    // Find or create conversation
    const conversation = messageService.findOrCreateConversation(
      user.id,
      user.name,
      vehicle.sellerId,
      vehicle.sellerName,
      vehicle.id,
      `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    );

    // Send message
    messageService.sendMessage(
      conversation.id,
      user.id,
      user.name,
      messageContent
    );

    setShowMessagePopup(false);
  };

  const handleTestDriveSubmit = async (data: {
    requestedDate: string;
    requestedTime: string;
    message?: string;
  }) => {
    if (!isAuthenticated || !user || !vehicle) return;

    // Validate inputs
    if (!data.requestedDate || !data.requestedTime) {
      toast({
        title: 'Invalid Request',
        description: 'Please select both date and time.',
        variant: 'destructive',
      });
      return;
    }

    // Normalize datetime string with seconds
    const requestedDateTime = new Date(`${data.requestedDate}T${data.requestedTime}:00`);

    // Guard against Invalid Date
    if (isNaN(requestedDateTime.getTime())) {
      toast({
        title: 'Invalid Date or Time',
        description: 'Please select a valid date and time.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create appointment using unified system (single source of truth)
      const { appointmentsService } = await import('@/lib/appointments/service');
      const { messageService } = await import('@/lib/api/messages');

      const result = await appointmentsService.createAppointment({
        appointment_type: 'test_drive',
        listing_id: vehicle.id,
        vehicle_id: vehicle.id,
        buyer_id: user.id,
        seller_id: vehicle.sellerId,
        seller_type: 'dealer',
        proposed_datetime: requestedDateTime,
        location: vehicle.location || 'TBD',
        metadata: {
          buyer_name: user.name,
          buyer_email: user.email,
          buyer_message: data.message,
          dealer_name: vehicle.sellerName,
          vehicle_make: vehicle.make,
          vehicle_model: vehicle.model,
          vehicle_year: vehicle.year,
        },
      });

      // Initialize appointment timeline
      if (!result.success || !result.appointment) {
        toast({
          title: 'Request Failed',
          description: result.error || 'Unable to submit appointment request. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Send system message to conversation thread
      const messageContent = `📅 **Appointment Request**\n\nType: Appointment\nVehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}\nRequested: ${requestedDateTime.toLocaleString()}\nStatus: Pending dealer confirmation\\nAppointment ID: ${result.appointment.id}${data.message ? `\n\nMessage: "${data.message}"` : ''}`;

      await messageService.sendMessage(
        vehicle.id,
        user.id,
        vehicle.sellerId,
        user.name,
        messageContent
      );

      toast({
        title: 'Appointment Request Sent',
        description: 'The dealer will review your request and confirm shortly.',
      });
      setShowTestDriveModal(false);
    } catch (error) {
      console.error('Failed to create appointment:', error);
      toast({
        title: 'Request Failed',
        description: 'Unable to submit appointment request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleVehicleSelect = (newVehicleId: string) => {
    router.push(`/listings/${newVehicleId}`);
  };

  if (loading) {
    return <ListingDetailSkeleton />;
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-light mb-4">Listing not found</h1>
          <p className="text-muted-foreground mb-8">
            This listing may have been removed or is no longer available.
          </p>
          <Link href="/">
            <Button>Browse all listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Generate SEO metadata
  const seoData = generateListingSEO(vehicle);

  const isDealer = user?.role === 'dealer';

  const specs = [
    { icon: Gauge, label: 'Mileage', value: formatVehicleMileage(vehicle.mileage, vehicle.location) },
    { icon: Calendar, label: 'Year', value: vehicle.year },
    { icon: Cog, label: 'Transmission', value: vehicle.transmission.charAt(0).toUpperCase() + vehicle.transmission.slice(1) },
    { icon: Fuel, label: 'Fuel Type', value: vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1) },
    { icon: Car, label: 'Body Type', value: vehicle.bodyType },
    { icon: MapPin, label: 'Location', value: vehicle.location },
  ];

  const tags = generateVehicleTags(vehicle);

  return (
    <>
      {/* SEO Meta Tags */}
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <link rel="canonical" href={seoData.canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoData.openGraph.title} />
        <meta property="og:description" content={seoData.openGraph.description} />
        <meta property="og:image" content={seoData.openGraph.image} />
        <meta property="og:url" content={seoData.openGraph.url} />
        <meta property="og:type" content={seoData.openGraph.type} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content={seoData.twitter.card} />
        <meta name="twitter:title" content={seoData.twitter.title} />
        <meta name="twitter:description" content={seoData.twitter.description} />
        <meta name="twitter:image" content={seoData.twitter.image} />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.jsonLd) }}
        />
      </Head>

      <div className="min-h-screen">
      {/* Back Navigation */}
      <div className="fixed top-20 left-6 z-40">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </div>

      {/* Hero Image Gallery */}
      <div 
        className="relative h-[60vh] bg-muted cursor-pointer"
        onClick={() => setShowImageCarousel(true)}
      >
        <img
          src={vehicle.images[activeImageIndex]}
          alt={generateImageAlt(vehicle, activeImageIndex)}
          className="w-full h-full object-cover"
        />
        
        {/* Image Thumbnails */}
        {vehicle.images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {vehicle.images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(index);
                }}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  activeImageIndex === index
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/75'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  {/* Status Tags */}
                  {tags.status.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {tags.status.map((tag) => {
                        const style = getTagStyle(tag, 'status');
                        return (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded text-xs font-medium uppercase tracking-wide"
                            style={{
                              backgroundColor: style.bgColor,
                              color: style.textColor,
                            }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  
                  <h1 className="text-4xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h1>
                  
                  {/* Smart Tags */}
                  {tags.smart.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {tags.smart.map((tag) => {
                        const style = getTagStyle(tag, 'smart');
                        return (
                          <span
                            key={tag}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium"
                            style={{
                              backgroundColor: style.bgColor,
                              color: style.textColor,
                            }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {(!isUnauthenticated && isBuyer) || isUnauthenticated ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSave}
                      className={cn(
                        'rounded-full',
                        saved && 'border-accent bg-accent/10'
                      )}
                      title={isUnauthenticated ? "Sign in to save" : saved ? "Remove from garage" : "Save to garage"}
                    >
                      <Heart className={cn('w-5 h-5', saved && 'fill-accent text-accent')} />
                    </Button>
                  ) : null}
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <p className="text-5xl font-light text-foreground">
                ${vehicle.price.toLocaleString()}
              </p>
            </div>

            <Separator />

            {/* Key Specs */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {specs.map((spec, index) => {
                  const Icon = spec.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border"
                    >
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{spec.label}</p>
                        <p className="text-sm font-medium">{spec.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Factory Warranty - Inline */}
              <WarrantyDisplay
                make={vehicle.make}
                model={vehicle.model}
                year={vehicle.year}
                currentMileage={vehicle.mileage}
                fuelType={vehicle.fuelType}
                location={vehicle.location}
                variant="compact"
              />
            </div>

            <Separator />

            {/* Description */}
            {vehicle.description && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {vehicle.description.split('\n').slice(0, 2).join(' ')}
                </p>
              </div>
            )}

            {/* Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-xl font-semibold mb-4">Features</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {vehicle.features.slice(0, 12).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  {vehicle.features.length > 12 && (
                    <p className="text-sm text-muted-foreground mt-3">
                      +{vehicle.features.length - 12} more features
                    </p>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Additional Details */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Additional Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Exterior Color</p>
                  <p className="font-medium">{vehicle.exteriorColor}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Interior Color</p>
                  <p className="font-medium">{vehicle.interiorColor}</p>
                </div>
                {vehicle.vin && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">VIN</p>
                    <p className="font-mono text-xs">{vehicle.vin}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Sticky CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Seller Card */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <button
                  className="w-full text-left flex items-center gap-3 hover:bg-muted/50 -m-3 p-3 rounded-lg transition-colors"
                  onClick={() => {
                    if (vehicle.sellerType === 'dealer') {
                      setDealerPopupTab('profile');
                      setShowDealerPopup(true);
                    }
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-accent">
                      {vehicle.sellerName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">
                        {vehicle.sellerName}
                      </p>
                      <Shield className="w-4 h-4 text-accent" />
                    </div>
                    {vehicle.sellerType === 'dealer' && (
                      <DealerReputationDisplay 
                        dealerId={vehicle.sellerId}
                        dealerName={vehicle.sellerName}
                        location={vehicle.dealerInfo ? `${vehicle.dealerInfo.city}, ${vehicle.dealerInfo.region}` : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDealerPopupTab('reputation');
                          setShowDealerPopup(true);
                        }}
                      />
                    )}
                  </div>
                </button>

                {!isDealer && (
                  <>
                    <Separator />
                    
                    <div className="space-y-2">
                      <Button
                        onClick={handleMessage}
                        className="w-full rounded-lg h-12 primary-glow"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Seller
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full rounded-lg h-12 primary-glow"
                        onClick={() => {
                          if (isLoading || !isAuthenticated) {
                            router.push('/auth/buyer');
                            return;
                          }
                          setShowTestDriveModal(true);
                        }}
                      >
                        Request Appointment
                      </Button>
                    </div>
                  </>
                )}

                {isUnauthenticated && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground text-center">
                      <Link href="/auth" className="text-accent hover:underline">
                        Sign in
                      </Link>{' '}
                      to save and message sellers
                    </p>
                  </>
                )}
              </div>

              {/* Stats - De-emphasized */}
              <div className="text-sm text-muted-foreground text-center space-y-1">
                <p>{vehicle.viewCount || 0} views · {vehicle.saveCount || 0} saves</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Drive Modal */}
      {vehicle && (
        <>
          <TestDriveModal
            open={showTestDriveModal}
            onClose={() => setShowTestDriveModal(false)}
            vehicle={vehicle}
            onSubmit={handleTestDriveSubmit}
          />
          
          <MessagePopup
            open={showMessagePopup}
            onClose={() => setShowMessagePopup(false)}
            vehicle={vehicle}
            onSend={handleSendMessage}
          />

          {/* Dealer Profile Popup - MANDATORY for all dealers */}
          {vehicle.sellerType === 'dealer' && (
            <DealerProfilePopup
              open={showDealerPopup}
              onClose={() => setShowDealerPopup(false)}
              dealerInfo={vehicle.dealerInfo || {
                dealershipName: vehicle.sellerName,
                city: 'Unknown',
                region: 'Unknown',
                dealershipType: 'USED',
                openingTime: '9:00 AM',
                closingTime: '6:00 PM'
              }}
              dealerId={vehicle.sellerId}
              currentVehicleId={vehicle.id}
              onVehicleSelect={handleVehicleSelect}
              onMessageDealer={handleMessage}
              defaultTab={dealerPopupTab}
            />
          )}
        </>
      )}

      {/* Image Carousel Popup */}
      <ImageCarouselPopup
        images={vehicle.images}
        open={showImageCarousel}
        onOpenChange={setShowImageCarousel}
        initialIndex={activeImageIndex}
      />
    </div>
    </>
  );
}

function ListingDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="fixed top-20 left-6 z-40">
        <Skeleton className="h-9 w-24" />
      </div>
      
      <Skeleton className="h-[60vh] w-full" />
      
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-16 w-48" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
