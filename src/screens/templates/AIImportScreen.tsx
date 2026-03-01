import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, Surface, TextInput, SegmentedButtons, useTheme, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { createTemplate, type CreateTemplateInput } from '@/features/api';

const AI_PROMPT = `You are an expert horticulturist and plant care specialist. I need your help creating a plant care guide for an app called Open Garden.

STEP 1 — LEARN ABOUT MY SITUATION

Ask me a few quick questions so you understand what I need. Adapt your questions to the plant — only ask what's relevant. Examples of good questions:
- What plant, herb, vegetable, or seed are you growing?
- Are you starting from seed, a seedling, or a transplant?
- Where will it live? (windowsill, balcony, patio, raised bed, greenhouse...)
- What pot or container do you have, if any?
- How much sunlight does the spot get?
- What's your climate, region, or growing zone?
- Any constraints? (limited space, budget, time, experience)

Wait for my answers before continuing.

STEP 2 — BUILD THE CARE GUIDE WITH YOUR EXPERTISE

Based on my answers, use YOUR horticultural knowledge to design a complete care plan. YOU decide:
- The right tools and supplies I'll need
- A full task schedule from day 0 to harvest or maturity
- Watering frequency, feeding, pruning, thinning, hardening, etc.
- Realistic difficulty and daily time commitment
- Proper timing for each care phase

Do NOT ask me for schedules, tools, or task details — that's YOUR job as the expert.

Then output ONLY a raw JSON object. No markdown formatting, no code fences, no backtick wrappers, no explanation text. Just the raw JSON starting with { and ending with }.

Use this exact structure:
{"title":"Plant Name (Method)","emoji":"🌿","difficulty":"Beginner","estimatedDailyTimeMins":5,"totalDurationDays":30,"environment":"Sunny Windowsill","tools":[{"name":"4-inch Pot with Drainage","emoji":"🪴"}],"consumables":[{"name":"Basil Seeds","quantity":5,"unit":"seeds","emoji":"🌱"}],"tasks":[{"title":"Sow Seeds","emoji":"🌱","description":"Fill pot with moist soil and press seeds gently into surface","taskType":"Preparation","windowStartDay":0,"windowEndDay":0,"timeOfDay":"10:00","isRepeating":false,"dailyTimes":null},{"title":"Water","emoji":"💧","description":"Check soil surface, mist if dry","taskType":"Care","windowStartDay":1,"windowEndDay":30,"timeOfDay":null,"isRepeating":true,"dailyTimes":["09:00"]}]}

Field reference:
- difficulty: Beginner, Intermediate, or Advanced
- taskType: Preparation, Care, Harvest, Observation, or Other
- windowStartDay / windowEndDay: day numbers (0 = first day)
- All times in 24-hour "HH:MM" format
- Non-repeating task: "isRepeating":false, "timeOfDay":"HH:MM", "dailyTimes":null
- Repeating task: "isRepeating":true, "dailyTimes":["HH:MM"], "timeOfDay":null

IMPORTANT: Your final output must be ONLY the raw JSON object. No surrounding text. No markdown. No backticks.`;

export default function AIImportScreen({ navigation }: any) {
    const theme = useTheme();
    const { t } = useTranslation();
    const [tab, setTab] = useState('prompt');
    const [jsonInput, setJsonInput] = useState('');
    const [importing, setImporting] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await Clipboard.setStringAsync(AI_PROMPT);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handlePaste = async () => {
        const text = await Clipboard.getStringAsync();
        if (text) setJsonInput(text);
    };

    const handleImport = async () => {
        if (!jsonInput.trim()) {
            Alert.alert(t('aiImport.emptyInput'), t('aiImport.emptyInputMsg'));
            return;
        }

        setImporting(true);
        try {
            const data = parseJsonInput(jsonInput);
            const newId = await createTemplate(data);
            Alert.alert(
                t('aiImport.guideImported'),
                t('aiImport.guideImportedMsg', { title: data.title }),
                [{
                    text: t('aiImport.viewGuide'),
                    onPress: () => navigation.reset({
                        index: 1,
                        routes: [
                            { name: 'LibraryRoot' },
                            { name: 'TemplateDetail', params: { templateId: newId } },
                        ],
                    }),
                }],
                { cancelable: false },
            );
        } catch (e: any) {
            console.error('Import failed:', e);
            Alert.alert(
                t('aiImport.importError'),
                String(e?.message || e || 'Unknown error.'),
            );
        } finally {
            setImporting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <SegmentedButtons
                value={tab}
                onValueChange={setTab}
                buttons={[
                    { value: 'prompt', label: t('aiImport.copyPrompt') },
                    { value: 'import', label: t('aiImport.pasteJSON') },
                ]}
                style={styles.tabs}
            />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled">
                {tab === 'prompt' ? (
                    <>
                        <Text variant="titleLarge" style={styles.title}>{t('aiImport.getAIHelp')}</Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            {t('aiImport.getAIHelpSubtitle')}
                        </Text>

                        <Surface style={styles.promptBox} elevation={1}>
                            <Text variant="bodySmall" style={styles.promptText}>
                                {AI_PROMPT}
                            </Text>
                        </Surface>

                        <Button
                            mode="contained"
                            icon={copied ? 'check' : 'content-copy'}
                            onPress={handleCopy}
                            style={styles.actionBtn}
                        >
                            {copied ? t('aiImport.copied') : t('aiImport.copyPromptBtn')}
                        </Button>

                        <Divider style={{ marginVertical: 20 }} />

                        <Text variant="bodySmall" style={{ opacity: 0.5, textAlign: 'center' }}>
                            {t('aiImport.afterGenerate')}
                        </Text>
                    </>
                ) : (
                    <>
                        <Text variant="titleLarge" style={styles.title}>{t('aiImport.pasteTitle')}</Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            {t('aiImport.pasteSubtitle')}
                        </Text>

                        <TextInput
                            mode="outlined"
                            value={jsonInput}
                            onChangeText={setJsonInput}
                            multiline
                            numberOfLines={14}
                            placeholder={'{\n  "title": "My Plant",\n  ...\n}'}
                            style={styles.jsonInput}
                        />

                        <View style={styles.btnRow}>
                            <Button mode="outlined" icon="clipboard-text" onPress={handlePaste}
                                style={{ flex: 1, borderRadius: 8 }}>
                                {t('aiImport.pasteFromClipboard')}
                            </Button>
                            <View style={{ width: 12 }} />
                            <Button mode="outlined" icon="delete-outline"
                                onPress={() => setJsonInput('')}
                                disabled={!jsonInput}
                                style={{ borderRadius: 8 }}>
                                {t('aiImport.clear')}
                            </Button>
                        </View>

                        <Button
                            mode="contained"
                            icon="import"
                            onPress={handleImport}
                            loading={importing}
                            disabled={importing || !jsonInput.trim()}
                            style={styles.actionBtn}
                        >
                            {t('aiImport.importGuide')}
                        </Button>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

function cleanJsonText(text: string): string {
    let s = text.trim();

    s = s.replace(/[\u200B\u200C\u200D\u200E\u200F\uFEFF]/g, '');
    s = s.replace(/[\u201C\u201D\u2033\u2036]/g, '"');
    s = s.replace(/[\u2018\u2019\u2032\u2035]/g, "'");
    s = s.replace(/\u00A0/g, ' ');
    s = s.replace(/```(?:json|JSON)?\s*\n?/g, '').replace(/```/g, '');
    s = s.trim();

    const firstBrace = s.indexOf('{');
    if (firstBrace < 0) throw new Error('No JSON object found — the text should contain { ... }');
    if (firstBrace > 0) s = s.slice(firstBrace);
    const lastBrace = s.lastIndexOf('}');
    if (lastBrace < 0) throw new Error('Incomplete JSON — missing closing }');
    if (lastBrace < s.length - 1) s = s.slice(0, lastBrace + 1);

    s = s.replace(/,(\s*[}\]])/g, '$1');
    s = s.replace(/\/\/[^\n]*$/gm, '');
    s = s.replace(/\/\*[\s\S]*?\*\//g, '');

    return s;
}

function parseJsonInput(input: string): CreateTemplateInput {
    const cleaned = cleanJsonText(input);

    let raw: any;
    try {
        raw = JSON.parse(cleaned);
    } catch {
        throw new Error(
            'Could not parse JSON. Common fixes:\n\n' +
            '\u2022 Make sure you copied the COMPLETE output\n' +
            '\u2022 Ask your AI to "output the JSON again with no code blocks and no extra text"\n' +
            '\u2022 The output should start with { and end with }',
        );
    }

    if (typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error('Expected a JSON object { ... }, not an array or primitive.');
    }
    if (!raw.title || typeof raw.title !== 'string') {
        throw new Error('Missing "title" field. The JSON needs at least a title.');
    }

    return {
        title: raw.title,
        difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(raw.difficulty)
            ? raw.difficulty : 'Beginner',
        estimatedDailyTimeMins: Math.max(1, Number(raw.estimatedDailyTimeMins) || 5),
        totalDurationDays: Math.max(1, Number(raw.totalDurationDays) || 30),
        environment: String(raw.environment || 'Indoor'),
        imageUri: null,
        emoji: raw.emoji ? String(raw.emoji) : null,
        tools: (Array.isArray(raw.tools) ? raw.tools : []).map((t: any) => ({
            name: String(t?.name || 'Tool'),
            imageUri: null,
            emoji: t?.emoji ? String(t.emoji) : null,
        })),
        consumables: (Array.isArray(raw.consumables) ? raw.consumables : []).map((c: any) => ({
            name: String(c?.name || 'Supply'),
            quantity: Math.max(0.01, Number(c?.quantity) || 1),
            unit: String(c?.unit || 'unit'),
            imageUri: null,
            emoji: c?.emoji ? String(c.emoji) : null,
        })),
        tasks: (Array.isArray(raw.tasks) ? raw.tasks : []).map((t: any) => ({
            title: String(t?.title || 'Task'),
            description: t?.description ? String(t.description) : undefined,
            taskType: ['Preparation', 'Care', 'Harvest', 'Observation', 'Other'].includes(t?.taskType)
                ? t.taskType : 'Care',
            windowStartDay: Math.max(0, Number(t?.windowStartDay) || 0),
            windowEndDay: Math.max(0, Number(t?.windowEndDay) || 0),
            timeOfDay: t?.isRepeating ? undefined : String(t?.timeOfDay || '09:00'),
            isRepeating: Boolean(t?.isRepeating),
            dailyTimes: t?.isRepeating
                ? JSON.stringify(Array.isArray(t?.dailyTimes) ? t.dailyTimes : ['09:00'])
                : undefined,
            imageUri: null,
            emoji: t?.emoji ? String(t.emoji) : null,
        })),
    };
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabs: { margin: 16, marginBottom: 0 },
    content: { padding: 16, paddingBottom: 40 },
    title: { fontWeight: '700', marginBottom: 4 },
    subtitle: { opacity: 0.55, marginBottom: 16, lineHeight: 20 },
    promptBox: { borderRadius: 12, padding: 16 },
    promptText: { lineHeight: 18 },
    actionBtn: { marginTop: 16, borderRadius: 8 },
    jsonInput: { marginBottom: 12, maxHeight: 300 },
    btnRow: { flexDirection: 'row', marginBottom: 8 },
});
