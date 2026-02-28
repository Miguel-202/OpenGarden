import React, { useCallback, useState } from 'react';
import { View, SectionList, StyleSheet, Alert } from 'react-native';
import {
    Text, Surface, FAB, Chip, List, Divider, Portal, Modal,
    TextInput, Button, SegmentedButtons, useTheme, ActivityIndicator,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getAllInventoryItems, upsertInventoryItem } from '@/features/api';

type Item = { id: string; name: string; category: 'tool' | 'consumable'; unitDefault?: string | null; notes?: string | null; };

export default function InventoryScreen() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState<'tool' | 'consumable'>('tool');
    const theme = useTheme();

    const refresh = useCallback(() => {
        getAllInventoryItems().then(data => {
            setItems(data as Item[]);
            setLoading(false);
        });
    }, []);

    useFocusEffect(refresh);

    const tools = items.filter(i => i.category === 'tool');
    const consumables = items.filter(i => i.category === 'consumable');
    const sections = [
        { title: '🔧 Tools (Reusable)', data: tools },
        { title: '🌱 Consumables', data: consumables },
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
                                <Chip compact style={styles.categChip}>
                                    {item.category}
                                </Chip>
                            )}
                        />
                    </Surface>
                )}
                SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
                ItemSeparatorComponent={() => <Divider />}
            />
            <FAB
                icon="plus"
                label="Add Item"
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
                    <Text variant="titleLarge" style={styles.modalTitle}>Add Inventory Item</Text>
                    <TextInput
                        label="Item Name"
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
                            { value: 'tool', label: 'Tool' },
                            { value: 'consumable', label: 'Consumable' },
                        ]}
                    />
                    <Button mode="contained" onPress={handleAdd} disabled={!newName.trim()} style={styles.addBtn}>
                        Add to Inventory
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
