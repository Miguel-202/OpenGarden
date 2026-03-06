import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Sprout, Library, Backpack, Settings } from 'lucide-react-native';
import { IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeContext';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LibraryScreen from '@/screens/templates/LibraryScreen';
import TemplateDetailScreen from '@/screens/templates/TemplateDetailScreen';
import AddTemplateScreen from '@/screens/templates/AddTemplateScreen';
import ManualCreateScreen from '@/screens/templates/ManualCreateScreen';
import AIImportScreen from '@/screens/templates/AIImportScreen';
import InventoryScreen from '@/screens/inventory/InventoryScreen';
import ShoppingListScreen from '@/screens/inventory/ShoppingListScreen';
import TodayScreen from '@/screens/runs/TodayScreen';
import ProjectsScreen from '@/screens/runs/ProjectsScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import OnboardingScreen, { ONBOARDING_KEY } from '@/screens/onboarding/OnboardingScreen';
import ProjectDetailScreen from '@/screens/runs/ProjectDetailScreen';

const Tab = createBottomTabNavigator();
const LibraryStack = createNativeStackNavigator();
const InventoryStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function LibraryNavigator() {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    return (
        <LibraryStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.primaryContainer },
                headerTintColor: theme.colors.onPrimaryContainer,
            }}
        >
            <LibraryStack.Screen
                name="LibraryRoot"
                component={LibraryScreen}
                options={({ navigation }) => ({
                    title: t('tabs.library'),
                    headerRight: () => (
                        <IconButton
                            icon="plus"
                            size={24}
                            onPress={() => navigation.navigate('AddTemplate')}
                        />
                    ),
                })}
            />
            <LibraryStack.Screen name="TemplateDetail" component={TemplateDetailScreen} options={{ title: t('nav.growingGuide') }} />
            <LibraryStack.Screen name="AddTemplate" component={AddTemplateScreen} options={{ title: t('nav.addGuide') }} />
            <LibraryStack.Screen name="ManualCreate" component={ManualCreateScreen} options={{ title: t('nav.createGuide') }} />
            <LibraryStack.Screen name="AIImport" component={AIImportScreen} options={{ title: t('nav.importWithAI') }} />
        </LibraryStack.Navigator>
    );
}

function InventoryNavigator() {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    return (
        <InventoryStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.primaryContainer },
                headerTintColor: theme.colors.onPrimaryContainer,
            }}
        >
            <InventoryStack.Screen name="InventoryRoot" component={InventoryScreen} options={{ title: t('nav.inventory') }} />
            <InventoryStack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: t('nav.shoppingList') }} />
        </InventoryStack.Navigator>
    );
}

function TabNavigator() {
    const { t, i18n } = useTranslation();
    const { theme } = useAppTheme();

    const toggleLanguage = () => {
        setLanguage(i18n.language === 'es' ? 'en' : 'es');
    };

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                tabBarStyle: { backgroundColor: theme.colors.primaryContainer },
                headerStyle: { backgroundColor: theme.colors.primaryContainer },
                headerTintColor: theme.colors.onPrimaryContainer,
            }}
        >
            <Tab.Screen
                name="Today"
                component={TodayScreen}
                options={{
                    headerShown: true,
                    tabBarLabel: t('tabs.today'),
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Projects"
                component={ProjectsScreen}
                options={{
                    headerShown: true,
                    tabBarLabel: t('tabs.projects'),
                    tabBarIcon: ({ color, size }) => <Sprout color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Library"
                component={LibraryNavigator}
                options={{
                    tabBarLabel: t('tabs.library'),
                    tabBarIcon: ({ color, size }) => <Library color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Inventory"
                component={InventoryNavigator}
                options={{
                    tabBarLabel: t('tabs.inventory'),
                    tabBarIcon: ({ color, size }) => <Backpack color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    headerShown: true,
                    tabBarLabel: t('tabs.settings'),
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function RootNavigator() {
    const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

    useEffect(() => {
        AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
            setShowOnboarding(val !== 'true');
        }).catch(() => setShowOnboarding(true));
    }, []);

    if (showOnboarding === null) return null; // still loading

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {showOnboarding ? (
                    <RootStack.Screen name="Onboarding">
                        {() => <OnboardingScreen onComplete={() => setShowOnboarding(false)} />}
                    </RootStack.Screen>
                ) : (
                    <RootStack.Screen name="MainTabs" component={TabNavigator} />
                )}
                <RootStack.Screen
                    name="ProjectDetail"
                    component={ProjectDetailScreen}
                    options={{
                        headerShown: true,
                        title: '',
                        headerStyle: { backgroundColor: '#F6F6F6' },
                    }}
                />
            </RootStack.Navigator>
        </NavigationContainer>
    );
}
