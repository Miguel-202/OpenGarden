import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import {
    Text, Surface, Checkbox, Divider, List, MD3Colors, useTheme,
    ActivityIndicator, Chip, IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getShoppingList, toggleShoppingItem } from '@/features/api';
import { ShoppingCart } from 'lucide-react-native';

type ShoppingItem = {
    id: string;
    itemId: string | null;
    name: string | null;
    quantity: number | null;
    unit: string | null;
    checked: boolean;
    storeNote: string | null;
};

export default function ShoppingListScreen() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const { t } = useTranslation();

    const refresh = useCallback(() => {
        getShoppingList().then(data => {
            setItems(data as ShoppingItem[]);
            setLoading(false);
        });
    }, []);

    useFocusEffect(refresh);

    const handleToggle = async (id: string, checked: boolean) => {
        await toggleShoppingItem(id, !checked);
        refresh();
    };

    const unchecked = items.filter(i => !i.checked);
    const checked = items.filter(i => i.checked);

    if (loading) return <ActivityIndicator style={styles.center} />;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={[...unchecked, ...checked]}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <ShoppingCart size={22} color={theme.colors.primary} />
                            <Text variant="headlineSmall" style={styles.heading}>{t('shopping.shoppingList')}</Text>
                        </View>
                        {items.length === 0 && (
                            <Surface style={styles.empty} elevation={1}>
                                <Text variant="bodyLarge" style={{ opacity: 0.6, textAlign: 'center' }}>
                                    {t('shopping.noItems')}
                                </Text>
                            </Surface>
                        )}
                    </>
                }
                renderItem={({ item }) => (
                    <Surface style={[styles.itemCard, item.checked && styles.checkedCard]} elevation={1}>
                        <View style={styles.row}>
                            <Checkbox
                                status={item.checked ? 'checked' : 'unchecked'}
                                onPress={() => handleToggle(item.id, item.checked)}
                                color={theme.colors.primary}
                            />
                            <View style={styles.itemBody}>
                                <Text
                                    variant="bodyLarge"
                                    style={item.checked && { textDecorationLine: 'line-through', opacity: 0.5 }}
                                >
                                    {item.name}
                                </Text>
                                {(item.quantity || item.unit) && (
                                    <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                                        {item.quantity} {item.unit}
                                    </Text>
                                )}
                                {item.storeNote && (
                                    <Text variant="bodySmall" style={{ opacity: 0.5 }}>
                                        🏪 {item.storeNote}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </Surface>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    list: { padding: 16, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    heading: { fontWeight: '700' },
    empty: { borderRadius: 12, padding: 32 },
    itemCard: { borderRadius: 10, overflow: 'hidden' },
    checkedCard: { opacity: 0.7 },
    row: { flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
    itemBody: { flex: 1, paddingVertical: 10 },
});
