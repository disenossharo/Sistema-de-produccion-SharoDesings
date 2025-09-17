const { pool } = require('../config/database');


// Función para calcular tiempo estimado basado en referencias y operaciones
async function calcularTiempoEstimado(tareas, referencias, cantidadAsignada) {
  const client = await pool.connect();
  try {
    console.log('🧮 Calculando tiempo estimado para:', { tareas, referencias, cantidadAsignada });
    
    let tiempoTotal = 0;
    
    for (const tarea of tareas) {
      const operacionId = tarea.id || tarea;
      
      // Buscar la operación con sus referencias vinculadas
      const operacionResult = await client.query(`
        SELECT o.id, o.nombre, o.tiempo_por_unidad,
               COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT(
                     'id', r.id,
                     'codigo', r.codigo,
                     'nombre', r.nombre,
                     'tiempo_por_referencia', COALESCE(ro.tiempo_por_referencia, o.tiempo_por_unidad)
                   )
                 ) FILTER (WHERE r.id IS NOT NULL),
                 '[]'::json
               ) as referencias
        FROM operaciones o
        LEFT JOIN referencia_operaciones ro ON o.id = ro.operacion_id AND ro.activa = true
        LEFT JOIN referencias r ON ro.referencia_id = r.id AND r.activa = true
        WHERE o.id = $1 AND o.activa = true
        GROUP BY o.id, o.nombre, o.tiempo_por_unidad
      `, [operacionId]);
      
      if (operacionResult.rows.length === 0) {
        console.log(`⚠️ Operación ${operacionId} no encontrada, usando tiempo por defecto`);
        continue;
      }
      
      const operacion = operacionResult.rows[0];
      const operacionesVinculadas = operacion.referencias || [];
      
      // Si la operación tiene referencias vinculadas
      if (operacionesVinculadas.length > 0) {
        // Buscar si alguna de las referencias seleccionadas está vinculada a esta operación
        let tiempoOperacion = 0;
        let referenciaEncontrada = false;
        let tieneTiempoEspecifico = false;
        
        for (const refSeleccionada of referencias) {
          const refId = refSeleccionada.id || refSeleccionada;
          const refCodigo = refSeleccionada.codigo || refSeleccionada;
          
          console.log(`🔍 Buscando referencia: ID=${refId}, Código=${refCodigo}`);
          console.log(`📋 Referencias vinculadas disponibles:`, operacionesVinculadas.map(r => `${r.codigo} (${r.tiempo_por_referencia} min)`));
          
          // Buscar en las referencias vinculadas
          const refVinculada = operacionesVinculadas.find(ref => 
            ref.id == refId || ref.codigo === refCodigo
          );
          
          if (refVinculada) {
            referenciaEncontrada = true;
            const tiempoEspecifico = refVinculada.tiempo_por_referencia;
            if (tiempoEspecifico && tiempoEspecifico > 0) {
              // Si hay tiempo específico, usarlo (sumar si hay múltiples referencias)
              tiempoOperacion += tiempoEspecifico;
              tieneTiempoEspecifico = true;
              console.log(`✅ Tiempo específico para ${operacion.nombre} con ${refVinculada.codigo}: ${tiempoEspecifico} min`);
            } else {
              console.log(`⚠️ Referencia ${refVinculada.codigo} vinculada pero sin tiempo específico`);
            }
          } else {
            console.log(`❌ Referencia ${refCodigo} no encontrada en las referencias vinculadas`);
          }
        }
        
        if (referenciaEncontrada && tieneTiempoEspecifico) {
          // Solo usar tiempo por referencia si hay tiempo específico configurado
          tiempoTotal += tiempoOperacion;
          console.log(`✅ Usando tiempo por referencia para ${operacion.nombre}: ${tiempoOperacion} min`);
        } else if (referenciaEncontrada && !tieneTiempoEspecifico) {
          // Si la operación tiene referencias vinculadas pero ninguna tiene tiempo específico,
          // NO usar tiempo por unidad (según requerimiento del usuario)
          console.log(`⚠️ Operación ${operacion.nombre} tiene referencias vinculadas pero sin tiempo específico - NO se calcula tiempo`);
          // No agregar tiempo a tiempoTotal
        } else {
          // Si no se encuentra ninguna referencia vinculada, usar tiempo por unidad
          tiempoTotal += operacion.tiempo_por_unidad;
          console.log(`ℹ️ Usando tiempo por unidad para ${operacion.nombre}: ${operacion.tiempo_por_unidad} min`);
        }
      } else {
        // Si la operación no tiene referencias vinculadas, usar tiempo por unidad
        tiempoTotal += operacion.tiempo_por_unidad;
        console.log(`ℹ️ Operación sin referencias específicas ${operacion.nombre}: ${operacion.tiempo_por_unidad} min`);
      }
    }
    
    // Multiplicar por la cantidad asignada
    const tiempoFinal = tiempoTotal * cantidadAsignada;
    console.log(`🧮 Tiempo calculado: ${tiempoTotal} min/uni × ${cantidadAsignada} uni = ${tiempoFinal} min`);
    
    // Redondear a 1 decimal para evitar números con muchos decimales
    const tiempoFinalRedondeado = Math.round(tiempoFinal * 10) / 10;
    console.log(`🔢 Tiempo final redondeado: ${tiempoFinalRedondeado} min`);
    
    return tiempoFinalRedondeado;
    
  } catch (error) {
    console.error('❌ Error calculando tiempo estimado:', error);
    // En caso de error, retornar 0 para que se use el tiempo por defecto
    return 0;
  } finally {
    client.release();
  }
}



// Calcular tiempo estimado para tareas (endpoint para frontend)
exports.calcularTiempoTareas = async (req, res) => {
  try {
    const { tareas = [], referencias = [], cantidadAsignada = 1 } = req.body;
    
    console.log('🧮 Calculando tiempo para tareas:', { tareas, referencias, cantidadAsignada });
    
    if (!Array.isArray(tareas) || tareas.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos una tarea' });
    }
    
    if (!Array.isArray(referencias) || referencias.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos una referencia' });
    }
    
    const tiempoCalculado = await calcularTiempoEstimado(tareas, referencias, Number(cantidadAsignada));
    
    res.json({
      tiempoEstimado: tiempoCalculado,
      cantidadAsignada: Number(cantidadAsignada),
      tiempoPorUnidad: tiempoCalculado / Number(cantidadAsignada),
      tareas: tareas.length,
      referencias: referencias.length
    });
    
  } catch (error) {
    console.error('❌ Error calculando tiempo de tareas:', error);
    res.status(500).json({ error: 'Error interno del servidor al calcular tiempo' });
  }
};

// Obtener historial de producción del usuario autenticado
exports.getHistorial = async (req, res) => {
  try {
    const email = req.user.email;
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM produccion WHERE empleado_email = $1 ORDER BY created_at DESC',
        [email]
      );
      
      // Obtener todas las operaciones para mapear IDs a nombres
      const operacionesResult = await client.query('SELECT id, nombre FROM operaciones WHERE activa = true');
      const operacionesMap = {};
      operacionesResult.rows.forEach(op => {
        operacionesMap[op.id] = op.nombre;
      });
      
      const historial = result.rows.map(row => {
        // Convertir IDs de tareas a nombres de operaciones
        let tareasNombres = [];
        if (row.tareas && Array.isArray(row.tareas)) {
          tareasNombres = row.tareas.map(tareaId => {
            // Si ya es un nombre (string), mantenerlo
            if (isNaN(tareaId)) {
              return tareaId;
            }
            // Si es un ID (número), convertirlo a nombre
            return operacionesMap[tareaId] || `Operación ${tareaId}`;
          });
        }
        
        return {
          id: row.id,
          tareas: tareasNombres,
          referencias: row.referencia ? row.referencia.split(', ') : [],
          cantidadAsignada: row.cantidad_asignada,
          cantidadHecha: row.cantidad_hecha,
          horaInicio: row.hora_inicio,
          horaFin: row.hora_fin,
          efectividad: row.efectividad,
          observaciones: row.observaciones,
          fecha: row.fecha,
          tiempoEstimado: row.tiempo_estimado,
          tiempoTranscurrido: row.tiempo_transcurrido,
          estado: row.estado
        };
      });
      
      res.json(historial);
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error al obtener historial:', e);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

// Obtener solo tareas activas (en progreso) para el dashboard - OPTIMIZADO
exports.getTareasActivas = async (req, res) => {
  try {
    console.log('🔍 getTareasActivas llamado por:', req.user?.email);
    
    if (!req.user || !req.user.email) {
      console.log('❌ Usuario no autenticado en getTareasActivas');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const client = await pool.connect();
    try {
      console.log('🔄 Ejecutando query para obtener tareas activas...');
      
      // Query optimizada para obtener TODAS las tareas activas, sin importar el estado de presencia
      // Incluye JOIN con operaciones para obtener nombres en lugar de IDs
      const result = await client.query(
        `SELECT p.id, p.empleado_email, p.tareas, p.referencia, p.cantidad_asignada, 
                p.cantidad_hecha, p.hora_inicio, p.efectividad, p.observaciones, 
                p.fecha, p.tiempo_estimado, p.estado, e.nombre as empleado_nombre,
                e.apellidos, e.activo as empleado_activo,
                COALESCE(pr.online, false) as empleado_online,
                COALESCE(pr.last_seen, NOW() - INTERVAL '1 hour') as empleado_last_seen
         FROM produccion p 
         INNER JOIN empleados e ON p.empleado_email = e.email 
         LEFT JOIN presencia pr ON e.email = pr.empleado_email
         WHERE p.estado = 'en_progreso' AND p.hora_fin IS NULL AND e.activo = true
         ORDER BY p.created_at DESC 
         LIMIT 100`
      );
      
      console.log('📊 Tareas activas encontradas en BD:', result.rows.length);
      console.log('📋 Detalle de tareas activas:', result.rows.map(row => ({
        id: row.id,
        empleado_email: row.empleado_email,
        empleado_nombre: row.empleado_nombre,
        estado: row.estado,
        hora_inicio: row.hora_inicio,
        hora_fin: row.hora_fin
      })));
      
      // Obtener todas las operaciones para mapear IDs a nombres
      const operacionesResult = await client.query('SELECT id, nombre FROM operaciones WHERE activa = true');
      const operacionesMap = {};
      operacionesResult.rows.forEach(op => {
        operacionesMap[op.id] = op.nombre;
      });

      // Mapeo optimizado con información de presencia
      const tareasActivas = result.rows.map(row => {
        // Calcular si el empleado está realmente online (más tolerante - 10 minutos)
        const lastSeen = new Date(row.empleado_last_seen);
        const now = new Date();
        const minutesDiff = (now - lastSeen) / (1000 * 60);
        const isActuallyOnline = row.empleado_online && minutesDiff <= 10;
        
        // Convertir IDs de tareas a nombres de operaciones
        let tareasNombres = [];
        if (row.tareas && Array.isArray(row.tareas)) {
          tareasNombres = row.tareas.map(tareaId => {
            // Si ya es un nombre (string), mantenerlo
            if (isNaN(tareaId)) {
              return tareaId;
            }
            // Si es un ID (número), convertirlo a nombre
            return operacionesMap[tareaId] || `Operación ${tareaId}`;
          });
        }
        
        return {
          id: row.id,
          usuario: row.empleado_email,
          empleadoNombre: `${row.empleado_nombre} ${row.apellidos || ''}`.trim(),
          empleadoOnline: isActuallyOnline,
          empleadoLastSeen: row.empleado_last_seen,
          tareas: tareasNombres,
          referencias: (() => {
            const refs = row.referencia ? row.referencia.split(', ') : [];
            console.log('🔍 [DEBUG] Referencias para empleado:', row.empleado_email, 'Original:', row.referencia, 'Procesado:', refs);
            return refs;
          })(),
          cantidadAsignada: row.cantidad_asignada,
          cantidadHecha: row.cantidad_hecha,
          horaInicio: row.hora_inicio,
          horaFin: null, // Siempre null para tareas activas
          efectividad: row.efectividad,
          observaciones: row.observaciones,
          fecha: row.fecha,
          tiempoEstimado: row.tiempo_estimado,
          estado: row.estado
        };
      });
      
      console.log('✅ Tareas activas mapeadas:', tareasActivas.length);
      console.log('📤 Enviando respuesta con tareas activas:', tareasActivas.map(t => ({
        id: t.id,
        usuario: t.usuario,
        empleadoNombre: t.empleadoNombre,
        empleadoOnline: t.empleadoOnline,
        estado: t.estado
      })));
      
      res.json(tareasActivas);
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('❌ Error al obtener tareas activas:', e);
    console.error('🔍 Stack trace:', e.stack);
    res.status(500).json({ error: 'Error al obtener tareas activas' });
  }
};

// Obtener todas las tareas de todos los empleados - OPTIMIZADO
exports.getAllTareas = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const client = await pool.connect();
    try {
      // Query optimizada con paginación
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      
      const result = await client.query(
        `SELECT p.id, p.empleado_email, p.tareas, p.referencia, p.cantidad_asignada, 
                p.cantidad_hecha, p.hora_inicio, p.hora_fin, p.efectividad, 
                p.observaciones, p.fecha, p.tiempo_estimado, p.estado, 
                e.nombre as empleado_nombre
         FROM produccion p 
         INNER JOIN empleados e ON p.empleado_email = e.email 
         ORDER BY p.created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      // Obtener todas las operaciones para mapear IDs a nombres
      const operacionesResult = await client.query('SELECT id, nombre FROM operaciones WHERE activa = true');
      const operacionesMap = {};
      operacionesResult.rows.forEach(op => {
        operacionesMap[op.id] = op.nombre;
      });

      const allTareas = result.rows.map(row => {
        // Convertir IDs de tareas a nombres de operaciones
        let tareasNombres = [];
        if (row.tareas && Array.isArray(row.tareas)) {
          tareasNombres = row.tareas.map(tareaId => {
            // Si ya es un nombre (string), mantenerlo
            if (isNaN(tareaId)) {
              return tareaId;
            }
            // Si es un ID (número), convertirlo a nombre
            return operacionesMap[tareaId] || `Operación ${tareaId}`;
          });
        }
        
        return {
          id: row.id,
          usuario: row.empleado_email,
          empleadoNombre: row.empleado_nombre,
          tareas: tareasNombres,
          referencias: row.referencia ? row.referencia.split(', ') : [],
          cantidadAsignada: row.cantidad_asignada,
          cantidadHecha: row.cantidad_hecha,
          horaInicio: row.hora_inicio,
          horaFin: row.hora_fin,
          efectividad: row.efectividad,
          observaciones: row.observaciones,
          fecha: row.fecha,
          tiempoEstimado: row.tiempo_estimado,
          estado: row.estado
        };
      });
      
      res.json(allTareas);
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error al obtener todas las tareas:', e);
    res.status(500).json({ error: 'Error al obtener todas las tareas' });
  }
};

// Crear una tarea en progreso (cuando el empleado inicia una tarea)
exports.crearTareaEnProgreso = async (req, res) => {
  try {
    const email = req.user.email;
    const {
      tareas = [],
      referencias = [],
      referencia = '', // Mantener compatibilidad con sistema anterior
      cantidadAsignada = 0,
      tiempoEstimado = 0,
      observaciones = ''
    } = req.body;
    
    console.log('🔍 Datos recibidos para crear tarea:', {
      email,
      tareas,
      referencias,
      cantidadAsignada,
      tiempoEstimado,
      observaciones
    });
    
    // Validaciones
    if (!email) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }
    
    if (!Array.isArray(tareas) || tareas.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos una tarea' });
    }
    
    // Determinar las referencias a usar (compatibilidad con sistema anterior)
    let referenciasFinales = [];
    if (Array.isArray(referencias) && referencias.length > 0) {
      referenciasFinales = referencias;
    } else if (referencia && referencia.trim().length > 0) {
      referenciasFinales = [referencia.trim()];
    } else {
      return res.status(400).json({ error: 'Debe seleccionar al menos una referencia' });
    }
    
    if (!cantidadAsignada || isNaN(cantidadAsignada) || Number(cantidadAsignada) <= 0) {
      return res.status(400).json({ error: 'Cantidad asignada debe ser mayor a 0' });
    }
    
    // Calcular tiempo estimado basado en referencias y operaciones
    console.log('🧮 Calculando tiempo estimado automáticamente...');
    const tiempoCalculado = await calcularTiempoEstimado(tareas, referenciasFinales, Number(cantidadAsignada));
    
    // SIEMPRE usar el tiempo calculado automáticamente por el backend (es el correcto)
    const tiempoEstimadoFinal = tiempoCalculado;
    
    console.log(`✅ Tiempo estimado - Frontend: ${tiempoEstimado} min, Calculado: ${tiempoCalculado} min, Usando: ${tiempoEstimadoFinal} min (BACKEND CALCULADO)`);
    
    // Validar tiempo estimado final
    if (tiempoEstimadoFinal < 0) {
      console.log('⚠️ Tiempo estimado negativo:', tiempoEstimadoFinal);
      return res.status(400).json({ error: 'Tiempo estimado no puede ser negativo' });
    }
    
    console.log('✅ Tarea creada - Usuario:', email, 'Refs:', referenciasFinales);
    
    const client = await pool.connect();
    try {
      // Verificar si ya hay una tarea en progreso para este usuario
      const existingTask = await client.query(
        'SELECT id FROM produccion WHERE empleado_email = $1 AND estado = \'en_progreso\' AND hora_fin IS NULL',
        [email]
      );
      
      if (existingTask.rows.length > 0) {
        return res.status(409).json({ error: 'Ya tienes una tarea en progreso. Finaliza la tarea actual antes de iniciar una nueva.' });
      }
      
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const fecha = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      
      console.log('📝 Insertando tarea en base de datos con datos:', {
        email,
        tareas,
        referencias: referenciasFinales,
        cantidadAsignada: Number(cantidadAsignada),
        tiempoEstimado: tiempoEstimadoFinal,
        observaciones: observaciones ? observaciones.trim() : ''
      });
      
      // Preparar parámetros para la inserción
      const insertParams = [
        email, 
        tareas, 
        referenciasFinales.join(', '), // Unir referencias con comas para almacenar
        Number(cantidadAsignada), 
        0, 
        now, 
        null, 
        null, 
        observaciones ? observaciones.trim() : '', 
        fecha, 
        tiempoEstimadoFinal, 
        'en_progreso'
      ];
      
      console.log('📝 Parámetros de inserción:', insertParams);
      
      const result = await client.query(
        `INSERT INTO produccion (
          empleado_email, tareas, referencia, cantidad_asignada, cantidad_hecha, 
          hora_inicio, hora_fin, efectividad, observaciones, fecha, tiempo_estimado, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        insertParams
      );
      
      const tareaGuardada = result.rows[0];
      res.status(201).json({
        id: tareaGuardada.id,
        tareas: tareaGuardada.tareas || [],
        referencias: tareaGuardada.referencia ? tareaGuardada.referencia.split(', ') : [],
        cantidadAsignada: tareaGuardada.cantidad_asignada,
        cantidadHecha: tareaGuardada.cantidad_hecha,
        horaInicio: tareaGuardada.hora_inicio,
        horaFin: tareaGuardada.hora_fin,
        efectividad: tareaGuardada.efectividad,
        observaciones: tareaGuardada.observaciones,
        fecha: tareaGuardada.fecha,
        tiempoEstimado: tareaGuardada.tiempo_estimado,
        estado: tareaGuardada.estado
      });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('💥 Error al crear tarea en progreso:', e);
    res.status(500).json({ error: 'Error interno del servidor al crear tarea en progreso' });
  }
};

// Actualizar tarea finalizada (cuando el empleado termina una tarea)
exports.actualizarTareaFinalizada = async (req, res) => {
  try {
    const email = req.user.email;
    const { tareaId } = req.params;
    const {
      cantidadHecha,
      efectividad,
      tiempoTranscurrido,
      observaciones = ''
    } = req.body;
    
    console.log('🔄 Actualizando tarea finalizada:', {
      email,
      tareaId,
      cantidadHecha,
      efectividad,
      tiempoTranscurrido,
      observaciones
    });
    
    // Validaciones
    if (!email) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }
    
    if (!tareaId || isNaN(tareaId)) {
      return res.status(400).json({ error: 'ID de tarea inválido' });
    }
    
    if (cantidadHecha === undefined || cantidadHecha === null || isNaN(cantidadHecha) || Number(cantidadHecha) < 0) {
      return res.status(400).json({ error: 'Cantidad hecha debe ser un número válido mayor o igual a 0' });
    }
    
    if (efectividad === undefined || efectividad === null || isNaN(efectividad) || Number(efectividad) < 0 || Number(efectividad) > 100) {
      return res.status(400).json({ error: 'Efectividad debe ser un número válido entre 0 y 100' });
    }
    
    console.log('✅ Tarea finalizada - Usuario:', email, 'Efectividad:', efectividad);
    
    const client = await pool.connect();
    try {
      // Verificar que la tarea existe y pertenece al usuario
      const existingTask = await client.query(
        'SELECT * FROM produccion WHERE id = $1 AND empleado_email = $2 AND estado = \'en_progreso\'',
        [tareaId, email]
      );
      
      if (existingTask.rows.length === 0) {
        return res.status(404).json({ error: 'Tarea no encontrada o ya finalizada' });
      }
      
      const tarea = existingTask.rows[0];
      
      // Validar que la cantidad hecha no exceda la asignada
      if (Number(cantidadHecha) > Number(tarea.cantidad_asignada)) {
        return res.status(400).json({ error: 'La cantidad hecha no puede exceder la cantidad asignada' });
      }
      
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const fecha = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      
      // Calcular tiempo transcurrido si no se proporciona
      let tiempoFinal = tiempoTranscurrido;
      if (!tiempoFinal && tarea.hora_inicio) {
        tiempoFinal = (now - new Date(tarea.hora_inicio)) / 1000 / 60; // en minutos
      }
      
      console.log('⏱️ Tiempo calculado:', {
        tiempoRecibido: tiempoTranscurrido,
        tiempoCalculado: tiempoFinal,
        horaInicio: tarea.hora_inicio,
        horaFin: now
      });
      
      const result = await client.query(
        `UPDATE produccion 
         SET cantidad_hecha = $1, efectividad = $2, hora_fin = $3, observaciones = $4, fecha = $5, estado = $6, tiempo_transcurrido = $7
         WHERE id = $8 AND empleado_email = $9
         RETURNING *`,
        [Number(cantidadHecha), Number(efectividad), now, observaciones ? observaciones.trim() : '', fecha, 'finalizada', tiempoFinal, tareaId, email]
      );
      
      const tareaActualizada = result.rows[0];
      console.log('✅ Tarea actualizada exitosamente:', {
        id: tareaActualizada.id,
        efectividad: tareaActualizada.efectividad,
        tiempoTranscurrido: tareaActualizada.tiempo_transcurrido
      });
      
      res.json({
        id: tareaActualizada.id,
        tareas: tareaActualizada.tareas || [],
        referencias: tareaActualizada.referencia ? tareaActualizada.referencia.split(', ') : [],
        cantidadAsignada: tareaActualizada.cantidad_asignada,
        cantidadHecha: tareaActualizada.cantidad_hecha,
        horaInicio: tareaActualizada.hora_inicio,
        horaFin: tareaActualizada.hora_fin,
        efectividad: tareaActualizada.efectividad,
        observaciones: tareaActualizada.observaciones,
        fecha: tareaActualizada.fecha,
        tiempoEstimado: tareaActualizada.tiempo_estimado,
        tiempoTranscurrido: tareaActualizada.tiempo_transcurrido,
        estado: tareaActualizada.estado
      });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('💥 Error al actualizar tarea finalizada:', e);
    res.status(500).json({ error: 'Error interno del servidor al actualizar tarea finalizada' });
  }
};

// Obtener tareas del día para un empleado específico
exports.getTareasDelDia = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Email del empleado requerido' });
    }
    
    const hoy = new Date().toLocaleDateString();
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM produccion WHERE empleado_email = $1 ORDER BY created_at DESC',
        [email]
      );
      
      const tareasDelDia = result.rows.filter(row => {
        if (!row.fecha) return false;
        const fechaTarea = typeof row.fecha === 'string' ? row.fecha.split(',')[0].trim() : '';
        const [dia, mes, anio] = fechaTarea.split('/');
        const fechaTareaObj = new Date(anio, mes - 1, dia);
        return fechaTareaObj.toLocaleDateString() === hoy;
      }).map(row => ({
        id: row.id,
        tareas: row.tareas || [],
        referencias: row.referencia ? row.referencia.split(', ') : [],
        cantidadAsignada: row.cantidad_asignada,
        cantidadHecha: row.cantidad_hecha,
        horaInicio: row.hora_inicio,
        horaFin: row.hora_fin,
        efectividad: row.efectividad,
        observaciones: row.observaciones,
        fecha: row.fecha,
        tiempoEstimado: row.tiempo_estimado,
        estado: row.estado
      }));
      
      res.json(tareasDelDia);
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('💥 Error en getTareasDelDia:', e);
    res.status(500).json({ error: 'Error interno del servidor al obtener tareas del día' });
  }
};

// Obtener estadísticas para el admin
exports.getEstadisticas = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const client = await pool.connect();
    try {
      // Contar empleados totales
      const empleadosResult = await client.query('SELECT COUNT(*) FROM empleados');
      const totalEmpleados = parseInt(empleadosResult.rows[0].count);
      
      // Contar empleados activos (con presencia reciente)
      const presenciaResult = await client.query(
        'SELECT COUNT(DISTINCT empleado_email) FROM presencia WHERE online = true AND last_seen > NOW() - INTERVAL \'5 minutes\''
      );
      const empleadosActivos = parseInt(presenciaResult.rows[0].count);
      
      // Contar tareas activas
      const tareasActivasResult = await client.query(
        'SELECT COUNT(*) FROM produccion WHERE estado = \'en_progreso\' AND hora_fin IS NULL'
      );
      const tareasActivas = parseInt(tareasActivasResult.rows[0].count);
      
      // Contar tareas completadas hoy
      const fechaHoy = new Date();
      const dia = fechaHoy.getDate().toString().padStart(2, '0');
      const mes = (fechaHoy.getMonth() + 1).toString().padStart(2, '0');
      const anio = fechaHoy.getFullYear();
      const fechaHoyStr = `${dia}/${mes}/${anio}`;
      
      const tareasHoyResult = await client.query(
        'SELECT COUNT(*) FROM produccion WHERE estado = \'finalizada\' AND fecha LIKE $1',
        [`${fechaHoyStr}%`]
      );
      const tareasCompletadasHoy = parseInt(tareasHoyResult.rows[0].count);
      
      // Calcular promedio de efectividad
      const efectividadResult = await client.query(
        'SELECT AVG(efectividad) FROM produccion WHERE estado = \'finalizada\' AND efectividad IS NOT NULL AND fecha LIKE $1',
        [`${fechaHoyStr}%`]
      );
      const promedioEfectividad = efectividadResult.rows[0].avg ? Math.round(parseFloat(efectividadResult.rows[0].avg)) : 100;
      
      // Calcular tiempo promedio de tareas completadas hoy
      const tiempoResult = await client.query(
        'SELECT AVG(tiempo_transcurrido) FROM produccion WHERE estado = \'finalizada\' AND tiempo_transcurrido > 0 AND fecha LIKE $1',
        [`${fechaHoyStr}%`]
      );
      const tiempoPromedio = tiempoResult.rows[0].avg ? Math.round(parseFloat(tiempoResult.rows[0].avg) * 10) / 10 : 0;
      
      // Calcular efectividad total del día (promedio ponderado)
      const efectividadDetalladaResult = await client.query(
        `SELECT 
           COUNT(*) as total_tareas,
           AVG(efectividad) as efectividad_promedio,
           SUM(tiempo_transcurrido) as tiempo_total,
           AVG(tiempo_transcurrido) as tiempo_promedio
         FROM produccion 
         WHERE estado = 'finalizada' AND fecha LIKE $1`,
        [`${fechaHoyStr}%`]
      );
      
      const efectividadDetallada = efectividadDetalladaResult.rows[0];
      const efectividadTotal = efectividadDetallada.efectividad_promedio ? 
        Math.round(parseFloat(efectividadDetallada.efectividad_promedio)) : 100;
      
      // Contar total de tareas
      const totalTareasResult = await client.query('SELECT COUNT(*) FROM produccion');
      const totalTareas = parseInt(totalTareasResult.rows[0].count);
      
      const estadisticas = {
        totalEmpleados,
        empleadosActivos,
        tareasActivas,
        tareasCompletadasHoy,
        promedioEfectividad: efectividadTotal,
        tiempoPromedio,
        tiempoTotal: efectividadDetallada.tiempo_total || 0,
        totalTareas
      };
      
      res.json(estadisticas);
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error al obtener estadísticas:', e);
    res.json({
      totalEmpleados: 0,
      empleadosActivos: 0,
      tareasActivas: 0,
      tareasCompletadasHoy: 0,
      promedioEfectividad: 100,
      totalTareas: 0
    });
  }
};

// Función auxiliar para buscar tareas activas de manera más agresiva
async function buscarTareaActivaAgresiva(email, client) {
  try {
    console.log('🔍 [AGRESIVA] Iniciando búsqueda agresiva para:', email);
    
    // 1. Buscar tareas en progreso sin hora_fin
    let result = await client.query(
      'SELECT * FROM produccion WHERE empleado_email = $1 AND estado = \'en_progreso\' AND hora_fin IS NULL ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ [AGRESIVA] Encontrada tarea en progreso estándar');
      return result.rows[0];
    }
    
    // 2. Buscar cualquier tarea sin hora_fin (independientemente del estado)
    result = await client.query(
      'SELECT * FROM produccion WHERE empleado_email = $1 AND hora_fin IS NULL ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ [AGRESIVA] Encontrada tarea sin hora_fin, forzando estado a en_progreso');
      const tarea = result.rows[0];
      
      // Actualizar el estado a en_progreso si no lo está
      if (tarea.estado !== 'en_progreso') {
        await client.query(
          'UPDATE produccion SET estado = \'en_progreso\' WHERE id = $1',
          [tarea.id]
        );
        tarea.estado = 'en_progreso';
        console.log('🔄 [AGRESIVA] Estado actualizado a en_progreso para tarea:', tarea.id);
      }
      
      return tarea;
    }
    
    // 3. Buscar la tarea más reciente del día actual
    const hoy = new Date().toISOString().split('T')[0];
    result = await client.query(
      'SELECT * FROM produccion WHERE empleado_email = $1 AND DATE(created_at) = $2 ORDER BY created_at DESC LIMIT 1',
      [email, hoy]
    );
    
    if (result.rows.length > 0) {
      const tarea = result.rows[0];
      console.log('✅ [AGRESIVA] Encontrada tarea del día actual, verificando si se puede reactivar');
      
      // Si la tarea no tiene hora_fin, la reactivamos
      if (!tarea.hora_fin) {
        await client.query(
          'UPDATE produccion SET estado = \'en_progreso\' WHERE id = $1',
          [tarea.id]
        );
        tarea.estado = 'en_progreso';
        console.log('🔄 [AGRESIVA] Tarea del día reactivada:', tarea.id);
        return tarea;
      }
    }
    
    console.log('❌ [AGRESIVA] No se encontró ninguna tarea activa');
    return null;
  } catch (error) {
    console.error('💥 [AGRESIVA] Error en búsqueda agresiva:', error);
    return null;
  }
}

// Obtener tarea en progreso del usuario autenticado
exports.getTareaEnProgreso = async (req, res) => {
  let client = null;
  try {
    console.log('🔍 [DEBUG] getTareaEnProgreso iniciado');
    
    const email = req.user?.email;
    console.log('📧 [DEBUG] Email del usuario:', email);
    
    if (!email) {
      console.log('❌ [DEBUG] No hay email de usuario');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    console.log('🔌 [DEBUG] Conectando a la base de datos...');
    client = await pool.connect();
    console.log('✅ [DEBUG] Conexión a BD exitosa');
    
    console.log('🔍 [DEBUG] Ejecutando consulta...');
    const result = await client.query(
      'SELECT * FROM produccion WHERE empleado_email = $1 AND estado = \'en_progreso\' AND hora_fin IS NULL ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    console.log('✅ [DEBUG] Consulta ejecutada, filas encontradas:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('❌ [DEBUG] No se encontraron tareas en progreso');
      return res.json(null);
    }
    
    const tareaData = result.rows[0];
    console.log('📋 [DEBUG] Tarea encontrada:', {
      id: tareaData.id,
      estado: tareaData.estado,
      hora_inicio: tareaData.hora_inicio,
      hora_fin: tareaData.hora_fin
    });
    
    // Verificación básica
    if (!tareaData.hora_inicio) {
      console.log('⚠️ [DEBUG] Tarea sin hora_inicio');
      return res.json(null);
    }
    
    // Intentar convertir IDs a nombres (con protección)
    let tareasNombres = [];
    try {
      console.log('🔄 [DEBUG] Convirtiendo IDs a nombres...');
      tareasNombres = await convertirIdsANombres(tareaData.tareas, client);
      console.log('✅ [DEBUG] Conversión exitosa:', tareasNombres);
    } catch (conversionError) {
      console.error('⚠️ [DEBUG] Error en conversión, usando IDs originales:', conversionError);
      tareasNombres = tareaData.tareas || [];
    }
    
    const response = {
      id: tareaData.id,
      tareas: tareasNombres,
      referencias: tareaData.referencia ? tareaData.referencia.split(', ') : [],
      cantidadAsignada: tareaData.cantidad_asignada,
      cantidadHecha: tareaData.cantidad_hecha,
      horaInicio: tareaData.hora_inicio,
      horaFin: tareaData.hora_fin,
      efectividad: tareaData.efectividad,
      observaciones: tareaData.observaciones,
      fecha: tareaData.fecha,
      tiempoEstimado: tareaData.tiempo_estimado,
      estado: tareaData.estado
    };
    
    console.log('✅ [SUCCESS] Enviando respuesta:', {
      id: response.id,
      tareas: response.tareas,
      estado: response.estado
    });
    
    res.json(response);
    
  } catch (e) {
    console.error('💥 [ERROR] Error completo en getTareaEnProgreso:', {
      message: e.message,
      stack: e.stack,
      name: e.name
    });
    res.status(500).json({ 
      error: 'Error interno del servidor al obtener tarea en progreso',
      details: e.message 
    });
  } finally {
    if (client) {
      try {
        console.log('🔌 [DEBUG] Liberando conexión...');
        client.release();
        console.log('✅ [DEBUG] Conexión liberada');
      } catch (releaseError) {
        console.error('⚠️ [DEBUG] Error liberando conexión:', releaseError);
      }
    }
  }
};

// Exportar datos a Excel (mantener la funcionalidad existente)
exports.exportarAExcel = async (req, res) => {
  try {
    const { email, filtro, fechaInicio, fechaFin } = req.body;
    console.log('📊 Exportando a Excel - Empleado:', email);
    
    if (!email) {
      return res.status(400).json({ error: 'Email del empleado requerido' });
    }
    
    const client = await pool.connect();
    try {
      // Obtener datos del empleado
      const empleadoResult = await client.query(
        'SELECT * FROM empleados WHERE email = $1',
        [email]
      );
      const empleado = empleadoResult.rows[0] || { nombre: email, email: email };
      
      // Obtener todas las tareas del empleado
      const tareasResult = await client.query(
        'SELECT * FROM produccion WHERE empleado_email = $1 ORDER BY created_at DESC',
        [email]
      );
      const todasLasTareas = tareasResult.rows.map(row => ({
        id: row.id,
        tareas: row.tareas || [],
        referencias: row.referencia ? row.referencia.split(', ') : [],
        cantidadAsignada: row.cantidad_asignada,
        cantidadHecha: row.cantidad_hecha,
        horaInicio: row.hora_inicio,
        horaFin: row.hora_fin,
        efectividad: row.efectividad,
        observaciones: row.observaciones,
        fecha: row.fecha,
        tiempoEstimado: row.tiempo_estimado,
        estado: row.estado
      }));
      
      // Filtrar tareas según el filtro (mantener lógica existente)
      let tareasFiltradas = todasLasTareas;
      if (filtro === 'dia' && fechaInicio) {
        const fecha = new Date(fechaInicio);
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        const fechaStr = `${dia}/${mes}/${anio}`;
        
        tareasFiltradas = todasLasTareas.filter(tarea => {
          if (!tarea.fecha) return false;
          const fechaTarea = tarea.fecha.split(',')[0].trim();
          return fechaTarea === fechaStr;
        });
      } else if (filtro === 'semana' && fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        
        tareasFiltradas = todasLasTareas.filter(tarea => {
          if (!tarea.fecha) return false;
          const fechaTarea = tarea.fecha.split(',')[0].trim();
          const [dia, mes, anio] = fechaTarea.split('/');
          const fechaTareaObj = new Date(anio, mes - 1, dia);
          return fechaTareaObj >= inicio && fechaTareaObj <= fin;
        });
      } else if (filtro === 'mes' && fechaInicio) {
        const fecha = new Date(fechaInicio);
        const mes = fecha.getMonth();
        const anio = fecha.getFullYear();
        
        tareasFiltradas = todasLasTareas.filter(tarea => {
          if (!tarea.fecha) return false;
          const fechaTarea = tarea.fecha.split(',')[0].trim();
          const [dia, mesTarea, anioTarea] = fechaTarea.split('/');
          const fechaTareaObj = new Date(anioTarea, mesTarea - 1, dia);
          return fechaTareaObj.getMonth() === mes && fechaTareaObj.getFullYear() === anio;
        });
      }
      
      // Importar ExcelJS y generar archivo (mantener código existente)
      const ExcelJS = require('exceljs');
      
      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Producción Sharo';
      workbook.lastModifiedBy = 'Admin';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Crear hoja principal
      const worksheet = workbook.addWorksheet('Análisis Completo');
      
      // Definir estilos
      const tituloStyle = {
        font: { bold: true, size: 16, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };
      
      const subtituloStyle = {
        font: { bold: true, size: 14, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '5B9BD5' } },
        alignment: { horizontal: 'left', vertical: 'middle' }
      };
      
      const headerStyle = {
        font: { bold: true, size: 12, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        }
      };
      
      const dataStyle = {
        font: { size: 11 },
        border: {
          top: { style: 'thin', color: { argb: 'CCCCCC' } },
          left: { style: 'thin', color: { argb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
          right: { style: 'thin', color: { argb: 'CCCCCC' } }
        }
      };
      
      const resumenStyle = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        }
      };
      
      // Agregar título principal
      const tituloRow = worksheet.addRow(['ANÁLISIS DE PRODUCTIVIDAD - EMPLEADO']);
      worksheet.mergeCells('A1:H1');
      tituloRow.getCell(1).style = tituloStyle;
      worksheet.addRow([]); // Línea en blanco
      
      // Agregar información del empleado
      worksheet.addRow(['INFORMACIÓN DEL EMPLEADO']);
      worksheet.mergeCells('A3:H3');
      worksheet.getRow(3).getCell(1).style = subtituloStyle;
      
      worksheet.addRow(['Nombre:', empleado.nombre || 'N/A', '', '', '', '', '', '']);
      worksheet.addRow(['Email:', empleado.email || 'N/A', '', '', '', '', '', '']);
      worksheet.addRow(['Cargo:', empleado.cargo_maquina || 'N/A', '', '', '', '', '', '']);
      worksheet.addRow(['Cédula:', empleado.cedula || 'N/A', '', '', '', '', '', '']);
      worksheet.addRow([]); // Línea en blanco
      
      // Agregar período de análisis
      worksheet.addRow(['PERÍODO DE ANÁLISIS']);
      worksheet.mergeCells('A9:H9');
      worksheet.getRow(9).getCell(1).style = subtituloStyle;
      
      worksheet.addRow(['Filtro:', filtro === 'dia' ? 'Por Día' : filtro === 'semana' ? 'Por Semana' : 'Por Mes', '', '', '', '', '', '']);
      worksheet.addRow(['Total de tareas:', tareasFiltradas.length, '', '', '', '', '', '']);
      worksheet.addRow(['Fecha de exportación:', new Date().toLocaleString(), '', '', '', '', '', '']);
      worksheet.addRow([]); // Línea en blanco
      
      // Agregar encabezados de tabla
      worksheet.addRow(['DETALLE DE TAREAS']);
      worksheet.mergeCells('A14:H14');
      worksheet.getRow(14).getCell(1).style = subtituloStyle;
      worksheet.addRow([]); // Línea en blanco
      
      const headers = ['Fecha', 'Tareas', 'Referencia', 'Cantidad Asignada', 'Cantidad Hecha', 'Efectividad (%)', 'Estado', 'Observaciones'];
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell, colNumber) => {
        cell.style = headerStyle;
      });
      
      // Agregar datos de las tareas
      tareasFiltradas.forEach((tarea, index) => {
        const dataRow = worksheet.addRow([
          tarea.fecha || '-',
          Array.isArray(tarea.tareas) ? tarea.tareas.join('; ') : tarea.tareas || '-',
          tarea.referencia || '-',
          tarea.cantidadAsignada || '-',
          tarea.cantidadHecha || '-',
          tarea.efectividad || '-',
          tarea.estado === 'finalizada' ? 'Completada' : 'En Progreso',
          tarea.observaciones || '-'
        ]);
        
        // Aplicar estilo alternado a las filas
        const isEvenRow = index % 2 === 0;
        dataRow.eachCell((cell, colNumber) => {
          cell.style = {
            ...dataStyle,
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: isEvenRow ? 'F2F2F2' : 'FFFFFF' } }
          };
        });
      });
      
      // Agregar resumen al final
      if (tareasFiltradas.length > 0) {
        const tareasCompletadas = tareasFiltradas.filter(t => t.estado === 'finalizada').length;
        const promedioEfectividad = tareasFiltradas
          .filter(t => t.efectividad && t.efectividad !== '-')
          .reduce((acc, t) => acc + Number(t.efectividad), 0) / 
          tareasFiltradas.filter(t => t.efectividad && t.efectividad !== '-').length;
        
        worksheet.addRow([]); // Línea en blanco
        worksheet.addRow(['RESUMEN']);
        worksheet.mergeCells(`A${worksheet.rowCount}:H${worksheet.rowCount}`);
        worksheet.getRow(worksheet.rowCount).getCell(1).style = subtituloStyle;
        
        const resumenData = [
          ['Total tareas:', tareasFiltradas.length, '', '', '', '', '', ''],
          ['Tareas completadas:', tareasCompletadas, '', '', '', '', '', ''],
          ['Tareas en progreso:', tareasFiltradas.length - tareasCompletadas, '', '', '', '', '', ''],
          ['Promedio efectividad:', isNaN(promedioEfectividad) ? 'N/A' : promedioEfectividad.toFixed(1) + '%', '', '', '', '', '', '']
        ];
        
        resumenData.forEach(rowData => {
          const resumenRow = worksheet.addRow(rowData);
          resumenRow.getCell(1).style = resumenStyle;
          resumenRow.getCell(2).style = resumenStyle;
        });
      }
      
      // Configurar anchos de columna
      worksheet.columns = [
        { key: 'A', width: 20 }, // Fecha
        { key: 'B', width: 40 }, // Tareas
        { key: 'C', width: 20 }, // Referencia
        { key: 'D', width: 18 }, // Cantidad Asignada
        { key: 'E', width: 18 }, // Cantidad Hecha
        { key: 'F', width: 15 }, // Efectividad
        { key: 'G', width: 15 }, // Estado
        { key: 'H', width: 40 }  // Observaciones
      ];
      
      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Configurar headers para descarga
      const nombreEmpleado = empleado.nombre || empleado.email;
      const fechaExport = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Analisis_${nombreEmpleado}_${fechaExport}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.setHeader('Content-Length', buffer.length);
      
      // Archivo Excel generado exitosamente
      res.send(buffer);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('💥 Error al exportar a Excel:', error);
    res.status(500).json({ error: 'Error interno del servidor al exportar a Excel' });
  }
};

// Obtener TODOS los empleados activos para el dashboard (sin filtro de presencia)
exports.getEmpleadosActivos = async (req, res) => {
  try {
    console.log('🔍 getEmpleadosActivos llamado por:', req.user?.email);
    
    if (!req.user || !req.user.email) {
      console.log('❌ Usuario no autenticado en getEmpleadosActivos');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    console.log('👥 Obteniendo TODOS los empleados activos');
    
    const client = await pool.connect();
    try {
      // Obtener TODOS los empleados activos (no admin)
      const empleadosResult = await client.query(`
        SELECT 
          e.email as empleado_email,
          e.nombre,
          e.apellidos,
          e.is_admin,
          e.activo,
          e.cedula,
          e.cargo_maquina
        FROM empleados e
        WHERE e.is_admin = false AND e.activo = true
        ORDER BY e.nombre ASC
      `);
      
      console.log('📊 Empleados activos encontrados:', empleadosResult.rows.length);
      console.log('📋 Lista completa de empleados activos:', empleadosResult.rows.map(row => ({
        email: row.empleado_email,
        nombre: row.nombre,
        apellidos: row.apellidos,
        is_admin: row.is_admin,
        activo: row.activo
      })));
      
      const empleados = empleadosResult.rows.map(row => ({
        id: row.empleado_email,
        email: row.empleado_email,
        nombre: `${row.nombre} ${row.apellidos || ''}`.trim(),
        cedula: row.cedula || '',
        cargoMaquina: row.cargo_maquina || '',
        isAdmin: row.is_admin,
        activo: row.activo
      }));
      
      console.log('✅ Empleados activos procesados:', empleados.length);
      console.log('📤 Enviando respuesta con empleados activos:', empleados.map(e => ({
        id: e.id,
        nombre: e.nombre,
        activo: e.activo
      })));
      
      res.json(empleados);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error obteniendo empleados activos:', error);
    console.error('🔍 Stack trace:', error.stack);
    res.status(500).json({ error: 'Error obteniendo empleados activos', details: error.message });
  }
};

// Obtener presencia de empleados
exports.getPresencia = async (req, res) => {
  try {
    console.log('🔍 getPresencia llamado por:', req.user?.email);
    
    if (!req.user || !req.user.email) {
      console.log('❌ Usuario no autenticado en getPresencia');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    console.log('👥 Obteniendo presencia de empleados');
    
    const client = await pool.connect();
    try {
      // Primero obtener TODOS los empleados activos (no admin)
      const empleadosResult = await client.query(`
        SELECT 
          e.email as empleado_email,
          e.nombre,
          e.apellidos,
          e.is_admin,
          e.activo
        FROM empleados e
        WHERE e.is_admin = false AND e.activo = true
        ORDER BY e.nombre ASC
      `);
      
      console.log('📊 Empleados activos encontrados:', empleadosResult.rows.length);
      console.log('📋 Lista de empleados activos:', empleadosResult.rows.map(row => ({
        email: row.empleado_email,
        nombre: row.nombre,
        apellidos: row.apellidos,
        is_admin: row.is_admin,
        activo: row.activo
      })));
      
      // Luego obtener su estado de presencia
      const presencias = await Promise.all(empleadosResult.rows.map(async (empleado) => {
        const presenciaResult = await client.query(`
          SELECT online, last_seen
          FROM presencia 
          WHERE empleado_email = $1
        `, [empleado.empleado_email]);
        
        const presencia = presenciaResult.rows[0];
        const online = presencia ? presencia.online : false;
        const lastSeen = presencia ? presencia.last_seen : new Date(Date.now() - 60 * 60 * 1000); // 1 hora atrás si no hay registro
        
        // Marcar como offline si han pasado más de 5 minutos (más tolerante)
        const now = new Date();
        const minutesDiff = (now - lastSeen) / (1000 * 60);
        const isActuallyOnline = online && minutesDiff <= 5;
        
        console.log(`👤 Empleado ${empleado.empleado_email}:`, {
          online: online,
          lastSeen: lastSeen,
          minutesDiff: Math.round(minutesDiff),
          isActuallyOnline: isActuallyOnline
        });
        
        return {
          id: empleado.empleado_email,
          online: isActuallyOnline,
          lastSeen: lastSeen,
          nombre: `${empleado.nombre} ${empleado.apellidos || ''}`.trim()
        };
      }));
      
      console.log('✅ Presencia procesada:', presencias.length, 'empleados');
      console.log('📊 Empleados online:', presencias.filter(p => p.online).length);
      console.log('📊 Empleados offline:', presencias.filter(p => !p.online).length);
      console.log('📤 Enviando respuesta con presencia:', presencias.map(p => ({
        id: p.id,
        nombre: p.nombre,
        online: p.online
      })));
      
      res.json(presencias);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error obteniendo presencia:', error);
    console.error('🔍 Stack trace:', error.stack);
    res.status(500).json({ error: 'Error obteniendo presencia', details: error.message });
  }
};

// Actualizar heartbeat del empleado
exports.updateHeartbeat = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const email = req.user.email;
    console.log('💓 Heartbeat de empleado:', email);
    
    const client = await pool.connect();
    try {
      // Verificar si el empleado existe
      const empleadoCheck = await client.query(
        'SELECT email FROM empleados WHERE email = $1',
        [email]
      );
      
      if (empleadoCheck.rows.length === 0) {
        console.error('❌ Empleado no encontrado:', email);
        // Marcar como offline si el empleado ya no existe
        await client.query(`
          DELETE FROM presencia WHERE empleado_email = $1
        `, [email]);
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      // Actualizar o insertar presencia con timestamp más preciso
      await client.query(`
        INSERT INTO presencia (empleado_email, online, last_seen)
        VALUES ($1, true, CURRENT_TIMESTAMP)
        ON CONFLICT (empleado_email)
        DO UPDATE SET 
          online = true,
          last_seen = CURRENT_TIMESTAMP
      `, [email]);
      
      console.log('✅ Heartbeat actualizado para:', email);
      res.json({ message: 'Heartbeat actualizado', timestamp: new Date().toISOString() });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error actualizando heartbeat:', error);
    res.status(500).json({ error: 'Error actualizando heartbeat', details: error.message });
  }
};

// Finalizar todas las tareas en progreso (función administrativa)
exports.finalizarTodasLasTareas = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    console.log('🛑 Finalizando todas las tareas en progreso...');
    
    const client = await pool.connect();
    try {
      // Obtener todas las tareas en progreso
      const tareasEnProgreso = await client.query(`
        SELECT id, empleado_email, tareas, referencia, cantidad_asignada, cantidad_hecha, hora_inicio
        FROM produccion 
        WHERE estado = 'en_progreso' AND hora_fin IS NULL
      `);
      
      console.log(`📊 Tareas en progreso encontradas: ${tareasEnProgreso.rows.length}`);
      
      if (tareasEnProgreso.rows.length === 0) {
        return res.json({ 
          message: 'No hay tareas en progreso para finalizar',
          tareasFinalizadas: 0
        });
      }

      // Finalizar cada tarea
      let tareasFinalizadas = 0;
      for (const tarea of tareasEnProgreso.rows) {
        const horaInicio = new Date(tarea.hora_inicio);
        const horaFin = new Date();
        const tiempoTranscurrido = (horaFin - horaInicio) / 1000 / 60; // en minutos
        
        // Calcular efectividad basada en cantidad hecha vs asignada
        let efectividad = null;
        if (tarea.cantidad_asignada > 0) {
          efectividad = (tarea.cantidad_hecha / tarea.cantidad_asignada) * 100;
        }
        
        await client.query(`
          UPDATE produccion 
          SET 
            estado = 'finalizada',
            hora_fin = CURRENT_TIMESTAMP,
            efectividad = $1,
            tiempo_transcurrido = $2
          WHERE id = $3
        `, [efectividad, tiempoTranscurrido, tarea.id]);
        
        tareasFinalizadas++;
        console.log(`✅ Tarea ${tarea.id} finalizada para ${tarea.empleado_email}`);
      }
      
      console.log(`🎯 Total de tareas finalizadas: ${tareasFinalizadas}`);
      
      res.json({ 
        message: `Se finalizaron ${tareasFinalizadas} tareas en progreso`,
        tareasFinalizadas: tareasFinalizadas
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error finalizando tareas:', error);
    res.status(500).json({ 
      error: 'Error finalizando tareas', 
      details: error.message 
    });
  }
}; 

// Marcar empleado como offline al cerrar sesión
exports.logout = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const email = req.user.email;
    console.log('🚪 Logout de empleado:', email);
    
    const client = await pool.connect();
    try {
      // Verificar si el empleado existe
      const empleadoCheck = await client.query(
        'SELECT email FROM empleados WHERE email = $1',
        [email]
      );
      
      if (empleadoCheck.rows.length === 0) {
        console.error('❌ Empleado no encontrado:', email);
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      // Marcar empleado como offline
      await client.query(`
        UPDATE presencia 
        SET 
          online = false,
          last_seen = CURRENT_TIMESTAMP
        WHERE empleado_email = $1
      `, [email]);
      
      console.log('✅ Empleado marcado como offline:', email);
      res.json({ message: 'Logout exitoso' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({ error: 'Error en logout', details: error.message });
  }
};

// Extender tiempo de tarea en progreso
exports.extenderTiempoTarea = async (req, res) => {
  try {
    console.log('🔍 [EXTENDER TIEMPO] Petición recibida:', {
      params: req.params,
      body: req.body,
      user: req.user?.email
    });
    
    const { id } = req.params;
    const { tiempoAdicional, observacion } = req.body;
    const email = req.user.email;

    // Validaciones
    if (!tiempoAdicional || isNaN(tiempoAdicional) || Number(tiempoAdicional) <= 0) {
      return res.status(400).json({ error: 'El tiempo adicional debe ser un número positivo' });
    }

    if (Number(tiempoAdicional) > 30) {
      return res.status(400).json({ error: 'El tiempo adicional no puede ser mayor a 30 minutos' });
    }

    if (!observacion || observacion.trim() === '') {
      return res.status(400).json({ error: 'Es obligatorio describir el inconveniente que se presentó' });
    }

    const client = await pool.connect();
    try {
      // Verificar que la tarea existe y pertenece al usuario
      const tareaResult = await client.query(
        `SELECT id, empleado_email, tiempo_estimado, observaciones 
         FROM produccion 
         WHERE id = $1 AND empleado_email = $2 AND estado = 'en_progreso'`,
        [id, email]
      );

      if (tareaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Tarea no encontrada o no está en progreso' });
      }

      const tarea = tareaResult.rows[0];
      const tiempoActual = parseFloat(tarea.tiempo_estimado) || 0;
      const nuevoTiempo = Math.ceil(tiempoActual + Number(tiempoAdicional));
      
      // Actualizar observaciones agregando la nueva observación
      const observacionesActuales = tarea.observaciones || '';
      const nuevaObservacion = `[EXTENSIÓN DE TIEMPO - ${new Date().toLocaleString()}] +${tiempoAdicional} min: ${observacion.trim()}`;
      const observacionesActualizadas = observacionesActuales 
        ? `${observacionesActuales}\n${nuevaObservacion}`
        : nuevaObservacion;

      // Actualizar la tarea
      const updateResult = await client.query(
        `UPDATE produccion 
         SET tiempo_estimado = $1, 
             observaciones = $2
         WHERE id = $3 AND empleado_email = $4`,
        [nuevoTiempo, observacionesActualizadas, id, email]
      );

      if (updateResult.rowCount === 0) {
        return res.status(404).json({ error: 'No se pudo actualizar la tarea' });
      }

      console.log(`✅ Tiempo extendido - Usuario: ${email}, Tarea: ${id}, Tiempo añadido: ${tiempoAdicional} min, Nuevo total: ${nuevoTiempo} min`);

      const response = {
        message: `Se añadieron ${tiempoAdicional} minutos adicionales a la tarea`,
        tiempoEstimadoAnterior: tiempoActual,
        tiempoEstimadoNuevo: nuevoTiempo,
        tiempoAdicional: Number(tiempoAdicional),
        observacion: observacion.trim()
      };
      
      console.log('📤 [EXTENDER TIEMPO] Respuesta enviada:', response);
      res.json(response);

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error al extender tiempo de tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor al extender tiempo' });
  }
}; 