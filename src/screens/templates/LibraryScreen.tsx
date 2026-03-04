import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, Image, InteractionManager } from 'react-native';
import { Text, Surface, Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getAllTemplates } from '@/features/api';
import { Sprout, Clock } from 'lucide-react-native';

type Template = {
    id: string;
    title: string;
    difficulty: string;
    totalDurationDays: number;
    estimatedDailyTimeMins: number;
    environment: string;
    imageUri: string | null;
    emoji: string | null;
};

export default function LibraryScreen({ navigation }: any) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const { t } = useTranslation();

    useFocusEffect(
        useCallback(() => {
            const task = InteractionManager.runAfterInteractions(() => {
                getAllTemplates().then(data => {
                    setTemplates(data as Template[]);
                    setLoading(false);
                });
            });
            return () => task.cancel();
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
                        {t('library.growingGuides')}
                    </Text>
                }
                renderItem={({ item }) => (
                    <Pressable onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}>
                        <Surface style={styles.card} elevation={2}>
                            {item.imageUri && (
                                <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
                            )}
                            <View style={styles.cardHeader}>
                                {item.emoji
                                    ? <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                                    : <Sprout size={20} color={theme.colors.primary} />
                                }
                                <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                                    {item.title}
                                </Text>
                            </View>
                            <View style={styles.chips}>
                                <Chip compact icon="signal-cellular-2">{item.difficulty}</Chip>
                                <Chip compact icon="calendar-range">{t('common.days', { n: item.totalDurationDays })}</Chip>
                                <Chip compact icon="home-outline">{item.environment}</Chip>
                            </View>
                            <View style={styles.footer}>
                                <Clock size={14} color={theme.colors.secondary} />
                                <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.secondary }}>
                                    {t('common.minPerDay', { n: item.estimatedDailyTimeMins })}
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
    cardImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    title: { flex: 1, fontWeight: '600' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    footer: { flexDirection: 'row', alignItems: 'center' },
});
