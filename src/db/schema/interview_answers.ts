import { pgTable, varchar, text, integer, decimal, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';

export const interviewAnswers = pgTable('interview_answers', {
  id: varchar('id', { length: 50 }).primaryKey(),
  sessionId: varchar('session_id', { length: 50 }).notNull(),
  questionId: varchar('question_id', { length: 50 }).notNull(),
  questionType: varchar('question_type', { length: 20 }).notNull(), // 'main' | 'clarification'
  transcriptText: text('transcript_text'),
  sttConfidence: decimal('stt_confidence', { precision: 5, scale: 4 }),
  scoreBreakdown: jsonb('score_breakdown').$type<{
    roleRelevance: number;
    starStructure: number;
    evidenceSpecificity: number;
    technicalAccuracy: number;
    communicationClarity: number;
    selfAwareness: number;
  }>(),
  answerScore: integer('answer_score'),
  detectedWeaknesses: jsonb('detected_weaknesses').$type<string[]>().default([]),
  evidenceLevel: integer('evidence_level'),
  needsClarification: boolean('needs_clarification').default(false),
  clarificationType: varchar('clarification_type', { length: 50 }),
  feedback: text('feedback'),
  strongerAnswer: text('stronger_answer'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});
