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
- [x] Fase 1: Arquitetura e tema
- [x] Fase 2: Backend e modelo de dados
- [x] Fase 3: Autenticação
- [x] Fase 4: Ministérios e mensagens
- [x] Fase 5: Avisos e eventos
- [x] Fase 6: Gestão de pessoas
- [x] Fase 7: Push notifications
- [x] Fase 8: Publicação

## 🚀 Build e Publicação

Este projeto utiliza **EAS Build** para gerar os executáveis.

### Pré-requisitos
1. Instale a CLI do EAS: `npm install -g eas-cli`
2. Faça login na sua conta Expo: `eas login`
3. Configure o projeto (se ainda não configurado): `eas build:configure`

### Gerando Builds

**Android (APK para teste):**
```bash
eas build -p android --profile preview
```

**iOS (Simulator):**
```bash
eas build -p ios --profile preview
```

**Produção (Stores):**
```bash
eas build -p all --profile production
```

## 🤝 Contribuição

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Faça o Commit de suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Faça o Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Projeto privado - Uso interno da igreja.

---

Desenvolvido com ❤️ para a comunidade Itaipu
