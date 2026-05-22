import { pgTable, varchar, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: varchar('id', { length: 50 }).primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  targetRoleId: varchar('target_role_id', { length: 50 }).notNull(),
  contextSource: varchar('context_source', { length: 20 }), // 'cv' | 'short_profile' | null
  profileSummary: text('profile_summary'),
  skills: jsonb('skills').$type<string[]>().default([]),
  tools: jsonb('tools').$type<string[]>().default([]),
  experienceSummary: text('experience_summary'),
  evidenceItems: jsonb('evidence_items').$type<string[]>().default([]),
  initialEvidenceScore: integer('initial_evidence_score').default(0),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull(),
});
