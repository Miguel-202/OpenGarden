import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, DataTable } from 'react-native-paper';

export default function InventoryScreen() {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Inventory</Text>
            <Text variant="bodyMedium">Tools & Consumables you own.</Text>
            <DataTable style={{ marginTop: 10 }}>
                <DataTable.Header>
                    <DataTable.Title>Item</DataTable.Title>
                    <DataTable.Title>Category</DataTable.Title>
                </DataTable.Header>
            </DataTable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 }
});
