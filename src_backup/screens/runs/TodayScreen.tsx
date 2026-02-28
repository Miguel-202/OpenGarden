import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import {
    Text, Surface, Button, Chip, List, Divider, IconButton,
    ActivityIndicator, useTheme, Menu,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getTodayTasks, getUpcomingTasks, updateTaskStatus } from '@/features/api';
import { shareCarePlan } from '@/services/carePlanService';
import { format } from 'date-fns';
import { Share2 } from 'lucide-react-native';

type TodayTask = {
    task: {
        id: string;
        dueAt: string;
        status: string;
        note: string | null;
    };
    taskTitle: string | null;
    taskType: string | null;
    taskDescription: string | null;
    templateTitle: string | null;
};

const TASK_TYPE_COLORS: Record<string, string> = {
    Preparation: '#A5D6A7',
    Care: '#80DEEA',
    Harvest: '#FFF176',
    Check: '#CE93D8',
};

export default function TodayScreen() {
    const [tasks, setTasks] = useState<TodayTask[]>([]);
    const [upcoming, setUpcoming] = useState<TodayTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const theme = useTheme();

    const refresh = useCallback(() => {
        Promise.all([getTodayTasks(), getUpcomingTasks(3)]).then(([today, up]) => {
            setTasks(today as TodayTask[]);
            setUpcoming(up as TodayTask[]);
            setLoading(false);
        });
    }, []);

    useFocusEffect(refresh);

    const handleAction = async (taskId: string, action: 'completed' | 'skipped' | 'snoozed') => {
        setActiveMenu(null);
        if (action === 'snoozed') {
            await updateTaskStatus(taskId, 'snoozed', 2); // snooze 2 hours
        } else {
            await updateTaskStatus(taskId, action);
        }
        refresh();
    };

    const renderTask = ({ item }: { item: TodayTask }) => {
        const typeColor = TASK_TYPE_COLORS[item.taskType ?? ''] ?? '#E0E0E0';
        const time = format(new Date(item.task.dueAt), 'h:mm a');

        return (
            <Surface style={styles.taskCard} elevation={2}>
                <View style={[styles.typeBar, { backgroundColor: typeColor }]} />
                <View style={styles.taskBody}>
                    <View style={styles.taskHeader}>
                        <Text variant="labelSmall" style={{ opacity: 0.6 }}>{item.templateTitle}</Text>
                        <Text variant="labelMedium" style={{ fontWeight: '700' }}>{time}</Text>
                    </View>
                    <Text variant="titleMedium" style={styles.taskTitle}>{item.taskTitle}</Text>
                    {item.taskDescription && (
                        <Text variant="bodySmall" style={styles.taskDesc}>{item.taskDescription}</Text>
                    )}
                    <Chip compact style={[styles.typeChip, { backgroundColor: typeColor }]}>
                        {item.taskType}
                    </Chip>
                </View>
                <View style={styles.taskActions}>
                    <IconButton
                        icon="check-circle-outline"
                        iconColor={theme.colors.primary}
                        size={26}
                        onPress={() => handleAction(item.task.id, 'completed')}
                    />
                    <Menu
                        visible={activeMenu === item.task.id}
                        onDismiss={() => setActiveMenu(null)}
                        anchor={
                            <IconButton
                                icon="dots-vertical"
                                size={20}
                                onPress={() => setActiveMenu(item.task.id)}
                            />
                        }
                    >
                        <Menu.Item
                            leadingIcon="alarm"
                            onPress={() => handleAction(item.task.id, 'snoozed')}
                            title="Snooze 2h"
                        />
                        <Menu.Item
                            leadingIcon="skip-next"
                            onPress={() => handleAction(item.task.id, 'skipped')}
                            title="Skip"
                        />
                    </Menu>
                </View>
            </Surface>
        );
    };

    if (loading) return <ActivityIndicator style={styles.center} />;

    const todayDate = format(new Date(), 'EEEE, MMMM d');

    return (
        <FlatList
            style={{ backgroundColor: theme.colors.background }}
            contentContainerStyle={styles.list}
            data={tasks}
            keyExtractor={item => item.task.id}
            renderItem={renderTask}
            ListHeaderComponent={
                <>
                    <View style={styles.topRow}>
                        <Text variant="headlineSmall" style={styles.dateHeading}>{todayDate}</Text>
                        <Button
                            compact
                            icon="share-variant"
                            mode="outlined"
                            onPress={() => shareCarePlan({ runTitle: 'My Plants' })}
                        >
                            Share Care Plan
                        </Button>
                    </View>
                    {tasks.length === 0 ? (
                        <Surface style={styles.emptyCard} elevation={1}>
                            <Text variant="bodyLarge" style={{ textAlign: 'center', opacity: 0.6 }}>
                                No tasks due today 🎉{'\n'}Start a run from the Library.
                            </Text>
                        </Surface>
                    ) : (
                        <Text variant="titleSmall" style={styles.sectionLabel}>DUE TODAY ({tasks.length})</Text>
                    )}
                </>
            }
            ListFooterComponent={
                upcoming.length > 0 ? (
                    <View>
                        <Divider style={{ marginVertical: 16 }} />
                        <Text variant="titleSmall" style={styles.sectionLabel}>COMING UP</Text>
                        {upcoming.slice(0, 5).map(item => (
                            <Surface key={item.task.id + item.task.dueAt} style={[styles.upcomingCard]} elevation={1}>
                                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{item.taskTitle}</Text>
                                <Text variant="labelSmall" style={{ opacity: 0.5 }}>
                                    {format(new Date(item.task.dueAt), 'EEE h:mm a')} · {item.templateTitle}
                                </Text>
                            </Surface>
                        ))}
                    </View>
                ) : null
            }
        />
    );
}

const styles = StyleSheet.create({
    list: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    dateHeading: { fontWeight: '700' },
    sectionLabel: { opacity: 0.5, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
    taskCard: { borderRadius: 12, flexDirection: 'row', marginBottom: 10, overflow: 'hidden' },
    typeBar: { width: 6 },
    taskBody: { flex: 1, padding: 12 },
    taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    taskTitle: { fontWeight: '600', marginBottom: 4 },
    taskDesc: { opacity: 0.6, marginBottom: 8 },
    typeChip: { alignSelf: 'flex-start' },
    taskActions: { justifyContent: 'center', paddingRight: 4 },
    emptyCard: { borderRadius: 12, padding: 32 },
    upcomingCard: { borderRadius: 10, padding: 12, marginBottom: 8 },
});
