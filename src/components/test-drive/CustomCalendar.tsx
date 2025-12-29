'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CustomCalendar({ selectedDate, onSelectDate, minDate }: CustomCalendarProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const [year, month] = selectedDate.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Check if disabled
    if (minDate && dateStr < minDate) return;
    
    onSelectDate(dateStr);
  };

  const isToday = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return dateStr === todayStr;
  };

  const isSelected = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return dateStr === selectedDate;
  };

  const isDisabled = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return minDate ? dateStr < minDate : false;
  };

  const isNearTerm = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const date = new Date(dateStr);
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7; // Next 7 days
  };

  const handleQuickPick = (type: 'today' | 'tomorrow' | 'weekend' | 'nextWeek') => {
    const now = new Date();
    let targetDate: Date;

    switch (type) {
      case 'today':
        targetDate = now;
        break;
      case 'tomorrow':
        targetDate = new Date(now);
        targetDate.setDate(now.getDate() + 1);
        break;
      case 'weekend':
        // Next Saturday
        targetDate = new Date(now);
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilSaturday);
        break;
      case 'nextWeek':
        // Next Monday
        targetDate = new Date(now);
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilMonday);
        break;
    }

    const dateStr = `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}-${targetDate.getDate().toString().padStart(2, '0')}`;
    setViewDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    onSelectDate(dateStr);
  };

  return (
    <div className="space-y-4 p-1">
      {/* Quick Pick Shortcuts */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleQuickPick('today')}
          className="flex-1 h-8 text-xs"
        >
          Today
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleQuickPick('tomorrow')}
          className="flex-1 h-8 text-xs"
        >
          Tomorrow
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleQuickPick('weekend')}
          className="flex-1 h-8 text-xs"
        >
          Weekend
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleQuickPick('nextWeek')}
          className="flex-1 h-8 text-xs"
        >
          Next Week
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handlePrevMonth}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-sm font-medium">
          {MONTHS[month]} {year}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground h-8 flex items-center justify-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-9" />;
            }

            const disabled = isDisabled(day);
            const selected = isSelected(day);
            const today = isToday(day);
            const nearTerm = isNearTerm(day);

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDay(day)}
                disabled={disabled}
                className={cn(
                  'h-9 text-sm rounded-lg transition-all duration-200',
                  'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent/50',
                  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
                  selected && 'bg-accent text-accent-foreground font-medium shadow-sm scale-105',
                  !selected && today && 'bg-accent/10 font-medium border border-accent/30',
                  !selected && !today && nearTerm && 'bg-muted/50',
                  !disabled && !selected && 'hover:scale-105 active:scale-95'
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-center text-muted-foreground">
        Near-term dates are preferred for scheduling
      </p>
    </div>
  );
}
