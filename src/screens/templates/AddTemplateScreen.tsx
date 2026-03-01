import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, useTheme, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export default function AddTemplateScreen({ navigation }: any) {
    const theme = useTheme();
    const { t } = useTranslation();

    const OPTIONS = [
        {
            key: 'manual',
            route: 'ManualCreate',
            icon: 'format-list-checks',
            title: t('addTemplate.stepByStep'),
            description: t('addTemplate.stepByStepDesc'),
        },
        {
            key: 'ai',
            route: 'AIImport',
            icon: 'creation',
            title: t('addTemplate.importAI'),
            description: t('addTemplate.importAIDesc'),
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text variant="headlineSmall" style={styles.heading}>{t('addTemplate.title')}</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
                {t('addTemplate.subtitle')}
            </Text>

            {OPTIONS.map(opt => (
                <Pressable key={opt.key} onPress={() => navigation.navigate(opt.route)}>
                    <Surface style={styles.card} elevation={2}>
                        <View style={styles.cardRow}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
                                <IconButton
                                    icon={opt.icon}
                                    size={28}
                                    iconColor={theme.colors.primary}
                                />
                            </View>
                            <View style={styles.cardText}>
                                <Text variant="titleMedium" style={styles.cardTitle}>{opt.title}</Text>
                                <Text variant="bodySmall" style={styles.cardDesc}>{opt.description}</Text>
                            </View>
                            <IconButton icon="chevron-right" size={24} iconColor={theme.colors.outline} />
                        </View>
                    </Surface>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    heading: { fontWeight: '700', marginBottom: 4 },
    subtitle: { opacity: 0.6, marginBottom: 28 },
    card: { borderRadius: 16, padding: 8, marginBottom: 16 },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    cardText: { flex: 1, marginLeft: 12, marginRight: 4 },
    cardTitle: { fontWeight: '600', marginBottom: 4 },
    cardDesc: { opacity: 0.6 },
});
