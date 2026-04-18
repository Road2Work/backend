import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../../db/index.ts';
import { jobRoles } from '../../db/schema/job_roles.ts';
import { interviewStages } from '../../db/schema/interview_stages.ts';
import { userInterviews } from '../../db/schema/user_interviews.ts';
import { interviewSessions } from '../../db/schema/interview_sessions.ts';
import { evaluateInterview } from './ai.service.ts';
import type { TranscriptEntry } from '../../validations/interview.validation.ts';

/**
 * Start a new interview process for a user.
 * Creates the user_interview record and pre-generates all stage sessions.
 */
export const startInterview = async (userId: string, jobRoleId: string) => {
  // Verify job role exists and is active
  const [role] = await db
    .select()
    .from(jobRoles)
    .where(and(eq(jobRoles.id, jobRoleId), eq(jobRoles.isActive, true)))
    .limit(1);

  if (!role) return null;

  // Get all stages for this job role
  const stages = await db
    .select()
    .from(interviewStages)
    .where(eq(interviewStages.jobRoleId, jobRoleId))
    .orderBy(interviewStages.stepOrder);

  if (stages.length === 0) return null;

  // Create the user interview record
  const interviewId = nanoid(16);
  const [interview] = await db
    .insert(userInterviews)
    .values({
      id: interviewId,
      userId,
      jobRoleId,
      status: 'in_progress',
    })
    .returning();

  // Pre-generate all session records (one per stage)
  const sessionValues = stages.map((stage) => ({
    id: nanoid(16),
    userInterviewId: interviewId,
    stageId: stage.id,
    status: 'pending' as const,
  }));

  const sessions = await db
    .insert(interviewSessions)
    .values(sessionValues)
    .returning();

  return {
    ...interview,
    jobRole: { id: role.id, name: role.name },
    sessions: sessions.map((session, index) => ({
      ...session,
      stage: {
        id: stages[index].id,
        stepOrder: stages[index].stepOrder,
        name: stages[index].name,
        type: stages[index].type,
        focusArea: stages[index].focusArea,
      },
    })),
  };
};

/**
 * Get all interviews for a user (history).
 */
export const getUserInterviews = async (userId: string) => {
  const interviews = await db
    .select({
      id: userInterviews.id,
      status: userInterviews.status,
      finalScore: userInterviews.finalScore,
      startedAt: userInterviews.startedAt,
      completedAt: userInterviews.completedAt,
      jobRoleId: userInterviews.jobRoleId,
      jobRoleName: jobRoles.name,
      jobRoleIcon: jobRoles.icon,
    })
    .from(userInterviews)
    .innerJoin(jobRoles, eq(userInterviews.jobRoleId, jobRoles.id))
    .where(eq(userInterviews.userId, userId))
    .orderBy(desc(userInterviews.startedAt));

  return interviews;
};

/**
 * Get interview detail with all session progress.
 */
export const getInterviewDetail = async (interviewId: string, userId: string) => {
  const [interview] = await db
    .select()
    .from(userInterviews)
    .where(and(eq(userInterviews.id, interviewId), eq(userInterviews.userId, userId)))
    .limit(1);

  if (!interview) return null;

  const [role] = await db
    .select()
    .from(jobRoles)
    .where(eq(jobRoles.id, interview.jobRoleId))
    .limit(1);

  const sessions = await db
    .select({
      id: interviewSessions.id,
      status: interviewSessions.status,
      score: interviewSessions.score,
      startedAt: interviewSessions.startedAt,
      completedAt: interviewSessions.completedAt,
      stageId: interviewStages.id,
      stageName: interviewStages.name,
      stageType: interviewStages.type,
      stepOrder: interviewStages.stepOrder,
      focusArea: interviewStages.focusArea,
    })
    .from(interviewSessions)
    .innerJoin(interviewStages, eq(interviewSessions.stageId, interviewStages.id))
    .where(eq(interviewSessions.userInterviewId, interviewId))
    .orderBy(interviewStages.stepOrder);

  return {
    ...interview,
    jobRole: role ? { id: role.id, name: role.name, icon: role.icon } : null,
    sessions,
  };
};

/**
 * Start a specific interview session (mark as in_progress).
 */
export const startSession = async (interviewId: string, sessionId: string, userId: string) => {
  // Verify ownership
  const [interview] = await db
    .select()
    .from(userInterviews)
    .where(and(eq(userInterviews.id, interviewId), eq(userInterviews.userId, userId)))
    .limit(1);

  if (!interview) return null;

  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.id, sessionId),
        eq(interviewSessions.userInterviewId, interviewId),
      ),
    )
    .limit(1);

  if (!session) return null;
  if (session.status !== 'pending') return { error: 'Session already started or completed' };

  const [updated] = await db
    .update(interviewSessions)
    .set({
      status: 'in_progress',
      startedAt: new Date(),
    })
    .where(eq(interviewSessions.id, sessionId))
    .returning();

  return updated;
};

/**
 * Submit a session transcript and trigger AI evaluation.
 * Backend orchestrates the AI call for security and scalability.
 */
export const submitSession = async (
  interviewId: string,
  sessionId: string,
  userId: string,
  transcript: TranscriptEntry[],
) => {
  // Verify ownership
  const [interview] = await db
    .select()
    .from(userInterviews)
    .where(and(eq(userInterviews.id, interviewId), eq(userInterviews.userId, userId)))
    .limit(1);

  if (!interview) return null;

  // Get session with stage info
  const [session] = await db
    .select({
      id: interviewSessions.id,
      status: interviewSessions.status,
      userInterviewId: interviewSessions.userInterviewId,
      stageId: interviewSessions.stageId,
      stageType: interviewStages.type,
      stageName: interviewStages.name,
    })
    .from(interviewSessions)
    .innerJoin(interviewStages, eq(interviewSessions.stageId, interviewStages.id))
    .where(
      and(
        eq(interviewSessions.id, sessionId),
        eq(interviewSessions.userInterviewId, interviewId),
      ),
    )
    .limit(1);

  if (!session) return null;
  if (session.status === 'completed') return { error: 'Session already completed' };

  // === BACKEND ORCHESTRATES AI CALL ===
  const aiResult = await evaluateInterview(transcript, session.stageType);

  // Save session result
  const [updated] = await db
    .update(interviewSessions)
    .set({
      status: 'completed',
      transcript: transcript,
      aiAssessment: aiResult,
      score: String(aiResult.overallScore),
      completedAt: new Date(),
    })
    .where(eq(interviewSessions.id, sessionId))
    .returning();

  // Check if all sessions are completed → finalize interview
  const allSessions = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.userInterviewId, interviewId));

  const allCompleted = allSessions.every((s) => s.status === 'completed');

  if (allCompleted) {
    const totalScore = allSessions.reduce((sum, s) => sum + (Number(s.score) || 0), 0);
    const finalScore = totalScore / allSessions.length;

    await db
      .update(userInterviews)
      .set({
        status: 'completed',
        finalScore: String(finalScore.toFixed(2)),
        completedAt: new Date(),
      })
      .where(eq(userInterviews.id, interviewId));
  }

  return {
    session: updated,
    aiAssessment: aiResult,
    interviewCompleted: allCompleted,
  };
};

/**
 * Get the full result of a completed interview.
 */
export const getInterviewResult = async (interviewId: string, userId: string) => {
  const [interview] = await db
    .select()
    .from(userInterviews)
    .where(and(eq(userInterviews.id, interviewId), eq(userInterviews.userId, userId)))
    .limit(1);

  if (!interview) return null;

  const [role] = await db
    .select()
    .from(jobRoles)
    .where(eq(jobRoles.id, interview.jobRoleId))
    .limit(1);

  const sessions = await db
    .select({
      id: interviewSessions.id,
      status: interviewSessions.status,
      score: interviewSessions.score,
      aiAssessment: interviewSessions.aiAssessment,
      startedAt: interviewSessions.startedAt,
      completedAt: interviewSessions.completedAt,
      stageId: interviewStages.id,
      stageName: interviewStages.name,
      stageType: interviewStages.type,
      stepOrder: interviewStages.stepOrder,
    })
    .from(interviewSessions)
    .innerJoin(interviewStages, eq(interviewSessions.stageId, interviewStages.id))
    .where(eq(interviewSessions.userInterviewId, interviewId))
    .orderBy(interviewStages.stepOrder);

  return {
    id: interview.id,
    status: interview.status,
    finalScore: interview.finalScore,
    startedAt: interview.startedAt,
    completedAt: interview.completedAt,
    jobRole: role ? { id: role.id, name: role.name, icon: role.icon } : null,
    sessions,
  };
};
