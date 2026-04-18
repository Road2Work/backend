import { pgTable, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const interviewStages = pgTable('interview_stages', {
  id: varchar('id', { length: 50 }).primaryKey(),
  jobRoleId: varchar('job_role_id', { length: 50 }).notNull(),
  stepOrder: integer('step_order').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // behavioral, technical, domain, negotiation, fgd
  focusArea: text('focus_area'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull(),
});
