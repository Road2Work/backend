import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../../db/index.ts';
import { profiles } from '../../db/schema/profiles.ts';
import { jobRoles } from '../../db/schema/job_roles.ts';
import {
  extractCvContext,
  extractShortProfileContext,
} from '../interview/ai.service.ts';
import type { ShortProfileInput } from '../../validations/profile.validation.ts';
import fs from 'fs';

export const createProfile = async (userId: string, targetRoleId: string) => {
  const [role] = await db
    .select()
    .from(jobRoles)
    .where(and(eq(jobRoles.id, targetRoleId), eq(jobRoles.isActive, true)))
    .limit(1);

  if (!role) return { error: 'ROLE_NOT_FOUND', message: 'Role not found' };

  const profileId = nanoid(16);
  const [profile] = await db
    .insert(profiles)
    .values({
      id: profileId,
      userId,
      targetRoleId,
    })
    .returning();

  return {
    profile: {
      id: profile.id,
      userId: profile.userId,
      targetRoleId: profile.targetRoleId,
      contextSource: profile.contextSource,
      profileSummary: profile.profileSummary,
      skills: profile.skills || [],
      tools: profile.tools || [],
      experienceSummary: profile.experienceSummary,
      evidenceItems: profile.evidenceItems || [],
      initialEvidenceScore: profile.initialEvidenceScore || 0,
      createdAt: profile.createdAt,
    },
  };
};

export const getProfileById = async (profileId: string, userId: string) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);

  if (!profile) return null;

  return {
    profile: {
      id: profile.id,
      userId: profile.userId,
      targetRoleId: profile.targetRoleId,
      contextSource: profile.contextSource,
      profileSummary: profile.profileSummary,
      skills: profile.skills || [],
      tools: profile.tools || [],
      experienceSummary: profile.experienceSummary,
      evidenceItems: profile.evidenceItems || [],
      initialEvidenceScore: profile.initialEvidenceScore || 0,
      createdAt: profile.createdAt,
    },
  };
};

export const processCV = async (profileId: string, userId: string, filePath: string, filename: string) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);

  if (!profile) return { error: 'PROFILE_NOT_FOUND', message: 'Profile not found' };

  const [role] = await db
    .select()
    .from(jobRoles)
    .where(eq(jobRoles.id, profile.targetRoleId))
    .limit(1);

  const roleName = role?.roleName || 'General';

  const cvBuffer = fs.readFileSync(filePath);

  const extraction = await extractCvContext(
    cvBuffer,
    filename,
    profile.targetRoleId,
    roleName,
  );

  const [updated] = await db
    .update(profiles)
    .set({
      contextSource: 'cv',
      profileSummary: extraction.profile_summary,
      skills: extraction.skills,
      tools: extraction.tools,
      experienceSummary: extraction.experience_summary,
      evidenceItems: extraction.evidence_items,
      initialEvidenceScore: extraction.initial_evidence_score,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profileId))
    .returning();

  return {
    profile: {
      id: updated.id,
      userId: updated.userId,
      targetRoleId: updated.targetRoleId,
      contextSource: updated.contextSource,
      profileSummary: updated.profileSummary,
      skills: updated.skills || [],
      tools: updated.tools || [],
      experienceSummary: updated.experienceSummary,
      evidenceItems: updated.evidenceItems || [],
      initialEvidenceScore: updated.initialEvidenceScore || 0,
      createdAt: updated.createdAt,
    },
    extraction: {
      status: 'success',
      source: 'cv',
    },
  };
};

export const processShortProfile = async (
  profileId: string,
  userId: string,
  data: ShortProfileInput,
) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);

  if (!profile) return { error: 'PROFILE_NOT_FOUND', message: 'Profile not found' };

  const [role] = await db
    .select()
    .from(jobRoles)
    .where(eq(jobRoles.id, profile.targetRoleId))
    .limit(1);

  const roleName = role?.roleName || 'General';

  const extraction = await extractShortProfileContext({
    target_role_id: profile.targetRoleId,
    target_role_name: roleName,
    most_relevant_experience: data.mostRelevantExperience,
    skills_and_tools: data.skillsAndTools,
    project_experience: data.projectExperience,
    achievement_or_impact: data.achievementOrImpact,
  });

  const [updated] = await db
    .update(profiles)
    .set({
      contextSource: 'short_profile',
      profileSummary: extraction.profile_summary,
      skills: extraction.skills,
      tools: extraction.tools,
      experienceSummary: extraction.experience_summary,
      evidenceItems: extraction.evidence_items,
      initialEvidenceScore: extraction.initial_evidence_score,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profileId))
    .returning();

  return {
    profile: {
      id: updated.id,
      userId: updated.userId,
      targetRoleId: updated.targetRoleId,
      contextSource: updated.contextSource,
      profileSummary: updated.profileSummary,
      skills: updated.skills || [],
      tools: updated.tools || [],
      experienceSummary: updated.experienceSummary,
      evidenceItems: updated.evidenceItems || [],
      initialEvidenceScore: updated.initialEvidenceScore || 0,
      createdAt: updated.createdAt,
    },
    extraction: {
      status: 'success',
      source: 'short_profile',
    },
  };
};
