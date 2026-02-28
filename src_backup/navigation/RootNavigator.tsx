import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Sprout, Library, Backpack } from 'lucide-react-native';

import LibraryScreen from '@/screens/templates/LibraryScreen';
import TemplateDetailScreen from '@/screens/templates/TemplateDetailScreen';
import InventoryScreen from '@/screens/inventory/InventoryScreen';
import ShoppingListScreen from '@/screens/inventory/ShoppingListScreen';
import TodayScreen from '@/screens/runs/TodayScreen';
import ProjectsScreen from '@/screens/runs/ProjectsScreen';

const Tab = createBottomTabNavigator();
const LibraryStack = createNativeStackNavigator();
const InventoryStack = createNativeStackNavigator();

function LibraryNavigator() {
    return (
        <LibraryStack.Navigator>
            <LibraryStack.Screen name="LibraryRoot" component={LibraryScreen} options={{ title: 'Library' }} />
            <LibraryStack.Screen name="TemplateDetail" component={TemplateDetailScreen} options={{ title: 'Growing Guide' }} />
        </LibraryStack.Navigator>
    );
}

function InventoryNavigator() {
    return (
        <InventoryStack.Navigator>
            <InventoryStack.Screen name="InventoryRoot" component={InventoryScreen} options={{ title: 'Inventory' }} />
            <InventoryStack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: 'Shopping List' }} />
        </InventoryStack.Navigator>
    );
}

function TabNavigator() {
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
                options={{ headerShown: true, tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Projects"
                component={ProjectsScreen}
                options={{ headerShown: true, tabBarIcon: ({ color, size }) => <Sprout color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Library"
                component={LibraryNavigator}
                options={{ tabBarIcon: ({ color, size }) => <Library color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Inventory"
                component={InventoryNavigator}
                options={{ tabBarIcon: ({ color, size }) => <Backpack color={color} size={size} /> }}
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
