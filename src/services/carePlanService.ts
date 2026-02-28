import { Share } from 'react-native';
import { getTodayTasks, getUpcomingTasks } from '@/features/api';
import { format } from 'date-fns';

export type CarePlanOptions = {
    runTitle: string;
    helperName?: string;
};

/**
 * Generates a human-readable, plain-text care plan for a helper.
 * Includes today's tasks + the next 3 days, formatted with checkboxes.
 */
export async function generateCarePlanText(options: CarePlanOptions): Promise<string> {
    const [today, upcoming] = await Promise.all([
        getTodayTasks(),
        getUpcomingTasks(3),
    ]);

    const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');
    const greeting = options.helperName
        ? `Hi ${options.helperName},\n`
        : '';

    const header = [
        `🌱 OpenGarden — Care Plan`,
        `Project: ${options.runTitle}`,
        `Prepared: ${todayStr}`,
        '',
        greeting,
        `This is a care guide so you can tend to the plants while I'm away.`,
        `Please check off each task as you complete it.`,
        '',
    ].join('\n');

    // --- TODAY ---
    const todaySection = today.length > 0
        ? [
            `━━━━━━━━━━━━━━━━━━━━━━`,
            `📅 TODAY — ${format(new Date(), 'EEE, MMM d')}`,
            `━━━━━━━━━━━━━━━━━━━━━━`,
            ...today.map(t => {
                const time = format(new Date(t.task.dueAt), 'h:mm a');
                return `☐ ${time}  ${t.taskTitle ?? 'Task'}\n   ${t.taskDescription ?? ''}`;
            }),
        ].join('\n')
        : `(No tasks due today.)`;

    // --- UPCOMING ---
    const grouped = new Map<string, typeof upcoming>();
    for (const item of upcoming) {
        const dayKey = format(new Date(item.task.dueAt), 'EEE, MMM d');
        if (!grouped.has(dayKey)) grouped.set(dayKey, []);
        grouped.get(dayKey)!.push(item);
    }

    const upcomingSection = upcoming.length > 0
        ? [
            '',
            `━━━━━━━━━━━━━━━━━━━━━━`,
            '📅 UPCOMING 3 DAYS',
            `━━━━━━━━━━━━━━━━━━━━━━`,
            ...[...grouped.entries()].map(([day, tasks]) => [
                `\n${day}`,
                ...tasks.map(t => {
                    const time = format(new Date(t.task.dueAt), 'h:mm a');
                    return `☐ ${time}  ${t.taskTitle ?? 'Task'}\n   ${t.taskDescription ?? ''}`;
                }),
            ].join('\n')),
        ].join('\n')
        : '';

    const footer = [
        '',
        '━━━━━━━━━━━━━━━━━━━━━━',
        '💡 KEY TIPS',
        '━━━━━━━━━━━━━━━━━━━━━━',
        '• If you see mold, orange colour, or foul smell — discard the batch.',
        '• Make sure to drain thoroughly after each rinse.',
        '• Keep the container in indirect light (not direct sun).',
        '',
        'Thank you for helping! 🙏',
    ].join('\n');

    return header + todaySection + upcomingSection + footer;
}

/**
 * Triggers the OS share sheet with the care plan text.
 */
export async function shareCarePlan(options: CarePlanOptions) {
    const text = await generateCarePlanText(options);
    await Share.share({
        title: `${options.runTitle} — Care Plan`,
        message: text,
    });
}
