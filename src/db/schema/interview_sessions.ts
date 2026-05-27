import { pgTable, varchar, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const interviewSessions = pgTable('interview_sessions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  profileId: varchar('profile_id', { length: 50 }).notNull(),
  roleId: varchar('role_id', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active' | 'completed' | 'cancelled'
  questionIndex: integer('question_index').notNull().default(0),
  totalMainQuestions: integer('total_main_questions').notNull().default(5),
  clarificationCount: integer('clarification_count').notNull().default(0),
  currentHrdState: varchar('current_hrd_state', { length: 20 }).notNull().default('idle'), // idle, asking, listening, thinking, clarifying, completed
  practiceMode: varchar('practice_mode', { length: 30 }).notNull().default('first_session'), // 'first_session' | 'adaptive_from_history' | 'retry_focus'
  adaptiveMemory: jsonb('adaptive_memory'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: false }),
});
