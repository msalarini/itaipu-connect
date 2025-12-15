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

/**
 * Send a push notification to a specific token
 */
export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        // data: { someData: 'goes here' },
    };

    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

/**
 * Send a broadcast notification to ALL users
 * Note: In production, this should be done via Edge Functions
 */
export async function sendBroadcastNotification(title: string, body: string) {
    try {
        // 1. Fetch all tokens with related profile preferences
        const { data: tokens, error } = await supabase
            .from('push_tokens')
            .select(`
                expo_push_token,
                profiles (
                    preferences
                )
            `);

        if (error) {
            console.error('Error fetching push tokens:', error);
            throw error;
        }

        if (!tokens || tokens.length === 0) {
            console.log('No tokens found to send notification');
            return;
        }

        // 2. Filter valid tokens and respect user preferences
        const uniqueTokens = [...new Set(
            tokens
                .filter((t: any) => {
                    // Check preferences (default to true if missing)
                    const prefs = t.profiles?.preferences;
                    if (!prefs) return true;
                    return prefs.push_notifications !== false;
                })
                .map((t: any) => t.expo_push_token)
        )];

        const validTokens = uniqueTokens.filter(t => t && t.length > 0);

        if (validTokens.length === 0) {
            console.log('No valid tokens found');
            return;
        }

        console.log(`Sending broadcast to ${validTokens.length} devices...`);

        // 3. Batch send (Expo recommends checking documentation for batch sizes)
        // For MVP, simple loop or small batches is fine via HTTP
        const messages = validTokens.map(token => ({
            to: token,
            sound: 'default',
            title: title,
            body: body,
        }));

        // Send in batches of 100
        const CHUNK_SIZE = 100;
        for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
            const batch = messages.slice(i, i + CHUNK_SIZE);
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(batch),
            });
        }

    } catch (error) {
        console.error('Error in broadcast:', error);
        throw error;
    }
}
