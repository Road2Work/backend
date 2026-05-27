import { eq, and, desc, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../../db/index.ts';
import { profiles } from '../../db/schema/profiles.ts';
import { jobRoles } from '../../db/schema/job_roles.ts';
import { interviewSessions } from '../../db/schema/interview_sessions.ts';
import { interviewQuestions } from '../../db/schema/interview_questions.ts';
import { interviewAnswers } from '../../db/schema/interview_answers.ts';
import { interviewResults } from '../../db/schema/interview_results.ts';
import {
  transcribeAudio,
  evaluateAnswer,
  generateClarifyingQuestion,
  generateNextQuestion,
  generateFinalResult,
} from './ai.service.ts';
import type { AdaptivePracticeMemory } from './ai.service.ts';
import type { CreateSessionInput } from '../../validations/interview.validation.ts';
import fs from 'fs';

const RECORDING_POLICY = {
  autoStartMic: true,
  autoStartTrigger: 'after_hrd_question_finished',
  answerLimitSeconds: 90,
  silenceAutoStopEnabled: false,
  userCanStopBeforeLimit: true,
  stopReasons: ['user_mic_off', 'timer_timeout'],
  audioFormat: 'webm',
};

async function buildAdaptiveMemory(
  userId: string,
  roleId: string,
  improvementFocus: string[],
  avoidRepeatedQuestions: boolean,
  retryMode: boolean,
): Promise<AdaptivePracticeMemory | null> {
  const previousSessions = await db
    .select()
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        eq(interviewSessions.roleId, roleId),
        eq(interviewSessions.status, 'completed'),
      ),
    )
    .orderBy(desc(interviewSessions.createdAt))
    .limit(5);

  if (previousSessions.length === 0) return null;

  const previousSessionIds = previousSessions.map((s) => s.id);

  const lastSession = previousSessions[0];
  const [lastResult] = await db
    .select()
    .from(interviewResults)
    .where(eq(interviewResults.sessionId, lastSession.id))
    .limit(1);

  const allPrevQuestions = await Promise.all(
    previousSessionIds.map((sid) =>
      db.select({
        id: interviewQuestions.id,
        questionText: interviewQuestions.questionText,
        questionType: interviewQuestions.questionType,
        competencyTarget: interviewQuestions.competencyTarget,
        createdAt: interviewQuestions.createdAt,
      })
      .from(interviewQuestions)
      .where(eq(interviewQuestions.sessionId, sid)),
    ),
  );
  const prevQuestions = allPrevQuestions.flat();

  const askedQuestionHistory = prevQuestions.map((q) => ({
    question_id: q.id,
    question_text: q.questionText,
    question_type: q.questionType,
    competency_target: q.competencyTarget || '',
    asked_at: q.createdAt?.toISOString(),
  }));

  const allPrevAnswers = await Promise.all(
    previousSessionIds.map((sid) =>
      db.select({ evidenceLevel: interviewAnswers.evidenceLevel, detectedWeaknesses: interviewAnswers.detectedWeaknesses })
        .from(interviewAnswers)
        .where(eq(interviewAnswers.sessionId, sid)),
    ),
  );
  const prevAnswers = allPrevAnswers.flat();

  const previousEvidenceLevels = prevAnswers.map((a) => a.evidenceLevel || 1);
  const allWeaknesses = prevAnswers.flatMap((a) => (a.detectedWeaknesses as string[]) || []);
  const uniqueWeaknesses = [...new Set(allWeaknesses)];

  const previousScoreBreakdown = lastResult?.scoreBreakdown as Record<string, number> | null;

  return {
    enabled: true,
    previous_session_ids: previousSessionIds,
    previous_interview_summary: lastResult
      ? `Score: ${lastResult.finalScore}, Status: ${lastResult.readinessStatus}`
      : null,
    previous_score_breakdown: previousScoreBreakdown || null,
    previous_detected_weaknesses: uniqueWeaknesses,
    previous_evidence_levels: previousEvidenceLevels,
    asked_question_history: askedQuestionHistory,
    latest_interview_feedback: null,
    next_best_actions: [],
    improvement_focus: improvementFocus,
    avoid_repeated_questions: avoidRepeatedQuestions,
    retry_mode: retryMode,
  };
}

export const createSession = async (userId: string, input: CreateSessionInput) => {
  const {
    profileId,
    roleId,
    totalMainQuestions = 5,
    practiceMode: inputPracticeMode = 'first_session',
    retryMode = false,
    avoidRepeatedQuestions = true,
    improvementFocus = [],
  } = input;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);

  if (!profile) {
    return { error: 'PROFILE_NOT_FOUND', message: 'Profile not found' };
  }

  if (!profile.contextSource) {
    return {
      error: 'INTERVIEW_CONTEXT_REQUIRED',
      message: 'Interview context is required before starting an interview',
    };
  }

  const [role] = await db
    .select()
    .from(jobRoles)
    .where(and(eq(jobRoles.id, roleId), eq(jobRoles.isActive, true)))
    .limit(1);

  if (!role) {
    return { error: 'ROLE_NOT_FOUND', message: 'Role not found' };
  }

  const MAX_FREE_QUOTA = 5;
  const [quotaCheck] = await db
    .select({ total: count() })
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId));

  if ((quotaCheck?.total || 0) >= MAX_FREE_QUOTA) {
    return { error: 'INTERVIEW_QUOTA_EXCEEDED', message: 'Interview quota exceeded. Maximum 5 sessions allowed.' };
  }

  const adaptiveMemory = await buildAdaptiveMemory(
    userId, roleId, improvementFocus, avoidRepeatedQuestions, retryMode,
  );

  const resolvedPracticeMode = adaptiveMemory
    ? (inputPracticeMode === 'first_session' ? 'adaptive_from_history' : inputPracticeMode)
    : 'first_session';

  const sessionId = nanoid(16);
  const [session] = await db
    .insert(interviewSessions)
    .values({
      id: sessionId,
      userId,
      profileId,
      roleId,
      status: 'active',
      questionIndex: 1,
      totalMainQuestions,
      clarificationCount: 0,
      currentHrdState: 'asking',
      practiceMode: resolvedPracticeMode,
      adaptiveMemory: adaptiveMemory as any,
    })
    .returning();

  const firstQuestion = await generateNextQuestion({
    session_id: sessionId,
    selected_role: {
      id: role.id,
      name: role.roleName,
      role_family: role.roleFamily,
    },
    interview_context: {
      skills: (profile.skills as string[]) || [],
      tools: (profile.tools as string[]) || [],
      experience_summary: profile.experienceSummary || '',
      evidence_items: (profile.evidenceItems as string[]) || [],
    },
    session_state: {
      question_index: 1,
      total_main_questions: totalMainQuestions,
      asked_questions: [],
      clarification_count: 0,
      detected_weaknesses: [],
    },
    adaptive_practice_memory: adaptiveMemory,
    practice_mode: resolvedPracticeMode,
    question_seed: [],
    competency_map: [],
  });

  const questionId = nanoid(16);
  const [savedQuestion] = await db
    .insert(interviewQuestions)
    .values({
      id: questionId,
      sessionId,
      questionText: firstQuestion.question_text,
      questionType: firstQuestion.question_type,
      parentQuestionId: null,
      competencyTarget: firstQuestion.competency_target,
      clarificationType: null,
      hrdState: firstQuestion.hrd_state,
    })
    .returning();

  return {
    session: {
      id: session.id,
      userId: session.userId,
      profileId: session.profileId,
      roleId: session.roleId,
      status: session.status,
      questionCount: session.totalMainQuestions,
      currentQuestionIndex: session.questionIndex,
      clarificationCount: session.clarificationCount,
      maxClarification: 3,
      currentState: session.currentHrdState,
      practiceMode: resolvedPracticeMode,
      recordingPolicy: RECORDING_POLICY,
      startedAt: session.createdAt,
      completedAt: session.completedAt,
    },
    adaptiveMemory: adaptiveMemory || undefined,
    currentQuestion: {
      id: savedQuestion.id,
      sessionId: savedQuestion.sessionId,
      questionText: savedQuestion.questionText,
      questionType: savedQuestion.questionType,
      parentQuestionId: savedQuestion.parentQuestionId,
      competencyTarget: savedQuestion.competencyTarget,
      clarificationType: savedQuestion.clarificationType,
      generatedFrom: firstQuestion.generated_from || 'role_context',
      hrdState: savedQuestion.hrdState,
    },
  };
};


export const getSessionDetail = async (sessionId: string, userId: string) => {
  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, userId)))
    .limit(1);

  if (!session) return null;

  const questions = await db
    .select()
    .from(interviewQuestions)
    .where(eq(interviewQuestions.sessionId, sessionId))
    .orderBy(desc(interviewQuestions.createdAt));

  const currentQuestion = questions[0] || null;

  const answers = await db
    .select()
    .from(interviewAnswers)
    .where(eq(interviewAnswers.sessionId, sessionId))
    .orderBy(interviewAnswers.createdAt);

  return {
    session: {
      id: session.id,
      userId: session.userId,
      profileId: session.profileId,
      roleId: session.roleId,
      status: session.status,
      questionIndex: session.questionIndex,
      totalMainQuestions: session.totalMainQuestions,
      clarificationCount: session.clarificationCount,
      currentHrdState: session.currentHrdState,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    },
    currentQuestion: currentQuestion
      ? {
        id: currentQuestion.id,
        sessionId: currentQuestion.sessionId,
        questionText: currentQuestion.questionText,
        questionType: currentQuestion.questionType,
        parentQuestionId: currentQuestion.parentQuestionId,
        competencyTarget: currentQuestion.competencyTarget,
        clarificationType: currentQuestion.clarificationType,
        hrdState: currentQuestion.hrdState,
      }
      : null,
    answers,
  };
};

export const submitVoiceAnswer = async (
  sessionId: string,
  userId: string,
  questionId: string,
  audioFilePath: string,
  audioFilename: string,
  audioMimeType: string,
) => {
  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, userId)))
    .limit(1);

  if (!session) return { error: 'INTERVIEW_SESSION_NOT_FOUND', message: 'Session not found' };
  if (session.status === 'completed') return { error: 'INTERVIEW_ALREADY_COMPLETED', message: 'Session already completed' };
  if (session.status === 'cancelled') return { error: 'INTERVIEW_ALREADY_COMPLETED', message: 'Session was cancelled' };

  const [question] = await db
    .select()
    .from(interviewQuestions)
    .where(and(eq(interviewQuestions.id, questionId), eq(interviewQuestions.sessionId, sessionId)))
    .limit(1);

  if (!question) return { error: 'INTERVIEW_SESSION_NOT_FOUND', message: 'Question not found' };

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.profileId))
    .limit(1);

  const [role] = await db
    .select()
    .from(jobRoles)
    .where(eq(jobRoles.id, session.roleId))
    .limit(1);

  if (!profile || !role) return { error: 'INTERVIEW_SESSION_NOT_FOUND', message: 'Profile or role not found' };

  const audioBuffer = fs.readFileSync(audioFilePath);
  const sttResult = await transcribeAudio(audioBuffer, audioFilename, audioMimeType);

  const existingAnswers = await db
    .select()
    .from(interviewAnswers)
    .where(eq(interviewAnswers.sessionId, sessionId));

  const scoreHistory = existingAnswers
    .filter((a) => a.scoreBreakdown)
    .map((a) => a.scoreBreakdown);

  const evalResult = await evaluateAnswer({
    session_id: sessionId,
    question: {
      id: question.id,
      question_text: question.questionText,
      question_type: question.questionType,
      competency_target: question.competencyTarget || undefined,
    },
    answer: {
      transcript_text: sttResult.transcript_text,
      stt_confidence: sttResult.stt_confidence,
    },
    selected_role: {
      id: role.id,
      name: role.roleName,
    },
    profile: {
      skills: (profile.skills as string[]) || [],
      tools: (profile.tools as string[]) || [],
      experience_summary: profile.experienceSummary || '',
      evidence_items: (profile.evidenceItems as string[]) || [],
    },
    session_state: {
      clarification_count: session.clarificationCount,
      max_clarification: 3,
    },
    score_history: scoreHistory,
  });

  const answerId = nanoid(16);
  const [savedAnswer] = await db
    .insert(interviewAnswers)
    .values({
      id: answerId,
      sessionId,
      questionId,
      questionType: question.questionType,
      transcriptText: sttResult.transcript_text,
      sttConfidence: String(sttResult.stt_confidence),
      scoreBreakdown: {
        roleRelevance: evalResult.score_breakdown.role_relevance,
        starStructure: evalResult.score_breakdown.star_structure,
        evidenceSpecificity: evalResult.score_breakdown.evidence_specificity,
        technicalAccuracy: evalResult.score_breakdown.technical_accuracy,
        communicationClarity: evalResult.score_breakdown.communication_clarity,
        selfAwareness: evalResult.score_breakdown.self_awareness,
      },
      answerScore: evalResult.answer_score,
      detectedWeaknesses: evalResult.detected_weaknesses,
      evidenceLevel: evalResult.evidence_level,
      needsClarification: evalResult.needs_clarification,
      clarificationType: evalResult.clarification_type || null,
      feedback: evalResult.feedback,
      strongerAnswer: evalResult.stronger_answer,
    })
    .returning();

  let nextQuestionData: any = null;
  let isCompleted = false;
  let resultId: string | undefined;

  if (evalResult.needs_clarification || sttResult.needs_clarification) {
    const clarificationType = sttResult.needs_clarification
      ? 'unclear_audio'
      : evalResult.clarification_type || 'weak_evidence';

    const clarifyResult = await generateClarifyingQuestion({
      question_text: question.questionText,
      answer_text: sttResult.transcript_text,
      detected_weaknesses: evalResult.detected_weaknesses,
      clarification_type: clarificationType,
      selected_role: { id: role.id, name: role.roleName },
    });

    const clarifyQuestionId = `${questionId}_clarification_${nanoid(6)}`;
    const [savedClarifyQuestion] = await db
      .insert(interviewQuestions)
      .values({
        id: clarifyQuestionId,
        sessionId,
        questionText: clarifyResult.question_text,
        questionType: 'clarification',
        parentQuestionId: questionId,
        competencyTarget: question.competencyTarget,
        clarificationType: clarificationType,
        hrdState: 'clarifying',
      })
      .returning();

    await db
      .update(interviewSessions)
      .set({
        clarificationCount: session.clarificationCount + 1,
        currentHrdState: 'clarifying',
      })
      .where(eq(interviewSessions.id, sessionId));

    nextQuestionData = {
      id: savedClarifyQuestion.id,
      sessionId: savedClarifyQuestion.sessionId,
      questionText: savedClarifyQuestion.questionText,
      questionType: savedClarifyQuestion.questionType,
      parentQuestionId: savedClarifyQuestion.parentQuestionId,
      competencyTarget: savedClarifyQuestion.competencyTarget,
      clarificationType: savedClarifyQuestion.clarificationType,
      hrdState: savedClarifyQuestion.hrdState,
    };
  } else if (session.questionIndex >= session.totalMainQuestions) {
    isCompleted = true;

    const allAnswers = await db
      .select({
        answerId: interviewAnswers.id,
        questionId: interviewAnswers.questionId,
        questionText: interviewQuestions.questionText,
        transcriptText: interviewAnswers.transcriptText,
        scoreBreakdown: interviewAnswers.scoreBreakdown,
        evidenceLevel: interviewAnswers.evidenceLevel,
        detectedWeaknesses: interviewAnswers.detectedWeaknesses,
      })
      .from(interviewAnswers)
      .innerJoin(interviewQuestions, eq(interviewAnswers.questionId, interviewQuestions.id))
      .where(eq(interviewAnswers.sessionId, sessionId));

    const finalResultData = await generateFinalResult({
      session_id: sessionId,
      selected_role: { id: role.id, name: role.roleName },
      answers: allAnswers.map((a) => ({
        question_text: a.questionText,
        answer_text: a.transcriptText || '',
        score_breakdown: a.scoreBreakdown
          ? {
            role_relevance: a.scoreBreakdown.roleRelevance,
            star_structure: a.scoreBreakdown.starStructure,
            evidence_specificity: a.scoreBreakdown.evidenceSpecificity,
            technical_accuracy: a.scoreBreakdown.technicalAccuracy,
            communication_clarity: a.scoreBreakdown.communicationClarity,
            self_awareness: a.scoreBreakdown.selfAwareness,
          }
          : {
            role_relevance: 0,
            star_structure: 0,
            evidence_specificity: 0,
            technical_accuracy: 0,
            communication_clarity: 0,
            self_awareness: 0,
          },
        evidence_level: a.evidenceLevel || 0,
        detected_weaknesses: (a.detectedWeaknesses as string[]) || [],
      })),
    });

    resultId = nanoid(16);
    await db.insert(interviewResults).values({
      id: resultId,
      sessionId,
      finalScore: finalResultData.final_score,
      readinessStatus: finalResultData.readiness_status,
      evidenceLevel: finalResultData.evidence_level,
      scoreBreakdown: {
        roleRelevance: finalResultData.score_breakdown.role_relevance,
        starStructure: finalResultData.score_breakdown.star_structure,
        evidenceSpecificity: finalResultData.score_breakdown.evidence_specificity,
        technicalAccuracy: finalResultData.score_breakdown.technical_accuracy,
        communicationClarity: finalResultData.score_breakdown.communication_clarity,
        selfAwareness: finalResultData.score_breakdown.self_awareness,
      },
      strengths: finalResultData.strengths,
      improvementAreas: finalResultData.improvement_areas,
      beforeAfterImprovement: finalResultData.before_after_improvement.map((item) => ({
        questionText: item.question_text,
        beforeAnswer: item.before_answer,
        afterAnswer: item.after_answer,
        improvementNotes: item.improvement_notes,
      })),
      nextPracticeRecommendation: finalResultData.next_practice_recommendation
        ? {
          practiceType: finalResultData.next_practice_recommendation.practice_type,
          reason: finalResultData.next_practice_recommendation.reason,
          focusAreas: finalResultData.next_practice_recommendation.focus_areas,
        }
        : undefined,
    });

    await db
      .update(interviewSessions)
      .set({
        status: 'completed',
        currentHrdState: 'completed',
        completedAt: new Date(),
      })
      .where(eq(interviewSessions.id, sessionId));
  } else {
    const allQuestions = await db
      .select()
      .from(interviewQuestions)
      .where(and(eq(interviewQuestions.sessionId, sessionId), eq(interviewQuestions.questionType, 'main')));

    const nextIndex = session.questionIndex + 1;
    const sessionAdaptiveMemory = session.adaptiveMemory as AdaptivePracticeMemory | null;

    const nextQuestionResult = await generateNextQuestion({
      session_id: sessionId,
      selected_role: {
        id: role.id,
        name: role.roleName,
        role_family: role.roleFamily,
      },
      interview_context: {
        skills: (profile.skills as string[]) || [],
        tools: (profile.tools as string[]) || [],
        experience_summary: profile.experienceSummary || '',
        evidence_items: (profile.evidenceItems as string[]) || [],
      },
      session_state: {
        question_index: nextIndex,
        total_main_questions: session.totalMainQuestions,
        asked_questions: allQuestions.map((q) => q.questionText),
        clarification_count: session.clarificationCount,
        detected_weaknesses: evalResult.detected_weaknesses,
      },
      adaptive_practice_memory: sessionAdaptiveMemory,
      practice_mode: session.practiceMode,
      question_seed: [],
      competency_map: [],
    });

    const nextQuestionId = nanoid(16);
    const [savedNextQuestion] = await db
      .insert(interviewQuestions)
      .values({
        id: nextQuestionId,
        sessionId,
        questionText: nextQuestionResult.question_text,
        questionType: 'main',
        parentQuestionId: null,
        competencyTarget: nextQuestionResult.competency_target,
        clarificationType: null,
        hrdState: 'asking',
      })
      .returning();

    await db
      .update(interviewSessions)
      .set({
        questionIndex: nextIndex,
        currentHrdState: 'asking',
      })
      .where(eq(interviewSessions.id, sessionId));

    nextQuestionData = {
      id: savedNextQuestion.id,
      sessionId: savedNextQuestion.sessionId,
      questionText: savedNextQuestion.questionText,
      questionType: savedNextQuestion.questionType,
      parentQuestionId: savedNextQuestion.parentQuestionId,
      competencyTarget: savedNextQuestion.competencyTarget,
      clarificationType: savedNextQuestion.clarificationType,
      hrdState: savedNextQuestion.hrdState,
    };
  }

  const [updatedSession] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, sessionId))
    .limit(1);

  const responseData: any = {
    answer: {
      id: savedAnswer.id,
      sessionId: savedAnswer.sessionId,
      questionId: savedAnswer.questionId,
      questionType: savedAnswer.questionType,
      transcriptText: savedAnswer.transcriptText,
      sttConfidence: Number(savedAnswer.sttConfidence),
      scoreBreakdown: savedAnswer.scoreBreakdown,
      answerScore: savedAnswer.answerScore,
      detectedWeaknesses: savedAnswer.detectedWeaknesses,
      evidenceLevel: savedAnswer.evidenceLevel,
      needsClarification: savedAnswer.needsClarification,
      clarificationType: savedAnswer.clarificationType,
      feedback: savedAnswer.feedback,
      strongerAnswer: savedAnswer.strongerAnswer,
    },
    nextQuestion: nextQuestionData,
    session: {
      id: updatedSession.id,
      status: updatedSession.status,
      questionIndex: updatedSession.questionIndex,
      totalMainQuestions: updatedSession.totalMainQuestions,
      clarificationCount: updatedSession.clarificationCount,
      currentHrdState: updatedSession.currentHrdState,
      ...(updatedSession.completedAt ? { completedAt: updatedSession.completedAt } : {}),
    },
    isCompleted,
  };

  if (resultId) {
    responseData.resultId = resultId;
  }

  try {
    fs.unlinkSync(audioFilePath);
  } catch {
  }

  return responseData;
};


export const cancelSession = async (sessionId: string, userId: string) => {
  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, userId)))
    .limit(1);

  if (!session) return null;
  if (session.status !== 'active') return { error: 'INTERVIEW_ALREADY_COMPLETED', message: 'Session is not active' };

  const [updated] = await db
    .update(interviewSessions)
    .set({
      status: 'cancelled',
      currentHrdState: 'completed',
      completedAt: new Date(),
    })
    .where(eq(interviewSessions.id, sessionId))
    .returning();

  return {
    session: {
      id: updated.id,
      status: updated.status,
    },
  };
};

export const getSessionResult = async (sessionId: string, userId: string) => {
  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, userId)))
    .limit(1);

  if (!session) return { error: 'INTERVIEW_SESSION_NOT_FOUND', message: 'Session not found' };

  const [result] = await db
    .select()
    .from(interviewResults)
    .where(eq(interviewResults.sessionId, sessionId))
    .limit(1);

  if (!result) return { error: 'RESULT_NOT_FOUND', message: 'Result not yet available' };

  const [role] = await db
    .select()
    .from(jobRoles)
    .where(eq(jobRoles.id, session.roleId))
    .limit(1);

  return {
    result: {
      id: result.id,
      sessionId: result.sessionId,
      finalScore: result.finalScore,
      readinessStatus: result.readinessStatus,
      evidenceLevel: result.evidenceLevel,
      targetRole: role
        ? {
          id: role.id,
          roleName: role.roleName,
          roleFamily: role.roleFamily,
        }
        : null,
      scoreBreakdown: result.scoreBreakdown,
      strengths: result.strengths,
      improvementAreas: result.improvementAreas,
      beforeAfterImprovement: result.beforeAfterImprovement,
      nextPracticeRecommendation: result.nextPracticeRecommendation,
      createdAt: result.createdAt,
    },
  };
};

/**
 * Get user interview history.
 */
export const getInterviewHistory = async (userId: string) => {
  const sessions = await db
    .select({
      sessionId: interviewSessions.id,
      status: interviewSessions.status,
      roleId: interviewSessions.roleId,
      roleName: jobRoles.roleName,
      createdAt: interviewSessions.createdAt,
      completedAt: interviewSessions.completedAt,
    })
    .from(interviewSessions)
    .innerJoin(jobRoles, eq(interviewSessions.roleId, jobRoles.id))
    .where(eq(interviewSessions.userId, userId))
    .orderBy(desc(interviewSessions.createdAt));

  const history = await Promise.all(
    sessions.map(async (s) => {
      const [result] = await db
        .select({ id: interviewResults.id, finalScore: interviewResults.finalScore, readinessStatus: interviewResults.readinessStatus })
        .from(interviewResults)
        .where(eq(interviewResults.sessionId, s.sessionId))
        .limit(1);

      return {
        sessionId: s.sessionId,
        resultId: result?.id || null,
        targetRole: s.roleName,
        finalScore: result?.finalScore || null,
        readinessStatus: result?.readinessStatus || null,
        createdAt: s.completedAt || s.createdAt,
      };
    }),
  );

  return { history };
};

const MAX_FREE_QUOTA = 5;

export const getQuota = async (userId: string) => {
  const [result] = await db
    .select({ total: count() })
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId));

  const used = result?.total || 0;
  const remaining = Math.max(0, MAX_FREE_QUOTA - used);

  return {
    quota: {
      total: MAX_FREE_QUOTA,
      used,
      remaining,
      isExceeded: remaining <= 0,
    },
  };
};

export const getPracticeMemory = async (userId: string, roleId: string) => {
  const sessions = await db
    .select()
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        eq(interviewSessions.roleId, roleId),
        eq(interviewSessions.status, 'completed'),
      ),
    )
    .orderBy(desc(interviewSessions.createdAt))
    .limit(5);

  if (sessions.length === 0) {
    return { error: 'PRACTICE_MEMORY_NOT_FOUND', message: 'No previous completed sessions found for this role' };
  }

  const lastSession = sessions[0];
  const [lastResult] = await db
    .select()
    .from(interviewResults)
    .where(eq(interviewResults.sessionId, lastSession.id))
    .limit(1);

  const prevAnswers = await db
    .select({ detectedWeaknesses: interviewAnswers.detectedWeaknesses })
    .from(interviewAnswers)
    .where(eq(interviewAnswers.sessionId, lastSession.id));

  const allWeaknesses = prevAnswers.flatMap((a) => (a.detectedWeaknesses as string[]) || []);

  const prevQuestions = await db
    .select({
      questionText: interviewQuestions.questionText,
      questionType: interviewQuestions.questionType,
      competencyTarget: interviewQuestions.competencyTarget,
    })
    .from(interviewQuestions)
    .where(eq(interviewQuestions.sessionId, lastSession.id));

  return {
    practiceMemory: {
      previousSessionIds: sessions.map((s) => s.id),
      previousInterviewSummary: lastResult
        ? `Score: ${lastResult.finalScore}, Status: ${lastResult.readinessStatus}`
        : null,
      previousScoreBreakdown: lastResult?.scoreBreakdown || null,
      previousDetectedWeaknesses: [...new Set(allWeaknesses)],
      askedQuestionHistory: prevQuestions.map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        competencyTarget: q.competencyTarget,
      })),
      nextPracticeRecommendation: lastResult?.nextPracticeRecommendation || null,
    },
  };
};

