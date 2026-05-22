import { pgTable, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const jobRoles = pgTable('job_roles', {
  id: varchar('id', { length: 50 }).primaryKey(),
  roleFamily: varchar('role_family', { length: 100 }).notNull().default('General'),
  roleName: varchar('role_name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull(),
});
