/**
 * Script de seed para poblar la base de datos con datos de clubes, canchas y reservas
 * Ejecutar con: npm run seed
 */

const db = require('./config/db.config');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const seed = async () => {
  try {
    console.log('Iniciando seed de la base de datos...\n');

    // 1) Características de clubes
    console.log('1. Insertando características de clubes...');
    const caracteristicas = ['Estacionamiento', 'Buffet', 'WiFi', 'Climatización'];
    for (const nombre of caracteristicas) {
      const [exists] = await db.query('SELECT 1 FROM caracteristicas WHERE nombre = ? LIMIT 1', [nombre]);
      if (exists.length === 0) {
        await db.query('INSERT INTO caracteristicas (nombre) VALUES (?)', [nombre]);
        console.log(`  ✓ Insertada caracteristica: ${nombre}`);
      } else {
        console.log(`  - Caracteristica ya existe: ${nombre}`);
      }
    }

    // 2) Agregar columnas a clubes si no existen (comprobación robusta)
    console.log('\n2. Verificando columnas en tabla clubes...');
    try {
      // Comprobar en INFORMATION_SCHEMA qué columnas existen
      const dbName = process.env.DB_NAME || 'openpadel';
      const [rows] = await db.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clubes' AND COLUMN_NAME IN ('telefono','imagen_url')",
        [dbName]
      );
      const existing = rows.map(r => r.COLUMN_NAME);

      if (!existing.includes('telefono')) {
        await db.query("ALTER TABLE clubes ADD COLUMN telefono VARCHAR(20) NULL");
        console.log('  ✓ Columna telefono creada');
      } else {
        console.log('  - Columna telefono ya existe');
      }

      if (!existing.includes('imagen_url')) {
        await db.query("ALTER TABLE clubes ADD COLUMN imagen_url VARCHAR(255) NULL");
        console.log('  ✓ Columna imagen_url creada');
      } else {
        console.log('  - Columna imagen_url ya existe');
      }
    } catch (err) {
      console.error('  ❌ Error comprobando/creando columnas en clubes:', err.message);
      throw err;
    }

    // 3) Clubes
    console.log('\n3. Insertando clubes...');
    const clubes = [
      { club_id: 1, nombre: 'BOX Padel', direccion: 'Av. Principal 123',admin_id:1, telefono: '1122334455', imagen_url: '/uploads/clubes/box.jpg' },
      { club_id: 2, nombre: 'Smash Padel', direccion: 'Calle 45 #333',admin_id:3, telefono: '1199887766', imagen_url: '/uploads/clubes/smash.jpg' },
      { club_id: 3, nombre: 'Mundo Padel', direccion: 'Ruta 8 km 52',admin_id:4, telefono: '1144556677', imagen_url: '/uploads/clubes/mundo.jpg' },
      { club_id: 4, nombre: 'Mercedes Padel', direccion: 'Perón 727',admin_id:5, telefono: '2324-444555', imagen_url: '/uploads/clubes/mercedes.jpg' },
    ];

    for (const c of clubes) {
      const [exists] = await db.query('SELECT 1 FROM clubes WHERE club_id = ? LIMIT 1', [c.club_id]);
      if (exists.length === 0) {
        await db.query(
          'INSERT INTO clubes (club_id, nombre, direccion, telefono, imagen_url) VALUES (?, ?, ?, ?, ?)',
          [c.club_id, c.nombre, c.direccion, c.telefono, c.imagen_url]
        );
        console.log(`  ✓ Insertado club: ${c.nombre}`);
      } else {
        console.log(`  - Club ya existe: ${c.nombre}`);
      }
    }

    // 4) Club ↔ Característica (usando IDs 7-10 que son de clubes)
    console.log('\n4. Limpiando relaciones viejas de club_caracteristica...');
    await db.query('DELETE FROM club_caracteristica WHERE caract_id IN (1,2,3,4,5,6)');
    console.log('  ✓ Relaciones viejas eliminadas');

    console.log('\n5. Insertando relaciones club ↔ característica...');
    const relaciones = [
      [1, 7], [1, 8], [1, 9],      // BOX Padel: Estacionamiento, Buffet, WiFi
      [2, 7], [2, 9],              // Smash Padel: Estacionamiento, WiFi
      [3, 8], [3, 9], [3, 10],     // Mundo Padel: Buffet, WiFi, Climatización
      [4, 7], [4, 8], [4, 9], [4, 10] // Mercedes Padel: todas
    ];

    for (const [club_id, caract_id] of relaciones) {
      const [exists] = await db.query('SELECT 1 FROM club_caracteristica WHERE club_id = ? AND caract_id = ? LIMIT 1', [club_id, caract_id]);
      if (exists.length === 0) {
        await db.query('INSERT INTO club_caracteristica (club_id, caract_id) VALUES (?, ?)', [club_id, caract_id]);
        console.log(`  ✓ Relación insertada: club_id=${club_id} ↔ caract_id=${caract_id}`);
      }
    }

    // 5) Canchas (2 por club)
    console.log('\n6. Insertando canchas...');
    const canchas = [
      { cancha_id: 1, club_id: 1, nombre: 'Cancha 1', imagen_url: '/uploads/canchas/1.jpg', precio_base: 1200 },
      { cancha_id: 2, club_id: 1, nombre: 'Cancha 2', imagen_url: '/uploads/canchas/2.jpg', precio_base: 1000 },
      { cancha_id: 3, club_id: 2, nombre: 'Cancha 1', imagen_url: '/uploads/canchas/3.jpg', precio_base: 1100 },
      { cancha_id: 4, club_id: 2, nombre: 'Cancha 2', imagen_url: '/uploads/canchas/4.jpg', precio_base: 900 },
      { cancha_id: 5, club_id: 3, nombre: 'Cancha 1', imagen_url: '/uploads/canchas/5.jpg', precio_base: 1300 },
      { cancha_id: 6, club_id: 3, nombre: 'Cancha 2', imagen_url: '/uploads/canchas/6.jpg', precio_base: 1250 },
      { cancha_id: 7, club_id: 4, nombre: 'Cancha 1', imagen_url: '/uploads/canchas/7.jpg', precio_base: 1400 },
      { cancha_id: 8, club_id: 4, nombre: 'Cancha 2', imagen_url: '/uploads/canchas/8.jpg', precio_base: 1200 },
    ];

    for (const ch of canchas) {
      const [exists] = await db.query('SELECT 1 FROM canchas WHERE cancha_id = ? LIMIT 1', [ch.cancha_id]);
      if (exists.length === 0) {
        await db.query(
          'INSERT INTO canchas (cancha_id, club_id, nombre, imagen_url, precio_base) VALUES (?, ?, ?, ?, ?)',
          [ch.cancha_id, ch.club_id, ch.nombre, ch.imagen_url, ch.precio_base]
        );
        console.log(`  ✓ Insertada cancha: ${ch.nombre} (club_id=${ch.club_id})`);
      } else {
        console.log(`  - Cancha ya existe: ${ch.nombre}`);
      }
    }

    // 6) Reservas de ejemplo
    console.log('\n7. Insertando reservas de ejemplo...');
    const reservas = [
      { reserva_id: 1, cancha_id: 7, usuario_id: 2, fecha: '2025-11-20', hora_inicio: '10:00', hora_fin: '11:30', estado: 'confirmada' },
      { reserva_id: 2, cancha_id: 1, usuario_id: 2, fecha: '2025-11-22', hora_inicio: '19:00', hora_fin: '20:00', estado: 'pendiente' },
      { reserva_id: 3, cancha_id: 2, usuario_id: 2, fecha: '2025-11-25', hora_inicio: '16:00', hora_fin: '17:00', estado: 'confirmada' },
      { reserva_id: 4, cancha_id: 3, usuario_id: 1, fecha: '2025-11-26', hora_inicio: '09:00', hora_fin: '10:00', estado: 'pendiente' },
    ];

    for (const r of reservas) {
      const [exists] = await db.query('SELECT 1 FROM reservas WHERE reserva_id = ? LIMIT 1', [r.reserva_id]);
      if (exists.length === 0) {
        await db.query(
          'INSERT INTO reservas (reserva_id, cancha_id, usuario_id, fecha, hora_inicio, hora_fin, estado, expira_en, solicitada_en) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)',
          [r.reserva_id, r.cancha_id, r.usuario_id, r.fecha, r.hora_inicio, r.hora_fin, r.estado]
        );
        console.log(`  ✓ Insertada reserva ${r.reserva_id} (cancha_id=${r.cancha_id})`);
      } else {
        console.log(`  - Reserva ya existe: ${r.reserva_id}`);
      }
    }

    console.log('\n✓ Seed completado exitosamente.');
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await delay(200);
    process.exit(0);
  }
};

seed();
