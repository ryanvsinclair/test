"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Circle,
  Lock,
  AlertCircle,
  Car,
  Eye,
  FileText,
  Package,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { AppointmentTimeline, AppointmentStep, StepType } from '@/types/appointments';
import { format } from 'date-fns';

const STEP_CONFIG: Record<
  StepType,
  { label: string; icon: any; description: string }
> = {
  created: {
    label: 'Appointment Created',
    icon: Calendar,
    description: 'Initial request submitted',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    description: 'Both parties confirmed',
  },
  arrived: {
    label: 'Arrived',
    icon: MapPin,
    description: 'Check-in completed',
  },
  activity_completed: {
    label: 'Activity Completed',
    icon: Car,
    description: 'Appointment concluded',
  },
  outcome_declared: {
    label: 'Outcome Declared',
    icon: Eye,
    description: 'Interest level shared',
  },
  reviewed: {
    label: 'Reviewed',
    icon: FileText,
    description: 'Experience rated',
  },
};

export default function BuyerAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(
    null
  );
  const [timeline, setTimeline] = useState<AppointmentTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);

  // Mock buyer ID
  const buyerId = 'buyer-001';

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (selectedAppointment) {
      fetchTimeline(selectedAppointment);
    }
  }, [selectedAppointment]);

  async function fetchAppointments() {
    try {
      const response = await fetch(`/api/appointments?buyer_id=${buyerId}`);
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

  async function fetchTimeline(appointmentId: string) {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/timeline`);
      if (response.ok) {
        const data = await response.json();
        setTimeline(data);
      } else {
        // Appointment not found in timeline system, set timeline to null
        setTimeline(null);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
      setTimeline(null);
    }
  }

  async function confirmStep(stepType: StepType) {
    if (!selectedAppointment || !timeline) return;

    // Optimistically update the UI immediately
    const updatedTimeline = {
      ...timeline,
      steps: timeline.steps.map(step => {
        if (step.step_type === stepType) {
          return {
            ...step,
            buyer_confirmed_at: new Date().toISOString(),
          };
        }
        return step;
      })
    };
    setTimeline(updatedTimeline);

    // Then call API in background
    try {
      const response = await fetch(
        `/api/appointments/${selectedAppointment}/confirm-step`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step_type: stepType,
            actor: 'buyer',
            actor_id: buyerId,
          }),
        }
      );

      if (response.ok) {
        // Refresh to get actual state
        await fetchTimeline(selectedAppointment);
        await fetchAppointments();
      }
    } catch (error) {
      console.error('Error confirming step:', error);
      // Revert on error
      await fetchTimeline(selectedAppointment);
    }
  }

  const getStepStatus = (step: AppointmentStep) => {
    if (step.status === 'completed' || step.status === 'locked') {
      return { color: 'text-green-600 dark:text-green-400', icon: CheckCircle };
    }
    if (step.status === 'pending_seller') {
      return { color: 'text-blue-600 dark:text-blue-400', icon: Clock };
    }
    if (step.status === 'pending_buyer') {
      return { color: 'text-orange-600 dark:text-orange-400', icon: AlertCircle };
    }
    return { color: 'text-neutral-400 dark:text-neutral-600', icon: Circle };
  };

  const canConfirmStep = (step: AppointmentStep) => {
    return (
      step.status !== 'completed' &&
      step.status !== 'locked' &&
      !step.buyer_confirmed_at
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-neutral-500 dark:text-neutral-400">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-50">
          Appointments
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Your scheduled vehicle viewings and interactions
        </p>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-1">
              No Appointments Scheduled
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              Schedule your first appointment with a dealer
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {appointments.map((appointment) => (
            <Collapsible
              key={appointment.id}
              open={expandedAppointment === appointment.id}
              onOpenChange={(open) => {
                setExpandedAppointment(open ? appointment.id : null);
                if (open) {
                  setSelectedAppointment(appointment.id);
                }
              }}
            >
              <Card className="border-neutral-200 dark:border-neutral-800">
                <CollapsibleTrigger asChild>
                  <div className="p-6 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Badge
                          variant="outline"
                          className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 mb-2"
                        >
                          {appointment.type?.replace('_', ' ') || 'Appointment'}
                        </Badge>
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                          {appointment.listing?.name || `${appointment.listing?.year} ${appointment.listing?.make} ${appointment.listing?.model}`}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <Car className="w-4 h-4" />
                          {appointment.dealer?.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            appointment.status === 'completed'
                              ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                              : appointment.status === 'confirmed'
                              ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                          }
                        >
                          {appointment.status.replace('_', ' ')}
                        </Badge>
                        {expandedAppointment === appointment.id ? (
                          <ChevronUp className="w-5 h-5 text-neutral-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neutral-500" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                      {appointment.listing?.photos?.[0] && (
                        <img
                          src={appointment.listing.photos[0]}
                          alt={appointment.listing.name || 'Vehicle'}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      )}
                      <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(
                            new Date(appointment.scheduledAt || appointment.proposed_datetime),
                            'MMM d, yyyy'
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {format(new Date(appointment.scheduledAt || appointment.proposed_datetime), 'h:mm a')}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {appointment.location}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Current Step: <span className="font-medium text-neutral-900 dark:text-neutral-50">
                          {appointment.current_step && STEP_CONFIG[appointment.current_step as StepType] 
                            ? STEP_CONFIG[appointment.current_step as StepType].label 
                            : 'Pending'}
                        </span>
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-6 pb-6 border-t border-neutral-200 dark:border-neutral-800">
                    {timeline && selectedAppointment === appointment.id && timeline.steps && timeline.steps.length > 0 ? (
                      <div className="pt-6 space-y-6">
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-50">
                          Appointment Progress
                        </h3>
                        
                        {timeline.steps.map((step, index) => {
                          const config = STEP_CONFIG[step.step_type];
                          const status = getStepStatus(step);
                          const Icon = status.icon;
                          const isLast = index === timeline.steps.length - 1;

                          return (
                            <div key={step.id} className="relative">
                              {!isLast && (
                                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-neutral-200 dark:bg-neutral-800" />
                              )}

                              <div className="flex items-start gap-4">
                                <div
                                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    step.status === 'completed' || step.status === 'locked'
                                      ? 'bg-green-100 dark:bg-green-950/30'
                                      : 'bg-neutral-100 dark:bg-neutral-800'
                                  }`}
                                >
                                  <Icon className={`w-5 h-5 ${status.color}`} />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <h4 className="font-medium text-neutral-900 dark:text-neutral-50">
                                        {config.label}
                                      </h4>
                                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {config.description}
                                      </p>
                                    </div>
                                    {step.status === 'locked' && (
                                      <Lock className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4 text-xs mb-3">
                                    <div
                                      className={`flex items-center gap-1 ${
                                        step.buyer_confirmed_at
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-neutral-400 dark:text-neutral-600'
                                      }`}
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      You{' '}
                                      {step.buyer_confirmed_at
                                        ? format(
                                            new Date(step.buyer_confirmed_at),
                                            'h:mm a'
                                          )
                                        : ''}
                                    </div>
                                    <div
                                      className={`flex items-center gap-1 ${
                                        step.seller_confirmed_at
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-neutral-400 dark:text-neutral-600'
                                      }`}
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      Dealer{' '}
                                      {step.seller_confirmed_at
                                        ? format(
                                            new Date(step.seller_confirmed_at),
                                            'h:mm a'
                                          )
                                        : ''}
                                    </div>
                                  </div>
                                  
                                  {step.buyer_confirmed_at && !step.seller_confirmed_at && (
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                                      Awaiting dealer confirmation
                                    </p>
                                  )}

                                  {canConfirmStep(step) && (
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        confirmStep(step.step_type);
                                      }}
                                    >
                                      Confirm {config.label}
                                      <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="pt-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                        {timeline === null ? 'No timeline data available for this appointment' : 'Loading appointment details...'}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}


    </div>
  );
}
