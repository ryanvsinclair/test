/**
 * Seed script for Reputation System
 * 
 * Run this to populate test data for development/demo purposes
 * In production, data flows from actual user interactions
 */

import { reputationDb } from '../lib/reputation/db';
import { recordInteractionEvent } from '../lib/reputation/events';
import { recomputeDealershipScore } from '../lib/reputation/recompute';

async function seed() {
  console.log('🌱 Seeding reputation system data...');

  // Create test dealership
  const dealership = await reputationDb.createDealership({
    name: 'Premium Auto Sales',
    google_place_id: null, // Set to real Place ID if testing Google integration
  });

  console.log(`✅ Created dealership: ${dealership.name} (${dealership.id})`);

  // Create staff members
  const staff1 = await reputationDb.createStaffMember({
    dealership_id: dealership.id,
    name: 'John Smith',
    role: 'sales',
    active: true,
  });

  const staff2 = await reputationDb.createStaffMember({
    dealership_id: dealership.id,
    name: 'Sarah Johnson',
    role: 'finance',
    active: true,
  });

  console.log(`✅ Created ${2} staff members`);

  // Create verified interaction events (simulate customer journey)
  const customer1 = 'customer-001';
  const customer2 = 'customer-002';
  const customer3 = 'customer-003';

  // Customer 1: Full journey (A -> E)
  const event1A = await recordInteractionEvent({
    dealershipId: dealership.id,
    staffId: staff1.id,
    userId: customer1,
    eventType: 'A_APPOINTMENT_CONFIRMED',
    verificationMethod: 'DOUBLE_CONFIRM',
    metadata: { listing_id: 'listing-1' },
  });

  const event1B = await recordInteractionEvent({
    dealershipId: dealership.id,
    staffId: staff1.id,
    userId: customer1,
    eventType: 'B_TEST_DRIVE_CONFIRMED',
    verificationMethod: 'SYSTEM_LOG',
    metadata: { listing_id: 'listing-1' },
  });

  const event1C = await recordInteractionEvent({
    dealershipId: dealership.id,
    staffId: staff2.id,
    userId: customer1,
    eventType: 'C_FINANCE_SESSION_CONFIRMED',
    verificationMethod: 'DOCUMENT_PROOF',
    metadata: {},
  });

  const event1D = await recordInteractionEvent({
    dealershipId: dealership.id,
    staffId: staff2.id,
    userId: customer1,
    eventType: 'D_PURCHASE_CONFIRMED',
    verificationMethod: 'DOCUMENT_PROOF',
    metadata: { vin: 'ABC123456' },
  });

  const event1E = await recordInteractionEvent({
    dealershipId: dealership.id,
    staffId: staff1.id,
    userId: customer1,
    eventType: 'E_DELIVERY_CONFIRMED',
    verificationMethod: 'SYSTEM_LOG',
    metadata: { vin: 'ABC123456' },
  });

  // Customer 2: Partial journey (A -> B)
  await recordInteractionEvent({
    dealershipId: dealership.id,
    staffId: staff1.id,
    userId: customer2,
    eventType: 'A_APPOINTMENT_CONFIRMED',
    verificationMethod: 'DOUBLE_CONFIRM',
    metadata: {},
  });

  await recordInteractionEvent({
    dealershipId: dealership.id,
    staffId: staff1.id,
    userId: customer2,
    eventType: 'B_TEST_DRIVE_CONFIRMED',
    verificationMethod: 'SYSTEM_LOG',
    metadata: {},
  });

  // Customer 3: Early journey (A only)
  await recordInteractionEvent({
    dealershipId: dealership.id,
    staffId: staff1.id,
    userId: customer3,
    eventType: 'A_APPOINTMENT_CONFIRMED',
    verificationMethod: 'DOUBLE_CONFIRM',
    metadata: {},
  });

  console.log(`✅ Created ${8} verified interaction events`);

  // Create reviews (only for customers with verified events)
  await reputationDb.createReview({
    dealership_id: dealership.id,
    staff_id: staff1.id,
    user_id: customer1,
    linked_interaction_event_id: event1E.id,
    stage: 'E',
    stars: 5,
    text: 'Excellent experience from start to finish! The team was professional, transparent, and made the entire process smooth. Highly recommend!',
    complaint_scope: 'PROCESS',
    tags: ['transparent', 'professional', 'smooth-process'],
  });

  await reputationDb.createReview({
    dealership_id: dealership.id,
    staff_id: staff1.id,
    user_id: customer2,
    linked_interaction_event_id: event1B.id,
    stage: 'B',
    stars: 4,
    text: 'Great test drive experience. Sales rep was knowledgeable and not pushy at all.',
    complaint_scope: 'PROCESS',
    tags: ['knowledgeable'],
  });

  console.log(`✅ Created ${2} verified reviews`);

  // Create external Google snapshot (simulated)
  await reputationDb.createExternalSnapshot({
    dealership_id: dealership.id,
    source: 'GOOGLE',
    rating_avg: 4.3,
    rating_count: 87,
    raw_sample_reviews: [
      {
        author_name: 'Jane Doe',
        rating: 5,
        text: 'Great service!',
        time: Date.now() / 1000,
      },
      {
        author_name: 'Bob Wilson',
        rating: 4,
        text: 'Good experience overall.',
        time: Date.now() / 1000,
      },
    ],
    fetched_at: new Date(),
  });

  console.log(`✅ Created Google snapshot (4.3 stars, 87 reviews)`);

  // Compute initial reputation score
  await recomputeDealershipScore(dealership.id);

  console.log(`✅ Computed initial reputation score`);

  const finalScore = await reputationDb.getLatestReputationScore(dealership.id);

  console.log('\n📊 REPUTATION SCORE RESULTS:');
  console.log(`   Final Stars: ${finalScore?.final_stars_1_5.toFixed(1)}/5.0`);
  console.log(`   Final Score: ${finalScore?.final_score_0_100.toFixed(0)}/100`);
  console.log(`   Confidence: ${finalScore?.confidence_level}`);
  console.log(`   Verified Events: ${finalScore?.breakdown_json.n_verified}`);
  console.log(`   Carly Reviews: ${finalScore?.breakdown_json.review_count}`);
  console.log(`   Google Reviews: ${finalScore?.breakdown_json.google_review_count}`);

  console.log('\n✅ Seed complete!');
  console.log(`\nDealership ID: ${dealership.id}`);
  console.log('Use this ID to fetch reputation data via API');
}

// Run seed
seed().catch(console.error);
