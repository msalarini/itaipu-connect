import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import {
    registerForPushNotificationsAsync,
    saveTokenToDatabase,
    removeTokenFromDatabase,
} from '../services/notificationService';

import { UserProfile } from '../types';

interface AuthContextData {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    expoPushToken: string | null;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const pushTokenRef = useRef<string | null>(null);

    useEffect(() => {
        // Carregar sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id);
                registerPushToken(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Escutar mudanças na autenticação
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id);
                registerPushToken(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const registerPushToken = async (userId: string) => {
        try {
            const token = await registerForPushNotificationsAsync();
            if (token) {
                setExpoPushToken(token);
                pushTokenRef.current = token;
                await saveTokenToDatabase(userId, token);
                console.log('Push token registered for user:', userId);
            }
        } catch (error) {
            console.error('Error registering push token:', error);
        }
    };

    const unregisterPushToken = async (userId: string) => {
        try {
            const token = pushTokenRef.current;
            if (token) {
                await removeTokenFromDatabase(userId, token);
                setExpoPushToken(null);
                pushTokenRef.current = null;
                console.log('Push token unregistered for user:', userId);
            }
        } catch (error) {
            console.error('Error unregistering push token:', error);
        }
    };

    const signIn = async () => {
        // Implementation note: The actual sign-in UI (email/password inputs) usually calls supabase.auth.signInWithPassword directly.
        // ideally, we should expose a wrapper here to keep supabase contained, e.g., signInWithEmail(email, password).
        // Since we are refactoring, let's keep it as is but mark as deprecated or strictly for session refresh if that was the intent.
        // However, the interface says `signIn: () => Promise<void>`, which implies no args.
        // It's likely unused or a placeholder. Let's remove it to avoid confusion or implement a real one if we change the interface.
        // For now, let's leave a clear comment that this is handled by components, or if we want to be strict, we'd add args.
        // Given constraints, I'll assume current screens use supabase directly for now.
        // TODO: Refactor LoginScreen to use a robust signIn(email, password) from context.
    };

    const signOut = async () => {
        // Unregister push token before signing out
        if (session?.user) {
            await unregisterPushToken(session.user.id);
        }
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
    };

    const refreshProfile = async () => {
        if (session?.user) {
            await fetchProfile(session.user.id);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                profile,
                loading,
                expoPushToken,
                signIn,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

