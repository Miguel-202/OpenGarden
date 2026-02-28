import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getAllTemplates } from '@/features/api';
import { Sprout, Clock } from 'lucide-react-native';

type Template = {
    id: string;
    title: string;
    difficulty: string;
    totalDurationDays: number;
    estimatedDailyTimeMins: number;
    environment: string;
};

export default function LibraryScreen({ navigation }: any) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useFocusEffect(
        useCallback(() => {
            getAllTemplates().then(data => {
                setTemplates(data as Template[]);
                setLoading(false);
            });
        }, [])
    );

    if (loading) {
        return <ActivityIndicator style={styles.center} />;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={templates}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <Text variant="headlineSmall" style={styles.heading}>
                        Growing Guides
                    </Text>
                }
                renderItem={({ item }) => (
                    <Pressable onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}>
                        <Surface style={styles.card} elevation={2}>
                            <View style={styles.cardHeader}>
                                <Sprout size={20} color={theme.colors.primary} />
                                <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                                    {item.title}
                                </Text>
                            </View>
                            <View style={styles.chips}>
                                <Chip compact icon="signal-cellular-2">{item.difficulty}</Chip>
                                <Chip compact icon="calendar-range">{item.totalDurationDays} days</Chip>
                                <Chip compact icon="home-outline">{item.environment}</Chip>
                            </View>
                            <View style={styles.footer}>
                                <Clock size={14} color={theme.colors.secondary} />
                                <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.secondary }}>
                                    ~{item.estimatedDailyTimeMins} min/day
                                </Text>
                            </View>
                        </Surface>
                    </Pressable>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    list: { padding: 16, gap: 12 },
    heading: { marginBottom: 8, fontWeight: '700' },
    card: { borderRadius: 12, padding: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    title: { flex: 1, fontWeight: '600' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    footer: { flexDirection: 'row', alignItems: 'center' },
});
