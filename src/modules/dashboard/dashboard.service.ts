import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { profiles } from '../../db/schema/profiles.ts';
import { jobRoles } from '../../db/schema/job_roles.ts';
import { interviewSessions } from '../../db/schema/interview_sessions.ts';
import { interviewResults } from '../../db/schema/interview_results.ts';

export const getDashboard = async (userId: string) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .orderBy(desc(profiles.createdAt))
    .limit(1);

  if (!profile) {
    return { error: 'PROFILE_NOT_FOUND', message: 'Profile not found. Please create a profile first.' };
  }

  const [role] = await db
    .select()
    .from(jobRoles)
    .where(eq(jobRoles.id, profile.targetRoleId))
    .limit(1);

  const completedSessions = await db
    .select()
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        eq(interviewSessions.status, 'completed'),
      ),
    )
    .orderBy(desc(interviewSessions.createdAt));

  const [sessionCountResult] = await db
    .select({ total: count() })
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId));

  const totalSessions = sessionCountResult?.total || 0;

  let latestResult = null;
  let scoreHistory: Array<{ sessionId: string; score: number; date: string }> = [];

  if (completedSessions.length > 0) {
    const [result] = await db
      .select()
      .from(interviewResults)
      .where(eq(interviewResults.sessionId, completedSessions[0].id))
      .limit(1);

    latestResult = result || null;

    const allResults = await Promise.all(
      completedSessions.slice(0, 10).map(async (s) => {
        const [r] = await db
          .select()
          .from(interviewResults)
          .where(eq(interviewResults.sessionId, s.id))
          .limit(1);
        return r ? { sessionId: s.id, score: r.finalScore || 0, date: s.createdAt?.toISOString() || '' } : null;
      }),
    );

    scoreHistory = allResults.filter(Boolean) as typeof scoreHistory;
  }

  const MAX_FREE_QUOTA = 5;
  const remainingQuota = Math.max(0, MAX_FREE_QUOTA - totalSessions);

  return {
    dashboard: {
      profile: {
        id: profile.id,
        contextSource: profile.contextSource,
        profileSummary: profile.profileSummary,
        skills: profile.skills,
        tools: profile.tools,
        initialEvidenceScore: profile.initialEvidenceScore,
      },
      selectedRole: role
        ? {
          id: role.id,
          roleName: role.roleName,
          roleFamily: role.roleFamily,
        }
        : null,
      interviewStats: {
        totalSessions,
        completedSessions: completedSessions.length,
        remainingQuota,
      },
      latestResult: latestResult
        ? {
          sessionId: latestResult.sessionId,
          finalScore: latestResult.finalScore,
          readinessStatus: latestResult.readinessStatus,
          evidenceLevel: latestResult.evidenceLevel,
          scoreBreakdown: latestResult.scoreBreakdown,
          strengths: latestResult.strengths,
          improvementAreas: latestResult.improvementAreas,
          nextPracticeRecommendation: latestResult.nextPracticeRecommendation,
          createdAt: latestResult.createdAt,
        }
        : null,
      scoreHistory,
    },
  };
};

export const refreshDashboard = async (userId: string) => {
  return getDashboard(userId);
};
