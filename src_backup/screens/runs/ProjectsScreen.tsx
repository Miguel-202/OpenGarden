import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import {
    Text, Surface, Button, Chip, List, Divider, FAB, Portal, Modal,
    TextInput, SegmentedButtons, useTheme, ActivityIndicator, Badge,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getAllRuns, getRunDetail, updateRequirementStatus, addToShoppingList, startStaggeredRuns } from '@/features/api';
import { isRunReady } from '@/core/readiness';
import { format } from 'date-fns';
import { CheckCircle, Circle, ShoppingCart, AlertCircle } from 'lucide-react-native';

type RunRow = {
    run: { id: string; templateId: string; startDate: Date; status: string };
    templateTitle: string | null;
};

type Requirement = {
    req: { id: string; status: string; requirementType: string; requiredQuantity: number | null; unit: string | null };
    itemName: string | null;
};

export default function ProjectsScreen({ navigation }: any) {
    const [runs, setRuns] = useState<RunRow[]>([]);
    const [selected, setSelected] = useState<{ run: RunRow; requirements: Requirement[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [staggerModal, setStaggerModal] = useState(false);
    const [staggerTemplateId, setStaggerTemplateId] = useState('');
    const [batchCount, setBatchCount] = useState('3');
    const [offsetDays, setOffsetDays] = useState('7');
    const theme = useTheme();

    const refresh = useCallback(() => {
        getAllRuns().then(data => {
            setRuns(data as RunRow[]);
            setLoading(false);
        });
    }, []);

    useFocusEffect(refresh);

    const openDetail = async (row: RunRow) => {
        const detail = await getRunDetail(row.run.id);
        if (detail) setSelected({ run: row, requirements: detail.requirements as Requirement[] });
    };

    const toggleReq = async (reqId: string, currentStatus: string) => {
        const next = currentStatus === 'have' ? 'missing' : 'have';
        await updateRequirementStatus(reqId, next as any);
        if (selected) {
            const detail = await getRunDetail(selected.run.run.id);
            if (detail) setSelected({ run: selected.run, requirements: detail.requirements as Requirement[] });
        }
    };

    const addReqToShoppingList = async (req: Requirement) => {
        if (!req.itemName || !selected) return;
        // Find or create global inventory item, then add to shopping list
        await addToShoppingList(req.req.id, req.req.requiredQuantity, req.req.unit, null, selected.run.run.id);
        Alert.alert('Added', `${req.itemName} added to Shopping List`);
    };

    if (loading) return <ActivityIndicator style={styles.center} />;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={runs}
                keyExtractor={item => item.run.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <Text variant="headlineSmall" style={styles.heading}>Active Runs</Text>
                }
                ListEmptyComponent={
                    <Surface style={styles.emptyCard} elevation={1}>
                        <Text variant="bodyLarge" style={{ textAlign: 'center', opacity: 0.6 }}>
                            No runs yet.{'\n'}Browse the Library to get started!
                        </Text>
                    </Surface>
                }
                renderItem={({ item }) => {
                    const startDateDisplay = format(new Date(item.run.startDate), 'MMM d, yyyy');
                    return (
                        <Surface style={styles.runCard} elevation={2}>
                            <List.Item
                                title={item.templateTitle ?? 'Unknown Template'}
                                description={`Started ${startDateDisplay} · ${item.run.status}`}
                                left={props => <List.Icon {...props} icon="sprout" color={theme.colors.primary} />}
                                right={() => (
                                    <Button compact mode="text" onPress={() => openDetail(item)}>
                                        Readiness
                                    </Button>
                                )}
                            />
                        </Surface>
                    );
                }}
            />

            {/* Readiness bottom sheet */}
            <Portal>
                <Modal
                    visible={!!selected}
                    onDismiss={() => setSelected(null)}
                    contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
                >
                    {selected && (
                        <>
                            <Text variant="titleLarge" style={styles.modalTitle}>
                                {selected.run.templateTitle} — Readiness
                            </Text>
                            {selected.requirements.map(req => {
                                const ok = req.req.status === 'have' || req.req.status === 'bought';
                                return (
                                    <View key={req.req.id} style={styles.reqRow}>
                                        <List.Icon
                                            icon={ok ? 'check-circle' : 'alert-circle-outline'}
                                            color={ok ? theme.colors.primary : theme.colors.error}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text variant="bodyMedium">{req.itemName}</Text>
                                            <Text variant="bodySmall" style={{ opacity: 0.5 }}>
                                                {req.req.requirementType} · {req.req.requiredQuantity ?? ''} {req.req.unit ?? ''}
                                            </Text>
                                        </View>
                                        <Button
                                            compact
                                            mode={ok ? 'outlined' : 'contained'}
                                            onPress={() => toggleReq(req.req.id, req.req.status)}
                                        >
                                            {ok ? 'Have ✓' : 'Mark Have'}
                                        </Button>
                                        {!ok && (
                                            <Button compact icon="cart" onPress={() => addReqToShoppingList(req)}>
                                                Shop
                                            </Button>
                                        )}
                                    </View>
                                );
                            })}
                            <Divider style={{ marginVertical: 12 }} />
                            <Chip
                                icon={isRunReady(selected.requirements.map(r => r.req)) ? 'check' : 'close'}
                                style={{
                                    backgroundColor: isRunReady(selected.requirements.map(r => r.req))
                                        ? '#C8E6C9'
                                        : '#FFCDD2',
                                    alignSelf: 'flex-start',
                                }}
                            >
                                {isRunReady(selected.requirements.map(r => r.req)) ? 'Ready to Start' : 'Prerequisites Missing'}
                            </Chip>
                        </>
                    )}
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    list: { padding: 16, paddingBottom: 100, gap: 10 },
    heading: { fontWeight: '700', marginBottom: 8 },
    runCard: { borderRadius: 12, overflow: 'hidden' },
    emptyCard: { borderRadius: 12, padding: 32 },
    modal: { margin: 16, borderRadius: 16, padding: 20, maxHeight: '80%' },
    modalTitle: { fontWeight: '700', marginBottom: 16 },
    reqRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 4 },
});
