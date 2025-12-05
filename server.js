// 1. IMPORTACIONES y configuración de entorno
import fs from 'fs';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors'; // Necesario para la comunicación entre Frontend y Backend
import CronService from './services/CronService.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

// Carga variables desde .env (si existe)
dotenv.config();
// Si estamos en modo development, intentar cargar .env.local (no sobrescribe variables ya definidas)
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if ((process.env.NODE_ENV || 'development') === 'development') {
  const localEnvPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
    console.log('Env: cargado .env.local para desarrollo');
  }
}

// 2. INICIALIZACIÓN
const app = express();
const PORT = process.env.PORT || 3000;

// 3. MIDDLEWARES (Configuración de la Aplicación)
// Permitimos orígenes configurables vía variable de entorno `CORS_ORIGINS`
// Ej: CORS_ORIGINS="http://localhost:5173,https://mi-frontend.vercel.app"
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Configuración flexible de CORS.
// Permite orígenes listados en CORS_ORIGINS, el valor exacto en FRONTEND_URL,
// y opcionalmente todos los subdominios de Vercel si ALLOW_VERCEL=true.
const allowVercel = (process.env.ALLOW_VERCEL || 'false') === 'true';
const frontendUrl = process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim();

app.use(cors({
  origin: function(origin, callback) {
    // Peticiones sin Origin (Postman, server-to-server) se permiten
    if (!origin) return callback(null, true);

    const o = origin.trim();

    if (allowedOrigins.indexOf(o) !== -1) return callback(null, true);
    if (frontendUrl && o === frontendUrl) return callback(null, true);
    if (allowVercel && /(^|\.)vercel\.app$/.test(o)) return callback(null, true);

    console.warn(`CORS blocked origin: ${o}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware de logging para depuración de CORS (muestra incoming origin)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) console.debug(`Incoming request origin: ${origin}`);
  next();
});

// Permite que Express lea el JSON del cuerpo de la solicitud
// Usar los parsers nativos de Express (sin dependencia extra)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos: uploads e images (alias a uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'uploads')));


// 4. CONEXIÓN DE RUTAS API (Endpoints)
// Importa tus rutas de canchas que acabamos de crear
import canchaRoutes from './routes/cancha.routes.js';
import horarioRoutes from './routes/Horario.routes.js'; 

// Rutas añadidas recientemente (clubes / reservas)
import clubesRoutes from './routes/clubes.js';
import reservasRoutes from './routes/reservas.js';
import reservaAdminRoutes from './routes/Reserva.routes.js';

app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Usa el prefijo /api/v1/canchas para todas las rutas definidas en cancha.routes.js
// La ruta completa será: GET http://localhost:3000/api/v1/canchas
app.use('/api/v1/canchas', canchaRoutes);
app.use('/api/v1/horarios', horarioRoutes); 

// Montar las rutas del nuevo módulo integrado
// IMPORTANTE: Las rutas admin deben ir ANTES de las genéricas para evitar que sean interceptadas
app.use('/api/reservas/admin', reservaAdminRoutes);
app.use('/api/clubes', clubesRoutes);
app.use('/api/reservas', reservasRoutes);

CronService.startCleanupJob();

// 5. RUTA DE PRUEBA SIMPLE (Para verificar que el servidor está activo)
app.get('/', (req, res) => {
    res.status(200).send("API de Reservas de OpenPadel Activa.");
});

// 404 handler para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler centralizado
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  const status = err && err.status ? err.status : 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});


// 6. LEVANTAMIENTO DEL SERVIDOR
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  console.log(`API base: http://localhost:${PORT}/api/v1`);
});
