-- v2.3 Adaptive Interview Session: Add practiceMode and adaptiveMemory columns
ALTER TABLE "interview_sessions"
  ADD COLUMN IF NOT EXISTS "practice_mode" varchar(30) NOT NULL DEFAULT 'first_session',
  ADD COLUMN IF NOT EXISTS "adaptive_memory" jsonb;
