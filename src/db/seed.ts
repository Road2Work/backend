import 'dotenv/config';
import { nanoid } from 'nanoid';
import { pool } from './client.ts';
import { db } from './index.ts';
import { jobRoles } from './schema/job_roles.ts';
import { roleSkills } from './schema/role_skills.ts';

const seed = async () => {
  console.log('Seeding database...\n');

  try {
    const daId = 'role_data_analyst';
    await db.insert(jobRoles).values({
      id: daId,
      roleFamily: 'Data & AI',
      roleName: 'Data Analyst',
      description: 'Analyze data, build dashboards, and communicate insights.',
      icon: 'bar-chart',
      isActive: true,
    }).onConflictDoNothing();

    const daSkills = [
      { skillName: 'SQL', skillType: 'core', importanceLevel: 5 },
      { skillName: 'Excel', skillType: 'tool', importanceLevel: 4 },
      { skillName: 'Data Visualization', skillType: 'core', importanceLevel: 5 },
      { skillName: 'Python', skillType: 'tool', importanceLevel: 4 },
      { skillName: 'Statistical Analysis', skillType: 'core', importanceLevel: 4 },
      { skillName: 'Tableau', skillType: 'tool', importanceLevel: 3 },
      { skillName: 'Communication', skillType: 'soft', importanceLevel: 4 },
    ];

    for (const skill of daSkills) {
      await db.insert(roleSkills).values({
        id: nanoid(16),
        roleId: daId,
        ...skill,
      }).onConflictDoNothing();
    }
    console.log(`Data Analyst — ${daSkills.length} skills`);

    const dsId = 'role_data_scientist';
    await db.insert(jobRoles).values({
      id: dsId,
      roleFamily: 'Data & AI',
      roleName: 'Data Scientist',
      description: 'Build models, run experiments, and generate business insights.',
      icon: 'brain',
      isActive: true,
    }).onConflictDoNothing();

    const dsSkills = [
      { skillName: 'Python', skillType: 'core', importanceLevel: 5 },
      { skillName: 'Machine Learning', skillType: 'core', importanceLevel: 5 },
      { skillName: 'Statistics', skillType: 'core', importanceLevel: 5 },
      { skillName: 'SQL', skillType: 'tool', importanceLevel: 4 },
      { skillName: 'TensorFlow/PyTorch', skillType: 'tool', importanceLevel: 4 },
      { skillName: 'Data Wrangling', skillType: 'core', importanceLevel: 4 },
    ];

    for (const skill of dsSkills) {
      await db.insert(roleSkills).values({
        id: nanoid(16),
        roleId: dsId,
        ...skill,
      }).onConflictDoNothing();
    }
    console.log(`Data Scientist — ${dsSkills.length} skills`);

    const aeId = 'role_ai_engineer';
    await db.insert(jobRoles).values({
      id: aeId,
      roleFamily: 'Data & AI',
      roleName: 'AI Engineer',
      description: 'Build AI-powered applications and model pipelines.',
      icon: 'cpu',
      isActive: true,
    }).onConflictDoNothing();

    const aeSkills = [
      { skillName: 'Python', skillType: 'core', importanceLevel: 5 },
      { skillName: 'Deep Learning', skillType: 'core', importanceLevel: 5 },
      { skillName: 'MLOps', skillType: 'core', importanceLevel: 4 },
      { skillName: 'Cloud Services', skillType: 'tool', importanceLevel: 4 },
      { skillName: 'API Development', skillType: 'core', importanceLevel: 4 },
    ];

    for (const skill of aeSkills) {
      await db.insert(roleSkills).values({
        id: nanoid(16),
        roleId: aeId,
        ...skill,
      }).onConflictDoNothing();
    }
    console.log(`AI Engineer — ${aeSkills.length} skills`);

    const mleId = 'role_ml_engineer';
    await db.insert(jobRoles).values({
      id: mleId,
      roleFamily: 'Data & AI',
      roleName: 'ML Engineer',
      description: 'Train, deploy, and monitor machine learning models.',
      icon: 'settings',
      isActive: true,
    }).onConflictDoNothing();

    const mleSkills = [
      { skillName: 'Python', skillType: 'core', importanceLevel: 5 },
      { skillName: 'Machine Learning', skillType: 'core', importanceLevel: 5 },
      { skillName: 'Docker', skillType: 'tool', importanceLevel: 4 },
      { skillName: 'Kubernetes', skillType: 'tool', importanceLevel: 3 },
      { skillName: 'Model Monitoring', skillType: 'core', importanceLevel: 4 },
    ];

    for (const skill of mleSkills) {
      await db.insert(roleSkills).values({
        id: nanoid(16),
        roleId: mleId,
        ...skill,
      }).onConflictDoNothing();
    }
    console.log(`ML Engineer — ${mleSkills.length} skills`);

    const beId = 'role_backend_developer';
    await db.insert(jobRoles).values({
      id: beId,
      roleFamily: 'Software Engineering',
      roleName: 'Backend Developer',
      description: 'Build APIs, databases, authentication, and backend systems.',
      icon: 'server',
      isActive: true,
    }).onConflictDoNothing();

    const beSkills = [
      { skillName: 'Node.js', skillType: 'core', importanceLevel: 5 },
      { skillName: 'SQL', skillType: 'core', importanceLevel: 5 },
      { skillName: 'REST API Design', skillType: 'core', importanceLevel: 5 },
      { skillName: 'Git', skillType: 'tool', importanceLevel: 4 },
      { skillName: 'Docker', skillType: 'tool', importanceLevel: 3 },
      { skillName: 'System Design', skillType: 'core', importanceLevel: 4 },
    ];

    for (const skill of beSkills) {
      await db.insert(roleSkills).values({
        id: nanoid(16),
        roleId: beId,
        ...skill,
      }).onConflictDoNothing();
    }
    console.log(`Backend Developer — ${beSkills.length} skills`);

    const feId = 'role_frontend_developer';
    await db.insert(jobRoles).values({
      id: feId,
      roleFamily: 'Software Engineering',
      roleName: 'Frontend Developer',
      description: 'Build responsive user interfaces and web applications.',
      icon: 'layout',
      isActive: true,
    }).onConflictDoNothing();

    const feSkills = [
      { skillName: 'JavaScript/TypeScript', skillType: 'core', importanceLevel: 5 },
      { skillName: 'React/Next.js', skillType: 'core', importanceLevel: 5 },
      { skillName: 'CSS/Tailwind', skillType: 'core', importanceLevel: 4 },
      { skillName: 'Git', skillType: 'tool', importanceLevel: 4 },
      { skillName: 'Responsive Design', skillType: 'core', importanceLevel: 4 },
    ];

    for (const skill of feSkills) {
      await db.insert(roleSkills).values({
        id: nanoid(16),
        roleId: feId,
        ...skill,
      }).onConflictDoNothing();
    }
    console.log(`Frontend Developer — ${feSkills.length} skills`);

    const pmId = 'role_product_manager';
    await db.insert(jobRoles).values({
      id: pmId,
      roleFamily: 'Product & Design',
      roleName: 'Product Manager',
      description: 'Define product strategy, prioritize features, and drive execution.',
      icon: 'lightbulb',
      isActive: true,
    }).onConflictDoNothing();

    const pmSkills = [
      { skillName: 'Product Strategy', skillType: 'core', importanceLevel: 5 },
      { skillName: 'User Research', skillType: 'core', importanceLevel: 4 },
      { skillName: 'Agile/Scrum', skillType: 'domain', importanceLevel: 4 },
      { skillName: 'Data-Driven Decision Making', skillType: 'core', importanceLevel: 4 },
      { skillName: 'Stakeholder Management', skillType: 'soft', importanceLevel: 5 },
    ];

    for (const skill of pmSkills) {
      await db.insert(roleSkills).values({
        id: nanoid(16),
        roleId: pmId,
        ...skill,
      }).onConflictDoNothing();
    }
    console.log(`Product Manager — ${pmSkills.length} skills`);

    const uxId = 'role_uiux_designer';
    await db.insert(jobRoles).values({
      id: uxId,
      roleFamily: 'Product & Design',
      roleName: 'UI/UX Designer',
      description: 'Design user interfaces and experiences through research and prototyping.',
      icon: 'palette',
      isActive: true,
    }).onConflictDoNothing();

    const uxSkills = [
      { skillName: 'Figma', skillType: 'tool', importanceLevel: 5 },
      { skillName: 'User Research', skillType: 'core', importanceLevel: 5 },
      { skillName: 'Wireframing', skillType: 'core', importanceLevel: 4 },
      { skillName: 'Prototyping', skillType: 'core', importanceLevel: 4 },
      { skillName: 'Design Systems', skillType: 'core', importanceLevel: 4 },
    ];

    for (const skill of uxSkills) {
      await db.insert(roleSkills).values({
        id: nanoid(16),
        roleId: uxId,
        ...skill,
      }).onConflictDoNothing();
    }
    console.log(`UI/UX Designer — ${uxSkills.length} skills`);

    console.log('\nSeeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

seed();
