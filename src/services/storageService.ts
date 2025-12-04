import { supabase } from './supabaseClient';
import * as FileSystem from 'expo-file-system';

export interface UploadResult {
    url: string;
    path: string;
    type: 'image' | 'document';
    filename: string;
}

export interface AttachmentFile {
    uri: string;
    type: string;
    name: string;
}

/**
 * Faz upload de um anexo para o Supabase Storage
 * @param file - Arquivo a ser enviado
 * @param messageId - ID da mensagem associada
 * @param ministryId - ID do ministério
 * @returns Resultado do upload com URL pública
 */
export async function uploadAttachment(
    file: AttachmentFile,
    messageId: string,
    ministryId: string
): Promise<UploadResult> {
    try {
        // Determinar tipo do arquivo
        const fileType = file.type.startsWith('image/') ? 'image' : 'document';

        // Criar path no formato: ministry_id/message_id/filename
        const filename = file.name || `file-${Date.now()}${getExtension(file.type)}`;
        const storagePath = `${ministryId}/${messageId}/${filename}`;

        // Ler o arquivo como ArrayBuffer
        const fileData = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Converter base64 para blob
        const blob = base64ToBlob(fileData, file.type);

        // Upload para o Supabase Storage
        const { data, error } = await supabase.storage
            .from('message-attachments')
            .upload(storagePath, blob, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            throw new Error(`Erro no upload: ${error.message}`);
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(storagePath);

        return {
            url: urlData.publicUrl,
            path: storagePath,
            type: fileType,
            filename,
        };
    } catch (error) {
        console.error('Upload attachment error:', error);
        throw error;
    }
}

/**
 * Deleta um anexo do Storage
 * @param path - Caminho do arquivo no Storage
 */
export async function deleteAttachment(path: string): Promise<void> {
    try {
        const { error } = await supabase.storage
            .from('message-attachments')
            .remove([path]);

        if (error) {
            throw new Error(`Erro ao deletar: ${error.message}`);
        }
    } catch (error) {
        console.error('Delete attachment error:', error);
        throw error;
    }
}

/**
 * Obtém a URL pública de um anexo
 * @param path - Caminho do arquivo no Storage
 * @returns URL pública do arquivo
 */
export function getPublicUrl(path: string): string {
    const { data } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(path);

    return data.publicUrl;
}

/**
 * Valida se o arquivo pode ser enviado
 * @param file - Arquivo a ser validado
 * @param maxSizeMB - Tamanho máximo em MB
 * @returns true se válido, senão lança erro
 */
export async function validateFile(file: AttachmentFile, maxSizeMB: number = 10): Promise<boolean> {
    // Verificar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use imagens (jpg, png, gif) ou PDF.');
    }

    // Verificar tamanho
    const fileInfo = await FileSystem.getInfoAsync(file.uri);
    if (fileInfo.exists && 'size' in fileInfo) {
        const sizeMB = fileInfo.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            throw new Error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        }
    }

    return true;
}

// Helpers

function getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'application/pdf': '.pdf',
    };
    return extensions[mimeType] || '';
}

function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}
