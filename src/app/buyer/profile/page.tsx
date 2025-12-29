'use client';

import { useState, useEffect } from 'react';
// Mock data removed - connect to real database
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Camera, Check, ShieldCheck } from 'lucide-react';
import { CitySearch } from '@/components/ui/city-search';
import { City } from '@/lib/api/cities';
import { useAuth } from '@/contexts/AuthContext';
import { useUnits } from '@/contexts/UnitsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/use-toast';
import { UserPreferences, mileageToleranceWeights, vehicleAgeWeights } from '@/types';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
// Mock data removed - connect to real database

export default function ProfilePage() {
  const { user } = useAuth();
  const { units } = useUnits();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  
  // Stats
  const [savedVehiclesCount, setSavedVehiclesCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [interactionsCount, setInteractionsCount] = useState(0);
  
  // TODO: Connect to real database
  useEffect(() => {
    if (user?.id) {
      setSavedVehiclesCount(0);
      setAppointmentsCount(0);
      setMessagesCount(0);
      setInteractionsCount(0);
    }
  }, [user?.id]);
  
  // Initialize with user's current city if available
  const [selectedCity, setSelectedCity] = useState<City | null>(
    user?.city && user?.state && user?.country
      ? {
          name: user.city,
          state: user.state,
          country: user.country,
          displayName: `${user.city}, ${user.state} · ${user.country === 'CA' ? 'Canada' : 'United States'}`
        }
      : null
  );

  // Smart Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>(
    user?.preferences || {
      budgetComfortRange: {},
      preferredBodyTypes: [],
      preferredMakes: [],
      mileageTolerance: {
        semantic: 'balanced',
        weight: mileageToleranceWeights.balanced
      },
      vehicleAgePreference: {
        semantic: 'open',
        weight: vehicleAgeWeights.open
      },
      ownershipIntent: undefined,
      fuelTypePreference: [],
      refineFeedEnabled: false,
    }
  );

  const bodyTypes = ['Sedan', 'SUV', 'Coupe', 'Truck', 'Hatchback', 'Convertible', 'Wagon', 'Van'];
  const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Nissan', 'Mazda', 'Volkswagen', 'Hyundai', 'Kia'];
  const fuelTypes = ['Gas', 'Hybrid', 'Electric', 'Diesel'];

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const toggleBodyType = (type: string) => {
    const current = preferences.preferredBodyTypes || [];
    if (current.includes(type)) {
      handlePreferenceChange('preferredBodyTypes', current.filter(t => t !== type));
    } else {
      handlePreferenceChange('preferredBodyTypes', [...current, type]);
    }
  };

  const toggleMake = (make: string) => {
    const current = preferences.preferredMakes || [];
    if (current.includes(make)) {
      handlePreferenceChange('preferredMakes', current.filter(m => m !== make));
    } else {
      handlePreferenceChange('preferredMakes', [...current, make]);
    }
  };

  const toggleFuelType = (type: string) => {
    const current = preferences.fuelTypePreference || [];
    if (current.includes(type)) {
      handlePreferenceChange('fuelTypePreference', current.filter(t => t !== type));
    } else {
      handlePreferenceChange('fuelTypePreference', [...current, type]);
    }
  };

  const handleCityChange = (city: City | null) => {
    setSelectedCity(city);
    
    if (city) {
      // Update user profile with city data
      // This will trigger unit system update via UnitsContext
      console.log('[PROFILE] City selected:', city);
      
      toast({
        title: 'Location Updated',
        description: `Your location has been set to ${city.displayName}. Distances will be shown in ${city.country === 'CA' ? 'kilometers' : 'miles'}.`,
      });
      
      // In production: call API to save city, state, country to user profile
      // await userAPI.updateProfile(user.id, {
      //   city: city.name,
      //   state: city.state,
      //   country: city.country,
      // });
    }
  };

  const handleSaveChanges = () => {
    // In production: Call API to save preferences
    console.log('[PROFILE] Saving preferences:', preferences);
    
    // Save to AuthContext (this will persist to localStorage)
    if (user) {
      user.preferences = preferences;
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    // Show fade in/out confirmation
    setShowSaveConfirmation(true);
    setTimeout(() => {
      setShowSaveConfirmation(false);
    }, 2000); // Fade in, stay, then fade out (total 2 seconds)
  };

  const handleCancel = () => {
    // Reset preferences to original user preferences
    setPreferences(user?.preferences || {
      budgetComfortRange: {},
      preferredBodyTypes: [],
      preferredMakes: [],
      mileageTolerance: {
        semantic: 'balanced',
        weight: mileageToleranceWeights.balanced
      },
      vehicleAgePreference: {
        semantic: 'open',
        weight: vehicleAgeWeights.open
      },
      ownershipIntent: undefined,
      fuelTypePreference: [],
      refineFeedEnabled: false,
    });
    
    toast({
      title: 'Changes Discarded',
      description: 'Your preferences have been reset.',
    });
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-6">
          {/* Profile Hero Header */}
          <div className="bg-gradient-to-br from-card via-card to-muted/20 rounded-2xl border border-border p-8 md:p-10 soft-shadow">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-3xl font-light">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-all shadow-md hover:scale-105">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
                      {user?.name || 'User'}
                    </h1>
                    {/* Buyer verification badges intentionally hidden until feature launch */}
                    {/* {mockUser.verified && (
                      <Badge className="verified-badge text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )} */}
                  </div>
                  <p className="text-muted-foreground text-lg">
                    {selectedCity ? selectedCity.displayName : user?.email}
                  </p>
                </div>
                {user?.bio && (
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {user.bio}
                  </p>
                )}
              </div>
              <div>
                <Button className="rounded-xl">
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-6 soft-shadow">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Saved Vehicles</p>
                <p className="text-3xl font-light text-foreground">{savedVehiclesCount}</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 soft-shadow">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Appointments</p>
                <p className="text-3xl font-light text-foreground">{appointmentsCount}</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 soft-shadow">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-3xl font-light text-foreground">{messagesCount}</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 soft-shadow">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Interactions</p>
                <p className="text-3xl font-light text-foreground">{interactionsCount}</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Personal Information & Preferences */}
            <div className="lg:col-span-1 space-y-6">
              {/* Personal Information */}
              <div className="bg-card rounded-xl border border-border p-6 soft-shadow">
                <h3 className="text-lg font-semibold text-foreground mb-6">
                  Personal Information
                </h3>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">Full Name</Label>
                    <Input
                      id="name"
                      defaultValue={user?.name || ''}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email || ''}
                      className="rounded-lg"
                    />
                  </div>
                  
                  {/* Smart City Search */}
                  <div className="space-y-2">
                    <CitySearch
                      value={selectedCity}
                      onChange={handleCityChange}
                      className="w-full"
                    />
                    {selectedCity && (
                      <p className="text-xs text-muted-foreground">
                        Distances will be shown in <strong>{units.distanceUnit}</strong> based on your location.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm">Bio</Label>
                    <Textarea
                      id="bio"
                      defaultValue={user?.bio || ''}
                      className="rounded-lg min-h-[100px]"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </div>

              {/* System Preferences */}
              <div className="bg-card rounded-xl border border-border p-6 soft-shadow">
                <h3 className="text-lg font-semibold text-foreground mb-6">
                  System Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">
                        Toggle between light and dark theme
                      </p>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={toggleTheme}
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">Refine my feed</p>
                      <p className="text-xs text-muted-foreground">
                        Hide vehicles to improve recommendations
                      </p>
                    </div>
                    <Switch
                      checked={preferences.refineFeedEnabled || false}
                      onCheckedChange={(checked) => handlePreferenceChange('refineFeedEnabled', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Privacy & Security */}
              <div className="bg-card rounded-xl border border-border p-6 soft-shadow">
                <h3 className="text-lg font-semibold text-foreground mb-6">
                  Privacy & Security
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Updates about saved vehicles
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-lg text-xs"
                      onClick={() => setShowNotificationsModal(true)}
                    >
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Privacy Settings</p>
                      <p className="text-xs text-muted-foreground">
                        Manage profile visibility
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-lg text-xs"
                      onClick={() => setShowPrivacyModal(true)}
                    >
                      Manage
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">Account Security</p>
                      <p className="text-xs text-muted-foreground">
                        Update password & security
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-lg text-xs"
                      onClick={() => setShowSecurityModal(true)}
                    >
                      Update
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-3 pt-4 border-t border-border">
                    <div className="flex items-start gap-3 flex-1">
                      <ShieldCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground text-sm">Identity Verification</p>
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                            Coming Soon
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Earn a Verified Buyer badge
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-lg text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      onClick={() => setShowVerificationModal(true)}
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Vehicle Preferences */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border p-6 md:p-8 soft-shadow">
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Vehicle Preferences
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    These help us highlight vehicles you're more likely to love. Your preferences don't restrict what you can browse.
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Budget Comfort Range */}
                  <div className="space-y-4 pb-6 border-b border-border">
                    <div>
                      <Label className="text-base font-medium">Budget Comfort Range</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ideal price range (not a hard limit)
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="min-budget" className="text-sm">Comfortable minimum</Label>
                        <Input
                          id="min-budget"
                          type="number"
                          placeholder="e.g., 10000"
                          value={preferences.budgetComfortRange?.min || ''}
                          onChange={(e) => handlePreferenceChange('budgetComfortRange', {
                            ...preferences.budgetComfortRange,
                            min: e.target.value ? Number(e.target.value) : undefined
                          })}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-budget" className="text-sm">Comfortable maximum</Label>
                        <Input
                          id="max-budget"
                          type="number"
                          placeholder="e.g., 40000"
                          value={preferences.budgetComfortRange?.max || ''}
                          onChange={(e) => handlePreferenceChange('budgetComfortRange', {
                            ...preferences.budgetComfortRange,
                            max: e.target.value ? Number(e.target.value) : undefined
                          })}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preferred Body Types */}
                  <div className="space-y-4 pb-6 border-b border-border">
                    <div>
                      <Label className="text-base font-medium">Preferred Body Types</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select any body styles that interest you
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bodyTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => toggleBodyType(type)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            preferences.preferredBodyTypes?.includes(type)
                              ? 'bg-[hsl(var(--accent-primary)_/_0.15)] text-[hsl(var(--accent-primary))] border border-[hsl(var(--accent-primary)_/_0.3)]'
                              : 'bg-muted text-muted-foreground hover:bg-muted/70 border border-transparent'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Makes */}
                  <div className="space-y-4 pb-6 border-b border-border">
                    <div>
                      <Label className="text-base font-medium">Preferred Makes</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Brands you're drawn to
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {makes.map((make) => (
                        <button
                          key={make}
                          onClick={() => toggleMake(make)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            preferences.preferredMakes?.includes(make)
                              ? 'bg-[hsl(var(--accent-primary)_/_0.15)] text-[hsl(var(--accent-primary))] border border-[hsl(var(--accent-primary)_/_0.3)]'
                              : 'bg-muted text-muted-foreground hover:bg-muted/70 border border-transparent'
                          }`}
                        >
                          {make}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mileage Tolerance */}
                  <div className="space-y-4 pb-6 border-b border-border">
                    <div>
                      <Label className="text-base font-medium">Mileage Tolerance</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your comfort level with vehicle mileage
                      </p>
                    </div>
                    <RadioGroup
                      value={preferences.mileageTolerance?.semantic || 'balanced'}
                      onValueChange={(value: 'low' | 'balanced' | 'flexible') => 
                        handlePreferenceChange('mileageTolerance', {
                          semantic: value,
                          weight: mileageToleranceWeights[value]
                        })
                      }
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="low" id="mileage-low" />
                        <Label htmlFor="mileage-low" className="font-normal cursor-pointer">
                          Low mileage preferred
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="balanced" id="mileage-balanced" />
                        <Label htmlFor="mileage-balanced" className="font-normal cursor-pointer">
                          Balanced
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="flexible" id="mileage-flexible" />
                        <Label htmlFor="mileage-flexible" className="font-normal cursor-pointer">
                          Mileage flexible
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Vehicle Age Preference */}
                  <div className="space-y-4 pb-6 border-b border-border">
                    <div>
                      <Label className="text-base font-medium">Vehicle Age Preference</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your preference for vehicle age
                      </p>
                    </div>
                    <RadioGroup
                      value={preferences.vehicleAgePreference?.semantic || 'open'}
                      onValueChange={(value: 'newer' | 'open' | 'classic') =>
                        handlePreferenceChange('vehicleAgePreference', {
                          semantic: value,
                          weight: vehicleAgeWeights[value]
                        })
                      }
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="newer" id="age-newer" />
                        <Label htmlFor="age-newer" className="font-normal cursor-pointer">
                          Newer models preferred
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="open" id="age-open" />
                        <Label htmlFor="age-open" className="font-normal cursor-pointer">
                          Open to older vehicles
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="classic" id="age-classic" />
                        <Label htmlFor="age-classic" className="font-normal cursor-pointer">
                          Classic / older vehicles preferred
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Ownership Intent */}
                  <div className="space-y-4 pb-6 border-b border-border">
                    <div>
                      <Label className="text-base font-medium">Ownership Intent</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        How you plan to use the vehicle (optional)
                      </p>
                    </div>
                    <RadioGroup
                      value={preferences.ownershipIntent || ''}
                      onValueChange={(value) => handlePreferenceChange('ownershipIntent', value || undefined)}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="daily" id="intent-daily" />
                        <Label htmlFor="intent-daily" className="font-normal cursor-pointer">
                          Daily driver
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="weekend" id="intent-weekend" />
                        <Label htmlFor="intent-weekend" className="font-normal cursor-pointer">
                          Weekend / fun vehicle
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="family" id="intent-family" />
                        <Label htmlFor="intent-family" className="font-normal cursor-pointer">
                          Family vehicle
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="work" id="intent-work" />
                        <Label htmlFor="intent-work" className="font-normal cursor-pointer">
                          Work / utility
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Fuel Type Preference */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Fuel Type Preference</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select any fuel types you're interested in
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fuelTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => toggleFuelType(type)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            preferences.fuelTypePreference?.includes(type)
                              ? 'bg-[hsl(var(--accent-primary)_/_0.15)] text-[hsl(var(--accent-primary))] border border-[hsl(var(--accent-primary)_/_0.3)]'
                              : 'bg-muted text-muted-foreground hover:bg-muted/70 border border-transparent'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-between items-center gap-4 relative">
            <Link href="/ask" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ask Carly (Support & Feedback)
            </Link>
            <div className="flex gap-4">
              <Button variant="outline" size="lg" className="rounded-xl" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="lg" className="rounded-xl icy-glow-hover primary-glow" onClick={handleSaveChanges}>
                Save Changes
              </Button>
            </div>
            
            {/* Save Confirmation Message */}
            <div 
              className={`absolute -top-16 right-0 bg-gradient-to-br from-[hsl(var(--accent-primary))] to-[hsl(var(--accent-secondary))] text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-500 ${
                showSaveConfirmation 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-2 pointer-events-none'
              }`}
            >
              <p className="text-sm font-medium">✓ Preferences saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Verified Buyer
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 mt-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                  Coming Soon
                </Badge>
              </div>
            </div>
            <DialogDescription className="text-base text-muted-foreground pt-2">
              A new trust layer for serious buyers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <p className="text-sm text-foreground leading-relaxed">
              Carly will soon offer optional identity verification using a secure third-party service. 
              Verified buyers earn a <span className="font-medium">Verified Buyer badge</span> that appears 
              on their profile and in all interactions.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-xs font-medium text-foreground">How it works:</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Verification is <strong className="text-foreground">optional</strong> — you choose if and when</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>No ID images or document numbers stored by Carly</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>The purpose is trust, not restriction</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Benefits:</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Verified Buyer badge on profile and messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Increased trust with sellers and dealers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Higher quality interactions</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={() => setShowVerificationModal(false)}
                className="flex-1"
              >
                Got it
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  toast({
                    title: "We'll notify you",
                    description: "You'll receive an email when verification launches.",
                  });
                  setShowVerificationModal(false);
                }}
                className="flex-1"
              >
                Notify me when this launches
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Notifications Modal */}
      <NotificationsConfigModal 
        open={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        userId={user?.id || 'default'}
      />

      {/* Privacy Settings Modal */}
      <PrivacySettingsModal 
        open={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        userId={user?.id || 'default'}
      />

      {/* Account Security Modal */}
      <AccountSecurityModal 
        open={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        userId={user?.id || 'default'}
      />
    </div>
  );
}

// Email Notifications Configuration Modal
function NotificationsConfigModal({ 
  open, 
  onClose, 
  userId 
}: { 
  open: boolean; 
  onClose: () => void; 
  userId: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    savedVehicleUpdates: true,
    priceDropAlerts: true,
    messageNotifications: true,
    announcements: false,
  });
  const [originalPreferences, setOriginalPreferences] = useState(preferences);

  // Load preferences on mount
  useState(() => {
    if (open) {
      setLoading(true);
      fetch(`/api/notifications/preferences?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.preferences) {
            setPreferences(data.preferences);
            setOriginalPreferences(data.preferences);
          }
        })
        .catch(() => {
          toast({
            title: 'Failed to load preferences',
            description: 'Using default settings.',
            variant: 'destructive',
          });
        })
        .finally(() => setLoading(false));
    }
  });

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferences }),
      });

      if (response.ok) {
        setOriginalPreferences(preferences);
        toast({
          title: 'Preferences saved',
          description: 'Your notification settings have been updated.',
        });
        onClose();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      // Rollback on error
      setPreferences(originalPreferences);
      toast({
        title: 'Failed to save preferences',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email Notifications</DialogTitle>
          <DialogDescription>
            Choose what updates you'd like to receive via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Saved vehicle updates</p>
              <p className="text-xs text-muted-foreground">
                Get notified when saved vehicles have updates
              </p>
            </div>
            <Switch
              checked={preferences.savedVehicleUpdates}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, savedVehicleUpdates: checked })
              }
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Price drop alerts</p>
              <p className="text-xs text-muted-foreground">
                Be notified when prices drop on vehicles you saved
              </p>
            </div>
            <Switch
              checked={preferences.priceDropAlerts}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, priceDropAlerts: checked })
              }
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Message notifications</p>
              <p className="text-xs text-muted-foreground">
                Get notified of new messages from dealers
              </p>
            </div>
            <Switch
              checked={preferences.messageNotifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, messageNotifications: checked })
              }
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Announcements</p>
              <p className="text-xs text-muted-foreground">
                Occasional updates about new features
              </p>
            </div>
            <Switch
              checked={preferences.announcements}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, announcements: checked })
              }
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Save preferences'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Privacy Settings Modal
function PrivacySettingsModal({ 
  open, 
  onClose, 
  userId 
}: { 
  open: boolean; 
  onClose: () => void; 
  userId: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    profileVisibility: 'platform-only' as 'public' | 'platform-only' | 'private',
    discoverable: true,
  });
  const [originalSettings, setOriginalSettings] = useState(settings);

  // Load settings on mount
  useState(() => {
    if (open) {
      setLoading(true);
      fetch(`/api/privacy/settings?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.settings) {
            setSettings(data.settings);
            setOriginalSettings(data.settings);
          }
        })
        .catch(() => {
          toast({
            title: 'Failed to load settings',
            description: 'Using default settings.',
            variant: 'destructive',
          });
        })
        .finally(() => setLoading(false));
    }
  });

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/privacy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, settings }),
      });

      if (response.ok) {
        setOriginalSettings(settings);
        toast({
          title: 'Settings saved',
          description: 'Your privacy settings have been updated.',
        });
        onClose();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      // Rollback on error
      setSettings(originalSettings);
      toast({
        title: 'Failed to save settings',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Privacy Settings</DialogTitle>
          <DialogDescription>
            Control how others see and interact with your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Profile visibility</Label>
            <RadioGroup
              value={settings.profileVisibility}
              onValueChange={(value) => 
                setSettings({ ...settings, profileVisibility: value as any })
              }
              disabled={loading}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="public" id="public" className="mt-0.5" />
                <div className="space-y-0.5">
                  <Label htmlFor="public" className="font-normal cursor-pointer">
                    Public
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Anyone can view your profile, even outside the platform
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="platform-only" id="platform-only" className="mt-0.5" />
                <div className="space-y-0.5">
                  <Label htmlFor="platform-only" className="font-normal cursor-pointer">
                    Platform only (recommended)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only logged-in Carly users can view your profile
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="private" id="private" className="mt-0.5" />
                <div className="space-y-0.5">
                  <Label htmlFor="private" className="font-normal cursor-pointer">
                    Private
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Your profile is hidden from everyone except dealers you message
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Discoverable</p>
              <p className="text-xs text-muted-foreground">
                Allow your profile to appear in dealer searches
              </p>
            </div>
            <Switch
              checked={settings.discoverable}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, discoverable: checked })
              }
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Save settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Account Security Modal
function AccountSecurityModal({ 
  open, 
  onClose, 
  userId 
}: { 
  open: boolean; 
  onClose: () => void; 
  userId: string;
}) {
  const { toast } = useToast();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Security</DialogTitle>
            <DialogDescription>
              Manage your password, two-factor authentication, and active sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">
                    Last changed 3 weeks ago
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change
                </Button>
              </div>
            </div>

            <div className="space-y-3 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorEnabled ? 'Enabled via authenticator app' : 'Add an extra layer of security'}
                  </p>
                </div>
                <Button 
                  variant={twoFactorEnabled ? "outline" : "default"}
                  size="sm"
                  onClick={() => setShow2FAModal(true)}
                >
                  {twoFactorEnabled ? 'Manage' : 'Enable'}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Active sessions</p>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">Current device</p>
                    <p className="text-muted-foreground">Toronto, ON · Today</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Active</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Multi-session management and revocation coming soon.
              </p>
            </div>
          </div>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <PasswordChangeModal 
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userId={userId}
      />

      {/* 2FA Management Modal */}
      <TwoFactorModal 
        open={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        userId={userId}
        enabled={twoFactorEnabled}
        onStatusChange={setTwoFactorEnabled}
      />
    </>
  );
}

// Password Change Modal
function PasswordChangeModal({
  open,
  onClose,
  userId
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSendResetEmail = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          title: 'Password reset email sent',
          description: 'Check your email for instructions to reset your password.',
        });
        onClose();
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      toast({
        title: 'Failed to send reset email',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            We'll send you a secure link to reset your password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email address</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter the email associated with your account
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSendResetEmail} 
            disabled={loading || !email}
            className="flex-1"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Two-Factor Authentication Modal
function TwoFactorModal({
  open,
  onClose,
  userId,
  enabled,
  onStatusChange
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  enabled: boolean;
  onStatusChange: (enabled: boolean) => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'manage'>('intro');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const handleEnable2FA = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep('setup');
      } else {
        throw new Error('Failed to enable 2FA');
      }
    } catch (error) {
      toast({
        title: 'Failed to enable 2FA',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode }),
      });

      if (response.ok) {
        onStatusChange(true);
        toast({
          title: 'Two-factor authentication enabled',
          description: 'Your account is now more secure.',
        });
        onClose();
      } else {
        throw new Error('Invalid code');
      }
    } catch (error) {
      toast({
        title: 'Invalid verification code',
        description: 'Please check the code and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        onStatusChange(false);
        toast({
          title: 'Two-factor authentication disabled',
          description: 'You can re-enable it anytime.',
        });
        onClose();
      } else {
        throw new Error('Failed to disable 2FA');
      }
    } catch (error) {
      toast({
        title: 'Failed to disable 2FA',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {!enabled && step === 'intro' && (
          <>
            <DialogHeader>
              <DialogTitle>Enable two-factor authentication</DialogTitle>
              <DialogDescription>
                Add an extra layer of security to your account using an authenticator app.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-medium text-foreground">How it works:</p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Scan a QR code with your authenticator app</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Enter a 6-digit code when signing in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Your account stays protected even if your password is compromised</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Recommended apps:</p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Google Authenticator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Authy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>1Password</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleEnable2FA}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Setting up...' : 'Continue'}
              </Button>
            </div>
          </>
        )}

        {!enabled && step === 'setup' && (
          <>
            <DialogHeader>
              <DialogTitle>Scan QR code</DialogTitle>
              <DialogDescription>
                Use your authenticator app to scan this QR code.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-xs text-muted-foreground text-center px-4">
                    QR code will appear here
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Manual entry code:</p>
                <div className="bg-muted/50 rounded-lg p-3">
                  <code className="text-xs font-mono text-foreground break-all">
                    {secret || 'XXXX XXXX XXXX XXXX'}
                  </code>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => setStep('verify')}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {!enabled && step === 'verify' && (
          <>
            <DialogHeader>
              <DialogTitle>Verify code</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code from your authenticator app.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="verify-code">Verification code</Label>
                <Input
                  id="verify-code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  className="text-center text-lg tracking-widest font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('setup')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? 'Verifying...' : 'Verify & enable'}
              </Button>
            </div>
          </>
        )}

        {enabled && (
          <>
            <DialogHeader>
              <DialogTitle>Two-factor authentication</DialogTitle>
              <DialogDescription>
                Your account is protected with two-factor authentication.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-medium text-foreground">2FA is enabled</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll be asked for a code from your authenticator app when signing in.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Recovery options:</p>
                <p className="text-xs text-muted-foreground">
                  If you lose access to your authenticator app, contact support to regain access to your account.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
