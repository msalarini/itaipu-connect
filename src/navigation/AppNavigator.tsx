import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { MinistriesListScreen } from '../screens/ministries/MinistriesListScreen';
import { EventsScreen } from '../screens/events/EventsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors } from '../theme';

export type AppTabParamList = {
    Home: undefined;
    Ministries: undefined;
    Events: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppNavigator: React.FC = () => {
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
                options={{
                    title: 'Início',
                }}
            />
            <Tab.Screen
                name="Ministries"
                component={MinistriesListScreen}
                options={{
                    title: 'Ministérios',
                }}
            />
            <Tab.Screen
                name="Events"
                component={EventsScreen}
                options={{
                    title: 'Eventos',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Perfil',
                }}
            />
        </Tab.Navigator>
    );
};
