import 'dotenv/config';
import { nanoid } from 'nanoid';
import { pool } from './client.ts';
import { db } from './index.ts';
import { jobRoles } from './schema/job_roles.ts';
import { interviewStages } from './schema/interview_stages.ts';

/**
 * Seed script for InterviewIQ.
 * Populates job_roles and interview_stages with initial data.
 *
 * Run with: npm run db:seed
 */
const seed = async () => {
  console.log('🌱 Seeding database...\n');

  try {
    // ==========================================
    // Job Role 1: Software Engineering
    // ==========================================
    const seId = nanoid(16);
    await db.insert(jobRoles).values({
      id: seId,
      name: 'Software Engineering',
      description:
        'Simulasi wawancara untuk posisi Software Engineer. Mencakup tahap HRD, Technical Interview, User Interview, dan Final/Offer.',
      icon: 'code',
      isActive: true,
    });

    const seStages = [
      {
        id: nanoid(16),
        jobRoleId: seId,
        stepOrder: 1,
        name: 'HRD Interview',
        type: 'behavioral',
        focusArea: 'Motivasi, kepribadian, ekspektasi gaji, culture fit, STAR method',
      },
      {
        id: nanoid(16),
        jobRoleId: seId,
        stepOrder: 2,
        name: 'Technical Interview',
        type: 'technical',
        focusArea: 'Data Structures & Algorithms, system design, coding logic, problem solving',
      },
      {
        id: nanoid(16),
        jobRoleId: seId,
        stepOrder: 3,
        name: 'User Interview',
        type: 'domain',
        focusArea: 'Kolaborasi tim, product sense, pengalaman kerja nyata, studi kasus',
      },
      {
        id: nanoid(16),
        jobRoleId: seId,
        stepOrder: 4,
        name: 'Final / Offer',
        type: 'negotiation',
        focusArea: 'Negosiasi gaji, ekspektasi kerja, pertanyaan ke perusahaan, closing',
      },
    ];

    await db.insert(interviewStages).values(seStages);
    console.log(`✅ Software Engineering — ${seStages.length} stages`);

    // ==========================================
    // Job Role 2: Data Analyst / Scientist
    // ==========================================
    const daId = nanoid(16);
    await db.insert(jobRoles).values({
      id: daId,
      name: 'Data Analyst',
      description:
        'Simulasi wawancara untuk posisi Data Analyst / Data Scientist. Mencakup tahap HRD, Technical (SQL/Python), Case Study, dan User Interview.',
      icon: 'bar-chart',
      isActive: true,
    });

    const daStages = [
      {
        id: nanoid(16),
        jobRoleId: daId,
        stepOrder: 1,
        name: 'HRD Interview',
        type: 'behavioral',
        focusArea: 'Motivasi, kepribadian, ekspektasi gaji, culture fit, STAR method',
      },
      {
        id: nanoid(16),
        jobRoleId: daId,
        stepOrder: 2,
        name: 'Technical Interview',
        type: 'technical',
        focusArea: 'SQL query, Python scripting, statistik dasar, data wrangling',
      },
      {
        id: nanoid(16),
        jobRoleId: daId,
        stepOrder: 3,
        name: 'Case Study',
        type: 'domain',
        focusArea: 'Analisis data nyata, presentasi insight, business recommendation',
      },
      {
        id: nanoid(16),
        jobRoleId: daId,
        stepOrder: 4,
        name: 'User Interview',
        type: 'domain',
        focusArea: 'Kolaborasi dengan stakeholder, komunikasi hasil analisis, prioritisasi',
      },
    ];

    await db.insert(interviewStages).values(daStages);
    console.log(`✅ Data Analyst — ${daStages.length} stages`);

    // ==========================================
    // Job Role 3: Product Manager
    // ==========================================
    const pmId = nanoid(16);
    await db.insert(jobRoles).values({
      id: pmId,
      name: 'Product Manager',
      description:
        'Simulasi wawancara untuk posisi Product Manager. Mencakup tahap HRD, Product Case, User Interview, dan Final.',
      icon: 'lightbulb',
      isActive: true,
    });

    const pmStages = [
      {
        id: nanoid(16),
        jobRoleId: pmId,
        stepOrder: 1,
        name: 'HRD Interview',
        type: 'behavioral',
        focusArea: 'Motivasi, kepribadian, culture fit, STAR method',
      },
      {
        id: nanoid(16),
        jobRoleId: pmId,
        stepOrder: 2,
        name: 'Product Case',
        type: 'domain',
        focusArea: 'Product sense, prioritization framework, metrics definition, user empathy',
      },
      {
        id: nanoid(16),
        jobRoleId: pmId,
        stepOrder: 3,
        name: 'User Interview',
        type: 'domain',
        focusArea: 'Stakeholder management, roadmap planning, cross-functional collaboration',
      },
      {
        id: nanoid(16),
        jobRoleId: pmId,
        stepOrder: 4,
        name: 'Final / Offer',
        type: 'negotiation',
        focusArea: 'Negosiasi, ekspektasi, pertanyaan ke perusahaan',
      },
    ];

    await db.insert(interviewStages).values(pmStages);
    console.log(`✅ Product Manager — ${pmStages.length} stages`);

    // ==========================================
    // Job Role 4: UI/UX Designer
    // ==========================================
    const uxId = nanoid(16);
    await db.insert(jobRoles).values({
      id: uxId,
      name: 'UI/UX Designer',
      description:
        'Simulasi wawancara untuk posisi UI/UX Designer. Mencakup tahap HRD, Portfolio Review, Design Challenge, dan User Interview.',
      icon: 'palette',
      isActive: true,
    });

    const uxStages = [
      {
        id: nanoid(16),
        jobRoleId: uxId,
        stepOrder: 1,
        name: 'HRD Interview',
        type: 'behavioral',
        focusArea: 'Motivasi, kepribadian, culture fit',
      },
      {
        id: nanoid(16),
        jobRoleId: uxId,
        stepOrder: 2,
        name: 'Portfolio Review',
        type: 'domain',
        focusArea: 'Presentasi portfolio, design process, design thinking, user research',
      },
      {
        id: nanoid(16),
        jobRoleId: uxId,
        stepOrder: 3,
        name: 'Design Challenge',
        type: 'technical',
        focusArea: 'Live design exercise, wireframing, prototyping, design rationale',
      },
      {
        id: nanoid(16),
        jobRoleId: uxId,
        stepOrder: 4,
        name: 'User Interview',
        type: 'domain',
        focusArea: 'Kolaborasi dengan engineer, handling feedback, iteration',
      },
    ];

    await db.insert(interviewStages).values(uxStages);
    console.log(`✅ UI/UX Designer — ${uxStages.length} stages`);

    console.log('\n🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

seed();
