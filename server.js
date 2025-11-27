// server/server.js 
// 1. IMPORTACIONES
// Cargamos .env y, en modo development, .env.local para uso local.
const fs = require('fs');
const dotenv = require('dotenv');
// Carga variables desde .env (si existe)
dotenv.config();
// Si estamos en modo development, intentar cargar .env.local (no sobrescribe variables ya definidas)
if ((process.env.NODE_ENV || 'development') === 'development') {
  const localEnvPath = __dirname + '/.env.local';
  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
    console.log('Env: cargado .env.local para desarrollo');
  }
}
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Necesario para la comunicación entre Frontend y Backend
const CronService = require('./services/CronService');

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
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos: uploads e images (alias a uploads)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'uploads')));


// 4. CONEXIÓN DE RUTAS API (Endpoints)
// Importa tus rutas de canchas que acabamos de crear
const canchaRoutes = require('./routes/cancha.routes');
const horarioRoutes = require('./routes/Horario.routes'); 

// Rutas añadidas recientemente (clubes / reservas / usuario)
const clubesRoutes = require('./routes/clubes');
const reservasRoutes = require('./routes/reservas');
const usuarioRoutes = require('./routes/usuario');

// Usa el prefijo /api/v1/canchas para todas las rutas definidas en cancha.routes.js
// La ruta completa será: GET http://localhost:3000/api/v1/canchas
app.use('/api/v1/canchas', canchaRoutes);
app.use('/api/v1/horarios', horarioRoutes); 

// Montar las rutas del nuevo módulo integrado
app.use('/api/clubes', clubesRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/usuario', usuarioRoutes);

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