// API client abstraction layer - AWS-ready architecture
// All external communication goes through this layer

import { Vehicle, User, Message, Conversation, Lead, DashboardStats, FilterOptions } from '@/types';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Vehicle endpoints
  async getVehicles(filters?: FilterOptions): Promise<Vehicle[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    return this.request(`/vehicles?${params.toString()}`);
  }

  async getVehicle(id: string): Promise<Vehicle> {
    return this.request(`/vehicles/${id}`);
  }

  async createVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle> {
    return this.request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  }

  async updateVehicle(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    return this.request(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicle),
    });
  }

  async deleteVehicle(id: string): Promise<void> {
    return this.request(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUser(id: string): Promise<User> {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  // Messaging endpoints
  async getConversations(userId: string): Promise<Conversation[]> {
    return this.request(`/conversations?userId=${userId}`);
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.request(`/messages?conversationId=${conversationId}`);
  }

  async sendMessage(message: Partial<Message>): Promise<Message> {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Saved vehicles endpoints
  async getSavedVehicles(userId: string): Promise<Vehicle[]> {
    return this.request(`/saved-vehicles?userId=${userId}`);
  }

  async saveVehicle(userId: string, vehicleId: string): Promise<void> {
    return this.request('/saved-vehicles', {
      method: 'POST',
      body: JSON.stringify({ userId, vehicleId }),
    });
  }

  async unsaveVehicle(userId: string, vehicleId: string): Promise<void> {
    return this.request(`/saved-vehicles?userId=${userId}&vehicleId=${vehicleId}`, {
      method: 'DELETE',
    });
  }

  // Lead endpoints
  async getLeads(sellerId: string): Promise<Lead[]> {
    return this.request(`/leads?sellerId=${sellerId}`);
  }

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  }

  async updateLead(id: string, lead: Partial<Lead>): Promise<Lead> {
    return this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lead),
    });
  }

  // Dashboard stats
  async getDashboardStats(userId: string, role: string): Promise<DashboardStats> {
    return this.request(`/dashboard/stats?userId=${userId}&role=${role}`);
  }
}

export const apiClient = new ApiClient();
