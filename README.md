# SENAI MAP - Frontend

Sistema de calendário de aulas para o SENAI desenvolvido com React + Vite.

## 🚀 Tecnologias

- **React 18** - Biblioteca JavaScript para interfaces
- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utility-first
- **React Router DOM** - Roteamento

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── main.tsx          # Ponto de entrada da aplicação
│   ├── App.tsx           # Componente principal
│   ├── index.css         # Estilos globais
│   ├── components/       # Componentes reutilizáveis
│   └── pages/            # Páginas da aplicação
│       └── Home.tsx
├── public/               # Arquivos estáticos
├── index.html            # HTML principal
├── vite.config.ts        # Configuração do Vite
├── tsconfig.json         # Configuração do TypeScript
└── tailwind.config.js    # Configuração do Tailwind
```

## 🛠️ Instalação

```bash
npm install
```

## 🏃 Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📦 Build

```bash
npm run build
```

## 👀 Preview

```bash
npm run preview
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria o build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter
