import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const interviewQuestions = pgTable('interview_questions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  sessionId: varchar('session_id', { length: 50 }).notNull(),
  questionText: text('question_text').notNull(),
  questionType: varchar('question_type', { length: 20 }).notNull(), // 'main' | 'clarification'
  parentQuestionId: varchar('parent_question_id', { length: 50 }),
  competencyTarget: varchar('competency_target', { length: 100 }),
  clarificationType: varchar('clarification_type', { length: 50 }),
  hrdState: varchar('hrd_state', { length: 20 }).notNull().default('asking'), // 'asking' | 'clarifying'
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});
