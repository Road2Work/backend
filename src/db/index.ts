import { drizzle } from 'drizzle-orm/node-postgres';
import { pool } from './client.ts';
import * as usersSchema from './schema/users.ts';
import * as authenticationsSchema from './schema/authentications.ts';
import * as jobRolesSchema from './schema/job_roles.ts';
import * as roleSkillsSchema from './schema/role_skills.ts';
import * as profilesSchema from './schema/profiles.ts';
import * as interviewSessionsSchema from './schema/interview_sessions.ts';
import * as interviewQuestionsSchema from './schema/interview_questions.ts';
import * as interviewAnswersSchema from './schema/interview_answers.ts';
import * as interviewResultsSchema from './schema/interview_results.ts';

export const schema = {
  ...usersSchema,
  ...authenticationsSchema,
  ...jobRolesSchema,
  ...roleSkillsSchema,
  ...profilesSchema,
  ...interviewSessionsSchema,
  ...interviewQuestionsSchema,
  ...interviewAnswersSchema,
  ...interviewResultsSchema,
};

export const db = drizzle(pool, { schema });
