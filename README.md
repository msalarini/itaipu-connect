# Itaipu Connect

Aplicativo móvel interno para gestão de ministérios com sistema de mensagens, avisos e eventos.

## 📱 Sobre o Projeto

**Itaipu Connect** é um aplicativo desenvolvido para facilitar a comunicação e organização interna da igreja, oferecendo:

- Sistema de mensagens em threads (similar a Slack/Discord)
- Gestão de ministérios
- Avisos e eventos
- Controle de permissões por papéis (MEMBER, LEADER, PASTOR)
- Acesso restrito por convite

## 🛠️ Stack Tecnológica

- **Mobile:** React Native + Expo
- **Linguagem:** TypeScript
- **UI:** gluestack-ui (dark theme)
- **Navegação:** React Navigation
- **Estado:** Context API
- **Backend:** Supabase (Auth + Postgres + Storage)
- **Notificações:** Expo Notifications

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo Go (no celular) ou emulador Android/iOS

### Instalação

```bash
# Clonar o repositório
git clone <repository-url>
cd itaipu-connect

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm start
```

### Executar em Dispositivo

```bash
# Android
npm run android

# iOS (requer macOS)
npm run ios

# Web
npm run web
```

## 📂 Estrutura do Projeto

```
itaipu-connect/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── screens/         # Telas do aplicativo
│   ├── navigation/      # Configuração de navegação
│   ├── hooks/           # Custom hooks
│   ├── services/        # Serviços (Supabase, etc)
│   └── theme/           # Configuração de tema
├── assets/              # Imagens, ícones, fontes
└── App.tsx              # Componente principal
```

## 👥 Sistema de Permissões

- **MEMBER:** Visualiza apenas seus ministérios e conteúdo relacionado
- **LEADER:** Gerencia seu ministério, cria avisos/eventos específicos
- **PASTOR:** Cria ministérios, visualiza tudo, cria avisos/eventos gerais

## 🔐 Autenticação

O acesso ao aplicativo é **exclusivo por convite**. Não há registro público.

## 📝 Roadmap

- [x] Fase 0: Configuração inicial
- [ ] Fase 1: Arquitetura e tema
- [ ] Fase 2: Backend e modelo de dados
- [ ] Fase 3: Autenticação
- [ ] Fase 4: Ministérios e mensagens
- [ ] Fase 5: Avisos e eventos
- [ ] Fase 6: Gestão de pessoas
- [ ] Fase 7: Push notifications
- [ ] Fase 8: Publicação

## 📄 Licença

Projeto privado - Uso interno da igreja.

---

Desenvolvido com ❤️ para a comunidade Itaipu
