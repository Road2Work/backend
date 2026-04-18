import { pgTable, varchar, decimal, timestamp } from 'drizzle-orm/pg-core';

export const userInterviews = pgTable('user_interviews', {
  id: varchar('id', { length: 50 }).primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  jobRoleId: varchar('job_role_id', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('in_progress'), // in_progress, completed, abandoned
  finalScore: decimal('final_score', { precision: 5, scale: 2 }),
  startedAt: timestamp('started_at', { withTimezone: false }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: false }),
});
