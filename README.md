# dailytracker-app

http://dailytracker.com.br

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

O build e o deploy são automatizados via GitHub Actions (`.github/workflows/docker-build.yml`): a cada push na `master` a imagem Docker é construída e publicada no GitHub Container Registry (`ghcr.io`), e em seguida puxada na VPS via SSH (`docker compose pull && docker compose up -d`).

A `VITE_API_URL` é uma variável **de build do Vite**: ela é "impressa" dentro do JavaScript no momento do `npm run build` (que roda dentro do Actions). Por isso ela vem do arquivo [`.env.production`](.env.production), versionado no repositório, e **não** de variáveis de ambiente na VPS — definir `VITE_API_URL` no `docker-compose.yml` ou em `docker run -e` não tem efeito, pois o bundle já está gerado.

Para apontar o front para outro backend: edite `.env.production`, faça commit/push na `master`, aguarde o Actions reconstruir a imagem `latest` e atualize a VPS.
