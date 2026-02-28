import { addDays, startOfDay, isBefore, isAfter } from 'date-fns';
import * as crypto from 'expo-crypto';

export type TemplateTaskDef = {
    id: string;
    windowStartDay: number;
    windowEndDay: number;
    timeOfDay?: string | null;
    isRepeating: boolean;
    dailyTimes?: string | null; // serialized JSON array
};

export type GeneratedRunTask = {
    id: string;
    runId: string;
    templateTaskId: string;
    dueAt: string; // ISO date string
    status: 'pending';
    reminderEnabled: boolean;
};

/**
 * Generates exact dates for a set of template tasks relative to the run's start date,
 * filtered by a rolling horizon to prevent infinite DB growth.
 * 
 * @param runId The ID of the run
 * @param startDate The exact date/time the run started
 * @param templateTasks The definitions of the tasks from the template
 * @param horizonDate The maximum date to generate tasks for (e.g., today + 14 days)
 * @param existingTaskIds Set of unique identifiers (e.g. `${templateTaskId}-${dueAt}`) to prevent duplicates
 */
export function generateRunTasks(
    runId: string,
    startDate: Date,
    templateTasks: TemplateTaskDef[],
    horizonDate: Date,
    existingTaskSignatures: Set<string> = new Set()
): GeneratedRunTask[] {
    const generatedTasks: GeneratedRunTask[] = [];
    const runStartDay = startOfDay(startDate);
    const horizonStart = startOfDay(horizonDate);

    for (const task of templateTasks) {
        const startDayOffset = task.windowStartDay;
        const endDayOffset = task.windowEndDay;

        for (let offset = startDayOffset; offset <= endDayOffset; offset++) {
            const targetDate = addDays(runStartDay, offset);

            // Stop generating if the specific day is past the horizon
            if (isAfter(targetDate, horizonStart)) {
                continue;
            }

            // Determine the specific times for this day
            let timesToGenerate: string[] = [];
            if (task.isRepeating && task.dailyTimes) {
                try {
                    timesToGenerate = JSON.parse(task.dailyTimes);
                } catch {
                    timesToGenerate = ['09:00'];
                }
            } else if (task.timeOfDay) {
                timesToGenerate = [task.timeOfDay];
            } else {
                timesToGenerate = ['09:00']; // default fallback
            }

            for (const timeStr of timesToGenerate) {
                const [hours, minutes] = timeStr.split(':').map(Number);
                const dueAtDate = new Date(targetDate);
                dueAtDate.setHours(hours, minutes, 0, 0);

                const dueAtIso = dueAtDate.toISOString();
                const signature = `${task.id}-${dueAtIso}`;

                if (!existingTaskSignatures.has(signature)) {
                    generatedTasks.push({
                        id: crypto.randomUUID(),
                        runId,
                        templateTaskId: task.id,
                        dueAt: dueAtIso,
                        status: 'pending',
                        reminderEnabled: true,
                    });
                }
            }
        }
    }

    return generatedTasks;
}
