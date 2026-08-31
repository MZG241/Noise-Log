import {
  pgTable,
  uuid,
  text,
  timestamp,
  doublePrecision,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// 1. USERS TABLE
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  preferredStandardCode: text('preferred_standard_code').default('NIOSH').notNull(),
  calibrationOffsetDb: doublePrecision("calibration_offset_db")
    .default(0)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. SAFETY STANDARDS TABLE (Section d'administration dédiée)
export const safetyStandards = pgTable('safety_standards', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // Auto-généré depuis le nom (ex: 'NIOSH', 'OSHA_PEL')
  name: text('name').notNull(),          // ex: 'NIOSH REL', 'OSHA PEL'
  criterionLevelDb: doublePrecision('criterion_level_db').notNull(), // Ex: 85 ou 90
  exchangeRateDb: doublePrecision('exchange_rate_db').notNull(),     // Ex: 3 ou 5
  referenceDurationHours: doublePrecision('reference_duration_hours').default(8).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. EVENTS / SOUND SESSIONS TABLE
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  location: text('location'),
  standardCodeUsed: text('standard_code_used').default('NIOSH').notNull(),
  
  totalDosePercentage: doublePrecision('total_dose_percentage').default(0).notNull(),
  twaDb: doublePrecision('twa_db').default(0).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. EXPOSURE LOGS TABLE
export const exposureLogs = pgTable('exposure_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),

  
      leqDb: doublePrecision("leq_db")
    .notNull()
    .default(0),

  peakDb: doublePrecision("peak_db"),
 
  decibelLevel: doublePrecision('decibel_level').notNull(),
  durationMinutes: doublePrecision('duration_minutes').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});