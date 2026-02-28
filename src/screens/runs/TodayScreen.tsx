import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function TodayScreen() {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Today's Tasks</Text>
            <Text variant="bodyLarge">Your active runs will appear here.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 }
});
