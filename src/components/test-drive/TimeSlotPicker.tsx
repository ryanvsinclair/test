'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string;
  onSelectTime: (time: string) => void;
}

const PERIODS = ['Morning', 'Afternoon', 'Evening'] as const;
type TimePeriod = typeof PERIODS[number];

// Single source of truth for period ranges
const PERIOD_RANGES = {
  Morning: { start: 9, end: 12 },
  Afternoon: { start: 12, end: 17 },
  Evening: { start: 17, end: 20 },
} as const;

/**
 * Format minutes since midnight to time string
 */
function formatMinutesToTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const period = hour >= 12 ? 'PM' : 'AM';
  const minuteStr = minute.toString().padStart(2, '0');
  return `${displayHour}:${minuteStr} ${period}`;
}

/**
 * Generate time slots for a specific period
 */
function generateTimeSlotsForPeriod(period: TimePeriod, selectedDate: string): string[] {
  const { start, end } = PERIOD_RANGES[period];
  const now = new Date();
  const selected = new Date(selectedDate + 'T00:00:00');
  const isToday = selected.toDateString() === now.toDateString();
  
  const slots: string[] = [];
  let startMinutes = start * 60;
  const endMinutes = end * 60;
  
  // If today, adjust start time to be in the future
  if (isToday) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const roundedMinutes = Math.ceil(currentMinutes / 15) * 15;
    
    // Only adjust if current time is within this period
    if (roundedMinutes >= startMinutes && roundedMinutes < endMinutes) {
      startMinutes = roundedMinutes;
    } else if (roundedMinutes >= endMinutes) {
      // Period has passed for today
      return [];
    }
  }
  
  // Generate 15-minute intervals
  for (let current = startMinutes; current < endMinutes; current += 15) {
    slots.push(formatMinutesToTime(current));
  }
  
  return slots;
}

/**
 * Generate all available time slots grouped by period
 */
function generateAllTimeSlots(selectedDate: string): Record<TimePeriod, string[]> {
  const groups: Record<TimePeriod, string[]> = {
    Morning: [],
    Afternoon: [],
    Evening: [],
  };

  PERIODS.forEach((period) => {
    groups[period] = generateTimeSlotsForPeriod(period, selectedDate);
  });

  return groups;
}

export function TimeSlotPicker({ selectedDate, selectedTime, onSelectTime }: TimeSlotPickerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('Morning');
  
  // Generate slots grouped by period - single source of truth
  const groupedSlots = useMemo(() => generateAllTimeSlots(selectedDate), [selectedDate]);

  // Auto-select first available period on mount or date change
  useEffect(() => {
    const firstAvailablePeriod = PERIODS.find(period => groupedSlots[period]?.length > 0);
    if (firstAvailablePeriod && groupedSlots[selectedPeriod]?.length === 0) {
      setSelectedPeriod(firstAvailablePeriod);
    }
  }, [selectedDate, groupedSlots, selectedPeriod]);
  
  // Reset selected time when period changes
  useEffect(() => {
    onSelectTime('');
  }, [selectedPeriod, onSelectTime]);

  const cyclePeriod = () => {
    setSelectedPeriod((prev) => {
      const index = PERIODS.indexOf(prev);
      let nextIndex = (index + 1) % PERIODS.length;
      
      // Skip periods with no slots
      let attempts = 0;
      while (attempts < PERIODS.length) {
        const candidate = PERIODS[nextIndex];
        if (groupedSlots[candidate]?.length > 0) {
          return candidate;
        }
        nextIndex = (nextIndex + 1) % PERIODS.length;
        attempts++;
      }
      
      return prev; // Fallback if no periods available
    });
  };

  // Check if any slots are available across all periods
  const hasAnySlots = PERIODS.some(period => groupedSlots[period]?.length > 0);

  if (!hasAnySlots) {
    return (
      <div className="p-8 text-center space-y-2 bg-muted/30 rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          No available time slots for this date
        </p>
        <p className="text-xs text-muted-foreground">
          Dealership is closed. Please select a different date.
        </p>
      </div>
    );
  }

  const currentPeriodSlots = groupedSlots[selectedPeriod] || [];

  const getPeriodTimeRange = (period: TimePeriod): string => {
    const range = PERIOD_RANGES[period];
    const formatHour = (hour: number) => {
      if (hour === 12) return '12:00 PM';
      if (hour < 12) return `${hour}:00 AM`;
      if (hour === 24) return '12:00 AM';
      return `${hour - 12}:00 PM`;
    };
    return `${formatHour(range.start)} – ${formatHour(range.end)}`;
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <motion.h4 
              key={selectedPeriod}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              {selectedPeriod}
            </motion.h4>
            <motion.p
              key={`range-${selectedPeriod}`}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="text-xs text-muted-foreground"
            >
              {getPeriodTimeRange(selectedPeriod)}
            </motion.p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              cyclePeriod();
            }}
            className="text-xs text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent/50 rounded px-2 py-1 transition-all"
          >
            Change period
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPeriod}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="max-h-[280px] overflow-y-auto pr-1 space-y-1.5 clean-scrollbar"
          >
            {currentPeriodSlots.map((slot) => {
              const isSelected = slot === selectedTime;

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectTime(slot);
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200',
                    'hover:border-accent/50 hover:bg-muted/50 hover:scale-[1.01]',
                    'focus:outline-none focus:ring-2 focus:ring-accent/50',
                    'active:scale-[0.99]',
                    isSelected && 'bg-accent text-accent-foreground border-accent font-medium shadow-sm scale-[1.01]',
                    !isSelected && 'border-border bg-background'
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <p className="text-xs text-center text-muted-foreground pt-1">
          Dealer will confirm availability
        </p>
      </div>
    </div>
  );
}
