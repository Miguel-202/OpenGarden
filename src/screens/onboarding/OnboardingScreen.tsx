import React, { useRef, useState } from 'react';
import {
    View, ScrollView, StyleSheet, Dimensions, NativeSyntheticEvent,
    NativeScrollEvent, Animated,
} from 'react-native';
import { Text, Button, Surface, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLanguage } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeContext';
import { ThemeName } from '@/theme';
import { startRun, activateRun } from '@/features/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const ONBOARDING_KEY = '@open_garden_onboarded';

type Props = {
    onComplete: () => void;
};

export default function OnboardingScreen({ onComplete }: Props) {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const { themeName, setTheme } = useAppTheme();
    const scrollRef = useRef<ScrollView>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [addingWelcome, setAddingWelcome] = useState(false);

    const TOTAL_PAGES = 8;

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setCurrentPage(page);
    };

    const goTo = (page: number) => {
        scrollRef.current?.scrollTo({ x: page * SCREEN_WIDTH, animated: true });
        setCurrentPage(page);
    };

    const goNext = () => goTo(Math.min(currentPage + 1, TOTAL_PAGES - 1));
    const goBack = () => goTo(Math.max(currentPage - 1, 0));

    const finish = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        onComplete();
    };

    const addWelcomeProject = async () => {
        setAddingWelcome(true);
        try {
            const runId = await startRun('template_welcome_test', new Date(), 'Welcome Test 🌱');
            await activateRun(runId);
            await finish();
        } catch (e) {
            console.error('Failed to create welcome project:', e);
            await finish();
        }
    };

    const selectLang = (lang: 'en' | 'es') => {
        setLanguage(lang);
    };

    const selectTheme = (name: ThemeName) => {
        setTheme(name);
    };

    const themeColors: Record<ThemeName, { bg: string; label: string }> = {
        green: { bg: '#E8F5E9', label: t('settings.green') },
        pink: { bg: '#FCE4EC', label: t('settings.pink') },
        blue: { bg: '#E3F2FD', label: t('settings.blue') },
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                bounces={false}
            >
                {/* ── Step 1: Welcome ── */}
                <View style={styles.page}>
                    <Text style={styles.bigEmoji}>🌱</Text>
                    <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.primary }]}>
                        {t('onboarding.welcome')}
                    </Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>
                        {t('onboarding.welcomeSub')}
                    </Text>
                </View>

                {/* ── Step 2: Language ── */}
                <View style={styles.page}>
                    <Text style={styles.bigEmoji}>🌐</Text>
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
                        {t('onboarding.pickLanguage')}
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        {t('onboarding.pickLanguageSub')}
                    </Text>
                    <View style={styles.optionRow}>
                        <Surface
                            style={[
                                styles.optionCard,
                                { backgroundColor: theme.colors.surfaceVariant },
                                i18n.language === 'en' && { borderColor: theme.colors.primary, borderWidth: 3 },
                            ]}
                            elevation={i18n.language === 'en' ? 3 : 1}
                        >
                            <Button mode="text" onPress={() => selectLang('en')} labelStyle={styles.optionLabel}>
                                🇺🇸  English
                            </Button>
                        </Surface>
                        <Surface
                            style={[
                                styles.optionCard,
                                { backgroundColor: theme.colors.surfaceVariant },
                                i18n.language === 'es' && { borderColor: theme.colors.primary, borderWidth: 3 },
                            ]}
                            elevation={i18n.language === 'es' ? 3 : 1}
                        >
                            <Button mode="text" onPress={() => selectLang('es')} labelStyle={styles.optionLabel}>
                                🇪🇸  Español
                            </Button>
                        </Surface>
                    </View>
                </View>

                {/* ── Step 3: Theme ── */}
                <View style={styles.page}>
                    <Text style={styles.bigEmoji}>🎨</Text>
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
                        {t('onboarding.pickTheme')}
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        {t('onboarding.pickThemeSub')}
                    </Text>
                    <View style={styles.themeRow}>
                        {(['green', 'pink', 'blue'] as ThemeName[]).map(name => (
                            <Surface
                                key={name}
                                style={[
                                    styles.themeCard,
                                    { backgroundColor: themeColors[name].bg },
                                    themeName === name && { borderColor: theme.colors.primary, borderWidth: 3 },
                                ]}
                                elevation={themeName === name ? 3 : 1}
                            >
                                <Button mode="text" onPress={() => selectTheme(name)} labelStyle={styles.themeLabel}>
                                    {themeColors[name].label}
                                </Button>
                            </Surface>
                        ))}
                    </View>
                </View>

                {/* ── Step 4: Today Tab ── */}
                <View style={styles.page}>
                    <Text style={styles.bigEmoji}>📅</Text>
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
                        {t('onboarding.todayTitle')}
                    </Text>
                    <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                        <Text variant="bodyMedium" style={styles.infoText}>
                            {t('onboarding.todaySub')}
                        </Text>
                    </Surface>
                </View>

                {/* ── Step 5: Library ── */}
                <View style={styles.page}>
                    <Text style={styles.bigEmoji}>📚</Text>
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
                        {t('onboarding.libraryTitle')}
                    </Text>
                    <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                        <Text variant="bodyMedium" style={styles.infoText}>
                            {t('onboarding.librarySub')}
                        </Text>
                    </Surface>
                </View>

                {/* ── Step 6: Projects ── */}
                <View style={styles.page}>
                    <Text style={styles.bigEmoji}>🌱</Text>
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
                        {t('onboarding.projectsTitle')}
                    </Text>
                    <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                        <Text variant="bodyMedium" style={styles.infoText}>
                            {t('onboarding.projectsSub')}
                        </Text>
                    </Surface>
                </View>

                {/* ── Step 7: Inventory ── */}
                <View style={styles.page}>
                    <Text style={styles.bigEmoji}>🎒</Text>
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
                        {t('onboarding.inventoryTitle')}
                    </Text>
                    <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                        <Text variant="bodyMedium" style={styles.infoText}>
                            {t('onboarding.inventorySub')}
                        </Text>
                    </Surface>
                </View>

                {/* ── Step 8: Get Started ── */}
                <View style={styles.page}>
                    <Text style={styles.bigEmoji}>🚀</Text>
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
                        {t('onboarding.getStarted')}
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        {t('onboarding.getStartedSub')}
                    </Text>
                    <View style={styles.ctaColumn}>
                        <Button
                            mode="contained"
                            icon="sprout"
                            onPress={addWelcomeProject}
                            loading={addingWelcome}
                            disabled={addingWelcome}
                            style={styles.ctaBtn}
                            contentStyle={{ paddingVertical: 6 }}
                        >
                            {t('onboarding.addWelcome')}
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={finish}
                            style={styles.ctaBtn}
                            contentStyle={{ paddingVertical: 6 }}
                        >
                            {t('onboarding.skipExplore')}
                        </Button>
                    </View>
                </View>
            </ScrollView>

            {/* ── Dot Indicator & Navigation ── */}
            <View style={styles.bottomBar}>
                <View style={styles.dots}>
                    {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: i === currentPage
                                        ? theme.colors.primary
                                        : theme.colors.outlineVariant,
                                    width: i === currentPage ? 24 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>
                <View style={styles.navRow}>
                    {currentPage > 0 ? (
                        <Button mode="text" onPress={goBack}>{t('onboarding.back')}</Button>
                    ) : (
                        <View style={{ width: 80 }} />
                    )}
                    {currentPage < TOTAL_PAGES - 1 ? (
                        <Button mode="contained" onPress={goNext} style={{ borderRadius: 20 }}>
                            {t('onboarding.next')}
                        </Button>
                    ) : (
                        <View style={{ width: 80 }} />
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    page: {
        width: SCREEN_WIDTH,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    bigEmoji: { fontSize: 72, marginBottom: 16 },
    title: { fontWeight: '800', textAlign: 'center', marginBottom: 12 },
    subtitle: { textAlign: 'center', opacity: 0.6, lineHeight: 22, marginBottom: 24, paddingHorizontal: 8 },

    // Language options
    optionRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
    optionCard: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 20, minWidth: 130 },
    optionLabel: { fontSize: 16, fontWeight: '600' },

    // Theme options
    themeRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    themeCard: { borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16, minWidth: 90, alignItems: 'center' },
    themeLabel: { fontSize: 14, fontWeight: '600' },

    // Info cards
    infoCard: { borderRadius: 16, padding: 24, marginHorizontal: 8, width: SCREEN_WIDTH - 80 },
    infoText: { textAlign: 'center', lineHeight: 22 },

    // CTA
    ctaColumn: { gap: 12, width: '100%', paddingHorizontal: 16 },
    ctaBtn: { borderRadius: 12 },

    // Bottom bar
    bottomBar: { paddingBottom: 40, paddingHorizontal: 24 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
    dot: { height: 8, borderRadius: 4 },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
