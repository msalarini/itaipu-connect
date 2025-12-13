import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, AppButton, AppInput } from '../../components';
import { spacing, typography } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabaseClient';
import { RootStackParamList } from '../../navigation/RootNavigator';

type InviteRegisterScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'InviteRegister'
>;

export const InviteRegisterScreen: React.FC = () => {
    const navigation = useNavigation<InviteRegisterScreenNavigationProp>();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !code || !password || !confirmPassword || !name) {
            Alert.alert('Erro', 'Preencha todos os campos.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem.');
            return;
        }

        setLoading(true);

        try {
            // 1. Validar código de convite via RPC
            const { data: inviteData, error: inviteError } = await supabase.rpc(
                'check_invite_code',
                { invite_code: code }
            );

            if (inviteError || !inviteData) {
                Alert.alert('Erro', 'Código de convite inválido ou expirado.');
                setLoading(false);
                return;
            }

            // 2. Criar usuário no Auth (com metadados para o trigger)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        global_role: inviteData.global_role,
                    },
                },
            });

            if (authError || !authData.user) {
                Alert.alert('Erro ao criar conta', authError?.message);
                setLoading(false);
                return;
            }

            const userId = authData.user.id;

            // 3. Aguardar um pouco para o trigger criar o perfil
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 4. Verificar se o perfil foi criado (pelo trigger)
            const { data: profileData, error: profileCheckError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            // Se o trigger não criou, criar manualmente (fallback)
            if (profileCheckError || !profileData) {
                const { error: profileError } = await supabase.from('profiles').insert({
                    id: userId,
                    email,
                    name,
                    global_role: inviteData.global_role,
                });

                if (profileError) {
                    console.error('Profile Error:', profileError);
                    // Continuar mesmo com erro, pois o usuário Auth foi criado
                }
            }


            // 4. Adicionar aos ministérios padrão (se houver)
            if (inviteData.ministries_default && inviteData.ministries_default.length > 0) {
                const memberships = inviteData.ministries_default.map((ministryId: string) => ({
                    ministry_id: ministryId,
                    user_id: userId,
                    ministry_role: 'MEMBER',
                }));

                const { error: memberError } = await supabase
                    .from('ministry_members')
                    .insert(memberships);

                if (memberError) {
                    console.error('Membership Error:', memberError);
                }
            }

            // 5. Marcar convite como usado
            await supabase.rpc('mark_invite_used', { invite_code: code });

            Alert.alert('Sucesso', 'Conta criada com sucesso! Faça login.');
            navigation.goBack();
        } catch (error) {
            console.error('Unexpected Error:', error);
            Alert.alert('Erro', 'Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenContainer scrollable>
            <View style={styles.container}>
                <Text style={styles.title}>Cadastro por Convite</Text>
                <Text style={styles.subtitle}>
                    Insira seu código de convite para criar sua conta
                </Text>

                <View style={styles.form}>
                    <AppInput
                        label="Nome Completo"
                        placeholder="Seu Nome"
                        value={name}
                        onChangeText={setName}
                    />
                    <AppInput
                        label="E-mail"
                        placeholder="seu@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <AppInput
                        label="Código de Convite"
                        placeholder="XXXXXX"
                        autoCapitalize="characters"
                        value={code}
                        onChangeText={setCode}
                    />
                    <AppInput
                        label="Senha"
                        placeholder="••••••••"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <AppInput
                        label="Confirmar Senha"
                        placeholder="••••••••"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />

                    <AppButton
                        title="Criar Conta"
                        variant="primary"
                        fullWidth
                        style={styles.button}
                        onPress={handleRegister}
                        loading={loading}
                    />

                    <AppButton
                        title="Voltar ao Login"
                        variant="outline"
                        fullWidth
                        onPress={() => navigation.goBack()}
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
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing['3xl'],
    },
    form: {
        gap: spacing.md,
    },
    button: {
        marginTop: spacing.md,
    },
});
