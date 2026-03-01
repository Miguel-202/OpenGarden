import React, { useState, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import {
    Text, Button, TextInput, Surface, Chip, Switch, IconButton,
    Divider, useTheme, ProgressBar,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { createTemplate, updateTemplate } from '@/features/api';
import type { TemplateDetail } from '@/features/api';
import ImagePickerButton from '@/components/ImagePickerButton';

const STEP_KEYS = ['projectInfo', 'tools', 'consumables', 'tasks', 'review'] as const;
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const TASK_TYPES = ['Preparation', 'Care', 'Harvest', 'Observation', 'Other'];

const DIFF_I18N: Record<string, string> = { Beginner: 'common.beginner', Intermediate: 'common.intermediate', Advanced: 'common.advanced' };
const TYPE_I18N: Record<string, string> = { Preparation: 'common.preparation', Care: 'common.care', Harvest: 'common.harvest', Observation: 'common.observation', Other: 'common.other' };

interface ToolEntry { key: string; name: string; imageUri: string | null; emoji: string }
interface ConsumableEntry { key: string; name: string; quantity: string; unit: string; imageUri: string | null; emoji: string }
interface TaskEntry {
    key: string; title: string; description: string; taskType: string;
    startDay: string; endDay: string; timeOfDay: string;
    isRepeating: boolean; dailyTimes: string; imageUri: string | null; emoji: string;
}

let _keyId = 0;
const uid = () => `e_${Date.now()}_${++_keyId}`;

function buildToolsFromEdit(d: TemplateDetail): ToolEntry[] {
    return d.tools.map(t => ({ key: uid(), name: t.name, imageUri: t.imageUri, emoji: t.emoji ?? '' }));
}
function buildConsumablesFromEdit(d: TemplateDetail): ConsumableEntry[] {
    return d.consumables.map(c => ({
        key: uid(), name: c.name, quantity: String(c.quantity), unit: c.unit,
        imageUri: c.imageUri, emoji: c.emoji ?? '',
    }));
}
function buildTasksFromEdit(d: TemplateDetail): TaskEntry[] {
    return d.tasks.map(t => ({
        key: uid(), title: t.title, description: t.description ?? '', taskType: t.taskType,
        startDay: String(t.windowStartDay), endDay: String(t.windowEndDay),
        timeOfDay: t.timeOfDay ?? '09:00',
        isRepeating: t.isRepeating,
        dailyTimes: t.dailyTimes ? JSON.parse(t.dailyTimes).join(', ') : '09:00',
        imageUri: t.imageUri, emoji: t.emoji ?? '',
    }));
}

export default function ManualCreateScreen({ route, navigation }: any) {
    const theme = useTheme();
    const { t } = useTranslation();
    const editId = route?.params?.templateId as string | undefined;
    const editData = route?.params?.editData as TemplateDetail | undefined;
    const isEditing = Boolean(editId && editData);

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState(editData?.template.title ?? '');
    const [difficulty, setDifficulty] = useState(editData?.template.difficulty ?? 'Beginner');
    const [environment, setEnvironment] = useState(editData?.template.environment ?? '');
    const [totalDays, setTotalDays] = useState(editData ? String(editData.template.totalDurationDays) : '');
    const [dailyMins, setDailyMins] = useState(editData ? String(editData.template.estimatedDailyTimeMins) : '');
    const [projectImage, setProjectImage] = useState<string | null>(editData?.template.imageUri ?? null);
    const [projectEmoji, setProjectEmoji] = useState(editData?.template.emoji ?? '');

    useLayoutEffect(() => {
        if (isEditing) navigation.setOptions({ title: t('create.editGuide') });
    }, [isEditing, navigation, t]);

    const [tools, setTools] = useState<ToolEntry[]>(() => editData ? buildToolsFromEdit(editData) : []);
    const [consumables, setConsumables] = useState<ConsumableEntry[]>(() => editData ? buildConsumablesFromEdit(editData) : []);
    const [tasks, setTasks] = useState<TaskEntry[]>(() => editData ? buildTasksFromEdit(editData) : []);

    const validateStep = (): boolean => {
        if (step === 0) {
            if (!title.trim()) { Alert.alert(t('create.requiredTitle'), t('create.enterProjectTitle')); return false; }
            if (!environment.trim()) { Alert.alert(t('create.requiredTitle'), t('create.enterEnvironment')); return false; }
            if (!totalDays.trim() || isNaN(Number(totalDays)) || Number(totalDays) <= 0) {
                Alert.alert(t('create.requiredTitle'), t('create.enterValidDays')); return false;
            }
            if (!dailyMins.trim() || isNaN(Number(dailyMins)) || Number(dailyMins) < 0) {
                Alert.alert(t('create.requiredTitle'), t('create.enterValidMinutes')); return false;
            }
        }
        return true;
    };

    const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
    const handleBack = () => { step > 0 ? setStep(s => s - 1) : navigation.goBack(); };

    const buildInput = () => ({
        title: title.trim(),
        difficulty,
        estimatedDailyTimeMins: Number(dailyMins),
        totalDurationDays: Number(totalDays),
        environment: environment.trim(),
        imageUri: projectImage,
        emoji: projectEmoji.trim() || null,
        tools: tools.filter(t => t.name.trim()).map(t => ({
            name: t.name.trim(), imageUri: t.imageUri, emoji: t.emoji.trim() || null,
        })),
        consumables: consumables.filter(c => c.name.trim()).map(c => ({
            name: c.name.trim(), quantity: Number(c.quantity) || 1,
            unit: c.unit.trim() || 'unit', imageUri: c.imageUri, emoji: c.emoji.trim() || null,
        })),
        tasks: tasks.filter(t => t.title.trim()).map(t => ({
            title: t.title.trim(),
            description: t.description.trim() || undefined,
            taskType: t.taskType,
            windowStartDay: Number(t.startDay) || 0,
            windowEndDay: Number(t.endDay) || 0,
            timeOfDay: t.isRepeating ? undefined : (t.timeOfDay.trim() || '09:00'),
            isRepeating: t.isRepeating,
            dailyTimes: t.isRepeating
                ? JSON.stringify(t.dailyTimes.split(',').map(s => s.trim()).filter(Boolean))
                : undefined,
            imageUri: t.imageUri, emoji: t.emoji.trim() || null,
        })),
    });

    const handleCreate = async () => {
        setSaving(true);
        try {
            const input = buildInput();
            let resultId: string;

            if (isEditing && editId) {
                await updateTemplate(editId, input);
                resultId = editId;
            } else {
                resultId = await createTemplate(input);
            }

            Alert.alert(
                isEditing ? t('create.guideUpdated') : t('create.guideCreated'),
                isEditing ? t('create.guideUpdatedMsg', { title }) : t('create.guideCreatedMsg', { title }),
                [{
                    text: t('create.viewGuide'),
                    onPress: () => navigation.reset({
                        index: 1,
                        routes: [
                            { name: 'LibraryRoot' },
                            { name: 'TemplateDetail', params: { templateId: resultId } },
                        ],
                    }),
                }],
                { cancelable: false },
            );
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message || t('create.failedToSave'));
        } finally {
            setSaving(false);
        }
    };

    const addTool = () => setTools(prev => [...prev, { key: uid(), name: '', imageUri: null, emoji: '' }]);
    const removeTool = (key: string) => setTools(prev => prev.filter(t => t.key !== key));
    const updateTool = (key: string, field: keyof ToolEntry, value: any) =>
        setTools(prev => prev.map(t => t.key === key ? { ...t, [field]: value } : t));

    const addConsumable = () =>
        setConsumables(prev => [...prev, { key: uid(), name: '', quantity: '', unit: '', imageUri: null, emoji: '' }]);
    const removeConsumable = (key: string) => setConsumables(prev => prev.filter(c => c.key !== key));
    const updateConsumable = (key: string, field: keyof ConsumableEntry, value: any) =>
        setConsumables(prev => prev.map(c => c.key === key ? { ...c, [field]: value } : c));

    const addTask = () => setTasks(prev => [...prev, {
        key: uid(), title: '', description: '', taskType: 'Care',
        startDay: '0', endDay: '0', timeOfDay: '09:00',
        isRepeating: false, dailyTimes: '09:00', imageUri: null, emoji: '',
    }]);
    const removeTask = (key: string) => setTasks(prev => prev.filter(t => t.key !== key));
    const updateTask = (key: string, field: keyof TaskEntry, value: any) =>
        setTasks(prev => prev.map(t => t.key === key ? { ...t, [field]: value } : t));

    const renderProjectInfo = () => (
        <>
            <Text variant="titleLarge" style={styles.stepTitle}>{t('create.tellAboutProject')}</Text>
            <Text variant="bodyMedium" style={styles.stepSubtitle}>{t('create.basicInfo')}</Text>

            <TextInput label={t('create.projectTitle')} value={title} onChangeText={setTitle} mode="outlined"
                placeholder={t('create.projectTitlePlaceholder')} style={styles.input} />

            <Text variant="labelLarge" style={styles.fieldLabel}>{t('create.difficulty')}</Text>
            <View style={styles.chipRow}>
                {DIFFICULTIES.map(d => (
                    <Chip key={d} selected={difficulty === d} onPress={() => setDifficulty(d)}
                        showSelectedOverlay>{t(DIFF_I18N[d])}</Chip>
                ))}
            </View>

            <TextInput label={t('create.environment')} value={environment} onChangeText={setEnvironment} mode="outlined"
                placeholder={t('create.environmentPlaceholder')} style={styles.input} />

            <View style={styles.row}>
                <TextInput label={t('create.totalDays')} value={totalDays} onChangeText={setTotalDays} mode="outlined"
                    keyboardType="numeric" placeholder="30" style={[styles.input, { flex: 1 }]} />
                <View style={{ width: 12 }} />
                <TextInput label={t('create.minutesPerDay')} value={dailyMins} onChangeText={setDailyMins} mode="outlined"
                    keyboardType="numeric" placeholder="5" style={[styles.input, { flex: 1 }]} />
            </View>

            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text variant="labelLarge" style={styles.fieldLabel}>{t('create.emojiOptional')}</Text>
                    <TextInput value={projectEmoji} onChangeText={setProjectEmoji} mode="outlined"
                        placeholder="🌱" style={[styles.input, { width: 80 }]} maxLength={2} />
                </View>
                <View style={{ flex: 2 }}>
                    <Text variant="labelLarge" style={styles.fieldLabel}>{t('create.projectPhoto')}</Text>
                    <ImagePickerButton imageUri={projectImage} onImageSelected={setProjectImage} size={100} />
                </View>
            </View>
        </>
    );

    const renderTools = () => (
        <>
            <Text variant="titleLarge" style={styles.stepTitle}>{t('create.toolsNeeded')}</Text>
            <Text variant="bodyMedium" style={styles.stepSubtitle}>{t('create.toolsSubtitle')}</Text>

            {tools.map(tool => (
                <Surface key={tool.key} style={styles.entryCard} elevation={1}>
                    <View style={styles.entryHeader}>
                        <TextInput value={tool.emoji} onChangeText={v => updateTool(tool.key, 'emoji', v)}
                            mode="outlined" dense placeholder="🔧" style={{ width: 56 }} maxLength={2} />
                        <TextInput label={t('create.toolName')} value={tool.name}
                            onChangeText={v => updateTool(tool.key, 'name', v)}
                            mode="outlined" style={{ flex: 1, marginLeft: 8 }} dense placeholder={t('create.toolPlaceholder')} />
                        <IconButton icon="close" size={20} onPress={() => removeTool(tool.key)} />
                    </View>
                    <ImagePickerButton imageUri={tool.imageUri}
                        onImageSelected={uri => updateTool(tool.key, 'imageUri', uri)}
                        size={72} label={t('common.photo')} />
                </Surface>
            ))}

            <Button icon="plus" mode="outlined" onPress={addTool} style={styles.addBtn}>
                {t('create.addTool')}
            </Button>
        </>
    );

    const renderConsumables = () => (
        <>
            <Text variant="titleLarge" style={styles.stepTitle}>{t('create.suppliesNeeded')}</Text>
            <Text variant="bodyMedium" style={styles.stepSubtitle}>{t('create.suppliesSubtitle')}</Text>

            {consumables.map(c => (
                <Surface key={c.key} style={styles.entryCard} elevation={1}>
                    <View style={styles.entryHeader}>
                        <TextInput value={c.emoji} onChangeText={v => updateConsumable(c.key, 'emoji', v)}
                            mode="outlined" dense placeholder="🛒" style={{ width: 56 }} maxLength={2} />
                        <Text variant="titleSmall" style={{ fontWeight: '600', flex: 1, marginLeft: 8 }}>{t('create.supply')}</Text>
                        <IconButton icon="close" size={20} onPress={() => removeConsumable(c.key)} />
                    </View>
                    <TextInput label={t('create.name')} value={c.name}
                        onChangeText={v => updateConsumable(c.key, 'name', v)}
                        mode="outlined" dense style={styles.input} placeholder={t('create.namePlaceholder')} />
                    <View style={styles.row}>
                        <TextInput label={t('create.qty')} value={c.quantity}
                            onChangeText={v => updateConsumable(c.key, 'quantity', v)}
                            mode="outlined" dense keyboardType="numeric" style={[styles.input, { flex: 1 }]} placeholder="5" />
                        <View style={{ width: 12 }} />
                        <TextInput label={t('create.unit')} value={c.unit}
                            onChangeText={v => updateConsumable(c.key, 'unit', v)}
                            mode="outlined" dense style={[styles.input, { flex: 1 }]} placeholder={t('create.unitPlaceholder')} />
                    </View>
                    <ImagePickerButton imageUri={c.imageUri}
                        onImageSelected={uri => updateConsumable(c.key, 'imageUri', uri)}
                        size={72} label={t('common.photo')} />
                </Surface>
            ))}

            <Button icon="plus" mode="outlined" onPress={addConsumable} style={styles.addBtn}>
                {t('create.addSupply')}
            </Button>
        </>
    );

    const renderTasks = () => (
        <>
            <Text variant="titleLarge" style={styles.stepTitle}>{t('create.careSchedule')}</Text>
            <Text variant="bodyMedium" style={styles.stepSubtitle}>{t('create.careSubtitle')}</Text>

            {tasks.map((task, idx) => (
                <Surface key={task.key} style={styles.entryCard} elevation={1}>
                    <View style={styles.entryHeader}>
                        <TextInput value={task.emoji} onChangeText={v => updateTask(task.key, 'emoji', v)}
                            mode="outlined" dense placeholder="📋" style={{ width: 56 }} maxLength={2} />
                        <Text variant="titleSmall" style={{ fontWeight: '700', flex: 1, marginLeft: 8 }}>{t('create.taskN', { n: idx + 1 })}</Text>
                        <IconButton icon="close" size={20} onPress={() => removeTask(task.key)} />
                    </View>

                    <TextInput label={t('create.taskTitle')} value={task.title}
                        onChangeText={v => updateTask(task.key, 'title', v)}
                        mode="outlined" dense style={styles.input} placeholder={t('create.taskPlaceholder')} />

                    <TextInput label={t('create.instructions')} value={task.description}
                        onChangeText={v => updateTask(task.key, 'description', v)}
                        mode="outlined" dense multiline numberOfLines={2} style={styles.input}
                        placeholder={t('create.instructionsPlaceholder')} />

                    <Text variant="labelMedium" style={styles.fieldLabel}>{t('create.type')}</Text>
                    <View style={styles.chipRow}>
                        {TASK_TYPES.map(tp => (
                            <Chip key={tp} selected={task.taskType === tp} compact
                                onPress={() => updateTask(task.key, 'taskType', tp)}
                                showSelectedOverlay>{t(TYPE_I18N[tp])}</Chip>
                        ))}
                    </View>

                    <View style={styles.row}>
                        <TextInput label={t('create.startDay')} value={task.startDay}
                            onChangeText={v => updateTask(task.key, 'startDay', v)}
                            mode="outlined" dense keyboardType="numeric" style={{ flex: 1 }} />
                        <View style={{ width: 12 }} />
                        <TextInput label={t('create.endDay')} value={task.endDay}
                            onChangeText={v => updateTask(task.key, 'endDay', v)}
                            mode="outlined" dense keyboardType="numeric" style={{ flex: 1 }} />
                    </View>

                    <View style={[styles.row, { alignItems: 'center', marginTop: 4 }]}>
                        <Text variant="bodyMedium" style={{ flex: 1 }}>{t('create.repeatsDaily')}</Text>
                        <Switch value={task.isRepeating}
                            onValueChange={v => updateTask(task.key, 'isRepeating', v)} />
                    </View>

                    {task.isRepeating ? (
                        <TextInput label={t('create.dailyTimes')} value={task.dailyTimes}
                            onChangeText={v => updateTask(task.key, 'dailyTimes', v)}
                            mode="outlined" dense style={styles.input} placeholder="08:00, 20:00" />
                    ) : (
                        <TextInput label={t('create.timeOfDay')} value={task.timeOfDay}
                            onChangeText={v => updateTask(task.key, 'timeOfDay', v)}
                            mode="outlined" dense style={styles.input} placeholder="09:00" />
                    )}

                    <ImagePickerButton imageUri={task.imageUri}
                        onImageSelected={uri => updateTask(task.key, 'imageUri', uri)}
                        size={72} label={t('common.photo')} />
                </Surface>
            ))}

            <Button icon="plus" mode="outlined" onPress={addTask} style={styles.addBtn}>
                {t('create.addTask')}
            </Button>
        </>
    );

    const validTools = tools.filter(t => t.name.trim());
    const validConsumables = consumables.filter(c => c.name.trim());
    const validTasks = tasks.filter(t => t.title.trim());

    const renderReview = () => (
        <>
            <Text variant="titleLarge" style={styles.stepTitle}>{t('create.reviewTitle')}</Text>
            <Text variant="bodyMedium" style={styles.stepSubtitle}>
                {isEditing ? t('create.reviewSubtitleEdit') : t('create.reviewSubtitle')}
            </Text>

            <Surface style={styles.reviewCard} elevation={1}>
                {projectImage && <Image source={{ uri: projectImage }} style={styles.reviewHero} />}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {projectEmoji ? <Text style={{ fontSize: 24 }}>{projectEmoji}</Text> : null}
                    <Text variant="titleMedium" style={{ fontWeight: '700', flex: 1 }}>{title}</Text>
                </View>
                <View style={[styles.chipRow, { marginTop: 8 }]}>
                    <Chip compact icon="signal-cellular-2">{t(DIFF_I18N[difficulty])}</Chip>
                    <Chip compact icon="calendar-range">{t('common.days', { n: totalDays })}</Chip>
                    <Chip compact icon="home-outline">{environment}</Chip>
                    <Chip compact icon="clock-outline">{t('common.minPerDay', { n: dailyMins })}</Chip>
                </View>
            </Surface>

            {validTools.length > 0 && (
                <Surface style={styles.reviewCard} elevation={1}>
                    <Text variant="titleSmall" style={{ fontWeight: '700', marginBottom: 8 }}>
                        {t('create.toolsCount', { n: validTools.length })}
                    </Text>
                    {validTools.map(tl => (
                        <View key={tl.key} style={styles.reviewItem}>
                            {tl.emoji ? <Text style={{ fontSize: 18 }}>{tl.emoji}</Text>
                                : tl.imageUri ? <Image source={{ uri: tl.imageUri }} style={styles.reviewThumb} />
                                : null}
                            <Text variant="bodyMedium">{tl.name}</Text>
                        </View>
                    ))}
                </Surface>
            )}

            {validConsumables.length > 0 && (
                <Surface style={styles.reviewCard} elevation={1}>
                    <Text variant="titleSmall" style={{ fontWeight: '700', marginBottom: 8 }}>
                        {t('create.suppliesCount', { n: validConsumables.length })}
                    </Text>
                    {validConsumables.map(c => (
                        <View key={c.key} style={styles.reviewItem}>
                            {c.emoji ? <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
                                : c.imageUri ? <Image source={{ uri: c.imageUri }} style={styles.reviewThumb} />
                                : null}
                            <Text variant="bodyMedium">{c.name} — {c.quantity} {c.unit}</Text>
                        </View>
                    ))}
                </Surface>
            )}

            {validTasks.length > 0 && (
                <Surface style={styles.reviewCard} elevation={1}>
                    <Text variant="titleSmall" style={{ fontWeight: '700', marginBottom: 8 }}>
                        {t('create.tasksCount', { n: validTasks.length })}
                    </Text>
                    {validTasks.map((tk, i) => (
                        <View key={tk.key}>
                            {i > 0 && <Divider style={{ marginVertical: 8 }} />}
                            <View style={styles.reviewItem}>
                                {tk.emoji ? <Text style={{ fontSize: 18 }}>{tk.emoji}</Text>
                                    : tk.imageUri ? <Image source={{ uri: tk.imageUri }} style={styles.reviewThumb} />
                                    : null}
                                <View style={{ flex: 1 }}>
                                    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{tk.title}</Text>
                                    <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                                        {t(TYPE_I18N[tk.taskType])} · {t('common.dayRange', { start: tk.startDay, end: tk.endDay })}
                                        {tk.isRepeating ? ` · ${tk.dailyTimes}` : ` · ${tk.timeOfDay}`}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </Surface>
            )}
        </>
    );

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <ProgressBar progress={(step + 1) / STEP_KEYS.length} color={theme.colors.primary} style={styles.progress} />
                <View style={styles.stepIndicator}>
                    <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                        {t('create.stepOf', { current: step + 1, total: STEP_KEYS.length })}
                    </Text>
                    <Text variant="labelMedium" style={{ opacity: 0.5 }}>{t(`create.${STEP_KEYS[step]}`)}</Text>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled">
                    {step === 0 && renderProjectInfo()}
                    {step === 1 && renderTools()}
                    {step === 2 && renderConsumables()}
                    {step === 3 && renderTasks()}
                    {step === 4 && renderReview()}
                </ScrollView>

                <Surface style={styles.footer} elevation={4}>
                    <Button mode="outlined" onPress={handleBack} style={styles.footerBtn}>
                        {step === 0 ? t('common.cancel') : t('common.back')}
                    </Button>
                    <View style={{ width: 12 }} />
                    {step < 4 ? (
                        <Button mode="contained" onPress={handleNext} style={styles.footerBtn}>
                            {t('common.next')}
                        </Button>
                    ) : (
                        <Button mode="contained" onPress={handleCreate} loading={saving}
                            disabled={saving} style={styles.footerBtn} icon="check">
                            {isEditing ? t('create.saveChanges') : t('create.createGuide')}
                        </Button>
                    )}
                </Surface>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    progress: { height: 4 },
    stepIndicator: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
    },
    content: { padding: 16, paddingBottom: 32 },
    stepTitle: { fontWeight: '700', marginBottom: 4 },
    stepSubtitle: { opacity: 0.55, marginBottom: 20 },
    fieldLabel: { fontWeight: '600', marginTop: 8, marginBottom: 6 },
    input: { marginBottom: 12 },
    row: { flexDirection: 'row', marginBottom: 12 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    entryCard: { borderRadius: 12, padding: 16, marginBottom: 12, gap: 4 },
    entryRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    addBtn: { marginTop: 4, marginBottom: 8, borderRadius: 8 },
    footer: { flexDirection: 'row', padding: 16, paddingBottom: 24 },
    footerBtn: { flex: 1, borderRadius: 8 },
    reviewCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
    reviewHero: { width: '100%', height: 160, borderRadius: 10, marginBottom: 12 },
    reviewItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    reviewThumb: { width: 40, height: 40, borderRadius: 8 },
});
