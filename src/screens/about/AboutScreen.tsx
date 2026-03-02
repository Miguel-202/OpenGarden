import React from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import { Text, Surface, Button, Divider, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

const GITHUB_URL = 'https://github.com/OpenGardenApp/OpenGarden';
const BMC_URL = 'https://buymeacoffee.com/opengarden';

export default function AboutScreen() {
    const theme = useTheme();
    const { t } = useTranslation();

    const openLink = (url: string) => Linking.openURL(url).catch(() => {});

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

            <Surface style={styles.card} elevation={1}>
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

            <Surface style={styles.card} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    📖 {t('about.howToUseTitle')}
                </Text>
                <Text variant="bodyMedium" style={styles.body}>
                    {t('about.howToUseBody')}
                </Text>
            </Surface>

            <Surface style={styles.card} elevation={1}>
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
    sectionTitle: { fontWeight: '700', marginBottom: 10 },
    body: { lineHeight: 22, opacity: 0.85 },
    linkBtn: { marginTop: 14, borderRadius: 10, alignSelf: 'flex-start' },
    divider: { marginVertical: 20 },
    footer: { textAlign: 'center', opacity: 0.5 },
});
