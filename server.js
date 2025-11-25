// server/server.js 
// 1. IMPORTACIONES
require('dotenv').config(); // Carga las variables del .env
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
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Si no hay origin (por ejemplo peticiones desde Postman o servidor to servidor), dejamos pasar
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

// Permite que Express lea el JSON del cuerpo de la solicitud
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));


// 4. CONEXIÓN DE RUTAS API (Endpoints)
// Importa tus rutas de canchas que acabamos de crear
const canchaRoutes = require('./routes/cancha.routes');
const horarioRoutes = require('./routes/Horario.routes'); 

// Usa el prefijo /api/v1/canchas para todas las rutas definidas en cancha.routes.js
// La ruta completa será: GET http://localhost:3000/api/v1/canchas
app.use('/api/v1/canchas', canchaRoutes);
app.use('/api/v1/horarios', horarioRoutes); 

CronService.startCleanupJob();

// 5. RUTA DE PRUEBA SIMPLE (Para verificar que el servidor está activo)
app.get('/', (req, res) => {
    res.status(200).send("API de Reservas de OpenPadel Activa.");
});


// 6. LEVANTAMIENTO DEL SERVIDOR
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  console.log(`API base: http://localhost:${PORT}/api/v1`);
});