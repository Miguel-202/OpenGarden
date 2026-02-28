import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';

export default function LibraryScreen({ navigation }: any) {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Template Library</Text>
            <Text variant="bodyLarge">Discover new plants to grow.</Text>
            {/* Placeholder list */}
            <Button mode="contained" onPress={() => navigation.navigate('TemplateDetail')} style={{ marginTop: 20 }}>
                View Details
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 }
});
