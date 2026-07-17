# Quizoo — Frontend

Landing page do **Quizoo**, uma plataforma de quizzes coloridos em tempo real: crie, jogue e aprenda com a turma, ao vivo e para todos.

> Pergunte. Jogue. Aprenda.

## Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) como build tool e dev server
- [Tailwind CSS](https://tailwindcss.com/) para estilização
- [ESLint](https://eslint.org/) para lint

## Estrutura do projeto

```
src/
├── assets/              # imagens e outros arquivos estáticos
├── components/
│   ├── landing/          # seções da landing page (Hero, Faq, Cta, etc.)
│   └── ui/                # componentes de UI reutilizáveis (Button, etc.)
├── pages/
│   └── LandingPage.tsx    # composição das seções da landing page
├── App.tsx
├── main.tsx
└── index.css
```

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org/) instalado.

```bash
# instalar dependências
npm install

# iniciar o servidor de desenvolvimento
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173`.

## Scripts disponíveis

| Comando           | Descrição                                          |
| ------------------ | --------------------------------------------------- |
| `npm run dev`     | Inicia o servidor de desenvolvimento com hot reload |
| `npm run build`   | Gera a build de produção (`tsc -b` + `vite build`)  |
| `npm run preview` | Serve localmente a build de produção                |
| `npm run lint`    | Executa o ESLint no projeto                          |
