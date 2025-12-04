# Fase 9 - Instalação de Dependências

## ⚠️ Ação Necessária

As dependências para upload de anexos precisam ser instaladas manualmente devido a problemas no ambiente de desenvolvimento.

### Passo 1: Instalar Dependências

Execute os seguintes comandos no terminal:

```bash
# Opção 1: Usando npx expo install (recomendado)
npx expo install expo-image-picker expo-document-picker expo-file-system

# OU Opção 2: Usando npm
npm install expo-image-picker expo-document-picker expo-file-system
```

### Passo 2: Configurar Permissões

As permissões já foram configuradas automaticamente pelos pacotes expo, mas você pode verificar/adicionar manualmente ao `app.json` se necessário:

```json
{
  "expo": {
   "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "O app precisa acessar suas fotos para enviar imagens nas mensagens.",
          "cameraPermission": "O app precisa acessar sua câmera para tirar fotos."
        }
      ]
    ]
  }
}
```

### Passo 3: Configurar Supabase Storage

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Storage** → **New bucket**
3. Configure:
   - **Nome:** `message-attachments`
   - **Public:** Desmarque (arquivo privado)
   - **File size limit:** 10485760 (10MB)
   - **Allowed MIME types:** `image/*,application/pdf`
4. Após criar o bucket, execute o SQL em `storage_setup.sql` no **SQL Editor**

### Passo 4: Testar

Após instalar e configurar, teste a funcionalidade:

1. Abra o app: `npm start`
2. Navegue até um canal de ministério
3. Clique no botão 📎 para adicionar anexo
4. Teste upload de imagem e PDF

---

## Arquivos Criados

✅ **Backend:**
- `storage_setup.sql` - Políticas RLS para Storage

✅ **Serviços:**
- `src/services/storageService.ts` - Upload, validação e gerenciamento

✅ **Componentes:**
- `src/components/AttachmentPicker.tsx` - Modal de seleção
- `src/components/AttachmentPreview.tsx` - Preview antes de enviar
- `src/components/MessageAttachment.tsx` - Renderização nas mensagens

⏳ **Pendente:**
- Integração nas telas de chat (MinistryChannelScreen e ThreadScreen)
- Instalação das dependências
