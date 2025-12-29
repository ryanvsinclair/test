"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  Mail,
  MapPin,
  User,
  Check,
  X,
  CalendarDays,
  LayoutList,
  CheckCircle,
  Circle,
  Lock,
  Car,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Appointment, AppointmentStep, StepType } from '@/types/appointments';

const STEP_CONFIG: Record<
  StepType,
  { label: string; icon: any }
> = {
  created: { label: 'Created', icon: CalendarIcon },
  confirmed: { label: 'Confirmed', icon: CheckCircle },
  arrived: { label: 'Arrived', icon: MapPin },
  activity_completed: { label: 'Completed', icon: Car },
  outcome_declared: { label: 'Outcome', icon: Eye },
  reviewed: { label: 'Reviewed', icon: FileText },
};

export default function DealerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(true);
  
  const dealerId = 'dealer-001';

  useEffect(() => {
    // Render page shell immediately, fetch data after mount
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function fetchAppointments() {
    try {
      const response = await fetch(`/api/appointments?seller_id=${dealerId}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  const requestedAppointments = appointments.filter(
    (a) => a.status === 'pending_confirmation'
  );
  const confirmedAppointments = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'in_progress'
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending_confirmation: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      confirmed: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      in_progress: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      completed: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      cancelled: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      no_show: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    };

    return (
      <Badge variant="outline" className={colors[status] || ''}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-50">
            Appointments
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage buyer meetings and track reputation signals
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span className="text-sm font-medium">List</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'calendar'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-medium">Calendar</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Pending Requests</p>
          <p className="text-3xl font-light mt-1 text-neutral-900 dark:text-neutral-50">
            {requestedAppointments.length}
          </p>
        </Card>
        <Card className="p-6 border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Confirmed</p>
          <p className="text-3xl font-light mt-1 text-neutral-900 dark:text-neutral-50">
            {confirmedAppointments.length}
          </p>
        </Card>
        <Card className="p-6 border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">This Week</p>
          <p className="text-3xl font-light mt-1 text-neutral-900 dark:text-neutral-50">
            {[...requestedAppointments, ...confirmedAppointments].length}
          </p>
        </Card>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Pending Requests */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-50">
                Pending Requests
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {requestedAppointments.map((appointment) => (
                <Card key={appointment.id} className="border-neutral-200 dark:border-neutral-800">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
                            Buyer #{appointment.buyer_id.slice(0, 8)}
                          </h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                        >
                          {appointment.appointment_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-50">
                          <CalendarIcon className="w-4 h-4" />
                          <span className="font-medium">
                            {format(new Date(appointment.proposed_datetime), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
                          {format(new Date(appointment.proposed_datetime), 'h:mm a')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                        Vehicle
                      </p>
                      <p className="text-neutral-900 dark:text-neutral-50 font-medium">
                        Listing #{appointment.listing_id.slice(0, 8)}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <MapPin className="w-4 h-4" />
                        {appointment.location}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          // Handle confirm
                        }}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Confirm
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <X className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Confirmed Appointments */}
          {confirmedAppointments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-50">
                  Confirmed Appointments
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {confirmedAppointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className="border-neutral-200 dark:border-neutral-800 border-l-4 border-l-purple-500 dark:border-l-purple-400"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
                              Buyer #{appointment.buyer_id.slice(0, 8)}
                            </h3>
                            {getStatusBadge(appointment.status)}
                          </div>
                          
                          <div className="mt-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 inline-block">
                            <p className="text-sm text-neutral-900 dark:text-neutral-50 font-medium">
                              Listing #{appointment.listing_id.slice(0, 8)}
                            </p>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                              Current Step:
                            </p>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                            >
                              {STEP_CONFIG[appointment.current_step as StepType].label}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-50">
                            <CalendarIcon className="w-4 h-4" />
                            <span className="font-medium">
                              {format(new Date(appointment.proposed_datetime), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
                            {format(new Date(appointment.proposed_datetime), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {requestedAppointments.length === 0 && confirmedAppointments.length === 0 && (
            <Card className="border-neutral-200 dark:border-neutral-800">
              <div className="p-12 text-center">
                <CalendarIcon className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                  No Appointments Scheduled
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  New appointment requests will appear here
                </p>
              </div>
            </Card>
          )}
        </>
      ) : (
        <CalendarView appointments={confirmedAppointments} />
      )}
    </div>
  );
}

// Calendar View Component
function CalendarView({ appointments }: { appointments: Appointment[] }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<'day' | 'week'>('week');
  
  const weekStart = startOfWeek(selectedDate);
  
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const dateKey = format(new Date(appointment.proposed_datetime), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(viewType === 'week' ? subWeeks(selectedDate, 1) : addDays(selectedDate, -1))}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(viewType === 'week' ? addWeeks(selectedDate, 1) : addDays(selectedDate, 1))}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
            {viewType === 'week' 
              ? `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
              : format(selectedDate, 'MMMM d, yyyy')}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
          <button
            onClick={() => setViewType('day')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              viewType === 'day'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewType('week')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              viewType === 'week'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDate[dateKey] || [];
          const isToday = isSameDay(date, new Date());

          return (
            <Card
              key={dateKey}
              className={`border-neutral-200 dark:border-neutral-800 ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="p-4">
                <div className="text-center mb-3">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    {format(date, 'EEE')}
                  </div>
                  <div className={`text-2xl font-light mt-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-900 dark:text-neutral-50'}`}>
                    {format(date, 'd')}
                  </div>
                </div>

                <div className="space-y-2">
                  {dayAppointments.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-xs text-neutral-400 dark:text-neutral-600">No appointments</div>
                    </div>
                  ) : (
                    dayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3 space-y-1 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1 text-xs text-purple-900 dark:text-purple-300 font-medium">
                          <Clock className="w-3 h-3" />
                          {format(new Date(appointment.proposed_datetime), 'h:mm a')}
                        </div>
                        <div className="text-xs text-neutral-900 dark:text-neutral-50 font-medium truncate">
                          Buyer #{appointment.buyer_id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                          {appointment.appointment_type.replace('_', ' ')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
