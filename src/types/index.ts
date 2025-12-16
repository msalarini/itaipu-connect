export type GlobalRole = 'MEMBER' | 'LEADER' | 'PASTOR';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    phone?: string;
    bio?: string;
    avatar_url?: string;
    global_role: GlobalRole;
    role?: string;
    leader_ministry_id?: string;
    ministry_coordinator_id?: string;
    preferences?: {
        push_notifications?: boolean;
    };
    created_at?: string;
    updated_at?: string;
}

export interface Ministry {
    id: string;
    name: string;
    description: string;
    created_by?: string;
    created_at?: string;
}

export interface MinistryMember {
    id: string;
    ministry_id: string;
    user_id: string;
    ministry_role: 'MEMBER' | 'LEADER';
    profile?: UserProfile;
    joined_at?: string;
}

export interface MessageAttachment {
    id: string;
    file_url: string;
    file_type: string;
    file_name: string;
    file_size?: number;
    message_id?: string;
}

export interface MessageReaction {
    id?: string;
    emoji: string;
    user_id: string;
    created_at?: string;
}

export interface Message {
    id: string;
    content: string;
    created_at: string;
    author_id: string;
    ministry_id?: string;
    parent_message_id?: string | null;
    author?: {
        name: string;
        avatar_url?: string;
    };
    attachments?: MessageAttachment[];
    reactions?: MessageReaction[];
    reply_count?: number;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    location: string;
    event_date: string;
    ministry_id?: string | null;
    created_by?: string;
    ministry?: {
        name: string;
    };
}

export interface EventRSVP {
    id: string;
    event_id: string;
    user_id: string;
    status: 'CONFIRMED' | 'DECLINED';
    profile?: {
        name: string;
        avatar_url?: string;
    };
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    author_id: string;
    ministry_id?: string | null;
    is_global: boolean;
    created_at: string;
    author?: {
        name: string;
    };
    ministry?: {
        name: string;
    };
}

export interface Invite {
    id: string;
    email: string;
    code: string;
    global_role: GlobalRole;
    ministries_default?: string[] | null; // IDs
    created_by?: string;
    expires_at: string;
    used_at?: string | null;
    created_at: string;
}
