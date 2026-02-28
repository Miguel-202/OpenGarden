import { db } from '@/db';
import {
    templates, templateTools, templateConsumables, templateTasks,
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

// ── Inventory queries ─────────────────────────────────────────────────────────

export async function getAllInventoryItems() {
    return db.select().from(inventoryItems);
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
        .select({ run: runs, templateTitle: templates.title })
        .from(runs)
        .leftJoin(templates, eq(runs.templateId, templates.id));
    return rows;
}

export async function getRunDetail(runId: string) {
    const runRows = await db.select().from(runs).where(eq(runs.id, runId));
    if (!runRows.length) return null;
    const run = runRows[0];

    const requirements = await db
        .select({
            req: runRequiredItems,
            itemName: inventoryItems.name,
        })
        .from(runRequiredItems)
        .leftJoin(inventoryItems, eq(runRequiredItems.itemId, inventoryItems.id))
        .where(eq(runRequiredItems.runId, runId));

    return { run, requirements };
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
): Promise<string> {
    const detail = await getTemplateDetail(templateId);
    if (!detail) throw new Error('Template not found');

    const runId = crypto.randomUUID();
    const startDateTs = startDate;

    await db.insert(runs).values({
        id: runId,
        templateId,
        startDate: startDateTs,
        status: 'active',
    });

    // Build requirements from template tools + consumables
    const globalInv = await getAllInventoryItems();
    const allReqs = [
        ...detail.tools.map(t => ({ name: t.name, category: 'tool' as const })),
        ...detail.consumables.map(c => ({
            name: c.name,
            category: 'consumable' as const,
            quantity: c.quantity,
            unit: c.unit,
        })),
    ];

    const { stubs, newGlobalItems } = buildRunRequirements(runId, allReqs, globalInv);

    // Insert any newly discovered global items
    for (const item of newGlobalItems) {
        await db.insert(inventoryItems).values({ id: item.id, name: item.name, category: item.category });
    }

    // Insert run requirements
    for (const stub of stubs) {
        await db.insert(runRequiredItems).values(stub);
    }

    // Generate initial rolling horizon tasks (14 days)
    await advanceHorizon(runId, startDate, detail.tasks);

    return runId;
}

// ── Staggered Runs ────────────────────────────────────────────────────────────

export async function startStaggeredRuns(
    templateId: string,
    firstStartDate: Date,
    batchCount: number,
    offsetDays: number,
): Promise<string[]> {
    const runIds: string[] = [];
    for (let i = 0; i < batchCount; i++) {
        const startDate = addDays(firstStartDate, i * offsetDays);
        const id = await startRun(templateId, startDate);
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

    // Get existing task signatures to avoid duplicates
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
        })
        .from(runTasks)
        .leftJoin(templateTasks, eq(runTasks.templateTaskId, templateTasks.id))
        .leftJoin(runs, eq(runTasks.runId, runs.id))
        .leftJoin(templates, eq(runs.templateId, templates.id))
        .where(and(
            eq(runTasks.status, 'pending'),
        ));

    // Filter to today's tasks in TypeScript (avoids SQLite ISO string comparison gotchas)
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
            updates.status = 'pending'; // snoozed pushes back to pending at new time
        }
    }

    await db.update(runTasks).set(updates).where(eq(runTasks.id, taskId));
}
