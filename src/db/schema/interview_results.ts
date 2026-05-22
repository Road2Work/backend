import { pgTable, varchar, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const interviewResults = pgTable('interview_results', {
  id: varchar('id', { length: 50 }).primaryKey(),
  sessionId: varchar('session_id', { length: 50 }).notNull().unique(),
  finalScore: integer('final_score'),
  readinessStatus: varchar('readiness_status', { length: 30 }), // 'Ready' | 'Almost Ready' | 'Needs Practice'
  evidenceLevel: integer('evidence_level'),
  scoreBreakdown: jsonb('score_breakdown').$type<{
    roleRelevance: number;
    starStructure: number;
    evidenceSpecificity: number;
    technicalAccuracy: number;
    communicationClarity: number;
    selfAwareness: number;
  }>(),
  strengths: jsonb('strengths').$type<Array<{
    title: string;
    description: string;
    evidence?: string;
  }>>().default([]),
  improvementAreas: jsonb('improvement_areas').$type<Array<{
    title: string;
    description: string;
    evidence?: string;
  }>>().default([]),
  beforeAfterImprovement: jsonb('before_after_improvement').$type<Array<{
    questionText: string;
    beforeAnswer: string;
    afterAnswer: string;
    improvementNotes: string[];
  }>>().default([]),
  nextPracticeRecommendation: jsonb('next_practice_recommendation').$type<{
    practiceType: string;
    reason: string;
    focusAreas: string[];
  }>(),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});
