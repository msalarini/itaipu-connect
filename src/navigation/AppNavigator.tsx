import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home/HomeScreen';
import { MinistriesListScreen } from '../screens/ministries/MinistriesListScreen';
import { EventsScreen } from '../screens/events/EventsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MinistryChannelScreen } from '../screens/ministries/MinistryChannelScreen';
import { ThreadScreen } from '../screens/ministries/ThreadScreen';
import { CreateEventScreen } from '../screens/events/CreateEventScreen';
import { AnnouncementsScreen } from '../screens/announcements/AnnouncementsScreen';
import { CreateAnnouncementScreen } from '../screens/announcements/CreateAnnouncementScreen';
import { MinistryMembersScreen } from '../screens/ministries/MinistryMembersScreen';
import { InvitesScreen } from '../screens/invites/InvitesScreen';
import { CreateInviteScreen } from '../screens/invites/CreateInviteScreen';
import { CreateMinistryScreen } from '../screens/ministries/CreateMinistryScreen';
import { EditMinistryScreen } from '../screens/ministries/EditMinistryScreen';
import { AddMemberScreen } from '../screens/ministries/AddMemberScreen';
import { EventDetailsScreen } from '../screens/events/EventDetailsScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
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
    MinistryMembers: { ministryId: string; ministryName: string };
    Thread: { rootMessageId: string; ministryId: string };
    CreateEvent: undefined;
    Announcements: undefined;
    CreateAnnouncement: undefined;
    Invites: undefined;
    CreateInvite: undefined;
    CreateMinistry: undefined;
    EditMinistry: { ministryId: string };
    AddMember: { ministryId: string; ministryName: string };
    EventDetails: { event: any };
    EditProfile: undefined;
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
                options={({ route, navigation }) => ({
                    headerShown: true,
                    title: route.params.ministryName,
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('MinistryMembers', {
                                ministryId: route.params.ministryId,
                                ministryName: route.params.ministryName
                            })}
                            style={{ padding: 8 }}
                        >
                            <Text style={{ fontSize: 20 }}>ℹ️</Text>
                        </TouchableOpacity>
                    ),
                })}
            />
            <Stack.Screen
                name="MinistryMembers"
                component={MinistryMembersScreen}
                options={{
                    headerShown: true,
                    title: 'Membros',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text
                }}
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
            <Stack.Screen
                name="CreateEvent"
                component={CreateEventScreen}
                options={{
                    headerShown: true,
                    title: 'Novo Evento',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text
                }}
            />
            <Stack.Screen
                name="Announcements"
                component={AnnouncementsScreen}
                options={{
                    headerShown: true,
                    title: 'Avisos',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text
                }}
            />
            <Stack.Screen
                name="CreateAnnouncement"
                component={CreateAnnouncementScreen}
                options={{
                    headerShown: true,
                    title: 'Novo Aviso',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text
                }}
            />
            <Stack.Screen
                name="Invites"
                component={InvitesScreen}
                options={{
                    headerShown: true,
                    title: 'Gerenciar Convites',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text
                }}
            />
            <Stack.Screen
                name="CreateInvite"
                component={CreateInviteScreen}
                options={{
                    headerShown: true,
                    title: 'Novo Convite',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text
                }}
            />
            <Stack.Screen
                name="CreateMinistry"
                component={CreateMinistryScreen}
                options={{
                    headerShown: true,
                    title: 'Novo Ministério',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text
                }}
            />
            <Stack.Screen
                name="EditMinistry"
                component={EditMinistryScreen}
                options={{
                    headerShown: true,
                    title: 'Editar Ministério',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text
                }}
            />
            <Stack.Screen
                name="AddMember"
                component={AddMemberScreen}
                options={{
                    headerShown: true,
                    title: 'Adicionar Membro',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text
                }}
            />
            <Stack.Screen
                name="EventDetails"
                component={EventDetailsScreen}
                options={{
                    headerShown: true,
                    title: 'Detalhes do Evento',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text,
                }}
            />
            <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{
                    headerShown: true,
                    title: 'Editar Perfil',
                    headerStyle: { backgroundColor: colors.backgroundCard },
                    headerTintColor: colors.text,
                }}
            />
        </Stack.Navigator>
    );
};
