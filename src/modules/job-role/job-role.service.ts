import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { jobRoles } from '../../db/schema/job_roles.ts';
import { interviewStages } from '../../db/schema/interview_stages.ts';

export const getAllJobRoles = async () => {
  const roles = await db
    .select({
      id: jobRoles.id,
      name: jobRoles.name,
      description: jobRoles.description,
      icon: jobRoles.icon,
    })
    .from(jobRoles)
    .where(eq(jobRoles.isActive, true))
    .orderBy(jobRoles.name);

  return roles;
};

export const getJobRoleById = async (id: string) => {
  const [role] = await db
    .select()
    .from(jobRoles)
    .where(eq(jobRoles.id, id))
    .limit(1);

  if (!role) return null;

  const stages = await db
    .select({
      id: interviewStages.id,
      stepOrder: interviewStages.stepOrder,
      name: interviewStages.name,
      type: interviewStages.type,
      focusArea: interviewStages.focusArea,
    })
    .from(interviewStages)
    .where(eq(interviewStages.jobRoleId, id))
    .orderBy(interviewStages.stepOrder);

  return { ...role, stages };
};
