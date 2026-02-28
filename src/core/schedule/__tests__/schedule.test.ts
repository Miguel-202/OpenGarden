import { generateRunTasks, TemplateTaskDef } from '../index';
import { addDays, startOfDay } from 'date-fns';

describe('Schedule Generator Engine', () => {
    const startDate = new Date('2026-06-01T10:00:00Z'); // Day 0
    const horizonDate = addDays(startDate, 10); // generate 10 days out

    it('generates a single fixed task', () => {
        const tasks: TemplateTaskDef[] = [{
            id: 'task-1',
            windowStartDay: 0,
            windowEndDay: 0,
            timeOfDay: '09:00',
            isRepeating: false,
        }];

        const result = generateRunTasks('run-1', startDate, tasks, horizonDate);

        expect(result).toHaveLength(1);
        expect(result[0].templateTaskId).toBe('task-1');
        const dueAt = new Date(result[0].dueAt);
        expect(dueAt.getUTCHours()).toBe(9); // assuming we are asserting local via Date but node env might run UTC.
        // Wait, the logic used JS new Date(targetDate).setHours(9, 0, 0, 0).
        // In UTC environment or local environment, it preserves the relative hour!
    });

    it('generates repeating tasks over a window for specific daily times', () => {
        const tasks: TemplateTaskDef[] = [{
            id: 'task-repeat',
            windowStartDay: 1, // Start on Day 1
            windowEndDay: 3,   // End on Day 3
            isRepeating: true,
            dailyTimes: JSON.stringify(['08:00', '20:00']),
        }];

        const result = generateRunTasks('run-1', startDate, tasks, horizonDate);

        // Day 1, Day 2, Day 3 = 3 days * 2 times = 6 tasks
        expect(result).toHaveLength(6);
        expect(result[0].dueAt).toContain('T08:00:00');
        expect(result[1].dueAt).toContain('T20:00:00');
    });

    it('respects the rolling horizon limit', () => {
        const tasks: TemplateTaskDef[] = [{
            id: 'task-long',
            windowStartDay: 5,
            windowEndDay: 20, // 15 days of tasks
            isRepeating: true,
            dailyTimes: JSON.stringify(['09:00']),
        }];

        // Horizon is 10 days from start. Day 20 is outside the horizon.
        // Days 5, 6, 7, 8, 9, 10 should be generated (6 days)
        const result = generateRunTasks('run-2', startDate, tasks, horizonDate);

        expect(result).toHaveLength(6);
    });

    it('skips existing signatures to prevent duplicates', () => {
        const tasks: TemplateTaskDef[] = [{
            id: 'task-dup',
            windowStartDay: 0,
            windowEndDay: 1,
            isRepeating: true,
            dailyTimes: JSON.stringify(['09:00']),
        }];

        const existingSignatures = new Set<string>();

        // Generate once
        const pass1 = generateRunTasks('run-3', startDate, tasks, horizonDate, existingSignatures);
        expect(pass1).toHaveLength(2);

        // Add them to the set
        for (const t of pass1) {
            existingSignatures.add(`${t.templateTaskId}-${t.dueAt}`);
        }

        // Generate again
        const pass2 = generateRunTasks('run-3', startDate, tasks, horizonDate, existingSignatures);
        expect(pass2).toHaveLength(0); // All skipped
    });
});
