import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import session from 'express-session';
import passport from 'passport';
import './passport-setup.js';
import prisma from './prisma.js';

const app = express();
app.set('trust proxy', 1);

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL_ERROR: JWT_SECRET is not defined in the environment variables.');
}

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));

app.use(cors({
  origin: ['https://dailytracker.com.br', 'http://localhost:5173'],
  credentials: true,
}));

app.use(helmet());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ── Rate Limiters ────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 10,                   // 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Tente novamente em 1 minuto.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 100,                  // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Limite de requisições excedido. Tente novamente em 1 minuto.' },
});

/**
 * Strict parseInt — rejects "42abc", "", NaN, etc.
 * Returns the parsed integer or null.
 */
function parseId(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

/**
 * Input length validation rules.
 */
const FIELD_MAX_LENGTHS = {
  title: 200,
  description: 5000,
  name: 100,
  color: 7,
  email: 254,
};

/**
 * Middleware that validates string field lengths in req.body.
 */
function validateBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object') return next();

  for (const [field, maxLen] of Object.entries(FIELD_MAX_LENGTHS)) {
    const value = req.body[field];
    if (value !== undefined && value !== null) {
      if (typeof value === 'string' && value.length > maxLen) {
        return res.status(400).json({
          message: `O campo '${field}' excede o tamanho máximo de ${maxLen} caracteres.`,
        });
      }
    }
  }
  next();
}

/**
 * Middleware that validates route param :id as a strict integer.
 */
function validateIdParam(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: 'ID inválido. Deve ser um número inteiro positivo.' });
  }
  req.parsedId = id;
  next();
}

// ── Auth Middleware ──────────────────────────────────────────────────────────

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
};

// ── Auth Routes ──────────────────────────────────────────────────────────────

app.post('/auth/register', authLimiter, validateBody, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });
    res.status(201).json({ message: "Usuário criado com sucesso!", userId: user.id });
  } catch (error) {
    res.status(400).json({ message: "Email já existe." });
  }
});

app.post('/auth/login', authLimiter, validateBody, async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

app.get('/auth/google', passport.authenticate('google'));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google-auth-failed`,
  }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Deliver token via postMessage to the opener window instead of exposing it in the URL.
    // The frontend LoginPage already listens for 'message' events from the popup.
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Autenticando...</title></head>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ token: '${token}' }, '${frontendOrigin}');
          }
          window.close();
        </script>
        <p>Autenticação concluída. Esta janela será fechada automaticamente.</p>
      </body>
      </html>
    `);
  }
);

// ── API Routes ───────────────────────────────────────────────────────────────

// Apply rate limiter and body validation to all /api/* routes
app.use('/api', apiLimiter, validateBody);

// User
app.get('/api/user/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno ao buscar dados do usuário.' });
  }
});

// Tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tasks);
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, description, status, projectId, taskTypeId } = req.body;
  const userId = req.userId;

  if (!title || !status) {
    return res.status(400).json({ message: 'Título e status são obrigatórios.' });
  }

  try {
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status,
        userId,
        projectId,
        taskTypeId,
      }
    });
    res.status(201).json(newTask);
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    res.status(500).json({ message: 'Erro interno ao criar tarefa.' });
  }
});

app.put('/api/tasks/:id', authenticateToken, validateIdParam, async (req, res) => {
  const id = req.parsedId;
  const { title, description, status, projectId, taskTypeId } = req.body;
  const userId = req.userId;

  const dataToUpdate = {};
  if (title !== undefined) dataToUpdate.title = title;
  if (description !== undefined) dataToUpdate.description = description;
  if (status !== undefined) dataToUpdate.status = status;
  if (projectId !== undefined) dataToUpdate.projectId = projectId;
  if (taskTypeId !== undefined) dataToUpdate.taskTypeId = taskTypeId;

  if (dataToUpdate.title === '') {
    return res.status(400).json({ message: 'O título não pode ser vazio.' });
  }

  dataToUpdate.updatedAt = new Date();

  try {
    const updatedTask = await prisma.task.update({
      where: {
        id: id,
        userId: userId
      },
      data: dataToUpdate
    });
    res.json(updatedTask);
  } catch (error) {
    console.error(`Erro ao atualizar tarefa ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Tarefa não encontrada ou não pertence ao usuário.' });
    }
    res.status(500).json({ message: 'Erro interno ao atualizar tarefa.' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, validateIdParam, async (req, res) => {
  const id = req.parsedId;
  const userId = req.userId;

  try {
    await prisma.task.delete({
      where: {
        id: id,
        userId: userId,
      }
    });
    res.status(204).send();
  } catch (error) {
    console.error(`Erro ao deletar tarefa ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Tarefa não encontrada ou não pertence ao usuário.' });
    }
    res.status(500).json({ message: 'Erro interno ao deletar tarefa.' });
  }
});

// Projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.userId },
    include: { taskTypes: true },
    orderBy: { name: 'asc' }
  });
  res.json(projects);
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ message: 'O nome do projeto é obrigatório.' });

  const newProject = await prisma.project.create({
    data: { name, color, userId: req.userId }
  });
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', authenticateToken, validateIdParam, async (req, res) => {
  const id = req.parsedId;
  const { name, color } = req.body;

  try {
    const updatedProject = await prisma.project.update({
      where: { id: id, userId: req.userId },
      data: { name, color }
    });
    res.json(updatedProject);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    }
    res.status(500).json({ message: 'Erro ao atualizar projeto.' });
  }
});

app.delete('/api/projects/:id', authenticateToken, validateIdParam, async (req, res) => {
  const id = req.parsedId;
  try {
    await prisma.project.delete({
      where: { id: id, userId: req.userId }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Não é possível excluir. O projeto atrelado a tarefas ou tipos de tarefa.' });
    }
    res.status(500).json({ message: 'Erro ao deletar projeto.' });
  }
});

// Task Types
app.post('/api/task-types', authenticateToken, async (req, res) => {
  const { name, projectId } = req.body;
  if (!name || !projectId) {
    return res.status(400).json({ message: 'Nome e ID do projeto são obrigatórios.' });
  }

  // IDOR fix: verify projectId belongs to the authenticated user
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: req.userId }
  });

  if (!project) {
    return res.status(404).json({ message: 'Projeto não encontrado ou não pertence ao usuário.' });
  }

  const newType = await prisma.taskType.create({
    data: { name, projectId }
  });
  res.status(201).json(newType);
});

app.put('/api/task-types/:id', authenticateToken, validateIdParam, async (req, res) => {
  const id = req.parsedId;
  const { name, projectId } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'O nome é obrigatório.' });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.userId }
    });

    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado ou não pertence ao usuário.' });
    }

    const updatedTaskType = await prisma.taskType.update({
      where: { id: id },
      data: { name },
    });
    res.json(updatedTaskType);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Tipo de tarefa não encontrado.' });
    }
    res.status(500).json({ message: 'Erro ao atualizar o tipo de tarefa.' });
  }
});

app.delete('/api/task-types/:id', authenticateToken, validateIdParam, async (req, res) => {
  const id = req.parsedId;

  try {
    const taskTypeToDelete = await prisma.taskType.findFirst({
      where: { id: id, project: { userId: req.userId } }
    });

    if (!taskTypeToDelete) {
      return res.status(404).json({ message: 'Tipo de tarefa não encontrado ou não pertence ao usuário.' });
    }

    await prisma.taskType.delete({
      where: { id: id },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Tipo de tarefa não encontrado.' });
    }
    res.status(500).json({ message: 'Erro ao deletar o tipo de tarefa.' });
  }
});

// Healthcheck
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor de API rodando na porta ${PORT}`));