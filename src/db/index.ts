import { drizzle } from 'drizzle-orm/node-postgres';
import { pool } from './client.ts';
import * as usersSchema from './schema/users.ts';
import * as authenticationsSchema from './schema/authentications.ts';
import * as jobRolesSchema from './schema/job_roles.ts';
import * as interviewStagesSchema from './schema/interview_stages.ts';
import * as userInterviewsSchema from './schema/user_interviews.ts';
import * as interviewSessionsSchema from './schema/interview_sessions.ts';

export const schema = {
  ...usersSchema,
  ...authenticationsSchema,
  ...jobRolesSchema,
  ...interviewStagesSchema,
  ...userInterviewsSchema,
  ...interviewSessionsSchema,
};

export const db = drizzle(pool, { schema });
