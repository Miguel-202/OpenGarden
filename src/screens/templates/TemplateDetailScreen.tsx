import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

export default function TemplateDetailScreen() {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Template Detail</Text>
            <Text variant="bodyMedium">Prerequisites, Steps, Requirements</Text>
            <Button mode="contained" style={{ marginTop: 20 }}>
                Start Run
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 }
});
