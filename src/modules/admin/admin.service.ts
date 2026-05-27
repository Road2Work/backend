import { eq, desc, count, avg } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { users } from '../../db/schema/users.ts';
import { interviewSessions } from '../../db/schema/interview_sessions.ts';
import { interviewResults } from '../../db/schema/interview_results.ts';

export const getUsers = async () => {
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      fullname: users.fullname,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return { users: allUsers, total: allUsers.length };
};

export const getAnalytics = async () => {
  const [userCount] = await db.select({ total: count() }).from(users);
  const [sessionCount] = await db.select({ total: count() }).from(interviewSessions);
  const [completedCount] = await db
    .select({ total: count() })
    .from(interviewSessions)
    .where(eq(interviewSessions.status, 'completed'));
  const [avgScore] = await db
    .select({ avg: avg(interviewResults.finalScore) })
    .from(interviewResults);

  return {
    analytics: {
      totalUsers: userCount?.total || 0,
      totalSessions: sessionCount?.total || 0,
      completedSessions: completedCount?.total || 0,
      averageScore: avgScore?.avg ? Math.round(Number(avgScore.avg)) : 0,
    },
  };
};
