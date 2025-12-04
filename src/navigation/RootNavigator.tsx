import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { InviteRegisterScreen } from '../screens/auth/InviteRegisterScreen';
import { AppNavigator } from './AppNavigator';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export type RootStackParamList = {
    Login: undefined;
    InviteRegister: undefined;
    App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {!session ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen
                            name="InviteRegister"
                            component={InviteRegisterScreen}
                        />
                    </>
                ) : (
                    <Stack.Screen name="App" component={AppNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
