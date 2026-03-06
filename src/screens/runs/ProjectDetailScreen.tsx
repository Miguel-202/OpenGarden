import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, InteractionManager } from 'react-native';
import {
    Text, Surface, Button, Chip, List, Divider, ProgressBar,
    useTheme, ActivityIndicator, IconButton,
} from 'react-native-paper';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
    getRunDetail, updateRequirementStatus, activateRun
} from '@/features/api';
import { isRunReady } from '@/core/readiness';
import { format, differenceInDays } from 'date-fns';
import { seedT, localizeProjectName, isRedundant } from '@/i18n/seedKeys';

export default function ProjectDetailScreen({ navigation }: any) {
    const route = useRoute();
    const { runId } = route.params as { runId: string };
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const { t, i18n } = useTranslation();

    const refresh = useCallback(async () => {
        try {
            const data = await getRunDetail(runId);
            setDetail(data);
        } catch (e) {
            console.error('Failed to fetch run details:', e);
        } finally {
            setLoading(false);
        }
    }, [runId]);

    useFocusEffect(
        useCallback(() => {
            const task = InteractionManager.runAfterInteractions(() => {
                refresh();
            });
            return () => task.cancel();
        }, [refresh])
    );

    if (loading) return <ActivityIndicator style={styles.center} />;
    if (!detail) return <View style={styles.center}><Text>{t('common.error')}</Text></View>;

    const { run, template, requirements } = detail;
    const localizedName = localizeProjectName(t, run.customName, run.templateId, template?.title);
    const localizedTemplateTitle = seedT(t, run.templateId, 'title', template?.title);
    const localizedTemplateDesc = seedT(t, run.templateId, 'description', template?.description);

    const ready = isRunReady(requirements.map((r: any) => r.req));
    const dayNum = differenceInDays(new Date(), new Date(run.startDate)) + 1;
    const progress = Math.min(1, Math.max(0, dayNum / (template?.totalDurationDays || 1)));

    const handleActivate = async () => {
        try {
            await activateRun(run.id);
            Alert.alert(t('projects.projectStarted'), t('projects.projectStartedMsg'));
            refresh();
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message);
        }
    };

    const toggleReq = async (reqId: string, currentStatus: string) => {
        const next = currentStatus === 'have' ? 'missing' : 'have';
        await updateRequirementStatus(reqId, next as any);
        refresh();
    };

    const showItemInfo = (req: any) => {
        Alert.alert(
            seedT(t, req.itemId, 'name', req.itemName),
            `${(req.itemCategory || '').toUpperCase()}\n\n${req.itemNotes || t('projects.noDescription')}`
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Surface style={[styles.headerCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                {template?.emoji && !template.imageUri && (
                    <Text style={{ fontSize: 40, textAlign: 'center', marginTop: 15, marginBottom: 5 }}>{template.emoji}</Text>
                )}
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text variant="headlineSmall" style={styles.title}>{localizedName}</Text>
                        {!isRedundant(localizedName, localizedTemplateTitle) && (
                            <Text variant="bodyMedium" style={{ opacity: 0.7 }}>{localizedTemplateTitle}</Text>
                        )}
                    </View>
                    <IconButton icon="dots-vertical" onPress={() => { }} />
                </View>

                <View style={styles.statsRow}>
                    <Chip compact icon="calendar">{t('common.day', { n: Math.max(1, dayNum) })}</Chip>
                    <Chip compact icon="lightning-bolt-outline">{t(`common.${template?.difficulty?.toLowerCase()}`)}</Chip>
                    <Chip compact icon="home-outline">{seedT(t, run.templateId, 'environment', template?.environment)}</Chip>
                </View>

                <View style={styles.progressSection}>
                    <View style={styles.progressLabels}>
                        <Text variant="labelSmall">{t('projects.progress')}</Text>
                        <Text variant="labelSmall">{Math.round(progress * 100)}%</Text>
                    </View>
                    <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
                    <Text variant="labelSmall" style={{ opacity: 0.5, marginTop: 4 }}>
                        {t('common.dayRange', { start: 1, end: template?.totalDurationDays })}
                    </Text>
                </View>
            </Surface>

            <View style={styles.content}>
                <Text variant="titleMedium" style={styles.sectionTitle}>{t('projects.aboutProject')}</Text>
                <Text variant="bodyMedium" style={styles.description}>
                    {localizedTemplateDesc || t('projects.noDescription')}
                </Text>

                <Divider style={styles.divider} />

                <Text variant="titleMedium" style={styles.sectionTitle}>{t('projects.readiness')}</Text>
                <Surface style={[styles.checklistCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                    {requirements.map((req: any) => {
                        const ok = req.req.status === 'have' || req.req.status === 'bought';
                        // Try lookup by ID first
                        let localizedItemName = seedT(t, req.itemId, 'name', req.itemName);

                        // Fallback for existing runs with UUIDs: Check if name matches known English seeds
                        if (localizedItemName === req.itemName && i18n.language !== 'en') {
                            const bridge: Record<string, string> = {
                                'Sprouting Jar with Mesh Lid': 'Frasco con Tapa de Malla para Germinados',
                                'Broccoli Sprouting Seeds': 'Semillas de Brócoli para Germinar',
                                'Narrow Glass or Jar': 'Vaso Estrecho o Frasco',
                                'Kitchen Scissors': 'Tijeras de Cocina',
                                'Green Onion Root Ends': 'Raíces de Cebollín',
                                '4-inch Nursery Pot with Drainage': 'Maceta de 10 cm con Drenaje',
                                'Plant Saucer': 'Plato para Maceta',
                                'Basil Seeds': 'Semillas de Albahaca',
                                'Potting Mix': 'Sustrato para Macetas',
                                'Your Phone': 'Tu Teléfono',
                            };
                            localizedItemName = bridge[req.itemName] || req.itemName;
                        }
                        const categoryLabel = t(`common.${req.req.requirementType.toLowerCase()}`);
                        return (
                            <List.Item
                                key={req.req.id}
                                title={localizedItemName}
                                titleStyle={ok ? styles.checkedText : undefined}
                                description={`${categoryLabel} · ${req.req.requiredQuantity ?? ''} ${req.req.unit ?? ''}`}
                                left={props => (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                        <IconButton
                                            {...props}
                                            icon={ok ? 'check-circle' : 'circle-outline'}
                                            iconColor={ok ? theme.colors.primary : theme.colors.onSurfaceVariant}
                                            onPress={() => toggleReq(req.req.id, req.req.status)}
                                        />
                                        {req.itemEmoji && <Text style={{ fontSize: 24, marginLeft: -4 }}>{req.itemEmoji}</Text>}
                                    </View>
                                )}
                                right={props => (
                                    <IconButton
                                        {...props}
                                        icon="information-outline"
                                        onPress={() => showItemInfo(req)}
                                    />
                                )}
                            />
                        );
                    })}
                </Surface>

                {!run.isStarted && (
                    <Surface style={[styles.startCard, { backgroundColor: ready ? theme.colors.primaryContainer : '#FFF9C4' }]} elevation={2}>
                        <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                            {ready ? t('projects.readyToStart') : t('projects.actionRequired')}
                        </Text>
                        <Text variant="bodySmall" style={{ marginBottom: 16 }}>
                            {ready ? t('projects.readyToStartMsg') : t('projects.actionRequiredMsg')}
                        </Text>
                        <Button
                            mode="contained"
                            icon={ready ? "play" : "alert-circle-outline"}
                            disabled={!ready}
                            onPress={handleActivate}
                            style={styles.startBtn}
                        >
                            {ready ? t('projects.startProject') : t('projects.incompleteRequirements')}
                        </Button>
                    </Surface>
                )}
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    headerCard: { padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    title: { fontWeight: '800' },
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    progressSection: { marginTop: 8 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressBar: { height: 8, borderRadius: 4 },
    content: { padding: 20 },
    sectionTitle: { fontWeight: '700', marginBottom: 12 },
    description: { opacity: 0.8, lineHeight: 20, marginBottom: 20 },
    divider: { marginVertical: 10 },
    checklistCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
    checkedText: { textDecorationLine: 'line-through', opacity: 0.6 },
    startCard: { padding: 20, borderRadius: 16, alignItems: 'center' },
    startBtn: { alignSelf: 'stretch', borderRadius: 12 },
});
