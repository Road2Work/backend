import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { jobRoles } from '../../db/schema/job_roles.ts';
import { roleSkills } from '../../db/schema/role_skills.ts';

export const getAllJobRoles = async (roleFamilyFilter?: string) => {
  let query = db
    .select({
      id: jobRoles.id,
      roleFamily: jobRoles.roleFamily,
      roleName: jobRoles.roleName,
      description: jobRoles.description,
    })
    .from(jobRoles)
    .where(eq(jobRoles.isActive, true))
    .orderBy(jobRoles.roleFamily, jobRoles.roleName);

  const roles = await query;

  const familyMap = new Map<string, Array<{
    id: string;
    roleFamily: string;
    roleName: string;
    description: string | null;
  }>>();

  for (const role of roles) {
    if (roleFamilyFilter && role.roleFamily !== roleFamilyFilter) continue;

    if (!familyMap.has(role.roleFamily)) {
      familyMap.set(role.roleFamily, []);
    }
    familyMap.get(role.roleFamily)!.push(role);
  }

  const roleFamilies = Array.from(familyMap.entries()).map(([name, familyRoles]) => ({
    name,
    roles: familyRoles,
  }));

  return { roleFamilies };
};

export const getJobRoleById = async (id: string) => {
  const [role] = await db
    .select()
    .from(jobRoles)
    .where(eq(jobRoles.id, id))
    .limit(1);

  if (!role) return null;

  const skills = await db
    .select({
      id: roleSkills.id,
      skillName: roleSkills.skillName,
      skillType: roleSkills.skillType,
      importanceLevel: roleSkills.importanceLevel,
    })
    .from(roleSkills)
    .where(eq(roleSkills.roleId, id))
    .orderBy(roleSkills.importanceLevel);

  return {
    role: {
      id: role.id,
      roleFamily: role.roleFamily,
      roleName: role.roleName,
      description: role.description,
      skills,
    },
  };
};
