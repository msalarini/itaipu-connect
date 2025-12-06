import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface PushNotificationState {
    token: string | null;
    notification: Notifications.Notification | null;
}

/**
 * Request permission and get Expo Push Token
 * @returns Expo Push Token string or null if failed
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
    }

    // Get project ID from Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
        console.log('Project ID not found. Make sure to configure EAS.');
        // For development, try without projectId
        try {
            const tokenData = await Notifications.getExpoPushTokenAsync();
            return tokenData.data;
        } catch (error) {
            console.error('Error getting push token:', error);
            return null;
        }
    }

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        return tokenData.data;
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
}

/**
 * Save push token to Supabase database
 * @param userId - User ID from auth
 * @param token - Expo Push Token
 */
export async function saveTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
        // Upsert to handle existing token
        const { error } = await supabase
            .from('push_tokens')
            .upsert(
                {
                    user_id: userId,
                    expo_push_token: token,
                    platform: Platform.OS,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id,expo_push_token',
                }
            );

        if (error) {
            console.error('Error saving push token:', error);
            throw error;
        }

        console.log('Push token saved successfully');
    } catch (error) {
        console.error('Error in saveTokenToDatabase:', error);
        throw error;
    }
}

/**
 * Remove push token from database (on logout)
 * @param userId - User ID from auth
 * @param token - Expo Push Token to remove
 */
export async function removeTokenFromDatabase(userId: string, token: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('push_tokens')
            .delete()
            .eq('user_id', userId)
            .eq('expo_push_token', token);

        if (error) {
            console.error('Error removing push token:', error);
            throw error;
        }

        console.log('Push token removed successfully');
    } catch (error) {
        console.error('Error in removeTokenFromDatabase:', error);
        // Don't throw on logout - not critical
    }
}

/**
 * Schedule a local notification (for testing or local alerts)
 * @param title - Notification title
 * @param body - Notification body
 * @param seconds - Delay in seconds (default: 1)
 */
export async function scheduleLocalNotification(
    title: string,
    body: string,
    seconds: number = 1
): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
        },
        trigger: {
            seconds,
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
    });

    return id;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 * @param count - Badge number to display
 */
export async function setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
}

// Configure Android notification channel
if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1', // Primary color
    });
}
