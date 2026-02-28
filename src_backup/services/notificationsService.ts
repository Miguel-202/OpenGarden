import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '@/db';
import { runTasks, templateTasks, runs } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { addDays } from 'date-fns';

/**
 * Configures the notification handler — must be called at Module scope or early in App.
 */
export function configureNotifications() {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

/**
 * Request OS permission for local notifications.
 * Returns true if granted, false otherwise.
 */
export async function requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Plant Care Reminders',
            importance: Notifications.AndroidImportance.HIGH,
        });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

/**
 * Schedules local notifications for all pending run tasks within the next 14 days
 * that do not yet have a scheduled notification.
 * 
 * If a task already has a `notificationId`, it is skipped (idempotent).
 * When a task is snoozed or completed (via updateTaskStatus in api.ts), the old
 * notification is cancelled and a new one is scheduled if needed.
 */
export async function scheduleRollingNotifications(horizonDays = 14) {
    const granted = await requestPermissions();
    if (!granted) return;

    const now = new Date();
    const horizon = addDays(now, horizonDays).toISOString();

    // Find all pending tasks within horizon that haven't been scheduled yet
    const pendingRows = await db
        .select({
            task: runTasks,
            taskTitle: templateTasks.title,
            taskDescription: templateTasks.description,
        })
        .from(runTasks)
        .leftJoin(templateTasks, eq(runTasks.templateTaskId, templateTasks.id))
        .where(and(eq(runTasks.status, 'pending'), isNull(runTasks.notificationId)));

    const toSchedule = pendingRows.filter(
        r => r.task.dueAt > now.toISOString() && r.task.dueAt <= horizon && r.task.reminderEnabled,
    );

    for (const row of toSchedule) {
        const triggerDate = new Date(row.task.dueAt);
        if (triggerDate <= now) continue; // past tasks — skip

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `🌱 ${row.taskTitle ?? 'Plant Task'}`,
                body: row.taskDescription ?? 'Time to tend to your plants!',
                data: { taskId: row.task.id },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
            },
        });

        // Persist the notification ID so we can cancel it later
        await db.update(runTasks).set({
            notificationId,
            notificationScheduledAt: now.toISOString(),
        }).where(eq(runTasks.id, row.task.id));
    }
}

/**
 * Cancels the scheduled notification for a specific task.
 * Call this before rescheduling (e.g., on snooze).
 */
export async function cancelTaskNotification(taskId: string) {
    const rows = await db.select().from(runTasks).where(eq(runTasks.id, taskId));
    if (rows.length && rows[0].notificationId) {
        await Notifications.cancelScheduledNotificationAsync(rows[0].notificationId);
        await db.update(runTasks).set({ notificationId: null, notificationScheduledAt: null }).where(eq(runTasks.id, taskId));
    }
}
