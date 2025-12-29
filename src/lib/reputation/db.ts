// Mock database layer for reputation system
// In production, replace with actual Prisma/Supabase queries

import type {
  Dealership,
  StaffMember,
  InteractionEvent,
  Review,
  Issue,
  ExternalRatingSnapshot,
  ReputationScore,
  StaffReputationScore,
} from '@/types/reputation';

// In-memory storage (replace with real DB)
const db = {
  dealerships: new Map<string, Dealership>(),
  staff_members: new Map<string, StaffMember>(),
  interaction_events: new Map<string, InteractionEvent>(),
  reviews: new Map<string, Review>(),
  issues: new Map<string, Issue>(),
  external_rating_snapshots: new Map<string, ExternalRatingSnapshot>(),
  reputation_scores: new Map<string, ReputationScore>(),
  staff_reputation_scores: new Map<string, StaffReputationScore>(),
};

export const reputationDb = {
  // Dealerships
  async getDealership(id: string): Promise<Dealership | null> {
    return db.dealerships.get(id) || null;
  },

  async createDealership(data: Omit<Dealership, 'id' | 'created_at' | 'updated_at'>): Promise<Dealership> {
    const dealership: Dealership = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
    db.dealerships.set(dealership.id, dealership);
    return dealership;
  },

  // Staff Members
  async getStaffMember(id: string): Promise<StaffMember | null> {
    return db.staff_members.get(id) || null;
  },

  async getStaffByDealership(dealership_id: string): Promise<StaffMember[]> {
    return Array.from(db.staff_members.values()).filter(
      (s) => s.dealership_id === dealership_id
    );
  },

  async createStaffMember(data: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>): Promise<StaffMember> {
    const staff: StaffMember = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
    db.staff_members.set(staff.id, staff);
    return staff;
  },

  // Interaction Events
  async createInteractionEvent(data: Omit<InteractionEvent, 'id' | 'created_at'>): Promise<InteractionEvent> {
    const event: InteractionEvent = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date(),
    };
    db.interaction_events.set(event.id, event);
    return event;
  },

  async getInteractionEvent(id: string): Promise<InteractionEvent | null> {
    return db.interaction_events.get(id) || null;
  },

  async getInteractionEventsByUser(user_id: string, dealership_id: string): Promise<InteractionEvent[]> {
    return Array.from(db.interaction_events.values()).filter(
      (e) => e.user_id === user_id && e.dealership_id === dealership_id
    );
  },

  async getInteractionEventsByDealership(
    dealership_id: string,
    since?: Date
  ): Promise<InteractionEvent[]> {
    const events = Array.from(db.interaction_events.values()).filter(
      (e) => e.dealership_id === dealership_id
    );
    if (since) {
      return events.filter((e) => e.occurred_at >= since);
    }
    return events;
  },

  async getInteractionEventsByStaff(staff_id: string, since?: Date): Promise<InteractionEvent[]> {
    const events = Array.from(db.interaction_events.values()).filter(
      (e) => e.staff_id === staff_id
    );
    if (since) {
      return events.filter((e) => e.occurred_at >= since);
    }
    return events;
  },

  // Reviews
  async createReview(data: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const review: Review = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date(),
    };
    db.reviews.set(review.id, review);
    return review;
  },

  async getReviewsByDealership(dealership_id: string, since?: Date): Promise<Review[]> {
    const reviews = Array.from(db.reviews.values()).filter(
      (r) => r.dealership_id === dealership_id
    );
    if (since) {
      return reviews.filter((r) => r.created_at >= since);
    }
    return reviews;
  },

  async getReviewsByStaff(staff_id: string, since?: Date): Promise<Review[]> {
    const reviews = Array.from(db.reviews.values()).filter(
      (r) => r.staff_id === staff_id
    );
    if (since) {
      return reviews.filter((r) => r.created_at >= since);
    }
    return reviews;
  },

  async getUserReviewForEvent(user_id: string, event_id: string): Promise<Review | null> {
    return (
      Array.from(db.reviews.values()).find(
        (r) => r.user_id === user_id && r.linked_interaction_event_id === event_id
      ) || null
    );
  },

  // Issues
  async createIssue(data: Omit<Issue, 'id'>): Promise<Issue> {
    const issue: Issue = {
      id: crypto.randomUUID(),
      ...data,
    };
    db.issues.set(issue.id, issue);
    return issue;
  },

  async updateIssue(id: string, data: Partial<Issue>): Promise<Issue | null> {
    const issue = db.issues.get(id);
    if (!issue) return null;
    const updated = { ...issue, ...data };
    db.issues.set(id, updated);
    return updated;
  },

  async getIssuesByDealership(dealership_id: string, since?: Date): Promise<Issue[]> {
    const issues = Array.from(db.issues.values()).filter(
      (i) => i.dealership_id === dealership_id
    );
    if (since) {
      return issues.filter((i) => i.opened_at >= since);
    }
    return issues;
  },

  // External Rating Snapshots
  async createExternalSnapshot(
    data: Omit<ExternalRatingSnapshot, 'id'>
  ): Promise<ExternalRatingSnapshot> {
    const snapshot: ExternalRatingSnapshot = {
      id: crypto.randomUUID(),
      ...data,
    };
    db.external_rating_snapshots.set(snapshot.id, snapshot);
    return snapshot;
  },

  async getLatestExternalSnapshot(
    dealership_id: string,
    source: 'GOOGLE'
  ): Promise<ExternalRatingSnapshot | null> {
    const snapshots = Array.from(db.external_rating_snapshots.values())
      .filter((s) => s.dealership_id === dealership_id && s.source === source)
      .sort((a, b) => b.fetched_at.getTime() - a.fetched_at.getTime());
    return snapshots[0] || null;
  },

  // Reputation Scores
  async createReputationScore(data: Omit<ReputationScore, 'id' | 'created_at'>): Promise<ReputationScore> {
    const score: ReputationScore = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date(),
    };
    db.reputation_scores.set(score.id, score);
    return score;
  },

  async getLatestReputationScore(dealership_id: string): Promise<ReputationScore | null> {
    const scores = Array.from(db.reputation_scores.values())
      .filter((s) => s.dealership_id === dealership_id)
      .sort((a, b) => b.computed_at.getTime() - a.computed_at.getTime());
    return scores[0] || null;
  },

  async getReputationScoreHistory(
    dealership_id: string,
    months: number
  ): Promise<ReputationScore[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    return Array.from(db.reputation_scores.values())
      .filter((s) => s.dealership_id === dealership_id && s.computed_at >= since)
      .sort((a, b) => b.computed_at.getTime() - a.computed_at.getTime());
  },

  // Staff Reputation Scores
  async createStaffReputationScore(
    data: Omit<StaffReputationScore, 'id'>
  ): Promise<StaffReputationScore> {
    const score: StaffReputationScore = {
      id: crypto.randomUUID(),
      ...data,
    };
    db.staff_reputation_scores.set(score.id, score);
    return score;
  },

  async getLatestStaffReputationScore(staff_id: string): Promise<StaffReputationScore | null> {
    const scores = Array.from(db.staff_reputation_scores.values())
      .filter((s) => s.staff_id === staff_id)
      .sort((a, b) => b.computed_at.getTime() - a.computed_at.getTime());
    return scores[0] || null;
  },

  async getAllDealerships(): Promise<Dealership[]> {
    return Array.from(db.dealerships.values());
  },
};
