import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
    Text, Surface, Button, Chip, Divider, List, MD3Colors, Banner,
    ActivityIndicator, useTheme, Portal, Modal, TextInput, SegmentedButtons, IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react-native';
import { getTemplateDetail, startRun, addToShoppingList, startStaggeredRuns, getNextRunName } from '@/features/api';
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

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            getTemplateDetail(templateId).then(d => {
                setDetail(d);
                setLoading(false);
            });
        }, [templateId]),
    );

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
            Alert.alert('Project Created! 🌱', `${plantName} is now in your Projects. Confirm readiness to start tasks.`, [
                { text: 'Go to Projects', onPress: () => navigation.navigate('MainTabs', { screen: 'Projects' }) },
                { text: 'OK' },
            ]);
            setShowOptions(false);
        } catch (e: any) {
            Alert.alert('Error', e.message);
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
            if (isNaN(count) || count < 1) throw new Error('Invalid batch size');
            if (isNaN(offset) || offset < 0) throw new Error('Invalid offset');

            await startStaggeredRuns(templateId, new Date(), count, offset);
            Alert.alert('Batch Created! 🚀', `${count} runs have been added to Projects.`, [
                { text: 'Go to Projects', onPress: () => navigation.navigate('MainTabs', { screen: 'Projects' }) },
                { text: 'OK' },
            ]);
            setShowOptions(false);
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
        <>
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
                        onPress={openSetup}
                        loading={starting}
                        disabled={starting}
                        style={styles.startBtn}
                        contentStyle={styles.startBtnContent}
                    >
                        Setup Your Plant
                    </Button>
                </View>
            </ScrollView>

            <Portal>
                {/* Info Dialog for Staggered explanation */}
                <Modal
                    visible={showInfo}
                    onDismiss={() => setShowInfo(false)}
                    contentContainerStyle={[styles.modalStyle, { backgroundColor: theme.colors.surface, zIndex: 2000 }]}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>What is Staggered Batch? 🔄</Text>
                    <Text variant="bodyMedium" style={{ marginVertical: 12 }}>
                        Staggering means starting multiple plants at different times instead of all at once.
                        {"\n\n"}
                        For example, if you start 3 jars of sprouts with a 7-day offset, you'll have a fresh harvest every week instead of 3 harvests on the same day!
                    </Text>
                    <Button mode="contained" onPress={() => setShowInfo(false)}>Got it</Button>
                </Modal>

                <Modal
                    visible={showOptions}
                    onDismiss={() => setShowOptions(false)}
                    contentContainerStyle={[styles.modalStyle, { backgroundColor: theme.colors.surface }]}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text variant="titleLarge" style={styles.modalTitle}>Setup Plant</Text>
                        <IconButton icon="close" size={20} onPress={() => setShowOptions(false)} />
                    </View>

                    <SegmentedButtons
                        value={setupMode}
                        onValueChange={setSetupMode}
                        style={{ marginBottom: 16 }}
                        buttons={[
                            { value: 'single', label: 'Single' },
                            { value: 'staggered', label: 'Staggered' },
                        ]}
                    />

                    <TextInput
                        label="Plant Nickname"
                        value={plantName}
                        onChangeText={setPlantName}
                        mode="outlined"
                        style={{ marginBottom: 16 }}
                        right={<TextInput.Icon icon="pencil" />}
                    />

                    {setupMode === 'staggered' ? (
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Text variant="titleSmall">Staggered Settings</Text>
                                <IconButton
                                    icon="help-circle-outline"
                                    size={18}
                                    onPress={() => setShowInfo(true)}
                                />
                            </View>
                            <View style={styles.inputRow}>
                                <TextInput
                                    label="Batch Count"
                                    value={batchCount}
                                    onChangeText={setBatchCount}
                                    keyboardType="numeric"
                                    mode="outlined"
                                    style={{ flex: 1 }}
                                />
                                <View style={{ width: 12 }} />
                                <TextInput
                                    label="Offset Days"
                                    value={offsetDays}
                                    onChangeText={setOffsetDays}
                                    keyboardType="numeric"
                                    mode="outlined"
                                    style={{ flex: 1 }}
                                />
                            </View>
                            <Button
                                icon="calendar-multiple"
                                mode="contained"
                                onPress={handleStartStaggered}
                                style={styles.optionBtn}
                            >
                                Launch Batch
                            </Button>
                        </View>
                    ) : (
                        <Button
                            icon="sprout"
                            mode="contained"
                            onPress={handleStartSingle}
                            style={styles.optionBtn}
                        >
                            Start Project
                        </Button>
                    )}

                    <Divider style={{ marginVertical: 12 }} />
                    <Button mode="text" onPress={() => setShowOptions(false)}>
                        OK / Dimiss Keyboard
                    </Button>
                </Modal>
            </Portal>
        </>
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
    modalStyle: { margin: 20, borderRadius: 16, padding: 24 },
    modalTitle: { fontWeight: '700', marginBottom: 8 },
    optionBtn: { borderRadius: 8, marginVertical: 4 },
    inputRow: { flexDirection: 'row', marginBottom: 12 },
});
