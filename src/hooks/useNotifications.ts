import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import {
    registerForPushNotificationsAsync,
    saveTokenToDatabase,
    removeTokenFromDatabase,
} from '../services/notificationService';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface NotificationData {
    type?: 'message' | 'announcement' | 'event';
    ministryId?: string;
    ministryName?: string;
    messageId?: string;
    eventId?: string;
    announcementId?: string;
}

interface UseNotificationsResult {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
    registerToken: (userId: string) => Promise<void>;
    unregisterToken: (userId: string) => Promise<void>;
}

/**
 * Hook to manage push notifications
 * Handles token registration, notification listeners, and navigation
 */
export function useNotifications(): UseNotificationsResult {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);

    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        // Listener for notifications received while app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            setNotification(notification);
            console.log('Notification received:', notification);
        });

        // Listener for when user taps on notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data as NotificationData;
            handleNotificationTap(data);
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    /**
     * Handle navigation when user taps on notification
     */
    const handleNotificationTap = (data: NotificationData) => {
        if (!data.type) return;

        switch (data.type) {
            case 'message':
                if (data.ministryId && data.ministryName) {
                    navigation.navigate('MinistryChannel', {
                        ministryId: data.ministryId,
                        ministryName: data.ministryName,
                    });
                }
                break;

            case 'announcement':
                navigation.navigate('Announcements');
                break;

            case 'event':
                // Navigate to events tab - for now just go to main tabs
                navigation.navigate('MainTabs');
                break;

            default:
                console.log('Unknown notification type:', data.type);
        }
    };

    /**
     * Register push token for a user
     * Call this after successful login
     */
    const registerToken = async (userId: string): Promise<void> => {
        try {
            const token = await registerForPushNotificationsAsync();

            if (token) {
                setExpoPushToken(token);
                await saveTokenToDatabase(userId, token);
                console.log('Push token registered:', token);
            }
        } catch (error) {
            console.error('Error registering push token:', error);
        }
    };

    /**
     * Unregister push token for a user
     * Call this before logout
     */
    const unregisterToken = async (userId: string): Promise<void> => {
        try {
            if (expoPushToken) {
                await removeTokenFromDatabase(userId, expoPushToken);
                setExpoPushToken(null);
                console.log('Push token unregistered');
            }
        } catch (error) {
            console.error('Error unregistering push token:', error);
        }
    };

    return {
        expoPushToken,
        notification,
        registerToken,
        unregisterToken,
    };
}
