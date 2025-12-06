# 📋 Guia de Testes - Fase 9: Upload de Anexos

## ✅ Pré-requisitos

- [ ] Bucket `message-attachments` criado no Supabase
- [ ] SQL do `storage_setup.sql` executado
- [ ] App rodando (`yarn start`)
- [ ] Dispositivo físico ou emulador com câmera configurada

---

## 🧪 Casos de Teste

### 1. Teste de Upload de Imagem (Galeria)

**Passos:**
1. Faça login no app
2. Entre em um canal de ministério
3. Clique no botão **📎** ao lado do input de mensagem
4. Selecione **🖼️ Galeria**
5. Escolha uma imagem da galeria
6. Verifique se o preview aparece
7. (Opcional) Digite uma mensagem
8. Clique em **Enviar**

**Resultado Esperado:**
- ✅ Preview mostra a imagem antes de enviar
- ✅ Mensagem é enviada com sucesso
- ✅ Imagem aparece inline na mensagem (200x200)
- ✅ Ao tocar na imagem, abre em fullscreen
- ✅ Outros membros do ministério veem a imagem

---

### 2. Teste de Upload de Imagem (Câmera)

**Passos:**
1. No canal de ministério, clique no **📎**
2. Selecione **📷 Tirar Foto**
3. Permita acesso à câmera (se solicitado)
4. Tire uma foto
5. Confirme a foto
6. Veja o preview
7. Envie

**Resultado Esperado:**
- ✅ App pede permissão de câmera
- ✅ Câmera abre corretamente
- ✅ Foto capturada aparece no preview
- ✅ Upload e envio funcionam normalmente

---

### 3. Teste de Upload de Documento (PDF)

**Passos:**
1. No canal de ministério, clique no **📎**
2. Selecione **📄 Documento (PDF)**
3. Escolha um arquivo PDF
4. Veja o preview (ícone + nome do arquivo)
5. Envie

**Resultado Esperado:**
- ✅ Seletor de arquivos abre
- ✅ Preview mostra ícone 📄 + nome do arquivo
- ✅ Mensagem é enviada com card do PDF
- ✅ Ao tocar no card, abre/baixa o PDF

---

### 4. Teste de Validação de Arquivo

**Teste 4.1: Arquivo muito grande**
1. Tente enviar uma imagem > 10MB
2. **Esperado:** Alert "Arquivo muito grande. Máximo: 10MB"

**Teste 4.2: Tipo não permitido**
1. Tente enviar um arquivo .docx, .mp4, etc
2. **Esperado:** Alert "Tipo de arquivo não permitido. Use imagens (jpg, png, gif) ou PDF."

---

### 5. Teste de Upload em Thread

**Passos:**
1. Em uma mensagem existente, clique em **Responder**
2. Na thread, clique no **📎**
3. Envie uma imagem ou PDF
4. Verifique se aparece na thread

**Resultado Esperado:**
- ✅ Botão 📎 presente na thread
- ✅ Upload funciona igualmente ao canal principal
- ✅ Anexo aparece na resposta da thread

---

### 6. Teste de Remoção de Anexo (Preview)

**Passos:**
1. Selecione um arquivo (📎 → qualquer opção)
2. Veja o preview
3. Clique no **✕** no preview
4. Verifique se o preview desaparece
5. Envie apenas texto

**Resultado Esperado:**
- ✅ Anexo é removido
- ✅ Pode enviar mensagem sem anexo

---

### 7. Teste de Permissões (RLS)

**Teste 7.1: Acesso autorizado**
1. Como membro do ministério A, envie uma imagem
2. Outro membro do ministério A deve ver a imagem
3. **Esperado:** ✅ Imagem visível

**Teste 7.2: Acesso negado (se possível testar)**
1. Tente acessar diretamente a URL de uma imagem de outro ministério
2. **Esperado:** ❌ Acesso negado (403)

---

### 8. Teste de Múltiplas Mensagens

**Passos:**
1. Envie 3 mensagens seguidas com anexos diferentes:
   - Mensagem 1: Imagem da galeria
   - Mensagem 2: Foto da câmera
   - Mensagem 3: PDF
2. Role o chat
3. Toque em cada anexo

**Resultado Esperado:**
- ✅ Todas as 3 mensagens aparecem
- ✅ Cada anexo é renderizado corretamente
- ✅ Imagens abrem em fullscreen
- ✅ PDF abre/baixa

---

## 🐛 Checklist de Problemas Comuns

Se algo não funcionar, verifique:

- [ ] Bucket `message-attachments` existe no Supabase?
- [ ] Políticas RLS estão configuradas?
- [ ] Tabela `message_attachments` existe?
- [ ] Permissões de câmera/galeria foram concedidas?
- [ ] Arquivo está dentro do limite de 10MB?
- [ ] Tipo do arquivo é permitido (jpg, png, gif, pdf)?
- [ ] Internet está funcionando? (Upload requer conexão)

---

## 📊 Resultado dos Testes

Preencha conforme testa:

| Caso de Teste | Status | Observações |
|--------------|--------|------------|
| 1. Upload Galeria | ⬜ | |
| 2. Upload Câmera | ⬜ | |
| 3. Upload PDF | ⬜ | |
| 4.1 Validação Tamanho | ⬜ | |
| 4.2 Validação Tipo | ⬜ | |
| 5. Upload em Thread | ⬜ | |
| 6. Remoção Preview | ⬜ | |
| 7. Permissões RLS | ⬜ | |
| 8. Múltiplas Mensagens | ⬜ | |

**Legenda:** ⬜ Não testado | ✅ Passou | ❌ Falhou

---

## 🚀 Como Executar os Testes

1. **Iniciar o app:**
   ```bash
   yarn start
   ```

2. **Abrir no dispositivo:**
   - Escaneie o QR code com Expo Go (Android/iOS)
   - OU pressione `a` para Android emulator
   - OU pressione `i` para iOS simulator

3. **Login com usuário de teste**
4. **Seguir os casos de teste acima**

---

**Data:** 2025-12-04  
**Testador:** _____________________  
**Versão:** 1.0.0 (MVP + Fase 9)
