import { supabase } from './supabaseClient';

export interface Invite {
    id: string;
    email: string;
    code: string;
    global_role: 'MEMBER' | 'LEADER' | 'PASTOR';
    ministries_default: string[] | null;
    created_by: string;
    expires_at: string;
    used_at: string | null;
    created_at: string;
}

export interface CreateInviteData {
    email: string;
    global_role: 'MEMBER' | 'LEADER';
    ministries_default?: string[];
    validity_days: number;
}

/**
 * Generate a random 6-character alphanumeric code
 */
export function generateInviteCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like I, O, 0, 1
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

/**
 * Create a new invite
 */
export async function createInvite(data: CreateInviteData, userId: string): Promise<Invite> {
    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.validity_days);

    const { data: invite, error } = await supabase
        .from('invites')
        .insert({
            email: data.email.toLowerCase().trim(),
            code,
            global_role: data.global_role,
            ministries_default: data.ministries_default && data.ministries_default.length > 0
                ? data.ministries_default
                : null,
            created_by: userId,
            expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating invite:', error);
        throw new Error(error.message);
    }

    return invite;
}

/**
 * List all invites created by the current user (PASTOR)
 */
export async function listInvites(): Promise<Invite[]> {
    const { data, error } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error listing invites:', error);
        throw new Error(error.message);
    }

    return data || [];
}

/**
 * Delete an unused invite
 */
export async function deleteInvite(inviteId: string): Promise<void> {
    const { error } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId);

    if (error) {
        console.error('Error deleting invite:', error);
        throw new Error(error.message);
    }
}

/**
 * Get invite status based on dates
 */
export function getInviteStatus(invite: Invite): 'active' | 'used' | 'expired' {
    if (invite.used_at) {
        return 'used';
    }

    const now = new Date();
    const expiresAt = new Date(invite.expires_at);

    if (now > expiresAt) {
        return 'expired';
    }

    return 'active';
}

/**
 * Format remaining time until expiration
 */
export function getTimeUntilExpiration(expiresAt: string): string {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) {
        return 'Expirado';
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
        return `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }

    return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
}
