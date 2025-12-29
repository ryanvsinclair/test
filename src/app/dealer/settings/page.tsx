"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
// Mock data removed - connect to real database
import { Building, Users, Bell, Upload, Sparkles, MailCheck } from 'lucide-react';
import { DealerBrandingSettings } from '@/components/dealer/DealerBrandingSettings';
import { AddTeamMemberDialog } from '@/components/dealer/AddTeamMemberDialog';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useAuth();
  // TODO: Replace with real database query
  const [profile, setProfile] = useState<any>({});
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);

  const handleInviteSuccess = () => {
    // Refresh team members list
    // In production, this would fetch from the backend
    console.log('Team member invited successfully');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-50">Settings</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage your dealership profile and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-neutral-100 dark:bg-neutral-800 relative">
          <TabsTrigger value="profile" className="gap-2">
            <Building className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6" tabIndex={-1}>
          <h2 className="sr-only">Profile Settings</h2>
          <Card className="border-neutral-200 dark:border-neutral-800">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">Dealership Information</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Update your dealership details</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {profile.logo && (
                    <img
                      src={profile.logo}
                      alt="Logo"
                      className="w-20 h-20 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
                    />
                  )}
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dealerName">Dealership Name</Label>
                  <Input
                    id="dealerName"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    value={profile.zip}
                    onChange={(e) => setProfile({ ...profile, zip: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Business Hours</Label>
                <div className="space-y-2">
                  {Object.entries(profile.hours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4">
                      <span className="w-24 text-sm text-neutral-700 capitalize">{day}</span>
                      <Input
                        value={hours}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            hours: { ...profile.hours, [day]: e.target.value },
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700 primary-glow">Save Changes</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6" tabIndex={-1}>
          <h2 className="sr-only">Branding Settings</h2>
          {user && (
            <DealerBrandingSettings dealerId={user.id} />
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6" tabIndex={-1}>
          <h2 className="sr-only">Team Settings</h2>
          <Card className="border-neutral-200 dark:border-neutral-800">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">Team Members</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage access and roles</p>
                </div>
                <Button onClick={() => setIsAddMemberDialogOpen(true)}>Add Member</Button>
              </div>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                      <span className="text-neutral-700 dark:text-neutral-200 font-medium">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-900 dark:text-neutral-50">{member.name}</p>
                        {member.active ? (
                          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <MailCheck className="w-3 h-3" />
                            Invited
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 capitalize px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                      {member.role}
                    </span>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6" tabIndex={-1}>
          <h2 className="sr-only">Notification Settings</h2>
          <Card className="border-neutral-200 dark:border-neutral-800">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">Notification Preferences</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Choose what you want to be notified about</p>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">New Messages</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Get notified when buyers message you</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">Test Drive Requests</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Get notified of new test drive bookings</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">Listing Performance</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Weekly summary of your listings' performance</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">New Reviews</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Get notified when you receive a new review</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">Marketing Tips</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive tips to improve your listings</p>
                </div>
                <Switch />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">Platform Updates</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Stay informed about new features</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          <Card className="border-neutral-200 dark:border-neutral-800">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">Reminder Settings</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Automated reminders for appointments</p>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">Test Drive Reminders</p>
                  <p className="text-sm text-neutral-500">Send reminder 1 hour before test drive</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">Follow-up Reminders</p>
                  <p className="text-sm text-neutral-500">Remind me to follow up on leads after 2 days</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          {/* Footer Link */}
          <div className="text-center pt-4">
            <Link href="/ask" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ask Carly (Support & Feedback)
            </Link>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Team Member Dialog */}
      <AddTeamMemberDialog
        open={isAddMemberDialogOpen}
        onOpenChange={setIsAddMemberDialogOpen}
        dealerEmail={user?.email || profile.email}
        dealerId={user?.id || 'dealer-1'}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}
