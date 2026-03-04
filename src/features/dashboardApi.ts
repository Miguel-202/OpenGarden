import { db } from '@/db';
import { runs, runTasks, templateTasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export type DashboardStats = {
    activeProjects: number;
    totalProjects: number;
    tasksCompletedToday: number;
    tasksCompletedThisWeek: number;
    totalTasksCompleted: number;
    completionRate: number; // 0–100
    currentStreak: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
    const allRuns = await db.select().from(runs);
    const activeProjects = allRuns.filter(r => r.isStarted && r.status === 'active').length;
    const totalProjects = allRuns.length;

    const allTasks = await db.select().from(runTasks);
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const skippedTasks = allTasks.filter(t => t.status === 'skipped');
    const totalTasksCompleted = completedTasks.length;

    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();
    const tasksCompletedToday = completedTasks.filter(
        t => t.completedAt && t.completedAt >= todayStart && t.completedAt <= todayEnd,
    ).length;

    const weekStart = subDays(startOfDay(now), 6).toISOString();
    const tasksCompletedThisWeek = completedTasks.filter(
        t => t.completedAt && t.completedAt >= weekStart,
    ).length;

    const denominator = completedTasks.length + skippedTasks.length;
    const completionRate = denominator > 0
        ? Math.round((completedTasks.length / denominator) * 100)
        : 0;

    // Streak: consecutive days (going backwards from today) with ≥1 completed task
    let streak = 0;
    for (let i = 0; i < 365; i++) {
        const dayStart = startOfDay(subDays(now, i)).toISOString();
        const dayEnd = endOfDay(subDays(now, i)).toISOString();
        const hasCompletion = completedTasks.some(
            t => t.completedAt && t.completedAt >= dayStart && t.completedAt <= dayEnd,
        );
        if (hasCompletion) {
            streak++;
        } else if (i > 0) {
            break;
        }
        // If today has no completions yet, streak can still be from yesterday
        if (i === 0 && !hasCompletion) continue;
    }

    return {
        activeProjects,
        totalProjects,
        tasksCompletedToday,
        tasksCompletedThisWeek,
        totalTasksCompleted,
        completionRate,
        currentStreak: streak,
    };
}

// ── Weekly Activity ───────────────────────────────────────────────────────────

export type DailyActivity = {
    dayLabel: string; // e.g. "Mon"
    completed: number;
    skipped: number;
};

export async function getWeeklyActivity(): Promise<DailyActivity[]> {
    const now = new Date();
    const allTasks = await db.select().from(runTasks);
    const result: DailyActivity[] = [];

    for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStart = startOfDay(day).toISOString();
        const dayEnd = endOfDay(day).toISOString();

        const completed = allTasks.filter(
            t => t.status === 'completed' && t.completedAt && t.completedAt >= dayStart && t.completedAt <= dayEnd,
        ).length;

        const skipped = allTasks.filter(
            t => t.status === 'skipped' && t.dueAt >= dayStart && t.dueAt <= dayEnd,
        ).length;

        result.push({
            dayLabel: format(day, 'EEE'),
            completed,
            skipped,
        });
    }

    return result;
}

// ── Task Type Breakdown ───────────────────────────────────────────────────────

export type TaskTypeCount = {
    type: string;
    count: number;
    color: string;
};

const TYPE_COLORS: Record<string, string> = {
    Preparation: '#A5D6A7',
    Care: '#81D4FA',
    Harvest: '#FFF59D',
    Check: '#E1BEE7',
};

export async function getTaskTypeBreakdown(): Promise<TaskTypeCount[]> {
    const allCompleted = await db
        .select({ taskType: templateTasks.taskType })
        .from(runTasks)
        .leftJoin(templateTasks, eq(runTasks.templateTaskId, templateTasks.id))
        .where(eq(runTasks.status, 'completed'));

    const counts: Record<string, number> = {};
    for (const row of allCompleted) {
        const type = row.taskType ?? 'Other';
        counts[type] = (counts[type] || 0) + 1;
    }

    return Object.entries(counts).map(([type, count]) => ({
        type,
        count,
        color: TYPE_COLORS[type] ?? '#E0E0E0',
    }));
}
