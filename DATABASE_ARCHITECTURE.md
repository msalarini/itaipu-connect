# Arquitetura de Dados e Páginas

Este documento mapeia a estrutura do banco de dados (Supabase/PostgreSQL), políticas de segurança (RLS) e como ela alimenta as principais telas do aplicativo Itaipu Connect.

## Estrutura de Arquivos

Os arquivos SQL de migração e setup estão organizados na pasta:
`📂 database/`

### Mapeamento: Tabela -> Aplicação

### 1. `profiles` (Perfis de Usuário)
- **Banco de Dados**: `public.profiles`
  - **RLS**: 
    - `SELECT`: Público (todos podem ver perfis básicos).
    - `UPDATE`: Apenas o próprio usuário (`auth.uid() = id`).
- **Interfaces TypeScript**: `UserProfile` em `src/context/AuthContext.tsx`
- **Serviços**: `src/context/AuthContext.tsx` (Gestão de estado global)
- **Uso nas Páginas**:
  - **HomeScreen**: Exibe avatar e saudação. Verifica `global_role` para exibir opções de admin.
  - **ProfileScreen**: Edição de dados e avatar.

### 2. `events` (Eventos)
- **Banco de Dados**: `public.events`
  - **RLS**:
    - `SELECT`: Público (todos veem eventos).
    - `INSERT/UPDATE`: Apenas Roles `PASTOR` ou `LEADER`.
- **Interfaces TypeScript**: `Event` em `src/screens/events/EventsScreen.tsx` (Recomendado mover para `src/types` ou `src/services/eventService.ts`)
- **Serviços**: `src/services/eventService.ts`
- **Uso nas Páginas**:
  - **EventsScreen**: Lista eventos futuros (`gte now()`). Filtra por ministério.
  - **CreateEventScreen**: Formulário para Líderes/Pastores.
  - **EventDetailsScreen**: Visualização completa.

### 3. `event_rsvps` (Confirmação de Presença)
- **Banco de Dados**: `public.event_rsvps`
  - **RLS**:
    - `SELECT`: Público (ver lista de presença).
    - `INSERT/UPDATE`: Apenas o próprio usuário para seu próprio `user_id`.
- **Interfaces TypeScript**: `EventRSVP` em `src/services/eventService.ts`
- **Serviços**: `src/services/eventService.ts` (`setRSVP`, `getEventAttendees`)
- **Uso nas Páginas**:
  - **EventDetailsScreen**:
    - Lista avatares de quem vai.
    - Botões "Eu vou" / "Não vou" (interação em tempo real).

### 4. `ministries` (Ministérios)
- **Banco de Dados**: `public.ministries`
  - **RLS**:
    - `SELECT`: Público.
    - `INSERT/UPDATE`: Apenas `PASTOR`.
- **Interfaces TypeScript**: `Ministry` em `src/services/ministryService.ts`
- **Serviços**: `src/services/ministryService.ts`
- **Uso nas Páginas**:
  - **MinistriesScreen**: Listagem.
  - **MinistryChannelScreen**: Contexto de chat.

### 5. `messages` & Chat (Sistema de Mensagens)
- **Banco de Dados**:
  - `messages`: Conteúdo do chat.
  - `message_reactions`: Reações (Emojis).
  - `message_attachments`: Arquivos e Fotos.
- **Interfaces TypeScript**: `Message`, `MessageAttachment` em `src/screens/ministries/MinistryChannelScreen.tsx`
- **Serviços**: `src/services/storageService.ts` (Uploads), `src/services/supabaseClient.ts` (Realtime)
- **Uso nas Páginas**:
  - **MinistryChannelScreen**: 
    - Feed com Scroll Infinito (ou paginação).
    - Upload de anexos.
    - Reações em mensagens.
    - Threads (respostas).

## Fluxo de Autenticação e Dados

1.  **Auth**: `AuthContext` inicializa `session` do Supabase.
2.  **Profile**: Ao logar, busca `profiles` para obter `global_role` e `avatar`.
3.  **Navegação**: `RootNavigator` decide entre `AuthStack` (Login) e `AppStack` (Home) baseado na sessão.

## Próximos Passos de Arquitetura

-   [ ] **Centralização de Tipos**: Mover interfaces dispersas (`Event`, `Message`) para uma pasta dedicada `src/types/`.
-   [ ] **Query Hooks**: Considerar uso de `TanStack Query` para cache e estados de loading mais robustos.
