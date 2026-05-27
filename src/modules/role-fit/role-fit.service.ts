import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { profiles } from '../../db/schema/profiles.ts';
import { jobRoles } from '../../db/schema/job_roles.ts';
import {
  generateRoleFitRanking,
  calculateRoleFitScore,
} from '../interview/ai.service.ts';

export const getRoleFitRanking = async (userId: string, profileId: string) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);

  if (!profile) {
    return { error: 'PROFILE_NOT_FOUND', message: 'Profile not found' };
  }

  if (profile.contextSource !== 'cv') {
    return { error: 'ROLE_FIT_RANKING_CV_ONLY', message: 'Role Fit Ranking is only available for CV path' };
  }

  const allRoles = await db
    .select()
    .from(jobRoles)
    .where(eq(jobRoles.isActive, true));

  const availableRoles = allRoles.map((r) => ({
    id: r.id,
    name: r.roleName,
    role_family: r.roleFamily,
  }));

  const result = await generateRoleFitRanking({
    profile: {
      skills: (profile.skills as string[]) || [],
      tools: (profile.tools as string[]) || [],
      experience_summary: profile.experienceSummary || '',
      evidence_items: (profile.evidenceItems as string[]) || [],
    },
    available_roles: availableRoles,
    limit: 3,
  });

  return {
    profileId: profile.id,
    recommendedRoles: result.recommended_roles.map((r) => ({
      roleId: r.role_id,
      roleName: r.role_name,
      fitScore: r.fit_score,
      strengths: r.strengths,
      gaps: r.gaps,
    })),
  };
};

export const getRoleFitScore = async (userId: string, profileId: string, roleId: string) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);

  if (!profile) {
    return { error: 'PROFILE_NOT_FOUND', message: 'Profile not found' };
  }

  const [role] = await db
    .select()
    .from(jobRoles)
    .where(and(eq(jobRoles.id, roleId), eq(jobRoles.isActive, true)))
    .limit(1);

  if (!role) {
    return { error: 'ROLE_NOT_FOUND', message: 'Role not found' };
  }

  const result = await calculateRoleFitScore({
    profile: {
      skills: (profile.skills as string[]) || [],
      tools: (profile.tools as string[]) || [],
      experience_summary: profile.experienceSummary || '',
      evidence_items: (profile.evidenceItems as string[]) || [],
    },
    selected_role: {
      id: role.id,
      name: role.roleName,
      role_family: role.roleFamily,
    },
  });

  return {
    profileId: profile.id,
    roleId: role.id,
    roleName: role.roleName,
    roleFitScore: result.role_fit_score,
    strengths: result.strengths,
    gaps: result.gaps,
    skillOverlap: result.skill_overlap,
  };
};

export const confirmRoleFit = async (userId: string, profileId: string, roleId: string) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);

  if (!profile) {
    return { error: 'PROFILE_NOT_FOUND', message: 'Profile not found' };
  }

  const [role] = await db
    .select()
    .from(jobRoles)
    .where(and(eq(jobRoles.id, roleId), eq(jobRoles.isActive, true)))
    .limit(1);

  if (!role) {
    return { error: 'ROLE_NOT_FOUND', message: 'Role not found' };
  }

  await db
    .update(profiles)
    .set({ targetRoleId: roleId, updatedAt: new Date() })
    .where(eq(profiles.id, profileId));

  return {
    profileId: profile.id,
    selectedRole: {
      id: role.id,
      roleName: role.roleName,
      roleFamily: role.roleFamily,
    },
    message: 'Role confirmed successfully',
  };
};
