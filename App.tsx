import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState } from 'react';
import migrations from '@/db/drizzle/migrations';
import { db } from '@/db';
import { seedDatabase } from '@/core/seed';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text } from 'react-native-paper';
import RootNavigator from '@/navigation/RootNavigator';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E7D32', // Leafy green
    secondary: '#81C784',
  },
};

export default function App() {
  const { success, error } = useMigrations(db, migrations);
  const [isSeeded, setIsSeeded] = useState(false);

  useEffect(() => {
    if (success) {
      seedDatabase().then(() => setIsSeeded(true)).catch(console.error);
    }
  }, [success]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success || !isSeeded) {
    return (
      <View style={styles.container}>
        <Text>Loading local database and templates...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <RootNavigator />
      <StatusBar style="auto" />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
