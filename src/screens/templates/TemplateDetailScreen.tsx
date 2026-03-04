import React, { useCallback, useState, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, Share, Keyboard, TouchableWithoutFeedback, Platform, KeyboardAvoidingView } from 'react-native';
import {
    Text, Surface, Button, Chip, Divider, List, MD3Colors, Banner,
    ActivityIndicator, useTheme, Portal, Modal, TextInput, SegmentedButtons, IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react-native';
import {
    getTemplateDetail, startRun, addToShoppingList, startStaggeredRuns,
    getNextRunName, deleteTemplate, exportTemplateAsJson,
} from '@/features/api';
import { resetBuiltinTemplate, BUILTIN_TEMPLATE_IDS } from '@/core/seed';
import { isRunReady } from '@/core/readiness';
import type { TemplateDetail } from '@/features/api';
import { Info, HelpCircle } from 'lucide-react-native';

export default function TemplateDetailScreen({ route, navigation }: any) {
    const { templateId } = route.params;
    const [detail, setDetail] = useState<TemplateDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [setupMode, setSetupMode] = useState('single');
    const [plantName, setPlantName] = useState('');
    const [batchCount, setBatchCount] = useState('3');
    const [offsetDays, setOffsetDays] = useState('7');
    const [showInfo, setShowInfo] = useState(false);
    const theme = useTheme();
    const { t } = useTranslation();

    const isBuiltin = BUILTIN_TEMPLATE_IDS.includes(templateId);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            getTemplateDetail(templateId).then(d => {
                setDetail(d);
                setLoading(false);
            });
        }, [templateId]),
    );

    useLayoutEffect(() => {
        if (!isBuiltin && detail) {
            navigation.setOptions({
                headerRight: () => (
                    <IconButton icon="share-variant" size={24} onPress={handleShare} />
                ),
            });
        }
    }, [navigation, isBuiltin, detail]);

    const handleShare = async () => {
        try {
            const json = await exportTemplateAsJson(templateId);
            await Share.share({
                message: json,
                title: detail?.template.title || t('nav.growingGuide'),
            });
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message || t('detail.failedExport'));
        }
    };

    const handleEdit = () => {
        if (!detail) return;
        navigation.navigate('ManualCreate', { templateId, editData: detail });
    };

    const handleReset = () => {
        Alert.alert(
            t('detail.resetTitle'),
            t('detail.resetMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('detail.reset'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await resetBuiltinTemplate(templateId);
                            const d = await getTemplateDetail(templateId);
                            setDetail(d);
                        } catch (e: any) {
                            Alert.alert(t('common.error'), e.message);
                        }
                    },
                },
            ],
        );
    };

    const handleDelete = () => {
        Alert.alert(
            t('detail.deleteTitle'),
            t('detail.deleteMessage', { title: detail?.template.title }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTemplate(templateId);
                            navigation.popToTop();
                        } catch (e: any) {
                            Alert.alert(t('common.error'), e.message);
                        }
                    },
                },
            ],
        );
    };

    const openSetup = async () => {
        if (!detail) return;
        const nextName = await getNextRunName(templateId, detail.template.title);
        setPlantName(nextName);
        setShowOptions(true);
    };

    const handleStartSingle = async () => {
        if (!detail) return;
        setStarting(true);
        try {
            await startRun(templateId, new Date(), plantName || detail.template.title);
            Alert.alert(t('detail.projectCreated'), t('detail.projectCreatedMsg', { name: plantName }), [
                { text: t('detail.goToProjects'), onPress: () => navigation.navigate('Projects') },
                { text: t('common.ok') },
            ]);
            setShowOptions(false);
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message);
        } finally {
            setStarting(false);
        }
    };

    const handleStartStaggered = async () => {
        if (!detail) return;
        setStarting(true);
        try {
            const count = parseInt(batchCount);
            const offset = parseInt(offsetDays);
            if (isNaN(count) || count < 1) throw new Error(t('detail.invalidBatchSize'));
            if (isNaN(offset) || offset < 0) throw new Error(t('detail.invalidOffset'));

            await startStaggeredRuns(templateId, new Date(), count, offset);
            Alert.alert(t('detail.batchCreated'), t('detail.batchCreatedMsg', { count }), [
                { text: t('detail.goToProjects'), onPress: () => navigation.navigate('Projects') },
                { text: t('common.ok') },
            ]);
            setShowOptions(false);
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message);
        } finally {
            setStarting(false);
        }
    };

    if (loading || !detail) {
        return <ActivityIndicator style={styles.center} />;
    }

    const { template, tools, consumables, tasks } = detail;

    const renderItemLeft = (emoji: string | null, imageUri: string | null, fallbackIcon: string, color?: string) => (props: any) => {
        if (imageUri) return <Image source={{ uri: imageUri }} style={styles.itemImage} />;
        if (emoji) return <Text style={styles.itemEmoji}>{emoji}</Text>;
        return <List.Icon {...props} icon={fallbackIcon} color={color} />;
    };

    return (
        <>
            <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
                <Surface style={styles.hero} elevation={1}>
                    {template.imageUri && (
                        <Image source={{ uri: template.imageUri }} style={styles.heroImage} />
                    )}
                    <View style={styles.heroHeader}>
                        {template.emoji && <Text style={styles.heroEmoji}>{template.emoji}</Text>}
                        <Text variant="headlineMedium" style={styles.heroTitle}>{template.title}</Text>
                    </View>
                    <View style={styles.chips}>
                        <Chip icon="signal-cellular-2">{template.difficulty}</Chip>
                        <Chip icon="calendar-range">{t('common.days', { n: template.totalDurationDays })}</Chip>
                        <Chip icon="home-outline">{template.environment}</Chip>
                        <Chip icon="clock-outline">{t('common.minPerDay', { n: template.estimatedDailyTimeMins })}</Chip>
                    </View>
                </Surface>

                <Text variant="titleMedium" style={styles.sectionTitle}>{t('detail.toolsSection')}</Text>
                <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                    {tools.length === 0 && <Text style={styles.empty}>{t('detail.noTools')}</Text>}
                    {tools.map(tool => (
                        <List.Item
                            key={tool.id}
                            title={tool.name}
                            left={renderItemLeft(tool.emoji, tool.imageUri, 'wrench-outline')}
                        />
                    ))}
                </Surface>

                <Text variant="titleMedium" style={styles.sectionTitle}>{t('detail.consumablesSection')}</Text>
                <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                    {consumables.length === 0 && <Text style={styles.empty}>{t('detail.noConsumables')}</Text>}
                    {consumables.map(c => (
                        <List.Item
                            key={c.id}
                            title={c.name}
                            description={`${c.quantity} ${c.unit}`}
                            left={renderItemLeft(c.emoji, c.imageUri, 'seed-outline')}
                        />
                    ))}
                </Surface>

                <Text variant="titleMedium" style={styles.sectionTitle}>{t('detail.taskSchedule')}</Text>
                <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                    {tasks.map((task, i) => {
                        const times = task.dailyTimes ? JSON.parse(task.dailyTimes).join(', ') : task.timeOfDay ?? '';
                        const window =
                            task.windowStartDay === task.windowEndDay
                                ? t('common.day', { n: task.windowStartDay })
                                : t('common.dayRange', { start: task.windowStartDay, end: task.windowEndDay });
                        return (
                            <React.Fragment key={task.id}>
                                {i > 0 && <Divider />}
                                <List.Item
                                    title={task.title}
                                    description={`${window} · ${times}${task.description ? '\n' + task.description : ''}`}
                                    descriptionNumberOfLines={3}
                                    left={renderItemLeft(
                                        task.emoji,
                                        task.imageUri,
                                        task.isRepeating ? 'refresh' : 'check-circle-outline',
                                        task.isRepeating ? theme.colors.primary : MD3Colors.neutral50,
                                    )}
                                />
                            </React.Fragment>
                        );
                    })}
                </Surface>

                <View style={styles.cta}>
                    <Button
                        mode="contained"
                        icon="sprout"
                        onPress={openSetup}
                        loading={starting}
                        disabled={starting}
                        style={styles.startBtn}
                        contentStyle={styles.startBtnContent}
                    >
                        {t('detail.setupYourPlant')}
                    </Button>
                </View>

                <Divider style={{ marginTop: 32, marginBottom: 16 }} />
                <Text variant="titleMedium" style={styles.manageTitle}>{t('detail.manage')}</Text>

                <Button mode="outlined" icon="pencil-outline" onPress={handleEdit}
                    style={styles.manageBtn} contentStyle={styles.manageBtnContent}>
                    {t('detail.editGuide')}
                </Button>

                {isBuiltin && (
                    <Button mode="outlined" icon="refresh" onPress={handleReset}
                        style={styles.manageBtn} contentStyle={styles.manageBtnContent}>
                        {t('detail.resetToOriginal')}
                    </Button>
                )}

                <Button mode="outlined" icon="delete-outline" textColor={theme.colors.error}
                    onPress={handleDelete}
                    style={[styles.manageBtn, { borderColor: theme.colors.errorContainer }]}
                    contentStyle={styles.manageBtnContent}>
                    {t('detail.deleteGuide')}
                </Button>

                <View style={{ height: 32 }} />
            </ScrollView>

            <Portal>
                <Modal
                    visible={showOptions}
                    onDismiss={() => setShowOptions(false)}
                    contentContainerStyle={[styles.modalStyle, { backgroundColor: theme.colors.surface }]}
                >
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text variant="titleLarge" style={styles.modalTitle}>{t('detail.setupPlant')}</Text>
                                    <IconButton icon="close" size={20} onPress={() => setShowOptions(false)} />
                                </View>

                                <SegmentedButtons
                                    value={setupMode}
                                    onValueChange={setSetupMode}
                                    style={{ marginBottom: 16 }}
                                    buttons={[
                                        { value: 'single', label: t('detail.single') },
                                        { value: 'staggered', label: t('detail.staggered') },
                                    ]}
                                />

                                <TextInput
                                    label={t('detail.plantNickname')}
                                    value={plantName}
                                    onChangeText={setPlantName}
                                    mode="outlined"
                                    style={{ marginBottom: 16 }}
                                    right={<TextInput.Icon icon="pencil" />}
                                />

                                {setupMode === 'staggered' ? (
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                            <Text variant="titleSmall">{t('detail.staggeredSettings')}</Text>
                                            <IconButton icon="help-circle-outline" size={18} onPress={() => setShowInfo(true)} />
                                        </View>
                                        <View style={styles.inputRow}>
                                            <TextInput
                                                label={t('detail.batchCount')}
                                                value={batchCount}
                                                onChangeText={setBatchCount}
                                                keyboardType="numeric"
                                                mode="outlined"
                                                style={{ flex: 1 }}
                                            />
                                            <View style={{ width: 12 }} />
                                            <TextInput
                                                label={t('detail.offsetDays')}
                                                value={offsetDays}
                                                onChangeText={setOffsetDays}
                                                keyboardType="numeric"
                                                mode="outlined"
                                                style={{ flex: 1 }}
                                            />
                                        </View>
                                    </View>
                                ) : null}

                                <View style={{ marginTop: 8 }}>
                                    {setupMode === 'staggered' ? (
                                        <Button icon="calendar-multiple" mode="contained" onPress={handleStartStaggered} style={styles.optionBtn}>
                                            {t('detail.launchBatch')}
                                        </Button>
                                    ) : (
                                        <Button icon="sprout" mode="contained" onPress={handleStartSingle} style={styles.optionBtn}>
                                            {t('detail.startProject')}
                                        </Button>
                                    )}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </Modal>

                <Modal
                    visible={showInfo}
                    onDismiss={() => setShowInfo(false)}
                    contentContainerStyle={[styles.modalStyle, { backgroundColor: theme.colors.surface }]}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>{t('detail.staggeredTitle')}</Text>
                    <Text variant="bodyMedium" style={{ marginVertical: 12 }}>
                        {t('detail.staggeredBody1')}
                        {"\n\n"}
                        {t('detail.staggeredBody2')}
                    </Text>
                    <Button mode="contained" onPress={() => setShowInfo(false)}>{t('detail.gotIt')}</Button>
                </Modal>
            </Portal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, gap: 8, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    hero: { borderRadius: 12, padding: 16, marginBottom: 8 },
    heroImage: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12 },
    heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    heroEmoji: { fontSize: 32 },
    heroTitle: { fontWeight: '700', flex: 1 },
    itemImage: { width: 40, height: 40, borderRadius: 8, marginLeft: 8, alignSelf: 'center' },
    itemEmoji: { fontSize: 24, width: 40, textAlign: 'center', alignSelf: 'center', marginLeft: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    sectionTitle: { fontWeight: '700', marginTop: 16, marginBottom: 6 },
    card: { borderRadius: 12 },
    empty: { padding: 12, opacity: 0.6 },
    cta: { marginTop: 24 },
    startBtn: { borderRadius: 12 },
    startBtnContent: { paddingVertical: 6 },
    manageTitle: { fontWeight: '700', marginBottom: 12, opacity: 0.6 },
    manageBtn: { marginBottom: 10, borderRadius: 10 },
    manageBtnContent: { paddingVertical: 4 },
    modalStyle: { margin: 20, borderRadius: 16, padding: 24 },
    modalTitle: { fontWeight: '700', marginBottom: 8 },
    optionBtn: { borderRadius: 8, marginVertical: 4 },
    inputRow: { flexDirection: 'row', marginBottom: 12 },
});
