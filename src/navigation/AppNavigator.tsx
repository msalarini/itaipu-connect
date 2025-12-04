import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home/HomeScreen';
import { MinistriesListScreen } from '../screens/ministries/MinistriesListScreen';
import { EventsScreen } from '../screens/events/EventsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MinistryChannelScreen } from '../screens/ministries/MinistryChannelScreen';
import { ThreadScreen } from '../screens/ministries/ThreadScreen';
import { colors } from '../theme';

// Tipos para as Tabs
export type MainTabParamList = {
    Home: undefined;
    Ministries: undefined;
    Events: undefined;
    Profile: undefined;
};

// Tipos para a Stack Principal do App
export type AppStackParamList = {
    MainTabs: undefined;
    MinistryChannel: { ministryId: string; ministryName: string };
    Thread: { rootMessageId: string; ministryId: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const MainTabs: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.backgroundCard,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Início' }}
            />
            <Tab.Screen
                name="Ministries"
                component={MinistriesListScreen}
                options={{ title: 'Ministérios' }}
            />
            <Tab.Screen
                name="Events"
                component={EventsScreen}
                options={{ title: 'Eventos' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Perfil' }}
            />
        </Tab.Navigator>
    );
};

export const AppNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
                name="MinistryChannel"
                component={MinistryChannelScreen}
                options={({ route }) => ({
                    headerShown: true,
                    title: route.params.ministryName,
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text
                })}
            />
            <Stack.Screen
                name="Thread"
                component={ThreadScreen}
                options={{
                    headerShown: true,
                    title: 'Thread',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text
                }}
            />
        </Stack.Navigator>
    );
};
