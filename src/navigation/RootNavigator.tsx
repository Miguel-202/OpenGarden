import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Sprout, Library, Backpack } from 'lucide-react-native';

// Placeholder screen imports
import LibraryScreen from '@/screens/templates/LibraryScreen';
import TemplateDetailScreen from '@/screens/templates/TemplateDetailScreen';
import InventoryScreen from '@/screens/inventory/InventoryScreen';
import TodayScreen from '@/screens/runs/TodayScreen';
import ProjectsScreen from '@/screens/runs/ProjectsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: true,
                tabBarActiveTintColor: '#2E7D32',
            }}
        >
            <Tab.Screen
                name="Today"
                component={TodayScreen}
                options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Projects"
                component={ProjectsScreen}
                options={{ tabBarIcon: ({ color, size }) => <Sprout color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Library"
                component={LibraryScreen}
                options={{ tabBarIcon: ({ color, size }) => <Library color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Inventory"
                component={InventoryScreen}
                options={{ tabBarIcon: ({ color, size }) => <Backpack color={color} size={size} /> }}
            />
        </Tab.Navigator>
    );
}

export default function RootNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen name="TemplateDetail" component={TemplateDetailScreen} options={{ headerShown: true, title: 'Template' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
