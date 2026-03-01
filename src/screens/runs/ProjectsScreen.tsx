import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import {
    Text, Surface, Button, Chip, List, Divider, Portal, Modal,
    useTheme, ActivityIndicator, IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
    getAllRuns, getRunDetail, updateRequirementStatus,
    deleteRun, activateRun
} from '@/features/api';
import { isRunReady } from '@/core/readiness';
import { format } from 'date-fns';

type RunRow = {
    run: { id: string; templateId: string; customName: string; startDate: Date; status: string; isStarted: boolean };
    templateTitle: string | null;
};

type Requirement = {
    req: { id: string; status: string; requirementType: string; requiredQuantity: number | null; unit: string | null };
    itemName: string | null;
    itemNotes: string | null;
    itemCategory: string | null;
};

export default function ProjectsScreen({ navigation }: any) {
    const [runs, setRuns] = useState<RunRow[]>([]);
    const [selected, setSelected] = useState<{ run: RunRow; requirements: Requirement[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const { t } = useTranslation();

    const refresh = useCallback(() => {
        getAllRuns().then(data => {
            setRuns(data as unknown as RunRow[]);
            setLoading(false);
        });
    }, []);

    useFocusEffect(refresh);

    const openDetail = async (row: RunRow) => {
        const detail = await getRunDetail(row.run.id);
        if (detail) setSelected({ run: row, requirements: detail.requirements as Requirement[] });
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

    const handleActivate = async (runId: string) => {
        try {
            await activateRun(runId);
            Alert.alert(t('projects.projectStarted'), t('projects.projectStartedMsg'));
            setSelected(null);
            refresh();
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message);
        }
    };

    const toggleReq = async (reqId: string, currentStatus: string) => {
        const next = currentStatus === 'have' ? 'missing' : 'have';
        await updateRequirementStatus(reqId, next as any);
        if (selected) {
            const detail = await getRunDetail(selected.run.run.id);
            if (detail) setSelected({ run: selected.run, requirements: detail.requirements as Requirement[] });
        }
    };

    const showLearnMore = (req: Requirement) => {
        Alert.alert(
            req.itemName ?? t('projects.itemInfo'),
            `${(req.itemCategory || '').toUpperCase()}\n\n${req.itemNotes || t('projects.noDescription')}`
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
                    return (
                        <Surface style={styles.runCard} elevation={2}>
                            <List.Item
                                title={item.run.customName}
                                description={`${item.templateTitle} · ${t('projects.started', { date: startDateDisplay })}${!item.run.isStarted ? ` · ${t('projects.pending')}` : ''}`}
                                left={props => <List.Icon {...props} icon="sprout" color={item.run.isStarted ? theme.colors.primary : '#999'} />}
                                right={() => (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Button compact mode="outlined" onPress={() => openDetail(item)} style={{ marginRight: 8 }}>
                                            {t('projects.readiness')}
                                        </Button>
                                        <IconButton
                                            icon="trash-can-outline"
                                            iconColor={theme.colors.error}
                                            size={20}
                                            onPress={() => handleDelete(item.run.id, item.run.customName)}
                                        />
                                    </View>
                                )}
                            />
                        </Surface>
                    );
                }}
            />

            <Portal>
                <Modal
                    visible={!!selected}
                    onDismiss={() => setSelected(null)}
                    contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
                >
                    {selected && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text variant="titleLarge" style={styles.modalTitle}>
                                {t('projects.readinessTitle', { name: selected.run.run.customName })}
                            </Text>
                            <Text variant="bodySmall" style={{ marginBottom: 16, opacity: 0.6 }}>
                                {selected.run.templateTitle}
                            </Text>

                            {selected.requirements.map(req => {
                                const ok = req.req.status === 'have' || req.req.status === 'bought';
                                return (
                                    <View key={req.req.id} style={styles.reqRow}>
                                        <List.Icon
                                            icon={ok ? 'check-circle' : 'alert-circle-outline'}
                                            color={ok ? theme.colors.primary : theme.colors.error}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text variant="bodyMedium">{req.itemName}</Text>
                                            <Text variant="bodySmall" style={{ opacity: 0.5 }}>
                                                {req.req.requirementType} · {req.req.requiredQuantity ?? ''} {req.req.unit ?? ''}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                                            <Button
                                                compact
                                                mode={ok ? 'outlined' : 'contained'}
                                                onPress={() => toggleReq(req.req.id, req.req.status)}
                                            >
                                                {ok ? t('projects.have') : t('projects.markHave')}
                                            </Button>
                                            <IconButton
                                                icon="information-outline"
                                                size={18}
                                                onPress={() => showLearnMore(req)}
                                                style={{ margin: 0 }}
                                            />
                                        </View>
                                    </View>
                                );
                            })}

                            <Divider style={{ marginVertical: 16 }} />

                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Chip
                                    icon={isRunReady(selected.requirements.map(r => r.req)) ? 'check' : 'close'}
                                    style={{
                                        backgroundColor: isRunReady(selected.requirements.map(r => r.req))
                                            ? '#C8E6C9'
                                            : '#FFCDD2',
                                    }}
                                >
                                    {isRunReady(selected.requirements.map(r => r.req)) ? t('projects.ready') : t('projects.incomplete')}
                                </Chip>

                                {!selected.run.run.isStarted && (
                                    <Button
                                        mode="contained"
                                        icon="play"
                                        disabled={!isRunReady(selected.requirements.map(r => r.req))}
                                        onPress={() => handleActivate(selected.run.run.id)}
                                    >
                                        {t('projects.startProject')}
                                    </Button>
                                )}
                            </View>

                            {!selected.run.run.isStarted && !isRunReady(selected.requirements.map(r => r.req)) && (
                                <View style={{ marginTop: 12, padding: 8, backgroundColor: '#FFF9C4', borderRadius: 8 }}>
                                    <Text variant="bodySmall" style={{ color: '#FBC02D', fontWeight: 'bold' }}>
                                        {t('projects.actionRequired')}
                                    </Text>
                                    <Text variant="bodySmall">
                                        {t('projects.actionRequiredMsg')}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </Modal>
            </Portal>
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
    modal: { margin: 16, borderRadius: 16, padding: 20, maxHeight: '85%' },
    modalTitle: { fontWeight: '700', marginBottom: 4 },
    reqRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 4 },
});
