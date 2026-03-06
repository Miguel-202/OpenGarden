import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState } from 'react';
import migrations from '@/db/drizzle/migrations';
import { db, expoDb } from '@/db';
import { seedDatabase } from '@/core/seed';
import { PaperProvider, Text } from 'react-native-paper';
import RootNavigator from '@/navigation/RootNavigator';
import { configureNotifications, scheduleRollingNotifications } from '@/services/notificationsService';
import '@/i18n';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useAppTheme } from '@/theme/ThemeContext';

// Register notification handler before the first render
configureNotifications();

function ensureSchemaColumns() {
  const allTargets = ['templates', 'template_tools', 'template_consumables', 'template_tasks', 'inventory_items'];
  for (const table of allTargets) {
    try { expoDb.execSync(`ALTER TABLE ${table} ADD COLUMN image_uri text`); } catch { }
    try { expoDb.execSync(`ALTER TABLE ${table} ADD COLUMN emoji text`); } catch { }
  }
  try { expoDb.execSync(`ALTER TABLE runs ADD COLUMN custom_name text NOT NULL DEFAULT ''`); } catch { }
  try { expoDb.execSync(`ALTER TABLE runs ADD COLUMN is_started integer NOT NULL DEFAULT 0`); } catch { }
}

function MainApp() {
  const { success, error } = useMigrations(db, migrations);
  const [isSeeded, setIsSeeded] = useState(false);
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  useEffect(() => {
    if (success) {
      ensureSchemaColumns();
      seedDatabase()
        .then(() => setIsSeeded(true))
        .then(() => scheduleRollingNotifications())
        .catch(console.error);
    }
  }, [success]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{t('common.migrationError', { message: error.message })}</Text>
      </View>
    );
  }

  if (!success || !isSeeded) {
    return (
      <View style={styles.container}>
        <Text>{t('common.loading')}</Text>
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

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
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

