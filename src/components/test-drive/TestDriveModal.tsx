'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { Vehicle } from '@/types';
import { CustomCalendar } from './CustomCalendar';
import { TimeSlotPicker } from './TimeSlotPicker';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onSubmit: (data: {
    requestedDate: string;
    requestedTime: string;
    message?: string;
  }) => void;
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 * Timezone-safe helper for date input default values
 */
function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate realistic time slots based on current time and dealer hours
 * Rounds up to next 15/30 minute interval and generates options
 */
function generateTimeSlots(selectedDate: string): string[] {
  const now = new Date();
  const selected = new Date(selectedDate + 'T00:00:00');
  const isToday = selected.toDateString() === now.toDateString();
  
  // Dealer hours (configurable)
  const openingHour = 9; // 9 AM
  const closingHour = 18; // 6 PM
  
  const slots: string[] = [];
  let startHour = openingHour;
  let startMinute = 0;
  
  if (isToday) {
    // Round up to next 15/30 minute interval
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const roundedMinutes = Math.ceil(currentMinutes / 15) * 15;
    
    startHour = Math.floor(roundedMinutes / 60);
    startMinute = roundedMinutes % 60;
    
    // If past closing, no slots available today
    if (startHour >= closingHour) {
      return [];
    }
  }
  
  // Generate slots with 15-minute and 30-minute intervals
  for (let hour = startHour; hour < closingHour; hour++) {
    const intervals = hour === startHour && startMinute > 0 
      ? [startMinute, startMinute + 15, startMinute + 30, startMinute + 45].filter(m => m < 60)
      : [0, 15, 30, 45];
    
    for (const minute of intervals) {
      const totalMinutes = hour * 60 + minute;
      if (totalMinutes >= closingHour * 60) break;
      
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      const minuteStr = minute.toString().padStart(2, '0');
      
      slots.push(`${displayHour}:${minuteStr} ${period}`);
    }
  }
  
  return slots;
}

export function TestDriveModal({ open, onClose, vehicle, onSubmit }: AppointmentModalProps) {
  const todayDate = getTodayDateString();
  
  const [requestedDate, setRequestedDate] = useState(todayDate);
  const [requestedTime, setRequestedTime] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Reset date to today when modal opens
  useEffect(() => {
    if (open) {
      setRequestedDate(getTodayDateString());
      setRequestedTime('');
      setMessage('');
      setSubmitted(false);
      setShowCalendar(false);
    }
  }, [open]);
  
  const handleSelectDate = (date: string) => {
    setRequestedDate(date);
    setRequestedTime(''); // Reset time when date changes
    setShowCalendar(false); // Close calendar after selection
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestedDate || !requestedTime) {
      return;
    }

    onSubmit({
      requestedDate,
      requestedTime,
      message: message.trim() || undefined,
    });

    setSubmitted(true);
    
    setTimeout(() => {
      handleClose();
    }, 2500);
  };

  const handleClose = () => {
    setRequestedDate(todayDate);
    setRequestedTime('');
    setMessage('');
    setSubmitted(false);
    onClose();
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8 space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl font-light mb-2">Appointment Requested</h3>
              <p className="text-muted-foreground text-sm">
                The dealer will review your request and confirm shortly.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        <DialogHeader className="space-y-3 flex-shrink-0">
          <DialogTitle className="text-2xl font-light">Schedule Appointment</DialogTitle>
          
          {/* Vehicle Context */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <img
              src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80'}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-16 h-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <p className="text-xs text-muted-foreground">
                ${vehicle.price.toLocaleString()}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mx-6 px-6 clean-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6 mt-2">
            {/* Date & Time Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Preferred Date
                </Label>
                
                {/* Date Display Button */}
                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-left font-medium"
                >
                  {formatDisplayDate(requestedDate)}
                </button>

                {/* Custom Calendar */}
                {showCalendar && (
                  <div className="mt-2 p-3 border border-border rounded-lg bg-card shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    <CustomCalendar
                      selectedDate={requestedDate}
                      onSelectDate={handleSelectDate}
                      minDate={todayDate}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Preferred Time
                </Label>
                
                <TimeSlotPicker
                  selectedDate={requestedDate}
                  selectedTime={requestedTime}
                  onSelectTime={setRequestedTime}
                />
              </div>
            </div>

            <Separator />

            {/* Optional Message Section */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm">
                Message <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any specific questions or requirements..."
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-lg"
                  disabled={!requestedTime}
                >
                  Request Appointment
                </Button>
              </div>
              
              {/* Helper Text */}
              <p className="text-xs text-center text-muted-foreground">
                Dealer confirmation required. No commitment.
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
