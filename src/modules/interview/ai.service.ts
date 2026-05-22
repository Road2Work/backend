import env from '../../config/env.ts';
import ApiError from '../../utils/ApiError.ts';

const ML_BASE = env.ML_SERVICE_URL;

async function mlFetch(path: string, options: RequestInit): Promise<any> {
  try {
    const res = await fetch(`${ML_BASE}${path}`, options);
    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown ML error');
      console.error(`[AI Service] ${path} returned ${res.status}: ${errorBody}`);
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


export interface SttResult {
  status: string;
  transcript_text: string;
  stt_confidence: number;
  duration_seconds: number;
  needs_clarification: boolean;
  clarification_type?: string;
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
  hrd_state: 'clarifying';
}

export interface NextQuestionResult {
  question_text: string;
  question_type: 'main';
  parent_question_id: null;
  competency_target: string;
  clarification_type: null;
  hrd_state: 'asking';
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

  return mlFetch('/v1/context/extract-cv', {
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
  return mlFetch('/v1/context/extract-profile', {
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
  target_role: {
    id: string;
    role_name: string;
  };
  interview_context: {
    skills: string[];
    tools: string[];
    experience_summary: string;
    evidence_items: string[];
  };
  score_history: any[];
  clarification_count: number;
}): Promise<EvaluateAnswerResult> {
  return mlFetch('/v1/interview/evaluate-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function generateClarifyingQuestion(payload: {
  target_role: string;
  question_text: string;
  answer_text: string;
  detected_weaknesses: string[];
  clarification_type: string;
  clarification_goal: string;
}): Promise<ClarifyingQuestionResult> {
  return mlFetch('/v1/interview/clarifying-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function generateNextQuestion(payload: {
  session_id: string;
  target_role: {
    id: string;
    role_name: string;
    role_family: string;
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
  question_seed: any[];
  competency_map: any[];
}): Promise<NextQuestionResult> {
  return mlFetch('/v1/interview/next-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function generateFinalResult(payload: {
  session_id: string;
  target_role: string;
  answers: Array<{
    question_text: string;
    answer_text: string;
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
  }>;
}): Promise<GenerateResultResponse> {
  return mlFetch('/v1/interview/generate-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
