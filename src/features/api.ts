import { db } from '@/db';
import {
    templates, templateTools, templateConsumables, templateTasks, templateLinks,
    runs, runRequiredItems, inventoryItems, shoppingListItems, shoppingListLinks, runTasks,
} from '@/db/schema';
import { generateRunTasks } from '@/core/schedule';
import { buildRunRequirements } from '@/core/readiness';
import { eq, and, inArray } from 'drizzle-orm';
import { addDays } from 'date-fns';
import * as crypto from 'expo-crypto';

// ── Template queries ──────────────────────────────────────────────────────────

export async function getAllTemplates() {
    return db.select().from(templates);
}

export type TemplateDetail = {
    template: typeof templates.$inferSelect;
    tools: (typeof templateTools.$inferSelect)[];
    consumables: (typeof templateConsumables.$inferSelect)[];
    tasks: (typeof templateTasks.$inferSelect)[];
};

export async function getTemplateDetail(id: string): Promise<TemplateDetail | null> {
    const rows = await db.select().from(templates).where(eq(templates.id, id));
    if (!rows.length) return null;

    const [tools, consumables, tasks] = await Promise.all([
        db.select().from(templateTools).where(eq(templateTools.templateId, id)),
        db.select().from(templateConsumables).where(eq(templateConsumables.templateId, id)),
        db.select().from(templateTasks).where(eq(templateTasks.templateId, id)).orderBy(templateTasks.windowStartDay),
    ]);

    return { template: rows[0], tools, consumables, tasks };
}

// ── Create Template ───────────────────────────────────────────────────────────

export interface CreateTemplateInput {
    title: string;
    difficulty: string;
    estimatedDailyTimeMins: number;
    totalDurationDays: number;
    environment: string;
    imageUri?: string | null;
    emoji?: string | null;
    tools: Array<{ name: string; imageUri?: string | null; emoji?: string | null }>;
    consumables: Array<{ name: string; quantity: number; unit: string; imageUri?: string | null; emoji?: string | null }>;
    tasks: Array<{
        title: string;
        description?: string;
        taskType: string;
        windowStartDay: number;
        windowEndDay: number;
        timeOfDay?: string;
        isRepeating: boolean;
        dailyTimes?: string;
        imageUri?: string | null;
        emoji?: string | null;
    }>;
}

export async function createTemplate(input: CreateTemplateInput): Promise<string> {
    const templateId = crypto.randomUUID();

    await db.insert(templates).values({
        id: templateId,
        title: input.title,
        difficulty: input.difficulty,
        estimatedDailyTimeMins: input.estimatedDailyTimeMins,
        totalDurationDays: input.totalDurationDays,
        environment: input.environment,
        imageUri: input.imageUri ?? null,
        emoji: input.emoji ?? null,
    });

    for (const tool of input.tools) {
        await db.insert(templateTools).values({
            id: crypto.randomUUID(),
            templateId,
            name: tool.name,
            imageUri: tool.imageUri ?? null,
            emoji: tool.emoji ?? null,
        });
    }

    for (const c of input.consumables) {
        await db.insert(templateConsumables).values({
            id: crypto.randomUUID(),
            templateId,
            name: c.name,
            quantity: c.quantity,
            unit: c.unit,
            imageUri: c.imageUri ?? null,
            emoji: c.emoji ?? null,
        });
    }

    for (const t of input.tasks) {
        await db.insert(templateTasks).values({
            id: crypto.randomUUID(),
            templateId,
            title: t.title,
            description: t.description ?? null,
            taskType: t.taskType,
            windowStartDay: t.windowStartDay,
            windowEndDay: t.windowEndDay,
            timeOfDay: t.timeOfDay ?? null,
            isRepeating: t.isRepeating,
            dailyTimes: t.dailyTimes ?? null,
            imageUri: t.imageUri ?? null,
            emoji: t.emoji ?? null,
        });
    }

    return templateId;
}

export async function updateTemplate(templateId: string, input: CreateTemplateInput): Promise<void> {
    await db.update(templates).set({
        title: input.title,
        difficulty: input.difficulty,
        estimatedDailyTimeMins: input.estimatedDailyTimeMins,
        totalDurationDays: input.totalDurationDays,
        environment: input.environment,
        imageUri: input.imageUri ?? null,
        emoji: input.emoji ?? null,
    }).where(eq(templates.id, templateId));

    await db.delete(templateTools).where(eq(templateTools.templateId, templateId));
    await db.delete(templateConsumables).where(eq(templateConsumables.templateId, templateId));
    await db.delete(templateTasks).where(eq(templateTasks.templateId, templateId));

    for (const tool of input.tools) {
        await db.insert(templateTools).values({
            id: crypto.randomUUID(), templateId, name: tool.name,
            imageUri: tool.imageUri ?? null, emoji: tool.emoji ?? null,
        });
    }
    for (const c of input.consumables) {
        await db.insert(templateConsumables).values({
            id: crypto.randomUUID(), templateId, name: c.name,
            quantity: c.quantity, unit: c.unit,
            imageUri: c.imageUri ?? null, emoji: c.emoji ?? null,
        });
    }
    for (const t of input.tasks) {
        await db.insert(templateTasks).values({
            id: crypto.randomUUID(), templateId, title: t.title,
            description: t.description ?? null, taskType: t.taskType,
            windowStartDay: t.windowStartDay, windowEndDay: t.windowEndDay,
            timeOfDay: t.timeOfDay ?? null, isRepeating: t.isRepeating,
            dailyTimes: t.dailyTimes ?? null,
            imageUri: t.imageUri ?? null, emoji: t.emoji ?? null,
        });
    }
}

export async function deleteTemplate(templateId: string) {
    const templateRuns = await db.select({ id: runs.id }).from(runs).where(eq(runs.templateId, templateId));
    for (const run of templateRuns) {
        await deleteRun(run.id);
    }
    await db.delete(templateTasks).where(eq(templateTasks.templateId, templateId));
    await db.delete(templateConsumables).where(eq(templateConsumables.templateId, templateId));
    await db.delete(templateTools).where(eq(templateTools.templateId, templateId));
    await db.delete(templateLinks).where(eq(templateLinks.fromTemplateId, templateId));
    await db.delete(templates).where(eq(templates.id, templateId));
}

export async function exportTemplateAsJson(templateId: string): Promise<string> {
    const detail = await getTemplateDetail(templateId);
    if (!detail) throw new Error('Template not found');

    return JSON.stringify({
        title: detail.template.title,
        difficulty: detail.template.difficulty,
        estimatedDailyTimeMins: detail.template.estimatedDailyTimeMins,
        totalDurationDays: detail.template.totalDurationDays,
        environment: detail.template.environment,
        tools: detail.tools.map(t => ({ name: t.name })),
        consumables: detail.consumables.map(c => ({
            name: c.name, quantity: c.quantity, unit: c.unit,
        })),
        tasks: detail.tasks.map(t => ({
            title: t.title, description: t.description, taskType: t.taskType,
            windowStartDay: t.windowStartDay, windowEndDay: t.windowEndDay,
            timeOfDay: t.timeOfDay, isRepeating: t.isRepeating,
            dailyTimes: t.dailyTimes ? JSON.parse(t.dailyTimes) : null,
        })),
    });
}

// ── Inventory queries ─────────────────────────────────────────────────────────

export async function getAllInventoryItems() {
    return db.select().from(inventoryItems);
}

export async function toggleInventoryItem(id: string, isOwned: boolean) {
    await db.update(inventoryItems).set({ isOwned }).where(eq(inventoryItems.id, id));
}

export async function upsertInventoryItem(
    name: string,
    category: 'tool' | 'consumable',
    unitDefault?: string,
    notes?: string,
) {
    const id = crypto.randomUUID();
    await db.insert(inventoryItems).values({ id, name, category, unitDefault, notes }).onConflictDoNothing();
    return id;
}

// ── Shopping list queries ─────────────────────────────────────────────────────

export async function getShoppingList() {
    const items = await db.select({
        id: shoppingListItems.id,
        itemId: shoppingListItems.itemId,
        name: inventoryItems.name,
        quantity: shoppingListItems.quantity,
        unit: shoppingListItems.unit,
        checked: shoppingListItems.checked,
        storeNote: shoppingListItems.storeNote,
        createdAt: shoppingListItems.createdAt,
    })
        .from(shoppingListItems)
        .leftJoin(inventoryItems, eq(shoppingListItems.itemId, inventoryItems.id));
    return items;
}

export async function toggleShoppingItem(id: string, checked: boolean) {
    await db.update(shoppingListItems).set({ checked }).where(eq(shoppingListItems.id, id));
}

export async function addToShoppingList(
    itemId: string,
    quantity: number | null,
    unit: string | null,
    storeNote: string | null,
    runId?: string,
) {
    const newId = crypto.randomUUID();
    await db.insert(shoppingListItems).values({
        id: newId,
        itemId,
        quantity,
        unit,
        storeNote,
        checked: false,
        createdAt: new Date().toISOString(),
    });
    if (runId) {
        await db.insert(shoppingListLinks).values({
            id: crypto.randomUUID(),
            shoppingListItemId: newId,
            runId,
        });
    }
    return newId;
}

// ── Run queries ───────────────────────────────────────────────────────────────

export async function getAllRuns() {
    const rows = await db
        .select({
            run: runs,
            templateTitle: templates.title,
            templateId: templates.id,
            templateEmoji: templates.emoji,
        })
        .from(runs)
        .leftJoin(templates, eq(runs.templateId, templates.id));
    return rows;
}

export async function getNextRunName(templateId: string, templateTitle: string): Promise<string> {
    const existing = await db.select().from(runs).where(eq(runs.templateId, templateId));
    return `${templateTitle} ${existing.length + 1}`;
}

export async function deleteRun(runId: string) {
    const linkedShoppingIds = await db
        .select({ sid: shoppingListLinks.shoppingListItemId })
        .from(shoppingListLinks)
        .where(eq(shoppingListLinks.runId, runId));

    const linkedInventoryIds = await db
        .select({ iid: runRequiredItems.itemId })
        .from(runRequiredItems)
        .where(eq(runRequiredItems.runId, runId));

    await db.delete(runTasks).where(eq(runTasks.runId, runId));
    await db.delete(runRequiredItems).where(eq(runRequiredItems.runId, runId));
    await db.delete(shoppingListLinks).where(eq(shoppingListLinks.runId, runId));
    await db.delete(runs).where(eq(runs.id, runId));

    for (const { sid } of linkedShoppingIds) {
        const remaining = await db
            .select({ id: shoppingListLinks.id })
            .from(shoppingListLinks)
            .where(eq(shoppingListLinks.shoppingListItemId, sid));
        if (remaining.length === 0) {
            await db.delete(shoppingListItems).where(eq(shoppingListItems.id, sid));
        }
    }

    for (const { iid } of linkedInventoryIds) {
        const stillUsed = await db
            .select({ id: runRequiredItems.id })
            .from(runRequiredItems)
            .where(eq(runRequiredItems.itemId, iid));
        if (stillUsed.length === 0) {
            const rows = await db.select().from(inventoryItems).where(eq(inventoryItems.id, iid));
            if (rows.length > 0 && !rows[0].isOwned) {
                await db.delete(inventoryItems).where(eq(inventoryItems.id, iid));
            }
        }
    }
}

export async function activateRun(runId: string) {
    const detail = await getRunDetail(runId);
    if (!detail) throw new Error('Run not found');
    const templateDetail = await getTemplateDetail(detail.run.templateId);
    if (!templateDetail) throw new Error('Template not found');

    await db.update(runs).set({ isStarted: true }).where(eq(runs.id, runId));
    await advanceHorizon(runId, detail.run.startDate, templateDetail.tasks);
}

export async function getRunDetail(runId: string) {
    const runRows = await db
        .select({
            run: runs,
            template: templates,
        })
        .from(runs)
        .leftJoin(templates, eq(runs.templateId, templates.id))
        .where(eq(runs.id, runId));

    if (!runRows.length) return null;
    const { run, template } = runRows[0];

    const requirements = await db
        .select({
            req: runRequiredItems,
            itemId: inventoryItems.id,
            itemName: inventoryItems.name,
            itemEmoji: inventoryItems.emoji,
            itemNotes: inventoryItems.notes,
            itemCategory: inventoryItems.category,
        })
        .from(runRequiredItems)
        .leftJoin(inventoryItems, eq(runRequiredItems.itemId, inventoryItems.id))
        .where(eq(runRequiredItems.runId, runId));

    return { run, template, requirements };
}

export async function updateRequirementStatus(
    reqId: string,
    status: 'missing' | 'have' | 'bought' | 'not_needed',
) {
    await db.update(runRequiredItems).set({ status }).where(eq(runRequiredItems.id, reqId));
}

// ── Start Run ─────────────────────────────────────────────────────────────────

export async function startRun(
    templateId: string,
    startDate: Date,
    customName: string,
): Promise<string> {
    const detail = await getTemplateDetail(templateId);
    if (!detail) throw new Error('Template not found');

    const runId = crypto.randomUUID();
    const startDateTs = startDate;

    await db.insert(runs).values({
        id: runId,
        templateId,
        customName,
        startDate: startDateTs,
        status: 'active',
        isStarted: false,
    });

    const globalInv = await getAllInventoryItems();
    const allReqs = [
        ...detail.tools.map(t => ({ id: t.id, name: t.name, category: 'tool' as const, emoji: t.emoji })),
        ...detail.consumables.map(c => ({
            id: c.id,
            name: c.name,
            category: 'consumable' as const,
            quantity: c.quantity,
            unit: c.unit,
            emoji: c.emoji,
        })),
    ];

    const { stubs, newGlobalItems } = buildRunRequirements(runId, allReqs, globalInv);

    for (const item of newGlobalItems) {
        await db.insert(inventoryItems).values({
            id: item.id,
            name: item.name,
            category: item.category,
            emoji: item.emoji,
        });
    }

    for (const stub of stubs) {
        await db.insert(runRequiredItems).values(stub);
    }

    return runId;
}

// ── Staggered Runs ────────────────────────────────────────────────────────────

export async function startStaggeredRuns(
    templateId: string,
    firstStartDate: Date,
    batchCount: number,
    offsetDays: number,
): Promise<string[]> {
    const detail = await getTemplateDetail(templateId);
    if (!detail) throw new Error('Template not found');
    const templateTitle = detail.template.title;

    const existingCount = (await db.select().from(runs).where(eq(runs.templateId, templateId))).length;

    const runIds: string[] = [];
    for (let i = 0; i < batchCount; i++) {
        const startDate = addDays(firstStartDate, i * offsetDays);
        const name = `${templateTitle} ${existingCount + i + 1}`;
        const id = await startRun(templateId, startDate, name);
        runIds.push(id);
    }
    return runIds;
}

// ── Rolling Horizon ───────────────────────────────────────────────────────────

export async function advanceHorizon(
    runId: string,
    runStartDate: Date,
    templateTaskDefs: (typeof templateTasks.$inferSelect)[],
    horizonDays = 14,
) {
    const horizonDate = addDays(new Date(), horizonDays);

    const existing = await db
        .select({ templateTaskId: runTasks.templateTaskId, dueAt: runTasks.dueAt })
        .from(runTasks)
        .where(eq(runTasks.runId, runId));

    const existingSignatures = new Set(existing.map(r => `${r.templateTaskId}-${r.dueAt}`));

    const newTasks = generateRunTasks(
        runId,
        runStartDate,
        templateTaskDefs,
        horizonDate,
        existingSignatures,
    );

    for (const task of newTasks) {
        await db.insert(runTasks).values(task);
    }
}

// ── Today Screen ──────────────────────────────────────────────────────────────

export async function getTodayTasks() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    const rows = await db
        .select({
            task: runTasks,
            taskTitle: templateTasks.title,
            taskType: templateTasks.taskType,
            taskDescription: templateTasks.description,
            templateTitle: templates.title,
            templateId: templates.id,
            startDate: runs.startDate,
            totalDurationDays: templates.totalDurationDays,
        })
        .from(runTasks)
        .leftJoin(templateTasks, eq(runTasks.templateTaskId, templateTasks.id))
        .leftJoin(runs, eq(runTasks.runId, runs.id))
        .leftJoin(templates, eq(runs.templateId, templates.id))
        .where(and(
            eq(runTasks.status, 'pending'),
        ));

    return rows.filter(r => r.task.dueAt >= startOfToday && r.task.dueAt <= endOfToday);
}

export async function getUpcomingTasks(days = 3) {
    const now = new Date();
    const endDate = addDays(now, days);
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const endOfWindow = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).toISOString();

    const rows = await db
        .select({
            task: runTasks,
            taskTitle: templateTasks.title,
            taskType: templateTasks.taskType,
            taskDescription: templateTasks.description,
            templateTitle: templates.title,
            templateId: templates.id,
            startDate: runs.startDate,
            totalDurationDays: templates.totalDurationDays,
        })
        .from(runTasks)
        .leftJoin(templateTasks, eq(runTasks.templateTaskId, templateTasks.id))
        .leftJoin(runs, eq(runTasks.runId, runs.id))
        .leftJoin(templates, eq(runs.templateId, templates.id))
        .where(eq(runTasks.status, 'pending'));

    return rows.filter(r => r.task.dueAt >= startOfTomorrow && r.task.dueAt <= endOfWindow);
}

export async function updateTaskStatus(
    taskId: string,
    status: 'completed' | 'skipped' | 'snoozed',
    snoozeHours?: number,
    note?: string,
) {
    const updates: Partial<typeof runTasks.$inferInsert> = {
        status,
        note: note ?? undefined,
    };

    if (status === 'completed') {
        updates.completedAt = new Date().toISOString();
    }

    if (status === 'snoozed' && snoozeHours) {
        const task = await db.select().from(runTasks).where(eq(runTasks.id, taskId));
        if (task.length) {
            const newDue = new Date(task[0].dueAt);
            newDue.setHours(newDue.getHours() + snoozeHours);
            updates.dueAt = newDue.toISOString();
            updates.status = 'pending';
        }
    }

    await db.update(runTasks).set(updates).where(eq(runTasks.id, taskId));
}
