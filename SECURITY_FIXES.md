# 🛡️ Security Fixes — TODO

Vulnerabilidades identificadas na auditoria de 2026-02-26, ordenadas por prioridade.

---

## 🔴 Crítico

- [ ] **Rate limiting nos endpoints de autenticação**
  - Instalar `express-rate-limit`
  - Limitar `/auth/login` e `/auth/register` a no máximo **10 requisições/minuto por IP**
  - Retornar `429 Too Many Requests` quando exceder

- [ ] **Rate limiting nos endpoints da API**
  - Limitar todos os endpoints `/api/*` a no máximo **100 requisições/minuto por usuário autenticado**

- [ ] **IDOR no `POST /api/task-types`**
  - Verificar que o `projectId` enviado pertence ao `req.userId` antes de criar o task type
  - Exemplo: `prisma.project.findFirst({ where: { id: projectId, userId: req.userId } })`

---

## 🟡 Importante

- [ ] **Adicionar Helmet (security headers)**
  - Instalar `helmet`
  - Adicionar `app.use(helmet())` no `server.js`
  - Headers que serão configurados: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`

- [ ] **Validação de tamanho dos inputs**
  - `title`: máximo 200 caracteres
  - `description`: máximo 5000 caracteres
  - `name` (project/task-type): máximo 100 caracteres
  - `color`: máximo 7 caracteres (formato `#hex`)
  - `email`: máximo 254 caracteres
  - Rejeitar com `400 Bad Request` quando exceder

- [ ] **Remover JWT da URL no callback do Google OAuth**
  - Atualmente: `res.redirect(...?token=${token})` expõe o token no browser history e referrer headers
  - Alternativa: usar cookie `httpOnly` temporário ou POST intermediário para entregar o token

- [ ] **Validação estrita de `parseInt` nos route params**
  - Substituir `parseInt(id)` por validação que rejeita input não-numérico (ex: `"42abc"`)
  - Retornar `400 Bad Request` para IDs inválidos

---

## 🟢 Preventivo

- [ ] **Limitar tamanho do body JSON**
  - Alterar `express.json()` para `express.json({ limit: '10kb' })` (o default é 100KB)

- [ ] **Unificar instância do PrismaClient**
  - `server.js` e `passport-setup.js` cada um cria `new PrismaClient()`
  - Criar um módulo compartilhado `prisma.js` e importar nos dois

- [ ] **Auditar histórico do Git por secrets vazados**
  - Verificar se `.env` com `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, etc. foi commitado em algum momento
  - Se sim: rotacionar todos os secrets e usar `git filter-branch` ou `BFG` para limpar o histórico

- [ ] **Proteger contra enumeração de IDs**
  - Considerar migrar de `autoincrement()` para UUIDs nas entidades sensíveis (longo prazo)
  - Isso impede que atacantes descubram IDs de outros usuários por iteração sequencial
