import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { InviteRegisterScreen } from '../screens/auth/InviteRegisterScreen';
import { AppNavigator } from './AppNavigator';

export type RootStackParamList = {
    Login: undefined;
    InviteRegister: undefined;
    App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
    // TODO: Implementar lógica de autenticação (Context API)
    const isAuthenticated = false;

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {!isAuthenticated ? (
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
