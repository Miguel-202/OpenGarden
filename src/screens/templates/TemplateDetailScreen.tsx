import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
    Text, Surface, Button, Chip, Divider, List, MD3Colors, Banner,
    ActivityIndicator, useTheme,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react-native';
import { getTemplateDetail, startRun, addToShoppingList } from '@/features/api';
import { isRunReady } from '@/core/readiness';
import type { TemplateDetail } from '@/features/api';

export default function TemplateDetailScreen({ route, navigation }: any) {
    const { templateId } = route.params;
    const [detail, setDetail] = useState<TemplateDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const theme = useTheme();

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            getTemplateDetail(templateId).then(d => {
                setDetail(d);
                setLoading(false);
            });
        }, [templateId]),
    );

    const handleStartRun = async () => {
        if (!detail) return;
        setStarting(true);
        try {
            const runId = await startRun(templateId, new Date());
            Alert.alert('Run Started! 🌱', `${detail.template.title} is now active. Check Today's tab.`, [
                { text: 'Go to Today', onPress: () => navigation.navigate('MainTabs', { screen: 'Today' }) },
                { text: 'OK' },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setStarting(false);
        }
    };

    if (loading || !detail) {
        return <ActivityIndicator style={styles.center} />;
    }

    const { template, tools, consumables, tasks } = detail;

    return (
        <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
            {/* Header */}
            <Surface style={styles.hero} elevation={1}>
                <Text variant="headlineMedium" style={styles.heroTitle}>{template.title}</Text>
                <View style={styles.chips}>
                    <Chip icon="signal-cellular-2">{template.difficulty}</Chip>
                    <Chip icon="calendar-range">{template.totalDurationDays} days</Chip>
                    <Chip icon="home-outline">{template.environment}</Chip>
                    <Chip icon="clock-outline">~{template.estimatedDailyTimeMins} min/day</Chip>
                </View>
            </Surface>

            {/* Required Tools */}
            <Text variant="titleMedium" style={styles.sectionTitle}>🔧 Tools Needed (Reusable)</Text>
            <Surface style={styles.card} elevation={1}>
                {tools.length === 0 && <Text style={styles.empty}>No special tools required.</Text>}
                {tools.map(tool => (
                    <List.Item
                        key={tool.id}
                        title={tool.name}
                        left={props => <List.Icon {...props} icon="wrench-outline" />}
                    />
                ))}
            </Surface>

            {/* Required Consumables */}
            <Text variant="titleMedium" style={styles.sectionTitle}>🛒 Consumables (Per Run)</Text>
            <Surface style={styles.card} elevation={1}>
                {consumables.length === 0 && <Text style={styles.empty}>No consumables required.</Text>}
                {consumables.map(c => (
                    <List.Item
                        key={c.id}
                        title={c.name}
                        description={`${c.quantity} ${c.unit}`}
                        left={props => <List.Icon {...props} icon="seed-outline" />}
                    />
                ))}
            </Surface>

            {/* Task Schedule */}
            <Text variant="titleMedium" style={styles.sectionTitle}>📅 Task Schedule</Text>
            <Surface style={styles.card} elevation={1}>
                {tasks.map((task, i) => {
                    const times = task.dailyTimes ? JSON.parse(task.dailyTimes).join(', ') : task.timeOfDay ?? '';
                    const window =
                        task.windowStartDay === task.windowEndDay
                            ? `Day ${task.windowStartDay}`
                            : `Days ${task.windowStartDay}–${task.windowEndDay}`;
                    return (
                        <React.Fragment key={task.id}>
                            {i > 0 && <Divider />}
                            <List.Item
                                title={task.title}
                                description={`${window} · ${times}${task.description ? '\n' + task.description : ''}`}
                                descriptionNumberOfLines={3}
                                left={props => (
                                    <List.Icon
                                        {...props}
                                        icon={task.isRepeating ? 'refresh' : 'check-circle-outline'}
                                        color={task.isRepeating ? theme.colors.primary : MD3Colors.neutral50}
                                    />
                                )}
                            />
                        </React.Fragment>
                    );
                })}
            </Surface>

            {/* CTA */}
            <View style={styles.cta}>
                <Button
                    mode="contained"
                    icon="sprout"
                    onPress={handleStartRun}
                    loading={starting}
                    disabled={starting}
                    style={styles.startBtn}
                    contentStyle={styles.startBtnContent}
                >
                    Start a Run
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, gap: 8, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    hero: { borderRadius: 12, padding: 16, marginBottom: 8 },
    heroTitle: { fontWeight: '700', marginBottom: 12 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    sectionTitle: { fontWeight: '700', marginTop: 16, marginBottom: 6 },
    card: { borderRadius: 12, overflow: 'hidden' },
    empty: { padding: 12, opacity: 0.6 },
    cta: { marginTop: 24 },
    startBtn: { borderRadius: 12 },
    startBtnContent: { paddingVertical: 6 },
});
