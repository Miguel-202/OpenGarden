import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Sprout, Library, Backpack } from 'lucide-react-native';
import { IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '@/i18n';

import LibraryScreen from '@/screens/templates/LibraryScreen';
import TemplateDetailScreen from '@/screens/templates/TemplateDetailScreen';
import AddTemplateScreen from '@/screens/templates/AddTemplateScreen';
import ManualCreateScreen from '@/screens/templates/ManualCreateScreen';
import AIImportScreen from '@/screens/templates/AIImportScreen';
import InventoryScreen from '@/screens/inventory/InventoryScreen';
import ShoppingListScreen from '@/screens/inventory/ShoppingListScreen';
import TodayScreen from '@/screens/runs/TodayScreen';
import ProjectsScreen from '@/screens/runs/ProjectsScreen';

const Tab = createBottomTabNavigator();
const LibraryStack = createNativeStackNavigator();
const InventoryStack = createNativeStackNavigator();

function LibraryNavigator() {
    const { t } = useTranslation();
    return (
        <LibraryStack.Navigator>
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
    return (
        <InventoryStack.Navigator>
            <InventoryStack.Screen name="InventoryRoot" component={InventoryScreen} options={{ title: t('nav.inventory') }} />
            <InventoryStack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: t('nav.shoppingList') }} />
        </InventoryStack.Navigator>
    );
}

function TabNavigator() {
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        setLanguage(i18n.language === 'es' ? 'en' : 'es');
    };

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#2E7D32',
            }}
        >
            <Tab.Screen
                name="Today"
                component={TodayScreen}
                options={{
                    headerShown: true,
                    tabBarLabel: t('tabs.today'),
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                    headerRight: () => (
                        <IconButton
                            icon="translate"
                            size={22}
                            onPress={toggleLanguage}
                        />
                    ),
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
        </Tab.Navigator>
    );
}

export default function RootNavigator() {
    return (
        <NavigationContainer>
            <TabNavigator />
        </NavigationContainer>
    );
}
