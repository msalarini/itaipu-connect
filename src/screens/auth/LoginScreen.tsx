import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, AppButton, AppInput } from '../../components';
import { spacing, typography } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabaseClient';
import { RootStackParamList } from '../../navigation/RootNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'Login'
>;

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                Alert.alert('Erro no Login', error.message);
            }
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro inesperado.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenContainer scrollable>
            <View style={styles.container}>
                <Text style={styles.title}>Itaipu Connect</Text>
                <Text style={styles.subtitle}>Entre com sua conta</Text>

                <View style={styles.form}>
                    <AppInput
                        label="E-mail"
                        placeholder="seu@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <AppInput
                        label="Senha"
                        placeholder="••••••••"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <AppButton
                        title="Entrar"
                        variant="primary"
                        fullWidth
                        style={styles.button}
                        onPress={handleLogin}
                        loading={loading}
                    />

                    <AppButton
                        title="Tenho um código de convite"
                        variant="outline"
                        fullWidth
                        onPress={() => navigation.navigate('InviteRegister')}
                    />
                </View>
            </View>
        </ScreenContainer>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing['2xl'],
        justifyContent: 'center',
    },
    title: {
        fontSize: typography.sizes['4xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.sizes.lg,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing['4xl'],
    },
    form: {
        gap: spacing.md,
    },
    button: {
        marginTop: spacing.md,
    },
});
