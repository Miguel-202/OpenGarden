import { db } from '@/db';
import { templates, templateTools, templateConsumables, templateTasks, inventoryItems } from '@/db/schema';
import { count } from 'drizzle-orm';

export async function seedDatabase() {
    const existingTemplates = await db.select({ value: count() }).from(templates);
    if (existingTemplates[0].value > 0) {
        return; // Already seeded
    }

    console.log('Seeding default templates...');

    // 1. Broccoli Sprouts (Jar Method)
    const sproutsId = 'template_broccoli_sprouts';
    await db.insert(templates).values({
        id: sproutsId,
        title: 'Broccoli Sprouts (Jar Method)',
        difficulty: 'Beginner',
        estimatedDailyTimeMins: 5,
        totalDurationDays: 5,
        environment: 'Kitchen Counter',
    });

    await db.insert(templateTools).values([
        { id: 'tool_sprout_jar', templateId: sproutsId, name: 'Sprouting Jar with Mesh Lid' },
    ]);

    await db.insert(templateConsumables).values([
        { id: 'cons_broccoli_seeds', templateId: sproutsId, name: 'Broccoli Sprouting Seeds', quantity: 2, unit: 'tbsp' },
    ]);

    await db.insert(templateTasks).values([
        {
            id: 'task_sprout_soak',
            templateId: sproutsId,
            title: 'Soak Seeds',
            description: 'Soak 2 tbsp of seeds in water overnight (8-12 hours).',
            taskType: 'Preparation',
            windowStartDay: 0,
            windowEndDay: 0,
            timeOfDay: '20:00', // Evening soak
            isRepeating: false,
        },
        {
            id: 'task_sprout_rinse',
            templateId: sproutsId,
            title: 'Rinse & Drain',
            description: 'Fill jar with water, swirl, and drain thoroughly through the mesh lid. Invert the jar at an angle.',
            taskType: 'Care',
            windowStartDay: 1,
            windowEndDay: 4,
            isRepeating: true,
            dailyTimes: JSON.stringify(['08:00', '20:00']), // Twice a day
        },
        {
            id: 'task_sprout_harvest',
            templateId: sproutsId,
            title: 'Harvest & Dry',
            description: 'Final rinse. Remove hulls if possible. Let them dry on a paper towel for 8 hours before refrigerating.',
            taskType: 'Harvest',
            windowStartDay: 5,
            windowEndDay: 5,
            timeOfDay: '09:00',
            isRepeating: false,
        }
    ]);

    // 2. Basil (Windowsill)
    const basilId = 'template_basil_windowsill';
    await db.insert(templates).values({
        id: basilId,
        title: 'Basil (Windowsill)',
        difficulty: 'Beginner',
        estimatedDailyTimeMins: 2,
        totalDurationDays: 30, // tracking seedling stage
        environment: 'Sunny Window',
    });

    await db.insert(templateTools).values([
        { id: 'tool_pot_4inch', templateId: basilId, name: '4-inch Nursery Pot with Drainage' },
        { id: 'tool_saucer', templateId: basilId, name: 'Plant Saucer' },
    ]);

    await db.insert(templateConsumables).values([
        { id: 'cons_basil_seeds', templateId: basilId, name: 'Basil Seeds', quantity: 5, unit: 'seeds' },
        { id: 'cons_potting_mix', templateId: basilId, name: 'Potting Mix', quantity: 1, unit: 'pot' },
    ]);

    await db.insert(templateTasks).values([
        {
            id: 'task_basil_plant',
            templateId: basilId,
            title: 'Sow Seeds',
            description: 'Fill pot with moist soil. Press 5 seeds gently into the surface. Do not bury deep.',
            taskType: 'Preparation',
            windowStartDay: 0,
            windowEndDay: 0,
            timeOfDay: '10:00',
            isRepeating: false,
        },
        {
            id: 'task_basil_water',
            templateId: basilId,
            title: 'Water/Mist',
            description: 'Check soil surface. If dry, mist or lightly water until slightly damp.',
            taskType: 'Care',
            windowStartDay: 1,
            windowEndDay: 30,
            isRepeating: true,
            dailyTimes: JSON.stringify(['09:00']), // Once a day check
        },
        {
            id: 'task_basil_thin',
            templateId: basilId,
            title: 'Thin Seedlings',
            description: 'Identify the strongest seedling. Snip the others at the soil line with scissors.',
            taskType: 'Care',
            windowStartDay: 14,
            windowEndDay: 14,
            timeOfDay: '10:00',
            isRepeating: false,
        }
    ]);

    // Global Inventory Defaults
    await db.insert(inventoryItems).values([
        { id: 'inv_sprout_jar', name: 'Sprouting Jar with Mesh Lid', category: 'tool', unitDefault: 'unit' },
        { id: 'inv_broccoli_seeds', name: 'Broccoli Sprouting Seeds', category: 'consumable', unitDefault: 'tbsp' },
        { id: 'inv_pot_4inch', name: '4-inch Nursery Pot with Drainage', category: 'tool', unitDefault: 'unit' },
        { id: 'inv_saucer', name: 'Plant Saucer', category: 'tool', unitDefault: 'unit' },
        { id: 'inv_basil_seeds', name: 'Basil Seeds', category: 'consumable', unitDefault: 'seeds' },
        { id: 'inv_potting_mix', name: 'Potting Mix', category: 'consumable', unitDefault: 'bag' },
    ]);

    console.log('Seeded templates successfully!');
}
