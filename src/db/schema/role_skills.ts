import { pgTable, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const roleSkills = pgTable('role_skills', {
  id: varchar('id', { length: 50 }).primaryKey(),
  roleId: varchar('role_id', { length: 50 }).notNull(),
  skillName: varchar('skill_name', { length: 255 }).notNull(),
  skillType: varchar('skill_type', { length: 20 }).notNull(), // 'core' | 'tool' | 'soft' | 'domain'
  importanceLevel: integer('importance_level').notNull().default(3), // 1-5
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});
