# ⚠️ Problemas com npm install

Se você estiver tendo problemas para instalar as dependências com `npm install`, tente uma das seguintes soluções:

## Solução 1: Reinstalar completamente

```bash
# Remover node_modules e lock files
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force

# Reinstalar
npm install
```

## Solução 2: Usar Yarn

```bash
# Instalar Yarn (se não tiver)
npm install -g yarn

# Remover npm lock
Remove-Item package-lock.json -Force

# Instalar com Yarn
yarn install
```

## Solução 3: Forçar instalação específica

```bash
npm install expo-file-system@~18.0.8 --legacy-peer-deps
```

## Solução 4: Atualizar npm

```bash
npm install -g npm@latest
npm install
```

## Verificar se funcionou

Após instalar, verifique se os pacotes estão presentes:

```bash
npm list expo-file-system expo-image-picker expo-document-picker
```

Deve mostrar as 3 dependências instaladas.

---

**Nota:** As dependências `expo-image-picker` e `expo-document-picker` já estavam no package.json. Apenas `expo-file-system` foi adicionada.
