import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
    getDashboardStats, getWeeklyActivity, getTaskTypeBreakdown,
    DashboardStats, DailyActivity, TaskTypeCount,
} from '@/features/dashboardApi';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Dashboard() {
    const theme = useTheme();
    const { t } = useTranslation();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [weekly, setWeekly] = useState<DailyActivity[]>([]);
    const [breakdown, setBreakdown] = useState<TaskTypeCount[]>([]);

    useFocusEffect(
        useCallback(() => {
            Promise.all([
                getDashboardStats(),
                getWeeklyActivity(),
                getTaskTypeBreakdown(),
            ]).then(([s, w, b]) => {
                setStats(s);
                setWeekly(w);
                setBreakdown(b);
            });
        }, []),
    );

    if (!stats) return null;

    const maxBar = Math.max(1, ...weekly.map(d => d.completed + d.skipped));
    const barAreaHeight = 100;
    const totalBreakdown = breakdown.reduce((sum, b) => sum + b.count, 0);

    return (
        <View style={styles.container}>
            <Text variant="titleMedium" style={[styles.heading, { color: theme.colors.onSurface }]}>
                📊 {t('dashboard.title')}
            </Text>

            {/* ── Stats Grid ── */}
            <View style={styles.statsGrid}>
                <StatCard
                    icon="🌱"
                    label={t('dashboard.activeProjects')}
                    value={`${stats.activeProjects}`}
                    sublabel={t('dashboard.ofTotal', { n: stats.totalProjects })}
                    bg={theme.colors.surfaceVariant}
                    textColor={theme.colors.onSurface}
                />
                <StatCard
                    icon="✅"
                    label={t('dashboard.completedToday')}
                    value={`${stats.tasksCompletedToday}`}
                    sublabel={t('dashboard.thisWeek', { n: stats.tasksCompletedThisWeek })}
                    bg={theme.colors.surfaceVariant}
                    textColor={theme.colors.onSurface}
                />
                <StatCard
                    icon="📈"
                    label={t('dashboard.completionRate')}
                    value={`${stats.completionRate}%`}
                    sublabel={t('dashboard.allTime')}
                    bg={theme.colors.surfaceVariant}
                    textColor={theme.colors.onSurface}
                />
                <StatCard
                    icon="🔥"
                    label={t('dashboard.streak')}
                    value={`${stats.currentStreak}`}
                    sublabel={stats.currentStreak === 1 ? t('dashboard.day') : t('dashboard.days')}
                    bg={theme.colors.surfaceVariant}
                    textColor={theme.colors.onSurface}
                />
            </View>

            {/* ── Weekly Activity Bar Chart ── */}
            <Surface style={[styles.chartCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                <Text variant="titleSmall" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
                    {t('dashboard.weeklyActivity')}
                </Text>
                <View style={styles.barChart}>
                    {weekly.map((day, i) => {
                        const completedH = (day.completed / maxBar) * barAreaHeight;
                        const skippedH = (day.skipped / maxBar) * barAreaHeight;
                        return (
                            <View key={i} style={styles.barColumn}>
                                <View style={[styles.barArea, { height: barAreaHeight }]}>
                                    {day.skipped > 0 && (
                                        <View style={[
                                            styles.bar,
                                            { height: skippedH, backgroundColor: theme.colors.error, opacity: 0.4 },
                                        ]} />
                                    )}
                                    <View style={[
                                        styles.bar,
                                        { height: completedH, backgroundColor: theme.colors.primary },
                                    ]} />
                                </View>
                                <Text variant="labelSmall" style={[styles.barLabel, { color: theme.colors.onSurfaceVariant }]}>
                                    {t(`common.dayNames.${day.dayLabel}`)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {t('dashboard.completed')}
                        </Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: theme.colors.error, opacity: 0.4 }]} />
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {t('dashboard.skipped')}
                        </Text>
                    </View>
                </View>
            </Surface>

            {/* ── Task Type Breakdown ── */}
            {breakdown.length > 0 && (
                <Surface style={[styles.chartCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                    <Text variant="titleSmall" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
                        {t('dashboard.taskBreakdown')}
                    </Text>

                    {/* Proportional bar */}
                    <View style={styles.proportionalBar}>
                        {breakdown.map((b, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.proportionalSegment,
                                    {
                                        flex: b.count,
                                        backgroundColor: b.color,
                                        borderTopLeftRadius: i === 0 ? 6 : 0,
                                        borderBottomLeftRadius: i === 0 ? 6 : 0,
                                        borderTopRightRadius: i === breakdown.length - 1 ? 6 : 0,
                                        borderBottomRightRadius: i === breakdown.length - 1 ? 6 : 0,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    {/* Labels */}
                    <View style={styles.breakdownLabels}>
                        {breakdown.map((b, i) => (
                            <View key={i} style={styles.breakdownLabel}>
                                <View style={[styles.legendDot, { backgroundColor: b.color }]} />
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    {t(`common.${b.type.toLowerCase()}`)} ({totalBreakdown > 0 ? Math.round((b.count / totalBreakdown) * 100) : 0}%)
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Total */}
                    <Text variant="labelSmall" style={[styles.totalLabel, { color: theme.colors.onSurfaceVariant }]}>
                        {t('dashboard.totalCompleted', { n: totalBreakdown })}
                    </Text>
                </Surface>
            )}
        </View>
    );
}

// ── Stat Card Sub-Component ──────────────────────────────────────────────────

function StatCard({
    icon, label, value, sublabel, bg, textColor,
}: {
    icon: string; label: string; value: string; sublabel: string;
    bg: string; textColor: string;
}) {
    return (
        <Surface style={[styles.statCard, { backgroundColor: bg }]} elevation={1}>
            <Text style={styles.statIcon}>{icon}</Text>
            <Text variant="headlineSmall" style={[styles.statValue, { color: textColor }]}>{value}</Text>
            <Text variant="labelSmall" style={[styles.statLabel, { color: textColor }]}>{label}</Text>
            <Text variant="labelSmall" style={[styles.statSublabel, { color: textColor, opacity: 0.5 }]}>{sublabel}</Text>
        </Surface>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { marginTop: 24 },
    heading: { fontWeight: '700', marginBottom: 12 },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        width: (SCREEN_WIDTH - 42) / 2, // 2 columns with gaps
    },
    statIcon: { fontSize: 24, marginBottom: 4 },
    statValue: { fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { fontWeight: '600', marginTop: 2, textAlign: 'center' },
    statSublabel: { marginTop: 2, textAlign: 'center' },

    // Chart Card
    chartCard: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
    },
    chartTitle: { fontWeight: '700', marginBottom: 12 },

    // Bar Chart
    barChart: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
    },
    barColumn: { alignItems: 'center', flex: 1 },
    barArea: { justifyContent: 'flex-end', width: 18 },
    bar: { width: 18, borderRadius: 4, marginBottom: 1 },
    barLabel: { marginTop: 6, fontWeight: '600' },

    // Legend
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 12,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },

    // Proportional bar
    proportionalBar: {
        flexDirection: 'row',
        height: 16,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 12,
    },
    proportionalSegment: { minWidth: 2 },

    // Breakdown labels
    breakdownLabels: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    breakdownLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },

    totalLabel: { marginTop: 8, textAlign: 'center', fontWeight: '600' },
});
