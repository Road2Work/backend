-- Road2Work.id Database Migration
-- This migration drops old tables and creates new ones matching the API Contract.
-- WARNING: This will DELETE all existing interview data. Run only on development.

-- ============================================
-- Step 1: Drop old tables that are no longer needed
-- ============================================
DROP TABLE IF EXISTS interview_sessions CASCADE;
DROP TABLE IF EXISTS user_interviews CASCADE;
DROP TABLE IF EXISTS interview_stages CASCADE;

-- ============================================
-- Step 2: Update job_roles table
-- ============================================
-- Add new columns if they don't exist
ALTER TABLE job_roles ADD COLUMN IF NOT EXISTS role_family VARCHAR(100) NOT NULL DEFAULT 'General';
ALTER TABLE job_roles ADD COLUMN IF NOT EXISTS role_name VARCHAR(255);

-- Copy name -> role_name if role_name is null
UPDATE job_roles SET role_name = name WHERE role_name IS NULL;

-- Make role_name NOT NULL
ALTER TABLE job_roles ALTER COLUMN role_name SET NOT NULL;

-- Drop old unique constraint on name if exists
ALTER TABLE job_roles DROP CONSTRAINT IF EXISTS job_roles_name_unique;

-- Drop old name column (optional — only if you want to clean up)
-- ALTER TABLE job_roles DROP COLUMN IF EXISTS name;

-- ============================================
-- Step 3: Create role_skills table
-- ============================================
CREATE TABLE IF NOT EXISTS role_skills (
  id VARCHAR(50) PRIMARY KEY,
  role_id VARCHAR(50) NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  skill_type VARCHAR(20) NOT NULL,
  importance_level INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- Step 4: Create profiles table
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  target_role_id VARCHAR(50) NOT NULL,
  context_source VARCHAR(20),
  profile_summary TEXT,
  skills JSONB DEFAULT '[]',
  tools JSONB DEFAULT '[]',
  experience_summary TEXT,
  evidence_items JSONB DEFAULT '[]',
  initial_evidence_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- Step 5: Create new interview_sessions table
-- ============================================
CREATE TABLE IF NOT EXISTS interview_sessions (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  profile_id VARCHAR(50) NOT NULL,
  role_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  question_index INTEGER NOT NULL DEFAULT 0,
  total_main_questions INTEGER NOT NULL DEFAULT 5,
  clarification_count INTEGER NOT NULL DEFAULT 0,
  current_hrd_state VARCHAR(20) NOT NULL DEFAULT 'idle',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP
);

-- ============================================
-- Step 6: Create interview_questions table
-- ============================================
CREATE TABLE IF NOT EXISTS interview_questions (
  id VARCHAR(50) PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL,
  parent_question_id VARCHAR(50),
  competency_target VARCHAR(100),
  clarification_type VARCHAR(50),
  hrd_state VARCHAR(20) NOT NULL DEFAULT 'asking',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- Step 7: Create interview_answers table
-- ============================================
CREATE TABLE IF NOT EXISTS interview_answers (
  id VARCHAR(50) PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  question_id VARCHAR(50) NOT NULL,
  question_type VARCHAR(20) NOT NULL,
  transcript_text TEXT,
  stt_confidence NUMERIC(5, 4),
  score_breakdown JSONB,
  answer_score INTEGER,
  detected_weaknesses JSONB DEFAULT '[]',
  evidence_level INTEGER,
  needs_clarification BOOLEAN DEFAULT FALSE,
  clarification_type VARCHAR(50),
  feedback TEXT,
  stronger_answer TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- Step 8: Create interview_results table
-- ============================================
CREATE TABLE IF NOT EXISTS interview_results (
  id VARCHAR(50) PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL UNIQUE,
  final_score INTEGER,
  readiness_status VARCHAR(30),
  evidence_level INTEGER,
  score_breakdown JSONB,
  strengths JSONB DEFAULT '[]',
  improvement_areas JSONB DEFAULT '[]',
  before_after_improvement JSONB DEFAULT '[]',
  next_practice_recommendation JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
