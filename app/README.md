# dailytracker-app

Frontend da aplicação Daily Tracker, um gerenciador de tarefas no estilo Kanban com foco em acompanhamento diário de atividades (daily scrum).

## Stack

- React 19
- Vite 7
- React Bootstrap
- React Router
- Axios
- dnd-kit (drag and drop)
- date-fns

## Funcionalidades

- Cadastro e login com email/senha
- Login com Google (OAuth2)
- Criação e gerenciamento de projetos com cores customizáveis
- Board Kanban com tarefas organizadas por status (Planned, In Progress, Done)
- Drag and drop para mover tarefas entre colunas
- Tipos de tarefa por projeto
- Filtro por data

## Rodando localmente

```bash
cd app
npm install
npm run dev
```

O app sobe em `http://localhost:5173` por padrão.

Crie um arquivo `.env` na pasta `app`:

```
VITE_API_URL=http://localhost:3000
```

## Estrutura

O frontend consome a API REST fornecida pelo backend em Java (Spring Boot), hospedado em repositório separado: [dailytracker-service](https://github.com/LorenzoPasquali/dailytracker-service).

## Deploy

O frontend é hospedado na Vercel. O build é feito automaticamente a cada push. A variável `VITE_API_URL` é configurada nas environment variables da Vercel apontando para o backend no Render.
