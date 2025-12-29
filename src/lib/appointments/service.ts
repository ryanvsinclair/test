/**
 * Appointment Service - Single Source of Truth for Scheduling
 * 
 * This is the canonical interface for all appointment-related operations.
 * All booking requests must flow through this service.
 * 
 * CRITICAL: "Test drive" is an appointment type, not a separate system.
 */

import { appointmentsDb } from './db';
import { initializeAppointmentSteps } from './state-machine';
import type { Appointment, AppointmentType } from '@/types/appointments';

export interface CreateAppointmentInput {
  appointment_type: AppointmentType;
  listing_id: string;
  vehicle_id?: string;
  buyer_id: string;
  seller_id: string;
  seller_type: 'dealer' | 'buyer';
  staff_id?: string;
  proposed_datetime: Date;
  location: string;
  metadata?: {
    buyer_name?: string;
    buyer_email?: string;
    buyer_message?: string;
    dealer_name?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    [key: string]: any;
  };
}

export interface CreateAppointmentResult {
  success: boolean;
  appointment?: Appointment;
  error?: string;
}

export const appointmentsService = {
  /**
   * Create a new appointment
   * 
   * This is the ONLY way to create appointments in the system.
   * Validates input, checks overlaps, creates appointment, initializes timeline.
   * 
   * @param input - Appointment creation parameters
   * @returns Result with appointment or error
   */
  async createAppointment(
    input: CreateAppointmentInput
  ): Promise<CreateAppointmentResult> {
    try {
      // Validate required fields
      if (!input.listing_id || !input.buyer_id || !input.seller_id) {
        return {
          success: false,
          error: 'Missing required fields: listing_id, buyer_id, seller_id',
        };
      }

      if (!input.proposed_datetime || isNaN(input.proposed_datetime.getTime())) {
        return {
          success: false,
          error: 'Invalid proposed_datetime',
        };
      }

      // Check for buyer overlap
      const buyerOverlap = await this._checkBuyerOverlap(
        input.buyer_id,
        input.proposed_datetime
      );
      if (buyerOverlap) {
        return {
          success: false,
          error: 'You have a conflicting appointment at this time',
        };
      }

      // Check for seller/vehicle overlap
      const sellerOverlap = await this._checkSellerOverlap(
        input.seller_id,
        input.listing_id,
        input.proposed_datetime
      );
      if (sellerOverlap) {
        return {
          success: false,
          error: 'This vehicle is not available at the requested time',
        };
      }

      // Create appointment
      const appointment = await appointmentsDb.createAppointment({
        listing_id: input.listing_id,
        vehicle_id: input.vehicle_id || input.listing_id,
        buyer_id: input.buyer_id,
        seller_id: input.seller_id,
        seller_type: input.seller_type,
        staff_id: input.staff_id,
        appointment_type: input.appointment_type,
        proposed_datetime: input.proposed_datetime,
        location: input.location,
        status: 'pending_confirmation',
        current_step: 'created',
        metadata: input.metadata || {},
      });

      // Initialize timeline
      await initializeAppointmentSteps(appointment.id);

      return {
        success: true,
        appointment,
      };
    } catch (error) {
      console.error('Error creating appointment:', error);
      return {
        success: false,
        error: 'Failed to create appointment',
      };
    }
  },

  /**
   * Check if buyer has overlapping confirmed appointments
   * @private
   */
  async _checkBuyerOverlap(
    buyer_id: string,
    proposed_datetime: Date
  ): Promise<boolean> {
    const appointments = await appointmentsDb.getAppointmentsByBuyer(buyer_id);
    
    // Only check confirmed appointments
    const confirmedAppointments = appointments.filter(
      (a) => a.status === 'confirmed' || a.status === 'in_progress'
    );

    const proposedStart = proposed_datetime;
    const proposedEnd = new Date(proposedStart.getTime() + 60 * 60 * 1000); // 1 hour

    for (const appointment of confirmedAppointments) {
      const existingStart = appointment.proposed_datetime;
      const existingEnd = new Date(existingStart.getTime() + 60 * 60 * 1000);

      // Check for overlap
      if (proposedStart < existingEnd && proposedEnd > existingStart) {
        return true;
      }
    }

    return false;
  },

  /**
   * Check if seller has overlapping appointments for same vehicle
   * @private
   */
  async _checkSellerOverlap(
    seller_id: string,
    listing_id: string,
    proposed_datetime: Date
  ): Promise<boolean> {
    const appointments = await appointmentsDb.getAppointmentsBySeller(seller_id);
    
    // Only check confirmed appointments for same vehicle
    const vehicleAppointments = appointments.filter(
      (a) =>
        a.listing_id === listing_id &&
        (a.status === 'confirmed' || a.status === 'in_progress')
    );

    const proposedStart = proposed_datetime;
    const proposedEnd = new Date(proposedStart.getTime() + 60 * 60 * 1000); // 1 hour

    for (const appointment of vehicleAppointments) {
      const existingStart = appointment.proposed_datetime;
      const existingEnd = new Date(existingStart.getTime() + 60 * 60 * 1000);

      // Check for overlap
      if (proposedStart < existingEnd && proposedEnd > existingStart) {
        return true;
      }
    }

    return false;
  },
};
