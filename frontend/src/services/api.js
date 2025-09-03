// src/services/api.js

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Login de usuario
export async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: Login fallido`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}

// Obtener perfil de usuario
export async function getPerfil(token) {
  try {
    console.log('Enviando token:', token);
    const res = await fetch(`${API_BASE}/empleados/perfil`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo obtener el perfil`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throw error;
  }
}

// Obtener historial de producción del usuario
export async function getHistorial(token) {
  // GET /api/produccion/historial
  const res = await fetch(`${API_BASE}/produccion/historial`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("No se pudo obtener el historial");
  return await res.json();
}

// Obtener tarea en progreso del usuario autenticado
export async function getTareaEnProgreso(token) {
  const res = await fetch(`${API_BASE}/produccion/tarea-en-progreso`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: No se pudo obtener la tarea en progreso`);
  }
  return await res.json();
}

// Obtener todos los empleados (para admin)
export async function getEmpleados(token) {
  // GET /api/empleados
  const res = await fetch(`${API_BASE}/empleados`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: No se pudo obtener empleados`);
  }
  return await res.json();
}

// Obtener toda la producción (para admin)
export async function getProduccion(token) {
  // GET /api/produccion
  const res = await fetch(`${API_BASE}/produccion`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("No se pudo obtener producción");
  return await res.json();
}

// Crear perfil de empleado
export async function crearPerfilEmpleado(token, perfil) {
  try {
    const res = await fetch(`${API_BASE}/empleados`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(perfil)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo crear el perfil`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al crear perfil:', error);
    throw error;
  }
}

// Actualizar perfil de empleado
export async function actualizarPerfilEmpleado(token, perfil) {
  try {
    const res = await fetch(`${API_BASE}/empleados`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(perfil)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo actualizar el perfil`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    throw error;
  }
}

// Crear tarea de producción
export async function crearProduccion(token, produccion) {
  const res = await fetch(`${API_BASE}/produccion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(produccion)
  });
  if (!res.ok) throw new Error("No se pudo crear la tarea de producción");
  return await res.json();
}

// Obtener todas las tareas (historial y activas) de todos los empleados (cualquier usuario autenticado)
export async function getAllTareas(token) {
  const res = await fetch(`${API_BASE}/produccion/todas`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("No se pudo obtener todas las tareas");
  return await res.json();
}

// Obtener solo tareas activas (en progreso) para el dashboard
export async function getTareasActivas(token) {
  const res = await fetch(`${API_BASE}/produccion/activas`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: No se pudo obtener las tareas activas`);
  }
  return await res.json();
}

// Crear tarea en progreso (cuando el empleado inicia una tarea)
export async function crearTareaEnProgreso(token, tareaData) {
  const res = await fetch(`${API_BASE}/produccion/en-progreso`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(tareaData)
  });
  if (!res.ok) throw new Error("No se pudo crear la tarea en progreso");
  return await res.json();
}

// Actualizar tarea finalizada (cuando el empleado termina una tarea)
export async function actualizarTareaFinalizada(token, tareaId, tareaData) {
  const res = await fetch(`${API_BASE}/produccion/finalizar/${tareaId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(tareaData)
  });
  if (!res.ok) throw new Error("No se pudo actualizar la tarea finalizada");
  return await res.json();
}

// Obtener tareas del día para un empleado específico (para calcular efectividad diaria)
export async function getTareasDelDia(token, email) {
  const res = await fetch(`${API_BASE}/produccion/dia/${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: No se pudo obtener las tareas del día`);
  }
  return await res.json();
}

// Obtener tareas del día para un empleado específico (endpoint alternativo)
export async function getTareasDelDiaEmpleado(token, email) {
  const res = await fetch(`${API_BASE}/produccion/tareas-del-dia/${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: No se pudo obtener las tareas del día`);
  }
  return await res.json();
}

// Obtener estadísticas para el admin
export async function getEstadisticas(token) {
  const res = await fetch(`${API_BASE}/produccion/estadisticas`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: No se pudo obtener estadísticas`);
  }
  return await res.json();
}

// Exportar datos a Excel con formato profesional
export async function exportarAExcel(token, datos) {
  const res = await fetch(`${API_BASE}/produccion/exportar-excel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(datos)
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: No se pudo exportar a Excel`);
  }
  
  // Obtener el blob del archivo Excel
  const blob = await res.blob();
  return blob;
}

// Obtener presencia de empleados (solo admin)
export async function getPresencia(token) {
  const res = await fetch(`${API_BASE}/produccion/presencia`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: No se pudo obtener presencia`);
  }
  return await res.json();
}

// Actualizar heartbeat del empleado
export async function updateHeartbeat(token) {
  try {
    const res = await fetch(`${API_BASE}/produccion/heartbeat`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      
      // Si el empleado no existe (404), limpiar completamente y redirigir al login
      if (res.status === 404) {
        console.log('🚫 Usuario no encontrado, limpiando sesión...');
        // Limpiar todo el localStorage
        localStorage.clear();
        // Limpiar también sessionStorage por si acaso
        sessionStorage.clear();
        // Redirigir al login
        window.location.href = '/login';
        return;
      }
      
      throw new Error(errorData.error || `Error ${res.status}: No se pudo actualizar heartbeat`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al actualizar heartbeat:', error);
    
    // Si hay un error de red o similar, también limpiar la sesión
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      console.log('🌐 Error de conexión, limpiando sesión...');
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
      return;
    }
    
    throw error;
  }
}

// Logout del empleado (marcar como offline)
export async function logout(token) {
  try {
    const res = await fetch(`${API_BASE}/produccion/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      
      // Si el empleado no existe (404), limpiar completamente y redirigir al login
      if (res.status === 404) {
        console.log('🚫 Usuario no encontrado en logout, limpiando sesión...');
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
        return;
      }
      
      throw new Error(errorData.error || `Error ${res.status}: No se pudo realizar logout`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al realizar logout:', error);
    
    // Si hay un error de red, también limpiar la sesión
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      console.log('🌐 Error de conexión en logout, limpiando sesión...');
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
      return;
    }
    
    throw error;
  }
}

// Finalizar todas las tareas en progreso (solo admin)
export async function finalizarTodasLasTareas(token) {
  const res = await fetch(`${API_BASE}/produccion/finalizar-todas`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: No se pudo finalizar las tareas`);
  }
  return await res.json();
}

// Puedes agregar más funciones según crezcan los endpoints del backend

// ===== API PARA OPERACIONES =====

// Obtener todas las operaciones (admin)
export async function getOperaciones(token) {
  try {
    const res = await fetch(`${API_BASE}/operaciones`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudieron obtener las operaciones`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al obtener operaciones:', error);
    throw error;
  }
}

// Obtener solo operaciones activas (empleados)
export async function getOperacionesActivas(token) {
  try {
    const res = await fetch(`${API_BASE}/operaciones/activas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudieron obtener las operaciones activas`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al obtener operaciones activas:', error);
    throw error;
  }
}

// Crear nueva operación
export async function createOperacion(token, operacion) {
  try {
    const res = await fetch(`${API_BASE}/operaciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(operacion)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo crear la operación`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al crear operación:', error);
    throw error;
  }
}

// Actualizar operación
export async function updateOperacion(token, id, operacion) {
  try {
    const res = await fetch(`${API_BASE}/operaciones/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(operacion)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo actualizar la operación`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al actualizar operación:', error);
    throw error;
  }
}

// Eliminar operación
export async function deleteOperacion(token, id) {
  try {
    const res = await fetch(`${API_BASE}/operaciones/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo eliminar la operación`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al eliminar operación:', error);
    throw error;
  }
}

// ===== API PARA REFERENCIAS =====

// Obtener todas las referencias (admin)
export async function getReferencias(token) {
  try {
    const res = await fetch(`${API_BASE}/referencias`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudieron obtener las referencias`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al obtener referencias:', error);
    throw error;
  }
}

// Obtener solo referencias activas (empleados)
export async function getReferenciasActivas(token) {
  try {
    const res = await fetch(`${API_BASE}/referencias/activas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudieron obtener las referencias activas`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al obtener referencias activas:', error);
    throw error;
  }
}

// Crear nueva referencia
export async function createReferencia(token, referencia) {
  try {
    const res = await fetch(`${API_BASE}/referencias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(referencia)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo crear la referencia`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al crear referencia:', error);
    throw error;
  }
}

// Actualizar referencia
export async function updateReferencia(token, id, referencia) {
  try {
    const res = await fetch(`${API_BASE}/referencias/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(referencia)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo actualizar la referencia`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al actualizar referencia:', error);
    throw error;
  }
}

// Eliminar referencia
export async function deleteReferencia(token, id) {
  try {
    const res = await fetch(`${API_BASE}/referencias/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo eliminar la referencia`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al eliminar referencia:', error);
    throw error;
  }
}

// ===== API PARA USUARIOS DEL SISTEMA =====

// Obtener todos los usuarios
export async function getUsuarios(token) {
  try {
    const res = await fetch(`${API_BASE}/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudieron obtener los usuarios`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
}

// Crear nuevo usuario
export async function createUsuario(token, usuario) {
  try {
    const res = await fetch(`${API_BASE}/usuarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(usuario)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo crear el usuario`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
}

// Actualizar usuario
export async function updateUsuario(token, id, usuario) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(usuario)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo actualizar el usuario`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
}

// Eliminar usuario
export async function deleteUsuario(token, id) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo eliminar el usuario`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
}

// Cambiar contraseña de usuario
export async function cambiarPassword(token, id, password) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${id}/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: No se pudo cambiar la contraseña`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    throw error;
  }
} 