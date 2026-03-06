import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, InteractionManager } from 'react-native';
import {
    Text, Surface, Button, List,
    useTheme, ActivityIndicator, IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
    getAllRuns, deleteRun
} from '@/features/api';
import { format } from 'date-fns';
import { seedT, localizeProjectName, isRedundant } from '@/i18n/seedKeys';

type RunRow = {
    run: { id: string; templateId: string; customName: string; startDate: Date; status: string; isStarted: boolean };
    templateTitle: string | null;
    templateId: string | null;
    templateEmoji: string | null;
};

export default function ProjectsScreen({ navigation }: any) {
    const [runs, setRuns] = useState<RunRow[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const { t } = useTranslation();

    const refresh = useCallback(() => {
        getAllRuns()
            .then(data => {
                setRuns(data as unknown as RunRow[]);
            })
            .catch(e => {
                console.error('Failed to fetch projects:', e);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useFocusEffect(
        useCallback(() => {
            const task = InteractionManager.runAfterInteractions(() => {
                refresh();
            });
            return () => task.cancel();
        }, [refresh])
    );

    const openDetail = (row: RunRow) => {
        navigation.navigate('ProjectDetail', { runId: row.run.id });
    };

    const handleDelete = (runId: string, name: string) => {
        Alert.alert(
            t('projects.deleteProject'),
            t('projects.deleteProjectMsg', { name }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        await deleteRun(runId);
                        refresh();
                    }
                },
            ]
        );
    };

    if (loading) return <ActivityIndicator style={styles.center} />;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={runs}
                keyExtractor={item => item.run.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <Text variant="headlineSmall" style={styles.heading}>{t('projects.yourProjects')}</Text>
                }
                ListEmptyComponent={
                    <Surface style={styles.emptyCard} elevation={1}>
                        <Text variant="bodyLarge" style={{ textAlign: 'center', opacity: 0.6 }}>
                            {t('projects.noRuns')}
                        </Text>
                    </Surface>
                }
                renderItem={({ item }) => {
                    const startDateDisplay = format(new Date(item.run.startDate), 'MMM d, yyyy');
                    const localizedTemplateTitle = seedT(t, item.templateId ?? '', 'title', item.templateTitle ?? '');
                    const localizedName = localizeProjectName(t, item.run.customName, item.templateId, item.templateTitle);

                    return (
                        <Surface style={[styles.runCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
                            <List.Item
                                title={localizedName}
                                description={`${isRedundant(localizedName, localizedTemplateTitle) ? '' : `${localizedTemplateTitle} · `}${t('projects.started', { date: startDateDisplay })}${!item.run.isStarted ? ` · ${t('projects.pending')}` : ''}`}
                                onPress={() => openDetail(item)}
                                left={props => (
                                    item.templateEmoji
                                        ? <Text style={{ fontSize: 28, alignSelf: 'center', marginLeft: 8 }}>{item.templateEmoji}</Text>
                                        : <List.Icon {...props} icon="sprout" color={item.run.isStarted ? theme.colors.primary : '#999'} />
                                )}
                                right={() => (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Button compact mode="outlined" onPress={() => openDetail(item)} style={{ marginRight: 8 }}>
                                            {t('projects.manage')}
                                        </Button>
                                        <IconButton
                                            icon="trash-can-outline"
                                            iconColor={theme.colors.error}
                                            size={20}
                                            onPress={() => handleDelete(item.run.id, localizedName)}
                                        />
                                    </View>
                                )}
                            />
                        </Surface>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    list: { padding: 16, paddingBottom: 100, gap: 10 },
    heading: { fontWeight: '700', marginBottom: 8 },
    runCard: { borderRadius: 12, overflow: 'hidden' },
    emptyCard: { borderRadius: 12, padding: 32 },
});
