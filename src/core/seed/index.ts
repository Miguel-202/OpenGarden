import { db } from '@/db';
import { templates, templateTools, templateConsumables, templateTasks } from '@/db/schema';
import { count, eq } from 'drizzle-orm';

export const BUILTIN_TEMPLATE_IDS = ['template_broccoli_sprouts', 'template_basil_windowsill'];

const BUILTIN_TEMPLATES = [
    {
        template: {
            id: 'template_broccoli_sprouts',
            title: 'Broccoli Sprouts (Jar Method)',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 5,
            totalDurationDays: 5,
            environment: 'Kitchen Counter',
            emoji: '🥦',
        },
        tools: [
            { id: 'tool_sprout_jar', name: 'Sprouting Jar with Mesh Lid', emoji: '🫙' },
        ],
        consumables: [
            { id: 'cons_broccoli_seeds', name: 'Broccoli Sprouting Seeds', quantity: 2, unit: 'tbsp', emoji: '🌱' },
        ],
        tasks: [
            {
                id: 'task_sprout_soak', title: 'Soak Seeds', emoji: '💧',
                description: 'Soak 2 tbsp of seeds in water overnight (8-12 hours).',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '20:00', isRepeating: false,
            },
            {
                id: 'task_sprout_rinse', title: 'Rinse & Drain', emoji: '🚿',
                description: 'Fill jar with water, swirl, and drain thoroughly through the mesh lid. Invert the jar at an angle.',
                taskType: 'Care', windowStartDay: 1, windowEndDay: 4,
                isRepeating: true, dailyTimes: JSON.stringify(['08:00', '20:00']),
            },
            {
                id: 'task_sprout_harvest', title: 'Harvest & Dry', emoji: '✂️',
                description: 'Final rinse. Remove hulls if possible. Let them dry on a paper towel for 8 hours before refrigerating.',
                taskType: 'Harvest', windowStartDay: 5, windowEndDay: 5,
                timeOfDay: '09:00', isRepeating: false,
            },
        ],
    },
    {
        template: {
            id: 'template_basil_windowsill',
            title: 'Basil (Windowsill)',
            difficulty: 'Beginner',
            estimatedDailyTimeMins: 2,
            totalDurationDays: 30,
            environment: 'Sunny Window',
            emoji: '🌿',
        },
        tools: [
            { id: 'tool_pot_4inch', name: '4-inch Nursery Pot with Drainage', emoji: '🪴' },
            { id: 'tool_saucer', name: 'Plant Saucer', emoji: '🍽️' },
        ],
        consumables: [
            { id: 'cons_basil_seeds', name: 'Basil Seeds', quantity: 5, unit: 'seeds', emoji: '🌱' },
            { id: 'cons_potting_mix', name: 'Potting Mix', quantity: 1, unit: 'pot', emoji: '🟤' },
        ],
        tasks: [
            {
                id: 'task_basil_plant', title: 'Sow Seeds', emoji: '🌱',
                description: 'Fill pot with moist soil. Press 5 seeds gently into the surface. Do not bury deep.',
                taskType: 'Preparation', windowStartDay: 0, windowEndDay: 0,
                timeOfDay: '10:00', isRepeating: false,
            },
            {
                id: 'task_basil_water', title: 'Water/Mist', emoji: '💧',
                description: 'Check soil surface. If dry, mist or lightly water until slightly damp.',
                taskType: 'Care', windowStartDay: 1, windowEndDay: 30,
                isRepeating: true, dailyTimes: JSON.stringify(['09:00']),
            },
            {
                id: 'task_basil_thin', title: 'Thin Seedlings', emoji: '✂️',
                description: 'Identify the strongest seedling. Snip the others at the soil line with scissors.',
                taskType: 'Care', windowStartDay: 14, windowEndDay: 14,
                timeOfDay: '10:00', isRepeating: false,
            },
        ],
    },
];

export async function seedDatabase() {
    const existing = await db.select({ value: count() }).from(templates);
    if (existing[0].value === 0) {
        console.log('Seeding default templates...');
        for (const data of BUILTIN_TEMPLATES) {
            await insertBuiltinTemplate(data);
        }
        console.log('Seeded templates successfully!');
    }
    await applyBuiltinEmojis();
}

async function insertBuiltinTemplate(data: (typeof BUILTIN_TEMPLATES)[number]) {
    await db.insert(templates).values(data.template);
    if (data.tools.length) {
        await db.insert(templateTools).values(
            data.tools.map(t => ({ ...t, templateId: data.template.id })),
        );
    }
    if (data.consumables.length) {
        await db.insert(templateConsumables).values(
            data.consumables.map(c => ({ ...c, templateId: data.template.id })),
        );
    }
    if (data.tasks.length) {
        await db.insert(templateTasks).values(
            data.tasks.map(t => ({ ...t, templateId: data.template.id })),
        );
    }
}

async function applyBuiltinEmojis() {
    for (const data of BUILTIN_TEMPLATES) {
        try {
            await db.update(templates).set({ emoji: data.template.emoji }).where(eq(templates.id, data.template.id));
            for (const t of data.tools) {
                await db.update(templateTools).set({ emoji: t.emoji }).where(eq(templateTools.id, t.id));
            }
            for (const c of data.consumables) {
                await db.update(templateConsumables).set({ emoji: c.emoji }).where(eq(templateConsumables.id, c.id));
            }
            for (const task of data.tasks) {
                await db.update(templateTasks).set({ emoji: task.emoji }).where(eq(templateTasks.id, task.id));
            }
        } catch {}
    }
}

export async function resetBuiltinTemplate(templateId: string) {
    const data = BUILTIN_TEMPLATES.find(t => t.template.id === templateId);
    if (!data) throw new Error('Not a built-in template');

    await db.delete(templateTasks).where(eq(templateTasks.templateId, templateId));
    await db.delete(templateConsumables).where(eq(templateConsumables.templateId, templateId));
    await db.delete(templateTools).where(eq(templateTools.templateId, templateId));
    await db.delete(templates).where(eq(templates.id, templateId));

    await insertBuiltinTemplate(data);
}
