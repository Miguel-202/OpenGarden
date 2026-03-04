import React from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import { Text, Surface, Button, Divider, SegmentedButtons, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeContext';
import { ThemeName } from '@/theme';

const GITHUB_URL = 'https://github.com/Miguel-202/OpenGarden';
const BMC_URL = 'https://buymeacoffee.com/mikytinez';

export default function SettingsScreen() {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const { themeName, setTheme } = useAppTheme();

    const openLink = (url: string) => Linking.openURL(url).catch(() => { });

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
        >
            <View style={styles.hero}>
                <Text style={styles.appIcon}>🌱</Text>
                <Text variant="headlineMedium" style={styles.appName}>Open Garden</Text>
                <Text variant="bodyMedium" style={[styles.tagline, { color: theme.colors.secondary }]}>
                    {t('about.tagline')}
                </Text>
            </View>

            <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    ⚙️ {t('tabs.settings')}
                </Text>

                <View style={styles.settingRow}>
                    <Text variant="bodyMedium" style={{ fontWeight: '600', marginBottom: 8 }}>
                        {t('settings.language')}
                    </Text>
                    <SegmentedButtons
                        value={i18n.language.startsWith('es') ? 'es' : 'en'}
                        onValueChange={(val) => setLanguage(val as 'en' | 'es')}
                        buttons={[
                            { value: 'en', label: 'English' },
                            { value: 'es', label: 'Español' },
                        ]}
                        style={styles.segmented}
                    />
                </View>

                <Divider style={{ marginVertical: 16 }} />

                <View style={[styles.settingRow, { marginBottom: 0 }]}>
                    <Text variant="bodyMedium" style={{ fontWeight: '600', marginBottom: 8 }}>
                        {t('settings.theme')}
                    </Text>
                    <SegmentedButtons
                        value={themeName}
                        onValueChange={(val) => setTheme(val as ThemeName)}
                        buttons={[
                            {
                                value: 'green',
                                label: t('settings.green'),
                                uncheckedColor: '#6B8E23',
                                checkedColor: '#6B8E23',
                            },
                            {
                                value: 'pink',
                                label: t('settings.pink'),
                                uncheckedColor: '#E57373',
                                checkedColor: '#E57373',
                            },
                            {
                                value: 'blue',
                                label: t('settings.blue'),
                                uncheckedColor: '#64B5F6',
                                checkedColor: '#64B5F6',
                            },
                        ]}
                        style={styles.segmented}
                    />
                </View>
            </Surface>

            <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    🌍 {t('about.openSourceTitle')}
                </Text>
                <Text variant="bodyMedium" style={styles.body}>
                    {t('about.openSourceBody')}
                </Text>
                <Button
                    mode="outlined"
                    icon="github"
                    onPress={() => openLink(GITHUB_URL)}
                    style={styles.linkBtn}
                >
                    {t('about.viewOnGithub')}
                </Button>
            </Surface>

            <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    📖 {t('about.howToUseTitle')}
                </Text>
                <Text variant="bodyMedium" style={styles.body}>
                    {t('about.howToUseBody')}
                </Text>
            </Surface>

            <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    🤝 {t('about.contributeTitle')}
                </Text>
                <Text variant="bodyMedium" style={styles.body}>
                    {t('about.contributeBody')}
                </Text>
                <Button
                    mode="outlined"
                    icon="source-pull"
                    onPress={() => openLink(GITHUB_URL)}
                    style={styles.linkBtn}
                >
                    {t('about.contributeBtn')}
                </Button>
            </Surface>

            <Surface style={[styles.card, { backgroundColor: '#FFF8E1' }]} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    ☕ {t('about.supportTitle')}
                </Text>
                <Text variant="bodyMedium" style={styles.body}>
                    {t('about.supportBody')}
                </Text>
                <Button
                    mode="contained"
                    icon="coffee"
                    onPress={() => openLink(BMC_URL)}
                    style={[styles.linkBtn, { backgroundColor: '#FFDD00' }]}
                    textColor="#000"
                >
                    {t('about.buyMeACoffee')}
                </Button>
            </Surface>

            <Divider style={styles.divider} />

            <Text variant="bodySmall" style={[styles.footer, { color: theme.colors.secondary }]}>
                {t('about.footer')}
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    hero: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
    appIcon: { fontSize: 56, marginBottom: 8 },
    appName: { fontWeight: '800', letterSpacing: 0.5 },
    tagline: { marginTop: 4, textAlign: 'center' },
    card: { borderRadius: 14, padding: 20, marginBottom: 16 },
    sectionTitle: { fontWeight: '700', marginBottom: 16 },
    body: { lineHeight: 22, opacity: 0.85 },
    settingRow: { marginBottom: 16 },
    segmented: { alignSelf: 'stretch' },
    linkBtn: { marginTop: 14, borderRadius: 10, alignSelf: 'flex-start' },
    divider: { marginVertical: 20 },
    footer: { textAlign: 'center', opacity: 0.5 },
});
