import React, { useCallback, useState } from 'react';
import { View, SectionList, StyleSheet, Alert } from 'react-native';
import {
    Text, Surface, FAB, Chip, List, Divider, Portal, Modal,
    TextInput, Button, SegmentedButtons, useTheme, ActivityIndicator,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getAllInventoryItems, upsertInventoryItem, toggleInventoryItem } from '@/features/api';
import { Checkbox, Switch } from 'react-native-paper';

type Item = { id: string; name: string; category: 'tool' | 'consumable'; unitDefault?: string | null; notes?: string | null; isOwned: boolean; };

export default function InventoryScreen() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState<'tool' | 'consumable'>('tool');
    const theme = useTheme();
    const { t } = useTranslation();

    const refresh = useCallback(() => {
        getAllInventoryItems().then(data => {
            setItems(data as Item[]);
            setLoading(false);
        });
    }, []);

    useFocusEffect(refresh);

    const handleToggle = async (id: string, current: boolean) => {
        await toggleInventoryItem(id, !current);
        refresh();
    };

    const tools = items.filter(i => i.category === 'tool');
    const consumables = items.filter(i => i.category === 'consumable');
    const sections = [
        { title: t('inventory.tools'), data: tools },
        { title: t('inventory.consumables'), data: consumables },
    ];

    const handleAdd = async () => {
        if (!newName.trim()) return;
        await upsertInventoryItem(newName.trim(), newCategory);
        setModalVisible(false);
        setNewName('');
        refresh();
    };

    if (loading) return <ActivityIndicator style={styles.center} />;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                renderSectionHeader={({ section: { title } }) => (
                    <Text variant="titleSmall" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
                        {title}
                    </Text>
                )}
                renderItem={({ item }) => (
                    <Surface style={styles.itemCard} elevation={1}>
                        <List.Item
                            title={item.name}
                            description={item.notes ?? undefined}
                            left={props => (
                                <List.Icon
                                    {...props}
                                    icon={item.category === 'tool' ? 'wrench-outline' : 'seed-outline'}
                                />
                            )}
                            right={() => (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text variant="labelSmall" style={{ opacity: 0.6, marginRight: 8 }}>
                                        {item.isOwned ? t('inventory.owned') : t('inventory.missing')}
                                    </Text>
                                    <Switch
                                        value={item.isOwned}
                                        onValueChange={() => handleToggle(item.id, item.isOwned)}
                                        color={theme.colors.primary}
                                    />
                                </View>
                            )}
                        />
                    </Surface>
                )}
                SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
                ItemSeparatorComponent={() => <Divider />}
            />
            <FAB
                icon="plus"
                label={t('inventory.addItem')}
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color="white"
                onPress={() => setModalVisible(true)}
            />
            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>{t('inventory.addInventoryItem')}</Text>
                    <TextInput
                        label={t('inventory.itemName')}
                        value={newName}
                        onChangeText={setNewName}
                        mode="outlined"
                        style={styles.input}
                    />
                    <SegmentedButtons
                        value={newCategory}
                        onValueChange={v => setNewCategory(v as 'tool' | 'consumable')}
                        style={styles.segmented}
                        buttons={[
                            { value: 'tool', label: t('inventory.tool') },
                            { value: 'consumable', label: t('inventory.consumable') },
                        ]}
                    />
                    <Button mode="contained" onPress={handleAdd} disabled={!newName.trim()} style={styles.addBtn}>
                        {t('inventory.addToInventory')}
                    </Button>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    list: { padding: 16, paddingBottom: 100, gap: 4 },
    sectionHeader: { fontWeight: '700', marginTop: 16, marginBottom: 4, paddingHorizontal: 4 },
    itemCard: { borderRadius: 8, marginBottom: 2 },
    categChip: { alignSelf: 'center', marginRight: 8 },
    fab: { position: 'absolute', right: 20, bottom: 24 },
    modal: { margin: 20, borderRadius: 16, padding: 24 },
    modalTitle: { fontWeight: '700', marginBottom: 16 },
    input: { marginBottom: 16 },
    segmented: { marginBottom: 20 },
    addBtn: { borderRadius: 10 },
});
