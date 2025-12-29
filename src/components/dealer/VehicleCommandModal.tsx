"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { X, Save, Eye, Heart, MessageSquare, Calendar, TrendingUp, TrendingDown, Upload, Trash2, GripVertical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VehicleCommandModalProps {
  listing: {
    listingId: string;
    stockNumber: string;
    vin: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    price: number;
    mileage: number;
    photos: string[];
    status: 'active' | 'paused' | 'pending' | 'sold';
    metrics: {
      views: number;
      saves: number;
      messages: number;
      appointments: number;
    };
    carfaxS3Key?: string;
    carfaxUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
  open: boolean;
  onClose: () => void;
  onSave: (updatedListing: any) => Promise<void>;
}

export function VehicleCommandModal({ listing, open, onClose, onSave }: VehicleCommandModalProps) {
  const [editedListing, setEditedListing] = useState(listing);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditedListing(listing);
    setHasChanges(false);
  }, [listing]);

  const handleClose = () => {
    if (hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedListing);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save listing:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setEditedListing(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysInStock = () => {
    const created = new Date(listing.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-light">
                  {editedListing.year} {editedListing.make} {editedListing.model}
                  {editedListing.trim && ` ${editedListing.trim}`}
                </DialogTitle>
                <p className="text-sm text-neutral-500 mt-1">
                  Stock #{editedListing.stockNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    editedListing.status === 'active' ? 'default' :
                    editedListing.status === 'sold' ? 'secondary' :
                    'outline'
                  }
                  className="capitalize"
                >
                  {editedListing.status}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4 flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Fixed height container for all tabs */}
            <div className="relative flex-1 overflow-y-auto min-h-[500px]">
              <TabsContent value="details" className="space-y-4 mt-4 absolute inset-0 overflow-y-auto data-[state=inactive]:hidden">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stockNumber">Stock Number</Label>
                  <Input
                    id="stockNumber"
                    value={editedListing.stockNumber}
                    onChange={(e) => updateField('stockNumber', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="vin">VIN</Label>
                  <Input
                    id="vin"
                    value={editedListing.vin}
                    readOnly
                    className="bg-neutral-50 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={editedListing.year}
                    onChange={(e) => updateField('year', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={editedListing.make}
                    onChange={(e) => updateField('make', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={editedListing.model}
                    onChange={(e) => updateField('model', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="trim">Trim</Label>
                  <Input
                    id="trim"
                    value={editedListing.trim || ''}
                    onChange={(e) => updateField('trim', e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editedListing.price}
                    onChange={(e) => updateField('price', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={editedListing.mileage}
                    onChange={(e) => updateField('mileage', parseInt(e.target.value))}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editedListing.status}
                    onValueChange={(value: any) => updateField('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="mt-4 absolute inset-0 overflow-y-auto data-[state=inactive]:hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-500">
                    {editedListing.photos.length} photo{editedListing.photos.length !== 1 ? 's' : ''}
                  </p>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {editedListing.photos.map((photo, index) => (
                    <div key={index} className="relative group aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`Vehicle ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4 absolute inset-0 overflow-y-auto data-[state=inactive]:hidden">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Carfax Report</h3>
                      <p className="text-sm text-neutral-500">Vehicle history document</p>
                    </div>
                    {editedListing.carfaxUrl ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={editedListing.carfaxUrl} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                        <Button variant="outline" size="sm">
                          Replace
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Carfax
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="mt-4 space-y-4 absolute inset-0 overflow-y-auto data-[state=inactive]:hidden">
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-neutral-500 mb-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Views</span>
                  </div>
                  <p className="text-2xl font-light">{listing.metrics.views}</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 text-neutral-500 mb-2">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">Saves</span>
                  </div>
                  <p className="text-2xl font-light">{listing.metrics.saves}</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 text-neutral-500 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">Messages</span>
                  </div>
                  <p className="text-2xl font-light">{listing.metrics.messages}</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 text-neutral-500 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Appointments</span>
                  </div>
                  <p className="text-2xl font-light">{listing.metrics.appointments}</p>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="font-medium mb-4">Activity Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    <div>
                      <p className="text-neutral-600 dark:text-neutral-400">Listing created</p>
                      <p className="text-neutral-400 text-xs">{formatDate(listing.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                    <div>
                      <p className="text-neutral-600 dark:text-neutral-400">Last updated</p>
                      <p className="text-neutral-400 text-xs">{formatDate(listing.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                    <div>
                      <p className="text-neutral-600 dark:text-neutral-400">Days in stock</p>
                      <p className="text-neutral-400 text-xs">{getDaysInStock()} days</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            </div>
          </Tabs>

          <div className="flex items-center justify-between pt-4 border-t mt-6 flex-shrink-0">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowUnsavedDialog(false);
              onClose();
            }}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
