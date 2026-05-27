import env from '../../config/env.ts';
import ApiError from '../../utils/ApiError.ts';

const ML_BASE = env.ML_SERVICE_URL;

async function mlFetch(path: string, options: RequestInit): Promise<any> {
  try {
    const res = await fetch(`${ML_BASE}${path}`, options);
    if (!res.ok) {
      let errorMessage = 'Unknown ML error';
      let errorCode = 'ML_SERVICE_ERROR';

      try {
        const errorJson = await res.json();
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
        errorCode = errorJson.code || errorCode;
      } catch {
        errorMessage = await res.text().catch(() => errorMessage);
      }

      console.error(`[AI Service] ${path} returned ${res.status}: ${errorMessage}`);

      if (res.status >= 400 && res.status < 500) {
        throw new ApiError(errorMessage, res.status, errorCode);
      }

      throw ApiError.serviceUnavailable(
        'AI service is currently unavailable. Please try again.',
        'AI_SERVICE_UNAVAILABLE',
      );
    }
    return res.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error(`[AI Service] Failed to reach ML service at ${path}:`, error);
    throw ApiError.serviceUnavailable(
      'AI service is currently unavailable. Please try again.',
      'AI_SERVICE_UNAVAILABLE',
    );
  }
}

export interface RecordingPolicy {
  autoStartMic: boolean;
  autoStartTrigger: string;
  answerLimitSeconds: number;
  silenceAutoStopEnabled: boolean;
  userCanStopBeforeLimit: boolean;
  stopReasons: string[];
  audioFormat: string;
}

export interface SttResult {
  status: string;
  transcript_text: string;
  stt_confidence: number;
  duration_seconds: number;
  needs_clarification: boolean;
  clarification_type?: string;
  recording_policy?: RecordingPolicy;
}

export interface EvaluateAnswerResult {
  score_breakdown: {
    role_relevance: number;
    star_structure: number;
    evidence_specificity: number;
    technical_accuracy: number;
    communication_clarity: number;
    self_awareness: number;
  };
  answer_score: number;
  detected_weaknesses: string[];
  evidence_level: number;
  needs_clarification: boolean;
  clarification_type?: string | null;
  feedback: string;
  stronger_answer: string;
  model_support?: {
    predicted_quality: string;
    confidence: number;
  };
}

export interface ClarifyingQuestionResult {
  question_text: string;
  question_type: 'clarification';
  clarification_type: string;
  competency_target: string;
  generated_from: string;
  hrd_state: 'clarifying';
  recording_policy?: RecordingPolicy;
}

export interface NextQuestionResult {
  question_text: string;
  question_type: 'main';
  parent_question_id: null;
  competency_target: string;
  clarification_type: null;
  generated_from: string;
  repeated_from_question_id?: string | null;
  hrd_state: 'asking';
  practice_mode?: string;
  recording_policy?: RecordingPolicy;
}

export interface GenerateResultResponse {
  final_score: number;
  readiness_status: 'Ready' | 'Almost Ready' | 'Needs Practice';
  evidence_level: number;
  score_breakdown: {
    role_relevance: number;
    star_structure: number;
    evidence_specificity: number;
    technical_accuracy: number;
    communication_clarity: number;
    self_awareness: number;
  };
  strengths: Array<{ title: string; description: string; evidence?: string }>;
  improvement_areas: Array<{ title: string; description: string; evidence?: string }>;
  before_after_improvement: Array<{
    question_text: string;
    before_answer: string;
    after_answer: string;
    improvement_notes: string[];
  }>;
  next_practice_recommendation: {
    practice_type: string;
    reason: string;
    focus_areas: string[];
  };
}

export interface ExtractCvResult {
  status: string;
  source: 'cv';
  profile_summary: string;
  skills: string[];
  tools: string[];
  experience_summary: string;
  evidence_items: string[];
  initial_evidence_score: number;
  raw_text_preview?: string;
}

export interface ExtractProfileResult {
  status: string;
  source: 'short_profile';
  profile_summary: string;
  skills: string[];
  tools: string[];
  experience_summary: string;
  evidence_items: string[];
  initial_evidence_score: number;
}

export interface AdaptivePracticeMemory {
  enabled: boolean;
  previous_session_ids: string[];
  previous_interview_summary?: string | null;
  previous_score_breakdown?: Record<string, number> | null;
  previous_detected_weaknesses: string[];
  previous_evidence_levels: number[];
  asked_question_history: Array<{
    question_id: string;
    question_text: string;
    question_type: string;
    competency_target: string;
    asked_at?: string;
  }>;
  latest_interview_feedback?: string | null;
  next_best_actions: Array<{
    id: string;
    title: string;
    description: string;
    impact_label: string;
    action_type: string;
  }>;
  improvement_focus: string[];
  avoid_repeated_questions: boolean;
  retry_mode: boolean;
}


export async function extractCvContext(
  cvBuffer: Buffer,
  filename: string,
  targetRoleId: string,
  targetRoleName: string,
): Promise<ExtractCvResult> {
  const formData = new FormData();
  const blob = new Blob([cvBuffer], { type: 'application/pdf' });
  formData.append('cvFile', blob, filename);
  formData.append('targetRoleId', targetRoleId);
  formData.append('targetRoleName', targetRoleName);

  return mlFetch('/v1/profile/extract-cv', {
    method: 'POST',
    body: formData,
  });
}

export async function extractShortProfileContext(payload: {
  target_role_id: string;
  target_role_name: string;
  most_relevant_experience: string;
  skills_and_tools: string;
  project_experience?: string;
  achievement_or_impact?: string;
}): Promise<ExtractProfileResult> {
  return mlFetch('/v1/profile/extract-manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}


export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<SttResult> {
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append('audioFile', blob, filename);
  formData.append('language', 'id');

  return mlFetch('/v1/stt/transcribe', {
    method: 'POST',
    body: formData,
  });
}


export async function evaluateAnswer(payload: {
  session_id: string;
  question: {
    id: string;
    question_text: string;
    question_type: string;
    competency_target?: string;
  };
  answer: {
    transcript_text: string;
    stt_confidence: number;
  };
  selected_role: {
    id?: string;
    name: string;
  };
  profile?: {
    skills: string[];
    tools: string[];
    experience_summary: string;
    evidence_items: string[];
  };
  session_state?: {
    clarification_count: number;
    max_clarification?: number;
  };
  score_history?: any[];
}): Promise<EvaluateAnswerResult> {
  return mlFetch('/v1/interview/evaluate-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function generateClarifyingQuestion(payload: {
  question_text: string;
  answer_text: string;
  detected_weaknesses: string[];
  clarification_type?: string;
  selected_role?: { id?: string; name: string };
}): Promise<ClarifyingQuestionResult> {
  return mlFetch('/v1/interview/generate-clarification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function generateNextQuestion(payload: {
  session_id: string;
  selected_role: {
    id?: string;
    name: string;
    role_family?: string;
  };
  interview_context: {
    skills: string[];
    tools: string[];
    experience_summary: string;
    evidence_items: string[];
  };
  session_state: {
    question_index: number;
    total_main_questions: number;
    asked_questions: string[];
    clarification_count: number;
    detected_weaknesses: string[];
  };
  adaptive_practice_memory?: AdaptivePracticeMemory | null;
  practice_mode?: string;
  question_seed?: any[];
  competency_map?: any[];
}): Promise<NextQuestionResult> {
  return mlFetch('/v1/interview/generate-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function generateFinalResult(payload: {
  session_id: string;
  selected_role: { id?: string; name: string };
  answers: Array<{
    question_text: string;
    answer_text: string;
    answer_score?: number;
    score_breakdown: {
      role_relevance: number;
      star_structure: number;
      evidence_specificity: number;
      technical_accuracy: number;
      communication_clarity: number;
      self_awareness: number;
    };
    evidence_level: number;
    detected_weaknesses: string[];
    feedback?: string;
    stronger_answer?: string;
  }>;
}): Promise<GenerateResultResponse> {
  return mlFetch('/v1/interview/generate-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// ── Role Fit AI ──

export interface RoleFitRankingResult {
  recommended_roles: Array<{
    role_id: string;
    role_name: string;
    fit_score: number;
    strengths: string[];
    gaps: string[];
  }>;
}

export interface RoleFitScoreResult {
  role_fit_score: number;
  strengths: string[];
  gaps: string[];
  skill_overlap: number;
}

export async function generateRoleFitRanking(payload: {
  profile: {
    skills: string[];
    tools: string[];
    experience_summary: string;
    evidence_items: string[];
  };
  available_roles: Array<{ id: string; name: string; role_family: string }>;
  limit?: number;
}): Promise<RoleFitRankingResult> {
  return mlFetch('/v1/role-fit/generate-ranking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function calculateRoleFitScore(payload: {
  profile: {
    skills: string[];
    tools: string[];
    experience_summary: string;
    evidence_items: string[];
  };
  selected_role: { id: string; name: string; role_family?: string };
}): Promise<RoleFitScoreResult> {
  return mlFetch('/v1/role-fit/calculate-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// ── Dashboard AI ──

export interface DashboardSummaryResult {
  career_summary: string;
}

export async function generateDashboardSummary(payload: {
  dashboard_data: any;
  final_score: number;
}): Promise<DashboardSummaryResult> {
  return mlFetch('/v1/dashboard/generate-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

