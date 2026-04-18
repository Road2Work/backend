import { pgTable, varchar, decimal, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const interviewSessions = pgTable('interview_sessions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  userInterviewId: varchar('user_interview_id', { length: 50 }).notNull(),
  stageId: varchar('stage_id', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, in_progress, completed
  aiAssessment: jsonb('ai_assessment'), // AI evaluation result
  transcript: jsonb('transcript'), // Conversation log between AI and user
  score: decimal('score', { precision: 5, scale: 2 }),
  startedAt: timestamp('started_at', { withTimezone: false }),
  completedAt: timestamp('completed_at', { withTimezone: false }),
});
