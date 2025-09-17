import React, { useState, useEffect, useMemo } from "react";
import { Button, Nav, Navbar, Container, Card, Row, Col, ProgressBar, Table, Alert, Spinner, Modal, Form } from "react-bootstrap";
import { FaUserCircle, FaChartLine, FaCheckCircle, FaUsers, FaChartBar, FaFileExcel, FaMedal, FaUserTie, FaStopCircle, FaCogs } from "react-icons/fa";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import logo from "../assets/sharo-logo.png";
import '../App.css';
import './Admin.css';
// import { tareas as tareasEmpleado } from "./Empleado"; // Ya no se usa
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as api from "../services/api";
import { useAuth } from "../context/AuthContext";

import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Operaciones disponibles para el admin (se pueden cargar desde la BD si es necesario)
const operacionesDisponibles = [
  'Coser cuello',
  'Pegar botones', 
  'Dobladillar manga',
  'Coser costuras',
  'Planchar prenda'
];

const Admin = () => {
  const navigate = useNavigate();
  const { user, token, logout, isAdmin, isLoading } = useAuth();
  
  // Función para truncar texto de operaciones
  const truncateOperationText = (text, maxLines = 3, maxCharsPerLine = 25) => {
    if (!text) return '';
    
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word.substring(0, maxCharsPerLine - 3) + '...');
        }
      }
      
      if (lines.length >= maxLines) {
        if (currentLine) {
          lines.push(currentLine + '...');
        }
        break;
      }
    }
    
    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  };
  
  // Función para manejar clic en operación
  const handleOperationClick = (operationText) => {
    alert(`Operación completa:\n\n${operationText}`);
  };

  // Protección de ruta para admin con mejor manejo de estado
  useEffect(() => {
    console.log('🔍 Admin - Verificando autenticación:', { isAdmin, user: user?.email, token: !!token, isLoading });
    
    // Esperar a que se complete la verificación del token
    if (isLoading) {
      console.log('⏳ Verificando sesión...');
      return;
    }
    
    if (!token) {
      console.log('❌ No hay token, redirigiendo a login...');
      navigate('/login');
    } else if (!isAdmin) {
      console.log('❌ Usuario no es admin, redirigiendo...');
      navigate('/empleado');
    } else {
      console.log('✅ Usuario admin autenticado correctamente');
    }
  }, [isAdmin, user, token, isLoading]);

  const [empleados, setEmpleados] = useState([]);
  const [produccion, setProduccion] = useState([]);
  const [tareasDelDia, setTareasDelDia] = useState({}); // Para almacenar tareas del día por empleado
  const [cargando, setCargando] = useState(true);
  const [datosCompletos, setDatosCompletos] = useState(false); // Para controlar cuando todos los datos están listos
  const [error, setError] = useState("");
  const [presencias, setPresencias] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showEmpleadoModal, setShowEmpleadoModal] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [anioActual] = useState(new Date().getFullYear());
  const mesesDelAnio = Array.from({ length: 12 }, (_, i) => new Date(anioActual, i, 1));
  const [horaActual, setHoraActual] = useState(new Date());
  const [horaFormateada, setHoraFormateada] = useState('');
  
  // --- NUEVO: breakpoint para layout responsivo (admin) ---
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : true);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // --- FIN NUEVO ---

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setHoraActual(now);
      
      // Formatear hora con configuración optimizada
      const horaFormateadaNueva = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      
      // Solo actualizar si el valor ha cambiado para evitar re-renders innecesarios
      setHoraFormateada(prev => prev !== horaFormateadaNueva ? horaFormateadaNueva : prev);
    };
    
    // Actualizar inmediatamente
    updateClock();
    
    // Luego cada segundo
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Función para formatear el cargo/máquina de manera consistente
  const formatearCargo = (cargo) => {
    if (!cargo) return 'Sin asignar';
    
    try {
      // Si es un string que parece JSON, intentar diferentes métodos de parseo
      if (typeof cargo === 'string') {
        // Intentar parsear como JSON válido
        if (cargo.startsWith('{') || cargo.startsWith('[')) {
          try {
            const cargos = JSON.parse(cargo);
            if (Array.isArray(cargos)) {
              return cargos.join(', ');
            }
          } catch (jsonError) {
            // Continuar con método alternativo
          }
        }
        
        // Si parece un array con comillas pero no es JSON válido, intentar limpiarlo
        if (cargo.includes('"') && cargo.includes(',')) {
          // Remover llaves y comillas, luego dividir por comas
          const limpio = cargo
            .replace(/[{}"]/g, '') // Remover llaves y comillas
            .split(',')
            .map(item => item.trim()) // Limpiar espacios
            .filter(item => item.length > 0); // Remover elementos vacíos
          
          if (limpio.length > 0) {
            return limpio.join(', ');
          }
        }
      }
      
      // Si es un array, unirlo con comas
      if (Array.isArray(cargo)) {
        return cargo.join(', ');
      }
      
      // Si es un string normal, devolverlo tal como está
      return cargo;
    } catch (error) {
      // Si hay error al parsear, devolver el string original
      return cargo;
    }
  };
  
  // Estados para el apartado de empleados mejorado
  const [empleadoSeleccionadoHistorial, setEmpleadoSeleccionadoHistorial] = useState(null);
  const [historialEmpleadoDetallado, setHistorialEmpleadoDetallado] = useState([]);
  const [filtroEmpleadoHistorial, setFiltroEmpleadoHistorial] = useState('semana');
  const [fechaEmpleadoSeleccionada, setFechaEmpleadoSeleccionada] = useState(new Date());
  const [mesEmpleadoSeleccionado, setMesEmpleadoSeleccionado] = useState(new Date().getMonth());
  const [semanaEnMesSeleccionada, setSemanaEnMesSeleccionada] = useState(0);
  const [estadisticas, setEstadisticas] = useState(null);
  const [estadisticasActualizando, setEstadisticasActualizando] = useState(false);
  const [navbarExpanded, setNavbarExpanded] = useState(false);

  // Presencia en línea: marcar online al entrar y offline al salir
  useEffect(() => {
    // Solo ejecutar si no está cargando la autenticación y hay usuario y token
    if (isLoading || !user || !user.email || !token) return;
    
    console.log('💓 Configurando heartbeat para admin:', user.email);
    
    // Enviar heartbeat inicial
    const sendHeartbeat = async () => {
      try {
        await api.updateHeartbeat(token);
        console.log('💓 Heartbeat admin enviado:', user.email);
      } catch (error) {
        console.error('❌ Error enviando heartbeat admin:', error);
        // Si hay error de autenticación, redirigir al login
        if (error.message && error.message.includes('401')) {
          console.log('🔐 Sesión admin expirada, redirigiendo al login...');
          logout();
          navigate('/login');
        }
      }
    };
    
    sendHeartbeat();
    
    // Enviar heartbeat cada 15 segundos para mejor detección de presencia
    const heartbeatInterval = setInterval(sendHeartbeat, 15000);
    
    // Marcar offline al cerrar pestaña o navegar fuera
    const handleOffline = async () => {
      try {
        if (user && user.email && token) {
          await api.logout(token);
          console.log('✅ Admin marcado como offline al cerrar pestaña:', user.email);
        }
      } catch (error) {
        console.error('❌ Error al marcar admin como offline:', error);
      }
    };
    
    // Event listener para antes de cerrar la pestaña
    window.addEventListener("beforeunload", handleOffline);
    
    // Event listener para cuando se pierde el foco de la ventana
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Ventana admin oculta, enviando heartbeat de emergencia');
        // En lugar de marcar offline inmediatamente, enviar un heartbeat de emergencia
        sendHeartbeat();
      } else {
        console.log('👁️ Ventana admin visible, enviando heartbeat de recuperación');
        // Cuando la pestaña vuelve a estar activa, enviar heartbeat inmediatamente
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(heartbeatInterval);
      // Marcar offline al desmontar el componente
      handleOffline();
      window.removeEventListener("beforeunload", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, token, logout, isLoading]);

  // Obtener empleados y producción al cargar
  useEffect(() => {
    // Solo ejecutar si no está cargando la autenticación y hay token
    if (isLoading || !token) return;
    
    console.log('🔄 Iniciando carga de datos del Admin...');
    async function fetchData() {
      setCargando(true);
      setError(""); // Limpiar errores previos
      
      try {
        // Obtener TODOS los empleados activos (no solo los que tienen presencia)
        const empleadosData = await api.getEmpleadosActivos(token);
        setEmpleados(empleadosData);
        console.log('✅ Empleados activos cargados:', empleadosData.length);
        console.log('📋 Lista de empleados activos:', empleadosData.map(e => ({
          id: e.id,
          nombre: e.nombre,
          activo: e.activo
        })));
        
        // Cargar estadísticas
        try {
          const statsData = await api.getEstadisticas(token);
          setEstadisticas(statsData);
          console.log('✅ Estadísticas cargadas:', statsData);
        } catch (statsError) {
          console.error('Error al cargar estadísticas:', statsError);
          setEstadisticas(null);
        }
        
        // Cargar tareas activas, tareas del día y presencia en paralelo para mayor velocidad
        if (empleadosData.length > 0) {
          await Promise.all([
            fetchTareasDelDia(),
            fetchTareasActivas(),
            fetchPresencia()
          ]);
        }
        
        // Marcar que todos los datos están cargados
        setDatosCompletos(true);
        console.log('✅ Datos completos marcados como cargados');
        
      } catch (e) {
        console.error('Error al cargar datos del admin:', e);
        
        if (e.message && e.message.includes('401')) {
          setError("Error de autenticación. Por favor, vuelve a iniciar sesión.");
          logout();
          navigate('/login');
        } else if (e.message && e.message.includes('403')) {
          setError("No tienes permisos de administrador.");
          navigate('/empleado');
        } else {
          setError("Error al cargar los datos. Intenta de nuevo.");
        }
      } finally {
        setCargando(false);
      }
    }
    fetchData();
    console.log('✅ useEffect de fetchData completado');
  }, [token, logout, isLoading]);

  // Función para obtener presencia de empleados
  const fetchPresencia = async () => {
    try {
      if (!token) {
        console.error('❌ No hay token para obtener presencia');
        return;
      }
      
      console.log('🔄 Obteniendo presencia de empleados...');
      const presenciasData = await api.getPresencia(token);
      setPresencias(presenciasData);
      console.log('✅ Presencia cargada:', presenciasData.length, 'empleados');
    } catch (error) {
      console.error('❌ Error al cargar presencia:', error);
      setPresencias([]);
    }
  };

  // Función para obtener tareas activas para el dashboard
  const fetchTareasActivas = async () => {
    try {
      if (!token) {
        console.error('❌ No hay token para obtener tareas activas');
        return;
      }
      
      console.log('🔄 Obteniendo tareas activas...');
      const tareasActivas = await api.getTareasActivas(token);
      
      console.log('📊 Tareas activas recibidas del backend:', tareasActivas);
      console.log('📋 Detalle de tareas activas:', tareasActivas.map(t => ({
        id: t.id,
        usuario: t.usuario,
        empleadoNombre: t.empleadoNombre,
        empleadoOnline: t.empleadoOnline,
        estado: t.estado,
        horaInicio: t.horaInicio,
        horaFin: t.horaFin,
        efectividad: t.efectividad
      })));
      
      // Validar que las tareas activas sean válidas
      const tareasValidas = tareasActivas.filter(t => {
        const isValid = t && t.id && t.usuario && t.estado === 'en_progreso';
        if (!isValid) {
          console.warn('⚠️ Tarea inválida filtrada:', t);
        }
        return isValid;
      });
      
      console.log('✅ Tareas válidas después de filtrado:', tareasValidas.length);
      
      setProduccion(tareasValidas);
      // Solo mostrar log si hay tareas activas para evitar spam
      if (tareasValidas.length > 0) {
        console.log('✅ Tareas activas actualizadas:', tareasValidas.length);
      } else {
        console.log('📭 No hay tareas activas en este momento');
      }
    } catch (error) {
      console.error('❌ Error al cargar tareas activas:', error);
      if (error.message && error.message.includes('401')) {
        alert('Sesión expirada. Redirigiendo al login...');
        logout();
        navigate('/login');
      } else if (error.message && error.message.includes('403')) {
        alert('Acceso denegado. Redirigiendo...');
        navigate('/empleado');
      } else {
        console.log('⚠️ Estableciendo producción como array vacío debido al error');
        setProduccion([]);
      }
    }
  };

  // Función para obtener tareas del día de todos los empleados
  const fetchTareasDelDia = async () => {
    try {
      if (empleados.length === 0) {
        console.log('⚠️ No hay empleados para obtener tareas del día');
        return {};
      }
      
      console.log('🔄 Obteniendo tareas del día...');
      // Obtener todas las tareas y filtrar por día en el frontend
      const todasLasTareas = await api.getAllTareas(token);
      
      console.log('📊 Todas las tareas recibidas:', todasLasTareas.length);
      
      const tareasDelDiaData = {};
      const fechaHoy = new Date();
      const dia = fechaHoy.getDate().toString().padStart(2, '0');
      const mes = (fechaHoy.getMonth() + 1).toString().padStart(2, '0');
      const anio = fechaHoy.getFullYear();
      const fechaHoyStr = `${dia}/${mes}/${anio}`;
      
      // Filtrar tareas del día para cada empleado
      for (const empleado of empleados) {
        const tareasEmpleado = todasLasTareas.filter(tarea => {
          const isSameUser = tarea.usuario === empleado.id;
          const isToday = tarea.fecha && typeof tarea.fecha === 'string' && tarea.fecha.split(',')[0].trim() === fechaHoyStr;
          return isSameUser && isToday;
        });
        
        console.log('📋 Tareas del día para empleado:', empleado.id, {
          nombre: empleado.nombre,
          totalTareas: tareasEmpleado.length,
          tareas: tareasEmpleado.map(t => ({ id: t.id, estado: t.estado, efectividad: t.efectividad, fecha: t.fecha }))
        });
        
        tareasDelDiaData[empleado.id] = tareasEmpleado;
      }
      
      console.log('✅ Tareas del día procesadas:', Object.keys(tareasDelDiaData).length, 'empleados');
      setTareasDelDia(tareasDelDiaData);
      return tareasDelDiaData; // Retornar los datos para que se pueda esperar
    } catch (error) {
      // Si hay error, usar datos de prueba
      console.log('⚠️ Usando datos de prueba para tareas del día');
      const tareasDelDiaPrueba = {
        'admin@sharo.com': [],
        'empleado1@sharo.com': [
          {
            id: 'tarea1',
            tareas: ['Corte', 'Doblez'],
            referencia: 'REF-001',
            cantidadAsignada: 100,
            cantidadHecha: 85,
            efectividad: 85,
            estado: 'finalizada',
            fecha: '01/08/2025, 09:00:00'
          }
        ],
        'empleado2@sharo.com': [
          {
            id: 'tarea2',
            tareas: ['Soldadura'],
            referencia: 'REF-002',
            cantidadAsignada: 50,
            cantidadHecha: 0,
            efectividad: null,
            estado: 'en_progreso',
            fecha: '01/08/2025, 10:30:00'
          }
        ],
        'empleado3@sharo.com': [
          {
            id: 'tarea3',
            tareas: ['Pintura', 'Acabado'],
            referencia: 'REF-003',
            cantidadAsignada: 75,
            cantidadHecha: 75,
            efectividad: 95,
            estado: 'finalizada',
            fecha: '01/08/2025, 08:15:00'
          }
        ]
      };
      setTareasDelDia(tareasDelDiaPrueba);
      return tareasDelDiaPrueba;
    }
  };

  // Polling optimizado cada 4 segundos para obtener tareas actualizadas
  useEffect(() => {
    if (isLoading || !token) return;
    
    // Ejecutar inmediatamente
    fetchTareasActivas();
    
    // Configurar intervalo para mejor responsividad
    const interval = setInterval(() => {
      fetchTareasActivas();
    }, 4000); // Cada 4 segundos para balance entre rendimiento y responsividad
    
    return () => clearInterval(interval);
  }, [token, isLoading]);

  // Actualizar tareas del día cuando cambien las tareas activas
  useEffect(() => {
    if (empleados.length > 0 && produccion.length > 0) {
      fetchTareasDelDia();
    }
  }, [produccion, empleados.length]);

  // Polling para tareas del día cada 8 segundos
  useEffect(() => {
    if (isLoading || !token || empleados.length === 0) return;
    
    // Ejecutar inmediatamente
    fetchTareasDelDia();
    
    // Configurar intervalo
    const interval = setInterval(() => {
      fetchTareasDelDia();
    }, 8000); // Cada 8 segundos para balance entre rendimiento y actualización
    
    return () => clearInterval(interval);
  }, [token, empleados.length, isLoading]);

  // Polling para estadísticas del dashboard en tiempo real
  useEffect(() => {
    if (isLoading || !token) return;
    
    // Función para actualizar estadísticas
    const fetchEstadisticas = async () => {
      try {
        setEstadisticasActualizando(true);
        const statsData = await api.getEstadisticas(token);
        setEstadisticas(statsData);
      } catch (statsError) {
        // Si hay error, mantener las estadísticas actuales
        console.log('⚠️ Error al actualizar estadísticas, manteniendo datos actuales');
      } finally {
        setEstadisticasActualizando(false);
      }
    };
    
    // Ejecutar inmediatamente
    fetchEstadisticas();
    
    // Configurar intervalo para actualizar estadísticas cada 10 segundos
    // para mejor experiencia en tiempo real
    const interval = setInterval(() => {
      fetchEstadisticas();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [token, isLoading]);

  // Recargar datos cuando se regrese al dashboard
  useEffect(() => {
    if (activeTab === 'dashboard' && !isLoading && token) {
      console.log('🔄 Regresando al dashboard, recargando datos...');
      recargarDatosDashboard();
    }
  }, [activeTab, isLoading, token]);

  // Optimización: precargar tareas del día cuando se cargan los empleados
  useEffect(() => {
    if (empleados.length > 0 && !datosCompletos) {
      fetchTareasDelDia();
    }
  }, [empleados.length, datosCompletos]);

  // Actualizar historial del empleado cuando cambien los filtros
  useEffect(() => {
    if (empleadoSeleccionadoHistorial) {
      // La gráfica se actualizará automáticamente cuando cambien los filtros
      // porque getChartDataFromEmpleadoHistorial depende de estos estados
    }
  }, [filtroEmpleadoHistorial, fechaEmpleadoSeleccionada, mesEmpleadoSeleccionado, semanaEnMesSeleccionada, historialEmpleadoDetallado]);

  // Leer presencia en tiempo real - OPTIMIZADO
  useEffect(() => {
    if (isLoading || !token) return;
    
    // Ejecutar inmediatamente
    fetchPresencia();
    
    // Actualizar cada 5 segundos para mejor responsividad
    const interval = setInterval(fetchPresencia, 5000);
    return () => clearInterval(interval);
  }, [token, isLoading]);

  // Función para abrir modal y cargar datos
  const handleOpenEmpleado = (emp) => {
    setEmpleadoSeleccionado(emp);
    setShowEmpleadoModal(true);
  };
  const handleCloseEmpleado = () => {
    setShowEmpleadoModal(false);
    setEmpleadoSeleccionado(null);
  };

  // Función para obtener el rango de semana en mes
  const getRangoSemanaEnMes = (mesIdx, semanaIdx) => {
    const mes = mesesDelAnio[mesIdx];
    if (!mes) return "";
    const inicio = new Date(mes);
    inicio.setDate(semanaIdx * 7 + 1);
    const fin = new Date(mes);
    fin.setDate(Math.min((semanaIdx + 1) * 7, new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()));
    return `${inicio.toLocaleDateString()} al ${fin.toLocaleDateString()}`;
  };

  // Función para cargar historial detallado de un empleado
  const cargarHistorialEmpleado = async (empleado) => {
    if (!token || !empleado) {
      console.error('Token o empleado no válido');
      return;
    }
    
    try {
      setEmpleadoSeleccionadoHistorial(empleado);
      setCargando(true);
      
      // Obtener todas las tareas del empleado
      const todasLasTareas = await api.getAllTareas(token);
      const tareasEmpleado = todasLasTareas.filter(tarea => tarea.usuario === empleado.id);
      setHistorialEmpleadoDetallado(tareasEmpleado);
      console.log(`✅ Historial cargado para ${empleado.nombre}: ${tareasEmpleado.length} tareas`);
      
    } catch (error) {
      console.error('Error al cargar historial del empleado:', error);
      
      if (error.message && error.message.includes('401')) {
        setError("Error de autenticación. Por favor, vuelve a iniciar sesión.");
        logout();
        navigate('/login');
      } else if (error.message && error.message.includes('403')) {
        setError("No tienes permisos para ver este historial.");
      } else {
        setError("Error al cargar el historial del empleado. Intenta nuevamente.");
      }
      
      setHistorialEmpleadoDetallado([]);
    } finally {
      setCargando(false);
    }
  };

  // Función para filtrar el historial del empleado según el filtro seleccionado
  const getHistorialFiltrado = () => {
    if (!empleadoSeleccionadoHistorial || historialEmpleadoDetallado.length === 0) {
      return [];
    }

    if (filtroEmpleadoHistorial === "dia") {
      // Filtrar por día seleccionado
      return historialEmpleadoDetallado.filter(h => {
        if (!h.fecha || typeof h.fecha !== 'string') return false;
        const fechaRegistro = h.fecha.split(',')[0].trim();
        const dia = fechaEmpleadoSeleccionada.getDate().toString().padStart(2, '0');
        const mes = (fechaEmpleadoSeleccionada.getMonth() + 1).toString().padStart(2, '0');
        const anio = fechaEmpleadoSeleccionada.getFullYear();
        const fechaSeleccionadaStr = `${dia}/${mes}/${anio}`;
        return fechaRegistro === fechaSeleccionadaStr;
      });
    } else if (filtroEmpleadoHistorial === "semana") {
      // Filtrar por semana seleccionada
      const mes = mesesDelAnio[mesEmpleadoSeleccionado];
      if (!mes) return [];
      
      const semanaBase = new Date(mes.getFullYear(), mes.getMonth(), 1 + semanaEnMesSeleccionada * 7);
      let lunes = new Date(semanaBase);
      while (lunes.getDay() !== 1) {
        lunes.setDate(lunes.getDate() - 1);
      }
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);

      return historialEmpleadoDetallado.filter(h => {
        let fecha;
        if (h.fecha instanceof Date) {
          fecha = h.fecha;
        } else if (h.fecha && typeof h.fecha === 'string') {
          const partes = h.fecha.split(",")[0].split("/");
          if (partes.length === 3) {
            fecha = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          } else {
            fecha = new Date(h.fecha);
          }
        } else {
          return false;
        }
        fecha.setHours(0,0,0,0);
        return fecha >= lunes && fecha <= domingo;
      });
    } else {
      // Filtrar por mes completo
      const mesInicio = mesesDelAnio[mesEmpleadoSeleccionado];
      if (!mesInicio) return [];
      
      const mesFin = new Date(mesInicio.getFullYear(), mesInicio.getMonth() + 1, 0);
      
      return historialEmpleadoDetallado.filter(h => {
        let fecha;
        if (h.fecha instanceof Date) {
          fecha = h.fecha;
        } else if (h.fecha && typeof h.fecha === 'string') {
          const partes = h.fecha.split(",")[0].split("/");
          if (partes.length === 3) {
            fecha = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          } else {
            fecha = new Date(h.fecha);
          }
        } else {
          return false;
        }
        fecha.setHours(0,0,0,0);
        return fecha >= mesInicio && fecha <= mesFin;
      });
    }
  };

  // Función para obtener datos de la gráfica del empleado
  const getChartDataFromEmpleadoHistorial = () => {
    const historialFiltrado = getHistorialFiltrado();
    
    if (historialFiltrado.length === 0) {
      return { labels: [], data: [] };
    }

    if (filtroEmpleadoHistorial === "dia") {
      // Mostrar tareas por hora del día
      const labels = historialFiltrado.map(h => h.fecha.split(' ')[1]?.slice(0, 5) || '');
      const data = historialFiltrado.map(h => h.efectividad);
      return { labels, data };
    } else if (filtroEmpleadoHistorial === "semana") {
      // Mostrar promedio por día de la semana
      const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      const suma = Array(7).fill(0);
      const cuenta = Array(7).fill(0);

      historialFiltrado.forEach(h => {
        let fecha;
        if (h.fecha instanceof Date) {
          fecha = h.fecha;
        } else if (h.fecha && typeof h.fecha === 'string') {
          const partes = h.fecha.split(",")[0].split("/");
          if (partes.length === 3) {
            fecha = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          } else {
            fecha = new Date(h.fecha);
          }
        } else {
          return;
        }
        fecha.setHours(0,0,0,0);
        let dia = fecha.getDay();
        dia = dia === 0 ? 6 : dia - 1;
        suma[dia] += Number(h.efectividad);
        cuenta[dia]++;
      });
      
      const data = suma.map((s, i) => cuenta[i] ? (s / cuenta[i]).toFixed(1) : 0);
      return { labels: dias, data };
    } else {
      // Mostrar promedio por semana del mes
      const semanas = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
      const suma = Array(4).fill(0);
      const cuenta = Array(4).fill(0);
      const mesInicio = mesesDelAnio[mesEmpleadoSeleccionado];
      
      if (!mesInicio) return { labels: semanas, data: Array(4).fill(0) };
      
      historialFiltrado.forEach(h => {
        let fecha;
        if (h.fecha instanceof Date) {
          fecha = h.fecha;
        } else if (h.fecha && typeof h.fecha === 'string') {
          const partes = h.fecha.split(",")[0].split("/");
          if (partes.length === 3) {
            fecha = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          } else {
            fecha = new Date(h.fecha);
          }
        } else {
          return;
        }
        fecha.setHours(0,0,0,0);
        if (fecha >= mesInicio) {
          const semana = Math.min(3, Math.floor((fecha.getDate() - 1) / 7));
          suma[semana] += Number(h.efectividad);
          cuenta[semana]++;
        }
      });
      
      const data = suma.map((s, i) => cuenta[i] ? (s / cuenta[i]).toFixed(1) : 0);
      return { labels: semanas, data };
    }
  };

  // Configuración de la gráfica del empleado
  const chartDataEmpleado = {
    labels: getChartDataFromEmpleadoHistorial().labels,
    datasets: [
      {
        label: 'Productividad (%)',
        data: getChartDataFromEmpleadoHistorial().data,
        fill: false,
        borderColor: '#0d6efd',
        backgroundColor: '#0d6efd',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 8,
        borderWidth: 3,
        spanGaps: true,
        hoverBackgroundColor: '#ffc107',
        hoverBorderColor: '#28a745',
      },
    ],
  };

  const chartOptionsEmpleado = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Productividad del Empleado' },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            return `Efectividad: ${context.parsed.y}%`;
          },
          title: function(context) {
            return context[0].label;
          }
        }
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Porcentaje (%)' },
        grid: { color: '#e3eaf7' },
      },
      x: {
        grid: { color: '#e3eaf7' },
      },
    },
  };

  // Función para exportar datos a Excel con formato profesional completo
  const exportarAExcel = async () => {
    if (!empleadoSeleccionadoHistorial || getHistorialFiltrado().length === 0) {
      alert('No hay datos para exportar. Selecciona un empleado y asegúrate de que tenga tareas en el período seleccionado.');
      return;
    }

    if (!token) {
      alert('Error de autenticación. Por favor, vuelve a iniciar sesión.');
      logout();
      navigate('/login');
      return;
    }

    try {
      // Mostrar indicador de carga
      const exportButton = document.querySelector('[data-export-excel]');
      if (exportButton) {
        exportButton.disabled = true;
        exportButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generando Excel...';
      }

      // Preparar datos para el backend
      const datos = {
        email: empleadoSeleccionadoHistorial.id,
        filtro: filtroEmpleadoHistorial,
        fechaInicio: null,
        fechaFin: null
      };

      // Calcular fechas según el filtro
      if (filtroEmpleadoHistorial === "dia") {
        datos.fechaInicio = fechaEmpleadoSeleccionada.toISOString();
      } else if (filtroEmpleadoHistorial === "semana") {
        const mes = mesesDelAnio[mesEmpleadoSeleccionado];
        const semanaBase = new Date(mes.getFullYear(), mes.getMonth(), 1 + semanaEnMesSeleccionada * 7);
        let lunes = new Date(semanaBase);
        while (lunes.getDay() !== 1) {
          lunes.setDate(lunes.getDate() - 1);
        }
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        
        datos.fechaInicio = lunes.toISOString();
        datos.fechaFin = domingo.toISOString();
      } else if (filtroEmpleadoHistorial === "mes") {
        const mes = mesesDelAnio[mesEmpleadoSeleccionado];
        datos.fechaInicio = mes.toISOString();
      }

      // Llamar al backend para generar Excel
      const blob = await api.exportarAExcel(token, datos);
      
      // Descargar el archivo
      const nombreEmpleado = empleadoSeleccionadoHistorial.nombre || empleadoSeleccionadoHistorial.id;
      const fechaExport = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Analisis_${nombreEmpleado}_${fechaExport}.xlsx`;
      
      saveAs(blob, nombreArchivo);

      alert('✅ ¡Archivo Excel generado exitosamente!\n\nEl archivo incluye:\n• Hoja de información del empleado\n• Hoja de datos organizados en columnas\n• Formato profesional listo para usar');
      
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      
      if (error.message && error.message.includes('401')) {
        alert('Error de autenticación. Por favor, vuelve a iniciar sesión.');
        logout();
        navigate('/login');
      } else if (error.message && error.message.includes('403')) {
        alert('No tienes permisos para exportar datos.');
      } else {
        alert('❌ Error al exportar el archivo Excel. Intenta nuevamente.');
      }
    } finally {
      // Restaurar botón
      const exportButton = document.querySelector('[data-export-excel]');
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.innerHTML = '<FaFileExcel style={{ fontSize: 16 }} /> Exportar Datos';
      }
    }
  };



  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      if (user && user.email && token) {
        // Marcar empleado como offline en la base de datos
        await api.logout(token);
        console.log('✅ Usuario admin marcado como offline:', user.email);
      }
    } catch (error) {
      console.error('❌ Error al marcar usuario admin como offline:', error);
      // Continuar con el logout aunque falle la API
    }
    
    try {
      logout();
      // Limpiar localStorage completamente
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Forzar limpieza y redirección
      localStorage.clear();
      navigate('/login');
    }
  };

  // Función para recargar todos los datos del dashboard
  const recargarDatosDashboard = async () => {
    try {
      console.log('🔄 Recargando datos del dashboard...');
      await Promise.all([
        fetchTareasActivas(),
        fetchTareasDelDia(),
        fetchPresencia()
      ]);
      console.log('✅ Datos del dashboard recargados');
    } catch (error) {
      console.error('❌ Error recargando datos del dashboard:', error);
    }
  };

  // Función para manejar el cambio de pestaña y cerrar el menú
  const handleTabChange = (selectedKey) => {
    if (selectedKey === 'produccion') {
      // Redirigir al sistema de producción usando React Router
      console.log('🔍 Admin - Redirigiendo a Gestión de Producción...');
      navigate('/produccion');
      return;
    }
    setActiveTab(selectedKey);
    setNavbarExpanded(false); // Cerrar el menú hamburguesa
  };

  // Función para finalizar todas las tareas en progreso
  const handleFinalizarTodasLasTareas = async () => {
    try {
      console.log('🛑 Iniciando finalización de todas las tareas...');
      
      const resultado = await api.finalizarTodasLasTareas(token);
      
      console.log('✅ Tareas finalizadas:', resultado);
      
      // Mostrar mensaje de éxito
      alert(`✅ ${resultado.message}\n\nSe finalizaron ${resultado.tareasFinalizadas} tareas en progreso.`);
      
      // Recargar datos para reflejar los cambios
      await fetchTareasActivas();
      await fetchTareasDelDia();
      
    } catch (error) {
      console.error('❌ Error finalizando tareas:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Empleados en línea - OPTIMIZADO
  const empleadosOnline = useMemo(() => {
    if (!empleados.length || !presencias.length) {
      return [];
    }
    
    return empleados.filter(emp => {
      const presencia = presencias.find(p => p.id === emp.id);
      return presencia && presencia.online === true;
    });
  }, [empleados, presencias]);
  
  // Debug: Mostrar información detallada de empleados y presencia
  console.log('🔍 DEBUG - Estado de empleados y presencia:', {
    totalEmpleados: empleados.length,
    totalPresencias: presencias.length,
    empleadosOnline: empleadosOnline.length,
    empleadosDetalle: empleados.map(emp => ({
      id: emp.id,
      nombre: emp.nombre,
      presencia: presencias.find(p => p.id === emp.id),
      tieneTareaActiva: produccion.some(p => p.usuario === emp.id && p.estado === 'en_progreso')
    }))
  });
  
  // Estado persistente para empleados online (evitar desapariciones)
  const [empleadosOnlinePersistent, setEmpleadosOnlinePersistent] = useState([]);
  
  // Actualizar estado persistente cuando cambie empleadosOnline
  useEffect(() => {
    if (empleadosOnline.length > 0) {
      setEmpleadosOnlinePersistent(empleadosOnline);
    }
  }, [empleadosOnline]);
  
  // Usar empleadosOnlinePersistent si empleadosOnline está vacío pero debería tener datos
  const empleadosParaMostrar = empleadosOnline.length > 0 ? empleadosOnline : empleadosOnlinePersistent;

  // DEBUG: Mostrar todos los datos para identificar el problema
  console.log('🔍 DEBUG - Datos completos:', {
    empleados: empleados.map(emp => ({ id: emp.id, nombre: emp.nombre })),
    presencias: presencias.map(p => ({ id: p.id, online: p.online, nombre: p.nombre })),
    empleadosOnline: empleadosOnline.map(emp => ({ id: emp.id, nombre: emp.nombre })),
    produccion: produccion.map(p => ({ id: p.id, usuario: p.usuario, estado: p.estado }))
  });

  // Resumen global
  const totalEmpleados = empleados.length;
  const totalEnLinea = empleadosOnline.length;
  const promedioEfectividad = (() => {
    // Calcular promedio de efectividad del día usando tareasDelDia (mismo método que abajo)
    const todasLasEfectividades = [];
    
    Object.keys(tareasDelDia).forEach(empId => {
      const tareasHoy = tareasDelDia[empId] || [];
      const tareasCompletadas = tareasHoy.filter(t => 
        t.estado === 'finalizada' && 
        t.efectividad !== null && 
        t.efectividad !== undefined
      );
      
      if (tareasCompletadas.length > 0) {
        const suma = tareasCompletadas.reduce((acc, t) => acc + Number(t.efectividad), 0);
        const promedio = Math.round(suma / tareasCompletadas.length);
        todasLasEfectividades.push(promedio);
      }
    });
    
    if (todasLasEfectividades.length === 0) return 100;
    const promedioGlobal = Math.round(todasLasEfectividades.reduce((acc, val) => acc + val, 0) / todasLasEfectividades.length);
    
    return promedioGlobal;
  })();

  return (
    <div className="bg-light min-vh-100 responsive-app" style={{ fontFamily: 'Montserrat, sans-serif', background: '#e9f1fb', margin: 0, padding: 0 }}>
      {/* Layout con sidebar */}
      <div className="d-flex" style={{ minHeight: '100vh', margin: 0, padding: 0 }}>
        {/* Sidebar - Visible en desktop, oculta en móvil */}
        <div className="sidebar-desktop d-none d-lg-block" style={{ 
          width: '280px', 
          background: 'white', 
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)', 
          height: '100vh',
          overflowY: 'auto',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          margin: 0,
          padding: 0
        }}>
          {/* Logo y título */}
          <div style={{ 
            padding: '20px', 
            borderBottom: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 900, letterSpacing: 2, fontSize: 24, color: '#2c3e50', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
              <img src={logo} alt="Logo Diseños Sharo" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: '50%', background: '#fff', border: '2px solid #e9ecef' }} />
              <span>DISEÑOS SHARO</span>
            </div>
            <div style={{ fontSize: 16, color: '#6c757d', fontWeight: 600 }}>
              Panel de Administración
            </div>
          </div>

          {/* Navegación */}
          <Nav className="flex-column" activeKey={activeTab} onSelect={handleTabChange} style={{ padding: '20px 0', flex: 1 }}>
            <Nav.Link 
              eventKey="dashboard" 
              style={{ 
                fontWeight: 600, 
                fontSize: 16, 
                padding: '15px 25px',
                borderLeft: activeTab === 'dashboard' ? '4px solid #0d6efd' : '4px solid transparent',
                background: activeTab === 'dashboard' ? '#f8f9fa' : 'transparent',
                color: activeTab === 'dashboard' ? '#0d6efd' : '#495057'
              }}
            >
              <FaChartLine style={{ marginRight: 10, fontSize: 18 }} />
              Dashboard
            </Nav.Link>
            <Nav.Link 
              eventKey="empleados" 
              style={{ 
                fontWeight: 600, 
                fontSize: 16, 
                padding: '15px 25px',
                borderLeft: activeTab === 'empleados' ? '4px solid #0d6efd' : '4px solid transparent',
                background: activeTab === 'empleados' ? '#f8f9fa' : 'transparent',
                color: activeTab === 'empleados' ? '#0d6efd' : '#495057'
              }}
            >
              <FaUserCircle style={{ marginRight: 10, fontSize: 18 }} />
              Empleados
            </Nav.Link>
            <Nav.Link 
              eventKey="empleados-detallado" 
              style={{ 
                fontWeight: 600, 
                fontSize: 16, 
                padding: '15px 25px',
                borderLeft: activeTab === 'empleados-detallado' ? '4px solid #0d6efd' : '4px solid transparent',
                background: activeTab === 'empleados-detallado' ? '#f8f9fa' : 'transparent',
                color: activeTab === 'empleados-detallado' ? '#0d6efd' : '#495057'
              }}
            >
              <FaUserTie style={{ marginRight: 10, fontSize: 18 }} />
              Análisis Empleados
            </Nav.Link>
            <Nav.Link 
              onClick={() => navigate('/produccion')}
              style={{ 
                fontWeight: 600, 
                fontSize: 16, 
                padding: '15px 25px',
                borderLeft: '4px solid transparent',
                background: 'transparent',
                color: '#495057'
              }}
            >
              <FaCogs style={{ marginRight: 10, fontSize: 18 }} />
              Gestión de Producción
            </Nav.Link>
          </Nav>

          {/* Usuario y logout */}
          <div style={{ 
            padding: '20px', 
            borderTop: '1px solid #e9ecef',
            marginTop: 'auto'
          }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 15, display: 'flex', alignItems: 'center' }}>
              <FaUserCircle style={{ fontSize: 24, marginRight: 8, color: '#0d6efd' }} />
              Admin
            </div>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={handleLogout} 
              style={{ fontWeight: 600, fontSize: 14, borderRadius: 8, width: '100%' }}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="main-content" style={{ 
          flex: 1, 
          marginLeft: '100px',
          minHeight: '100vh',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          width: 'calc(100vw - 100px)',
          maxWidth: 'calc(100vw - 100px)'
        }}>
          {/* Barra superior para móvil */}
          <Navbar 
            bg="white" 
            expand="lg" 
            expanded={navbarExpanded}
            onToggle={(expanded) => setNavbarExpanded(expanded)}
            className="shadow-sm d-lg-none" 
            style={{ borderRadius: 0, margin: 0, padding: '0.5rem 1rem' }}
          >
            <Container fluid>
              <Navbar.Brand style={{ fontWeight: 900, letterSpacing: 2, fontSize: 20, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={logo} alt="Logo Diseños Sharo" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: '50%', background: '#fff', border: '2px solid #e9ecef', marginRight: 8 }} />
                <span>D. SHARO</span>
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="admin-navbar-nav" />
              <Navbar.Collapse id="admin-navbar-nav">
                <Nav className="me-auto" activeKey={activeTab} onSelect={handleTabChange} style={{ fontWeight: 600, fontSize: 16 }}>
                  <Nav.Link eventKey="dashboard">Dashboard</Nav.Link>
                  <Nav.Link eventKey="empleados">Empleados</Nav.Link>
                  <Nav.Link eventKey="empleados-detallado">Análisis Empleados</Nav.Link>
                  <Nav.Link onClick={() => navigate('/produccion')}>Gestión de Producción</Nav.Link>
                </Nav>
                <div className="d-flex align-items-center" style={{ fontWeight: 600, fontSize: 16 }}>
                  <FaUserCircle style={{ fontSize: 22, marginRight: 6 }} />Admin
                  <Button variant="outline-danger" size="sm" onClick={handleLogout} style={{ fontWeight: 600, fontSize: 14, borderRadius: 8, marginLeft: 10 }}>Cerrar sesión</Button>
                </div>
              </Navbar.Collapse>
            </Container>
          </Navbar>

          {/* Contenido de la página */}
          <div style={{ padding: '15px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            <div className="w-100" style={{ padding: 0, margin: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#0d6efd', flexDirection: 'column', gap: 20 }}>
              <Spinner animation="border" variant="primary" size="lg" />
              <div>Verificando sesión...</div>
              <div style={{ fontSize: 16, color: '#6c757d', marginTop: 10 }}>Por favor espera...</div>
            </div>
          ) : cargando ? (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#0d6efd', flexDirection: 'column', gap: 20 }}>
              <Spinner animation="border" variant="primary" size="lg" />
              <div>Cargando datos completos...</div>
              <div style={{ fontSize: 16, color: '#6c757d', marginTop: 10 }}>Preparando dashboard...</div>
            </div>
          ) : error ? (
            <Alert variant="danger" style={{ fontSize: 18, borderRadius: 10 }}>{error}</Alert>
          ) : (
            <>
                                          {activeTab === "dashboard" && (
                <>
                  <div className="text-center mb-2" style={{ fontSize: 18, color: '#6c757d', fontWeight: 500 }}>
                    {horaFormateada}
                  </div>
                  <div className="mb-4 p-4" style={{ background: 'linear-gradient(90deg, #e3f0ff 0%, #f8fafc 100%)', borderRadius: 18, boxShadow: '0 2px 12px rgba(44,62,80,0.07)', textAlign: 'center', width: '100%', margin: '0 0 32px 0' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#2c3e50', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <FaChartLine style={{ color: '#0d6efd', fontSize: 28 }} /> Progreso global del día
                    </div>
                    <div style={{ fontSize: 16, color: '#6c757d', marginBottom: 10 }}>¡Sigue así, cada tarea suma al equipo!</div>
                    <ProgressBar now={promedioEfectividad} label={`${promedioEfectividad}%`} style={{ height: 28, fontSize: 18, borderRadius: 14, background: '#e9ecef', boxShadow: '0 1px 6px #b6c6e0' }} variant={promedioEfectividad >= 80 ? "success" : promedioEfectividad >= 50 ? "warning" : "danger"} animated />
                    <div style={{ fontSize: 18, color: '#0d6efd', fontWeight: 700, marginTop: 10 }}>
                      {promedioEfectividad >= 80 ? <span><FaCheckCircle style={{ color: '#28a745', marginRight: 6 }} />¡Excelente equipo!</span> : promedioEfectividad >= 50 ? "¡Vamos bien!" : "¡Atención, podemos mejorar!"}
                    </div>
                    
                    {/* Estadísticas adicionales */}
                    {estadisticas && (
                      <Row className="mt-4 g-2 admin-stats-row">
                        <Col xs={6} sm={3} className="admin-stats-col">
                          <div style={{ textAlign: 'center', padding: 12, background: '#e8f5e8', borderRadius: 8, margin: '0 4px', position: 'relative' }}>
                            {estadisticasActualizando && (
                              <div style={{ position: 'absolute', top: 5, right: 5 }}>
                                <Spinner animation="border" size="sm" variant="success" />
                              </div>
                            )}
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#28a745' }}>
                              {estadisticas.tareasCompletadasHoy || 0}
                            </div>
                            <div style={{ fontSize: 12, color: '#6c757d' }}>Tareas Completadas Hoy</div>
                          </div>
                        </Col>
                        <Col xs={6} sm={3} className="admin-stats-col">
                          <div style={{ textAlign: 'center', padding: 12, background: '#fff3cd', borderRadius: 8, margin: '0 4px', position: 'relative' }}>
                            {estadisticasActualizando && (
                              <div style={{ position: 'absolute', top: 5, right: 5 }}>
                                <Spinner animation="border" size="sm" variant="warning" />
                              </div>
                            )}
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#ffc107' }}>
                              {estadisticas.tareasActivas || 0}
                            </div>
                            <div style={{ fontSize: 12, color: '#6c757d' }}>Tareas Activas</div>
                          </div>
                        </Col>
                        <Col xs={6} sm={3} className="admin-stats-col">
                          <div style={{ textAlign: 'center', padding: 12, background: '#e3f0ff', borderRadius: 8, margin: '0 4px', position: 'relative' }}>
                            {estadisticasActualizando && (
                              <div style={{ position: 'absolute', top: 5, right: 5 }}>
                                <Spinner animation="border" size="sm" variant="primary" />
                              </div>
                            )}
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#0d6efd' }}>
                              {estadisticas.empleadosActivos || 0}
                            </div>
                            <div style={{ fontSize: 12, color: '#6c757d' }}>Empleados Activos</div>
                          </div>
                        </Col>
                        <Col xs={6} sm={3} className="admin-stats-col">
                          <div style={{ textAlign: 'center', padding: 12, background: '#f8d7da', borderRadius: 8, margin: '0 4px', position: 'relative' }}>
                            {estadisticasActualizando && (
                              <div style={{ position: 'absolute', top: 5, right: 5 }}>
                                <Spinner animation="border" size="sm" variant="danger" />
                              </div>
                            )}
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#dc3545' }}>
                              {estadisticas.totalTareas || 0}
                            </div>
                            <div style={{ fontSize: 12, color: '#6c757d' }}>Total Tareas</div>
                          </div>
                        </Col>
                      </Row>
                    )}
                  </div>
                  <div className="mb-4 text-center">
                    <h2 style={{ fontWeight: 900, color: '#0d6efd', fontSize: 32, marginBottom: 6, letterSpacing: 1 }}>Tareas Activas</h2>
                    <div style={{ fontSize: 20, color: '#2c3e50', fontWeight: 600, marginBottom: 8 }}>Tareas en progreso: <span style={{ color: '#0d6efd', fontWeight: 900 }}>{produccion.length}</span> | Empleados conectados: <span style={{ color: '#28a745', fontWeight: 900 }}>{totalEnLinea}</span> de <span style={{ color: '#28a745', fontWeight: 900 }}>{totalEmpleados}</span></div>
                  </div>
                  {produccion.length === 0 ? (
                    <Alert variant="info" style={{ fontSize: 18, borderRadius: 10 }}>No hay tareas activas en este momento.</Alert>
                  ) : (
                    <Row className="g-4 admin-cards-container">
                      {(() => {
                        console.log('🎯 Renderizando tareas activas:', produccion.map(t => ({ id: t.id, usuario: t.usuario, empleadoNombre: t.empleadoNombre })));
                        return produccion.map(tarea => {
                        // La tarea ya está disponible directamente
                        console.log('🔍 Procesando tarea activa:', {
                          tareaId: tarea.id,
                          usuario: tarea.usuario,
                          empleadoNombre: tarea.empleadoNombre,
                          estado: tarea.estado,
                          horaInicio: tarea.horaInicio,
                          horaFin: tarea.horaFin
                        });
                        
                        // Calcular efectividad en tiempo real y hora de fin estimada
                        let efectividadEnTiempo = 100;
                        let tiempoEstimado = null;
                        let horaFinEstimada = "-";
                        let horaInicio = null;
                        let tiempoTranscurrido = "-";
                        
                        if (tarea && tarea.horaInicio) {
                          console.log('📊 Procesando tarea activa para empleado:', tarea.usuario, {
                            tareaId: tarea.id,
                            horaInicio: tarea.horaInicio,
                            tiempoEstimado: tarea.tiempoEstimado,
                            cantidadAsignada: tarea.cantidadAsignada,
                            cantidadHecha: tarea.cantidadHecha
                          });
                          
                          // Convertir horaInicio a Date de manera más robusta
                          try {
                            if (tarea.horaInicio.toDate) {
                              horaInicio = tarea.horaInicio.toDate();
                            } else if (tarea.horaInicio._seconds) {
                              horaInicio = new Date(tarea.horaInicio._seconds * 1000);
                            } else if (tarea.horaInicio instanceof Date) {
                              horaInicio = tarea.horaInicio;
                            } else {
                              horaInicio = new Date(tarea.horaInicio);
                            }
                            console.log('✅ Hora de inicio convertida:', horaInicio);
                          } catch (error) {
                            console.error('❌ Error al convertir horaInicio:', error);
                            horaInicio = null;
                          }
                          
                          // Usar tiempoEstimado del backend o calcularlo
                          if (tarea.tiempoEstimado && tarea.tiempoEstimado > 0) {
                            tiempoEstimado = tarea.tiempoEstimado;
                            console.log('📅 Usando tiempo estimado del backend:', tiempoEstimado, 'minutos');
                          } else {
                            // Si no hay tiempo estimado del backend, usar un valor por defecto
                            tiempoEstimado = 60; // 60 minutos por defecto
                            console.log('📅 Usando tiempo estimado por defecto:', tiempoEstimado, 'minutos');
                          }
                          
                          if (tiempoEstimado && tiempoEstimado > 0 && horaInicio) {
                            const fin = new Date(horaInicio.getTime() + tiempoEstimado * 60000);
                            horaFinEstimada = fin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            
                            // Calcular tiempo transcurrido usando horaActual para actualización en tiempo real
                            const tiempoTranscurridoMs = horaActual.getTime() - horaInicio.getTime();
                            const minutos = Math.floor(tiempoTranscurridoMs / 60000);
                            const segundos = Math.floor((tiempoTranscurridoMs % 60000) / 1000);
                            tiempoTranscurrido = `${minutos} min ${segundos} seg`;
                            
                            // Calcular efectividad en tiempo real de manera más precisa
                            const minutosTranscurridos = tiempoTranscurridoMs / 60000;
                            if (minutosTranscurridos <= tiempoEstimado) {
                              // Dentro del tiempo estimado
                              efectividadEnTiempo = 100;
                            } else {
                              // Pasado el tiempo estimado, calcular efectividad real
                              efectividadEnTiempo = Math.max(0, Math.round((tiempoEstimado / minutosTranscurridos) * 100));
                            }
                            
                            console.log('⏱️ Cálculo de efectividad:', {
                              tiempoEstimado,
                              minutosTranscurridos,
                              efectividadEnTiempo,
                              horaFinEstimada,
                              tiempoTranscurrido
                            });
                          } else if (horaInicio) {
                            // Si no hay tiempo estimado, mostrar solo tiempo transcurrido
                            const tiempoTranscurridoMs = horaActual.getTime() - horaInicio.getTime();
                            const minutos = Math.floor(tiempoTranscurridoMs / 60000);
                            const segundos = Math.floor((tiempoTranscurridoMs % 60000) / 1000);
                            tiempoTranscurrido = `${minutos} min ${segundos} seg`;
                            efectividadEnTiempo = 100; // Por defecto 100% si no hay tiempo estimado
                            
                            console.log('⏱️ Sin tiempo estimado, mostrando tiempo transcurrido:', tiempoTranscurrido);
                          }
                        }
                        
                        // Si no hay tarea activa, mostrar la barra de progreso del día
                        let barraProgreso = null;
                        let informacionAdicional = null;
                        
                        // Buscar información del empleado para esta tarea
                        const empleado = empleados.find(emp => emp.id === tarea.usuario);
                        const empleadoNombre = empleado ? empleado.nombre : tarea.empleadoNombre || tarea.usuario;
                        
                        if (!tarea) {
                          console.log('📊 No hay tarea activa para empleado:', tarea.usuario, '- Mostrando progreso del día');
                          
                          // Calcular promedio de efectividad del día usando las tareas del día reales
                          const tareasHoy = tareasDelDia[tarea.usuario] || [];
                          const tareasCompletadas = tareasHoy.filter(t => 
                            t.estado === 'finalizada' && 
                            t.efectividad !== null && 
                            t.efectividad !== undefined
                          );
                          
                          console.log('📋 Tareas del día para empleado:', tarea.usuario, {
                            totalTareas: tareasHoy.length,
                            tareasCompletadas: tareasCompletadas.length,
                            tareasHoy: tareasHoy.map(t => ({ id: t.id, estado: t.estado, efectividad: t.efectividad }))
                          });
                          
                          let efectividadDia = 100; // Por defecto 100% si no hay tareas completadas
                          if (tareasCompletadas.length > 0) {
                            const suma = tareasCompletadas.reduce((acc, t) => acc + Number(t.efectividad), 0);
                            efectividadDia = Math.round(suma / tareasCompletadas.length);
                            console.log('📈 Efectividad del día calculada:', efectividadDia, '%');
                          } else {
                            console.log('📈 Sin tareas completadas, efectividad por defecto:', efectividadDia, '%');
                          }
                          
                          barraProgreso = (
                            <ProgressBar 
                              now={efectividadDia} 
                              label={`${efectividadDia}%`} 
                              style={{ height: 22, fontSize: 16, borderRadius: 10, background: '#e9ecef', boxShadow: '0 1px 6px #b6c6e0', marginBottom: 16 }} 
                              variant={efectividadDia >= 80 ? "success" : efectividadDia >= 50 ? "warning" : "danger"} 
                              animated 
                            />
                          );
                          
                          // Información adicional cuando no hay tarea activa
                          informacionAdicional = (
                            <div style={{ 
                              background: 'linear-gradient(135deg, #e8f5e8 0%, #f8fafc 100%)', 
                              borderRadius: 12, 
                              padding: 16, 
                              marginTop: 8,
                              border: '1px solid #d4edda'
                            }}>
                              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                                <div style={{ fontSize: 14, color: '#28a745', fontWeight: 700, marginBottom: 4 }}>
                                  📊 Resumen del Día
                                </div>
                                <div style={{ fontSize: 12, color: '#6c757d' }}>
                                  {tareasCompletadas.length > 0 
                                    ? `${tareasCompletadas.length} tarea${tareasCompletadas.length > 1 ? 's' : ''} completada${tareasCompletadas.length > 1 ? 's' : ''}`
                                    : 'Sin tareas completadas hoy'
                                  }
                                </div>
                              </div>
                              
                              <Row style={{ fontSize: 12, color: '#2c3e50' }}>
                                <Col xs={6} style={{ textAlign: 'center' }}>
                                  <div style={{ fontWeight: 700, color: '#28a745' }}>
                                    {tareasHoy.length}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#6c757d' }}>Total</div>
                                </Col>
                                <Col xs={6} style={{ textAlign: 'center' }}>
                                  <div style={{ fontWeight: 700, color: '#ffc107' }}>
                                    {tareasHoy.filter(t => t.estado === 'en_progreso').length}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#6c757d' }}>En Progreso</div>
                                </Col>
                              </Row>
                            </div>
                          );
                        } else {
                          console.log('📊 Mostrando tarea activa para empleado:', tarea.usuario, {
                            efectividadEnTiempo,
                            tareaId: tarea.id,
                            tareaEstado: tarea.estado
                          });
                          
                          barraProgreso = (
                            <ProgressBar 
                              now={Number(efectividadEnTiempo)} 
                              label={`${efectividadEnTiempo}%`} 
                              style={{ height: 22, fontSize: 16, borderRadius: 10, background: '#e9ecef', boxShadow: '0 1px 6px #b6c6e0', marginBottom: 16 }} 
                              variant={efectividadEnTiempo >= 80 ? "success" : efectividadEnTiempo >= 50 ? "warning" : "danger"} 
                              animated 
                            />
                          );
                        }
                        return (
                          <Col key={tarea.id} xs={12} sm={6} lg={4}>
                            <Card className="shadow-sm border-0 admin-card" style={{ borderRadius: 16, background: 'linear-gradient(120deg, #f8fafc 60%, #e3f0ff 100%)', boxShadow: '0 2px 12px rgba(44,62,80,0.07)', width: '100%', height: '400px' }}>
                              <Card.Body style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0d6efd', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
                                    <FaUserCircle style={{ fontSize: 24, marginRight: 6 }} />
                                    <span>{empleadoNombre}</span>
                                    {tarea ? (
                                      <span style={{ fontSize: 12, color: '#28a745', fontWeight: 600, backgroundColor: '#d4edda', padding: '2px 8px', borderRadius: 6 }}>
                                        🟢 Trabajando
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: 12, color: '#28a745', fontWeight: 600, backgroundColor: '#e8f5e8', padding: '2px 8px', borderRadius: 6 }}>
                                        🟢 Disponible
                                      </span>
                                    )}
                                  </div>
                                  {barraProgreso}
                                  
                                  {/* Información adicional cuando no hay tarea activa */}
                                  {!tarea && informacionAdicional}
                                  
                                  {/* Texto descriptivo cuando no hay tarea */}
                                  {!tarea && (
                                    <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 8, textAlign: 'center' }}>
                                      {(() => {
                                        const tareasHoy = tareasDelDia[tarea.usuario] || [];
                                        const tareasCompletadas = tareasHoy.filter(t => t.estado === 'finalizada');
                                        if (tareasCompletadas.length === 0) {
                                          return "Efectividad del día: 100% (sin tareas)";
                                        } else {
                                          return `Promedio del día: ${tareasCompletadas.length} tarea${tareasCompletadas.length > 1 ? 's' : ''} completada${tareasCompletadas.length > 1 ? 's' : ''}`;
                                        }
                                      })()}
                                    </div>
                                  )}
                                  
                                  {/* Indicador de última actividad */}
                                  {!tarea && (
                                    <div style={{ 
                                      fontSize: 11, 
                                      color: '#28a745', 
                                      textAlign: 'center', 
                                      marginTop: 8,
                                      padding: '4px 8px',
                                      backgroundColor: '#e8f5e8',
                                      borderRadius: 6,
                                      border: '1px solid #d4edda'
                                    }}>
                                      🕐 Última actividad: {(() => {
                                        const presencia = presencias.find(p => p.id === tarea.usuario);
                                        if (presencia && presencia.lastSeen) {
                                          const lastSeen = new Date(presencia.lastSeen);
                                          const now = new Date();
                                          const diffMs = now - lastSeen;
                                          const diffMins = Math.floor(diffMs / 60000);
                                          
                                          if (diffMins < 1) return 'Justo ahora';
                                          if (diffMins < 60) return `Hace ${diffMins} min`;
                                          const diffHours = Math.floor(diffMins / 60);
                                          if (diffHours < 24) return `Hace ${diffHours}h`;
                                          return lastSeen.toLocaleDateString();
                                        }
                                        return 'Recientemente';
                                      })()}
                                    </div>
                                  )}
                                  
                                  {/* Indicador de estado de sincronización */}
                                  {!tarea && (
                                    <div style={{ 
                                      fontSize: 10, 
                                      color: '#6c757d', 
                                      textAlign: 'center', 
                                      marginTop: 4,
                                      padding: '2px 6px',
                                      backgroundColor: '#f8f9fa',
                                      borderRadius: 4,
                                      border: '1px solid #dee2e6'
                                    }}>
                                      🔄 Sincronizando datos...
                                    </div>
                                  )}
                                {tarea && (
                                  <>
                                    <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 8, textAlign: 'center' }}>
                                      Efectividad en tiempo real
                                    </div>
                                    <Row style={{ fontSize: 14, color: '#2c3e50', marginBottom: 0 }}>
                                    <Col xs={6} style={{ paddingLeft: 0 }}>
                                      <div style={{ marginBottom: 6 }}>
                                        <div style={{ color: '#6c757d', fontWeight: 700, fontSize: 13 }}>Operación</div>
                                        <div 
                                          className="operation-text"
                                          style={{ 
                                            fontWeight: 600, 
                                            cursor: 'pointer',
                                            whiteSpace: 'pre-line',
                                            lineHeight: '1.3',
                                            minHeight: '39px',
                                            maxHeight: '39px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical'
                                          }}
                                          onClick={() => handleOperationClick(Array.isArray(tarea.tareas) ? tarea.tareas.join(", ") : tarea.tareas)}
                                          title={Array.isArray(tarea.tareas) ? tarea.tareas.join(", ") : tarea.tareas}
                                        >
                                          {truncateOperationText(Array.isArray(tarea.tareas) ? tarea.tareas.join(", ") : tarea.tareas)}
                                        </div>
                                      </div>
                                      <div style={{ marginBottom: 6 }}>
                                        <div style={{ color: '#6c757d', fontWeight: 700, fontSize: 13 }}>Ref</div>
                                        <div style={{ fontWeight: 600 }}>
                                          {(() => {
                                            console.log('🔍 [DEBUG] Referencias para tarea:', tarea.id, tarea.referencias, 'Tipo:', typeof tarea.referencias);
                                            
                                            if (!tarea.referencias) return '-';
                                            
                                            // Si es un array
                                            if (Array.isArray(tarea.referencias)) {
                                              if (tarea.referencias.length === 0) return '-';
                                              
                                              // Si los elementos del array son objetos, extraer la propiedad correcta
                                              const refsStrings = tarea.referencias.map(ref => {
                                                if (typeof ref === 'object' && ref !== null) {
                                                  // Si es un objeto, intentar extraer codigo, id o convertir a string
                                                  return ref.codigo || ref.id || ref.nombre || JSON.stringify(ref);
                                                }
                                                return String(ref);
                                              });
                                              
                                              return refsStrings.join(', ');
                                            }
                                            
                                            // Si es un string, devolverlo directamente
                                            if (typeof tarea.referencias === 'string') {
                                              return tarea.referencias || '-';
                                            }
                                            
                                            // Si es un objeto, intentar extraer propiedades útiles
                                            if (typeof tarea.referencias === 'object' && tarea.referencias !== null) {
                                              return tarea.referencias.codigo || tarea.referencias.id || tarea.referencias.nombre || '-';
                                            }
                                            
                                            // Fallback final
                                            return String(tarea.referencias);
                                          })()}
                                        </div>
                                      </div>
                                      <div style={{ marginBottom: 6 }}>
                                        <div style={{ color: '#6c757d', fontWeight: 700, fontSize: 13 }}>Cantidad</div>
                                        <div style={{ fontWeight: 600 }}>{tarea.cantidadAsignada}</div>
                                      </div>
                                    </Col>
                                    <Col xs={6} style={{ paddingRight: 0 }}>
                                      <div style={{ marginBottom: 6 }}>
                                        <div style={{ color: '#6c757d', fontWeight: 700, fontSize: 13 }}>H/Inicio</div>
                                        <div style={{ fontWeight: 600 }}>{horaInicio ? horaInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</div>
                                      </div>
                                      <div style={{ marginBottom: 6 }}>
                                        <div style={{ color: '#6c757d', fontWeight: 700, fontSize: 13 }}>H/Fin</div>
                                        <div style={{ fontWeight: 600 }}>{horaFinEstimada}</div>
                                      </div>
                                      <div style={{ marginBottom: 6 }}>
                                        <div style={{ color: '#6c757d', fontWeight: 700, fontSize: 13 }}>Tiempo</div>
                                        <div style={{ fontWeight: 600 }}>{tiempoTranscurrido}</div>
                                      </div>
                                    </Col>
                                  </Row>
                                  </>
                                )}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      });
                    })()}
                    </Row>
                  )}
                </>
              )}
              {activeTab === "empleados" && (
                                  <div style={{ width: '100%', padding: 32, background: 'linear-gradient(90deg, #e3f0ff 0%, #f8fafc 100%)', borderRadius: 24, boxShadow: '0 2px 12px rgba(44,62,80,0.07)' }}>
                  <h2 style={{ fontWeight: 900, color: '#0d6efd', fontSize: 32, marginBottom: 24, letterSpacing: 1, textAlign: 'center' }}>Empleados</h2>
                  <Row xs={2} sm={3} md={4} lg={5} xl={6} className="g-3" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                    {empleados.map(emp => (
                      <Col key={emp.id} style={{ display: 'flex', justifyContent: 'flex-start', maxWidth: 260, minWidth: 210 }}>
                        <Card className="shadow-sm border-0" style={{ 
                          borderRadius: 18, 
                          background: 'linear-gradient(120deg, #f8fafc 80%, #e3f0ff 100%)', 
                          cursor: 'pointer', 
                          minHeight: 70, 
                          minWidth: 210, 
                          maxWidth: 260, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          boxShadow: '0 2px 12px rgba(44,62,80,0.10)', 
                          borderBottom: '4px solid #0d6efd', 
                          position: 'relative', 
                          overflow: 'hidden' 
                        }} onClick={() => handleOpenEmpleado(emp)}>
                          <Card.Body style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 14, width: '100%' }}>
                            <FaUserCircle style={{ fontSize: 36, color: '#0d6efd', marginBottom: 6, filter: 'drop-shadow(0 2px 4px #b6c6e0)' }} />
                            <span style={{ fontWeight: 800, fontSize: 18, color: '#2c3e50', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: 0.5, textShadow: '0 1px 2px #e3f0ff' }}>
                              {emp.nombre} {emp.apellidos ? emp.apellidos.split(' ')[0] : ''}
                            </span>
                            
                            {/* Indicador de estado sutil */}
                            <div style={{ 
                              position: 'absolute', 
                              top: 8, 
                              right: 8, 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              backgroundColor: presencias.some(p => p.id === emp.id && p.online) ? '#28a745' : '#6c757d',
                              border: '1px solid white',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }} />
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  {/* Modal de empleado */}
                  <Modal show={showEmpleadoModal} onHide={handleCloseEmpleado} centered size="lg">
                    <Modal.Header closeButton style={{ background: '#e3f0ff', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
                      <Modal.Title style={{ fontWeight: 800, color: '#0d6efd', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FaUserCircle style={{ fontSize: 38, color: '#0d6efd' }} />
                        {empleadoSeleccionado ? `${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellidos}` : ''}
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ background: '#f8fafc', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
                      {empleadoSeleccionado && (
                        <div style={{ fontSize: 16, color: '#2c3e50', fontWeight: 600, padding: 16 }}>
                          {/* Información personal organizada */}
                          <div style={{ 
                            background: 'linear-gradient(135deg, #e3f0ff 0%, #f8fafc 100%)', 
                            borderRadius: 12, 
                            padding: 20, 
                            marginBottom: 20,
                            border: '1px solid #dee2e6'
                          }}>
                            <h5 style={{ color: '#0d6efd', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FaUserCircle style={{ fontSize: 20 }} />
                              Información Personal
                            </h5>
                            <Row className="mb-3">
                              <Col xs={12} md={6} style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 14, color: '#6c757d', fontWeight: 600, marginBottom: 4 }}>Nombre Completo</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#2c3e50' }}>
                                  {empleadoSeleccionado.nombre} {empleadoSeleccionado.apellidos || ''}
                                </div>
                              </Col>
                              <Col xs={12} md={6} style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 14, color: '#6c757d', fontWeight: 600, marginBottom: 4 }}>Cédula</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#2c3e50' }}>
                                  {empleadoSeleccionado.cedula || 'No registrada'}
                                </div>
                              </Col>
                            </Row>
                            <Row className="mb-3">
                              <Col xs={12} md={6} style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 14, color: '#6c757d', fontWeight: 600, marginBottom: 4 }}>Correo Electrónico</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#2c3e50' }}>
                                  {empleadoSeleccionado.email}
                                </div>
                              </Col>
                                                              <Col xs={12} md={6} style={{ marginBottom: 12 }}>
                                  <div style={{ fontSize: 14, color: '#6c757d', fontWeight: 600, marginBottom: 4 }}>Cargo/Máquina</div>
                                  <div style={{ 
                                    fontSize: 16, 
                                    fontWeight: 700, 
                                    color: '#2c3e50',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'normal',
                                    lineHeight: 1.4,
                                    maxWidth: '100%'
                                  }}>
                                    {formatearCargo(empleadoSeleccionado.cargoMaquina)}
                                  </div>
                                </Col>
                            </Row>
                          </div>

                          {/* Estado actual del empleado */}
                          <div style={{ 
                            background: 'linear-gradient(135deg, #e8f5e8 0%, #f8fafc 100%)', 
                            borderRadius: 12, 
                            padding: 20, 
                            marginBottom: 20,
                            border: '1px solid #d4edda'
                          }}>
                            <h5 style={{ color: '#28a745', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FaChartLine style={{ fontSize: 20 }} />
                              Estado Actual
                            </h5>
                            <Row>
                              <Col xs={12} md={6} style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 14, color: '#6c757d', fontWeight: 600, marginBottom: 4 }}>Estado de Conexión</div>
                                <div style={{ 
                                  fontSize: 16, 
                                  fontWeight: 700, 
                                  color: presencias.some(p => p.id === empleadoSeleccionado.id && p.online) ? '#28a745' : '#6c757d',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8
                                }}>
                                  <div style={{ 
                                    width: 10, 
                                    height: 10, 
                                    borderRadius: '50%', 
                                    backgroundColor: presencias.some(p => p.id === empleadoSeleccionado.id && p.online) ? '#28a745' : '#6c757d'
                                  }} />
                                  {presencias.some(p => p.id === empleadoSeleccionado.id && p.online) ? 'En línea' : 'Desconectado'}
                                </div>
                              </Col>
                              <Col xs={12} md={6} style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 14, color: '#6c757d', fontWeight: 600, marginBottom: 4 }}>Tareas Activas</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#2c3e50' }}>
                                  {produccion.filter(p => p.usuario === empleadoSeleccionado.id && p.estado === 'en_progreso').length} tarea(s)
                                </div>
                              </Col>
                            </Row>
                          </div>

                          {/* Botones de acción */}
                          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <Button 
                              variant="primary" 
                              style={{ 
                                fontWeight: 700, 
                                fontSize: 16, 
                                borderRadius: 10, 
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                              }} 
                              onClick={() => {
                                // Cerrar modal actual y redirigir al análisis detallado
                                handleCloseEmpleado();
                                // Cambiar a la pestaña de análisis detallado
                                setActiveTab("empleados-detallado");
                                // Cargar el historial del empleado seleccionado
                                setTimeout(() => {
                                  cargarHistorialEmpleado(empleadoSeleccionado);
                                }, 100);
                              }}
                            >
                              <FaChartBar style={{ fontSize: 18 }} />
                              Ver Análisis Detallado
                            </Button>
                          </div>
                        </div>
                      )}
                      {/* La sección de historial se eliminó porque ahora redirige al análisis detallado */}
                    </Modal.Body>
                  </Modal>
                </div>
              )}
              {activeTab === "empleados-detallado" && (
                                  <div style={{ width: '100%', padding: 32, background: 'linear-gradient(90deg, #e3f0ff 0%, #f8fafc 100%)', borderRadius: 24, boxShadow: '0 2px 12px rgba(44,62,80,0.07)' }}>
                  <div style={{ margin: '0 0 20px 0', textAlign: 'center', width: '100%' }}>
                    <h2 style={{ fontWeight: 900, color: '#0d6efd', fontSize: 32, marginBottom: 8, letterSpacing: 1, marginTop: 0 }}>
                      <FaChartBar style={{ color: '#0d6efd', fontSize: 32, marginRight: 12 }} />
                      Análisis Detallado de Empleados
                    </h2>
                    <div style={{ fontSize: 18, color: '#2c3e50', fontWeight: 600, marginBottom: 16 }}>
                      Selecciona un empleado para ver su historial y análisis de productividad
                    </div>
                    
                    {/* Botón para finalizar todas las tareas en progreso */}
                    <div style={{ marginBottom: 20 }}>
                      <Button 
                        variant="warning" 
                        size="lg"
                        onClick={handleFinalizarTodasLasTareas}
                        style={{ 
                          fontWeight: 700, 
                          fontSize: 16, 
                          borderRadius: 12, 
                          padding: '12px 24px',
                          boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
                          border: 'none'
                        }}
                      >
                        <FaStopCircle style={{ marginRight: 8, fontSize: 18 }} />
                        Finalizar Todas las Tareas en Progreso
                      </Button>
                      <div style={{ fontSize: 14, color: '#6c757d', marginTop: 8, fontStyle: 'italic' }}>
                        ⚠️ Esta acción finalizará todas las tareas que están en progreso actualmente
                      </div>
                    </div>
                  </div>

                  {/* Selección de empleado */}
                  <div style={{ marginBottom: 24, textAlign: 'center' }}>
                    <Form.Select 
                      style={{ width: 400, fontSize: 16, borderRadius: 8, margin: '0 auto' }}
                      onChange={(e) => {
                        const empleado = empleados.find(emp => emp.id === e.target.value);
                        if (empleado) {
                          cargarHistorialEmpleado(empleado);
                        }
                      }}
                    >
                      <option value="">Selecciona un empleado para análisis detallado</option>
                      {empleados.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombre} {emp.apellidos || ''}
                        </option>
                      ))}
                    </Form.Select>
                  </div>

                  {empleadoSeleccionadoHistorial && (
                    <>
                      {cargando ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                          <Spinner animation="border" variant="primary" />
                          <div style={{ marginTop: 16, fontSize: 18, color: '#6c757d' }}>
                            Cargando historial de {empleadoSeleccionadoHistorial.nombre}...
                          </div>
                        </div>
                      ) : (
                        <>
                                                    {/* Información del empleado seleccionado */}
                          <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 16, background: '#fff' }}>
                            <Card.Body style={{ padding: 20 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <FaUserCircle style={{ fontSize: 48, color: '#0d6efd' }} />
                                <div>
                                  <h4 style={{ fontWeight: 800, color: '#2c3e50', margin: 0 }}>
                                    {empleadoSeleccionadoHistorial.nombre} {empleadoSeleccionadoHistorial.apellidos}
                                  </h4>
                                  <p style={{ color: '#6c757d', margin: 0, fontSize: 16 }}>
                                    {empleadoSeleccionadoHistorial.id}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Estadísticas rápidas */}
                              <Row>
                                <Col md={3}>
                                  <div style={{ textAlign: 'center', padding: 12, background: '#e3f0ff', borderRadius: 8 }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0d6efd' }}>
                                      {historialEmpleadoDetallado.length}
                                    </div>
                                    <div style={{ fontSize: 14, color: '#6c757d' }}>Total Tareas</div>
                                  </div>
                                </Col>
                                <Col md={3}>
                                  <div style={{ textAlign: 'center', padding: 12, background: '#e8f5e8', borderRadius: 8 }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#28a745' }}>
                                      {historialEmpleadoDetallado.filter(t => t.estado === 'finalizada').length}
                                    </div>
                                    <div style={{ fontSize: 14, color: '#6c757d' }}>Completadas</div>
                                  </div>
                                </Col>
                                <Col md={3}>
                                  <div style={{ textAlign: 'center', padding: 12, background: '#fff3cd', borderRadius: 8 }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#ffc107' }}>
                                      {historialEmpleadoDetallado.filter(t => t.estado === 'en_progreso').length}
                                    </div>
                                    <div style={{ fontSize: 14, color: '#6c757d' }}>En Progreso</div>
                                  </div>
                                </Col>
                                <Col md={3}>
                                  <div style={{ textAlign: 'center', padding: 12, background: '#f8d7da', borderRadius: 8 }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#dc3545' }}>
                                      {(() => {
                                        const tareasCompletadas = historialEmpleadoDetallado.filter(t => t.estado === 'finalizada' && t.efectividad !== null);
                                        if (tareasCompletadas.length === 0) return 0;
                                        const promedio = tareasCompletadas.reduce((acc, t) => acc + Number(t.efectividad), 0) / tareasCompletadas.length;
                                        return Math.round(promedio);
                                      })()}%
                                    </div>
                                    <div style={{ fontSize: 14, color: '#6c757d' }}>Promedio</div>
                                  </div>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>

                      {/* Filtros para la gráfica */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'center', marginBottom: 24, width: '100%' }}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>Ver por:</span>
                        <Form.Select style={{ width: 120, fontSize: 15, borderRadius: 8 }} value={filtroEmpleadoHistorial} onChange={e => setFiltroEmpleadoHistorial(e.target.value)}>
                          <option value="dia">Día</option>
                          <option value="semana">Semana</option>
                          <option value="mes">Mes</option>
                        </Form.Select>
                        
                        {filtroEmpleadoHistorial === "dia" && (
                          <div className="d-flex align-items-center gap-2" style={{ marginLeft: 8 }}>
                            <span style={{ fontWeight: 600, color: '#0d6efd', fontSize: 15 }}>Selecciona un día:</span>
                            <DatePicker
                              selected={fechaEmpleadoSeleccionada}
                              onChange={date => setFechaEmpleadoSeleccionada(date)}
                              dateFormat="dd/MM/yyyy"
                              className="form-control"
                              maxDate={new Date()}
                              showPopperArrow={false}
                              popperPlacement="bottom"
                              calendarClassName="w-100"
                            />
                          </div>
                        )}
                        
                        {filtroEmpleadoHistorial === "semana" && (
                          <>
                            <Form.Select style={{ width: 140, fontSize: 15, borderRadius: 8 }} value={mesEmpleadoSeleccionado} onChange={e => setMesEmpleadoSeleccionado(Number(e.target.value))}>
                              {mesesDelAnio.map((d, idx) => <option key={idx} value={idx}>{d.toLocaleString('default', { month: 'long' })}</option>)}
                            </Form.Select>
                            <Form.Select style={{ width: 140, fontSize: 15, borderRadius: 8 }} value={semanaEnMesSeleccionada} onChange={e => setSemanaEnMesSeleccionada(Number(e.target.value))}>
                              {[0,1,2,3].map(idx => <option key={idx} value={idx}>{`Semana ${idx+1}`}</option>)}
                            </Form.Select>
                            <span style={{ fontWeight: 600, color: '#0d6efd' }}>{getRangoSemanaEnMes(mesEmpleadoSeleccionado, semanaEnMesSeleccionada)}</span>
                          </>
                        )}
                        
                        {filtroEmpleadoHistorial === "mes" && (
                          <>
                            <Form.Select style={{ width: 180, fontSize: 15, borderRadius: 8 }} value={mesEmpleadoSeleccionado} onChange={e => setMesEmpleadoSeleccionado(Number(e.target.value))}>
                              {mesesDelAnio.map((d, idx) => <option key={idx} value={idx}>{d.toLocaleString('default', { month: 'long', year: 'numeric' })}</option>)}
                            </Form.Select>
                            <span style={{ fontWeight: 600, color: '#0d6efd' }}>{mesesDelAnio[mesEmpleadoSeleccionado].toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                          </>
                        )}
                        
                        {/* Botón de exportar Excel */}
                        <Button 
                          variant="success" 
                          size="sm" 
                          onClick={exportarAExcel}
                          data-export-excel
                          style={{ 
                            fontWeight: 600, 
                            fontSize: 14, 
                            borderRadius: 8, 
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginLeft: 16
                          }}
                        >
                          <FaFileExcel style={{ fontSize: 16 }} />
                          Exportar Datos
                        </Button>
                      </div>

                      {/* Gráfica */}
                                              <div className="responsive-graph-container" style={{ background: 'white', boxShadow: '0 2px 12px rgba(44,62,80,0.07)', borderRadius: 16, width: '100%', margin: '0 0 24px 0', padding: 24, overflowX: 'auto' }}>
                          <div style={{ width: '100%', height: '300px' }}>
                          <Line data={chartDataEmpleado} options={chartOptionsEmpleado} style={{ width: '100%', height: '300px' }} />
                        </div>
                      </div>

                      {/* Tabla de historial detallado */}
                      <div className="responsive-table-card" style={{ background: 'white', boxShadow: '0 2px 12px rgba(44,62,80,0.07)', borderRadius: 16, width: '100%', overflowX: 'auto' }}>
                        <div style={{ padding: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <h4 style={{ fontWeight: 800, color: '#2c3e50', margin: 0 }}>
                                <FaChartLine style={{ color: '#0d6efd', fontSize: 24, marginRight: 8 }} />
                                Historial Detallado
                              </h4>
                              <Button 
                                variant="outline-success" 
                                size="sm" 
                                onClick={exportarAExcel}
                                data-export-excel
                                style={{ 
                                  fontWeight: 600, 
                                  fontSize: 12, 
                                  borderRadius: 6, 
                                  padding: '4px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <FaFileExcel style={{ fontSize: 14 }} />
                                Exportar
                              </Button>
                            </div>
                            <div style={{ fontSize: 14, color: '#6c757d', fontWeight: 600 }}>
                              {(() => {
                                const historialFiltrado = getHistorialFiltrado();
                                if (filtroEmpleadoHistorial === "dia") {
                                  const dia = fechaEmpleadoSeleccionada.getDate().toString().padStart(2, '0');
                                  const mes = (fechaEmpleadoSeleccionada.getMonth() + 1).toString().padStart(2, '0');
                                  const anio = fechaEmpleadoSeleccionada.getFullYear();
                                  return `Mostrando ${historialFiltrado.length} tarea${historialFiltrado.length !== 1 ? 's' : ''} del ${dia}/${mes}/${anio}`;
                                } else if (filtroEmpleadoHistorial === "semana") {
                                  return `Mostrando ${historialFiltrado.length} tarea${historialFiltrado.length !== 1 ? 's' : ''} de la semana ${semanaEnMesSeleccionada + 1} de ${mesesDelAnio[mesEmpleadoSeleccionado].toLocaleString('default', { month: 'long' })}`;
                                } else {
                                  return `Mostrando ${historialFiltrado.length} tarea${historialFiltrado.length !== 1 ? 's' : ''} de ${mesesDelAnio[mesEmpleadoSeleccionado].toLocaleString('default', { month: 'long', year: 'numeric' })}`;
                                }
                              })()}
                            </div>
                          </div>
                          <Table striped bordered hover size="sm" responsive="md" style={{ fontSize: 14, borderRadius: 0, width: '100%', marginBottom: 0, background: 'white', boxShadow: 'none' }}>
                            <thead style={{ background: '#e3f0ff', fontWeight: 700, fontSize: 15 }}>
                              <tr>
                                <th style={{ minWidth: 110 }}>Fecha</th>
                                <th style={{ minWidth: 120 }}>Operaciones</th>
                                <th style={{ minWidth: 120 }}>Referencia</th>
                                <th style={{ minWidth: 80 }}>Asignada</th>
                                <th style={{ minWidth: 80 }}>Hecha</th>
                                <th style={{ minWidth: 110 }}>Efectividad (%)</th>
                                <th style={{ minWidth: 120 }}>Tiempo Transcurrido</th>
                                <th style={{ minWidth: 100 }}>Estado</th>
                                <th style={{ minWidth: 140 }}>Observaciones</th>
                              </tr>
                            </thead>
                                                                                      <tbody>
                               {getHistorialFiltrado().length > 0 ? (
                                 getHistorialFiltrado().map((h, idx) => (
                                   <tr key={idx} style={{ background: h.efectividad >= 80 ? '#e8fbe8' : h.efectividad >= 50 ? '#fffbe8' : '#fbe8e8', wordBreak: 'break-word' }}>
                                     <td style={{ maxWidth: 120, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{h.fecha}</td>
                                     <td style={{ maxWidth: 140, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{Array.isArray(h.tareas) ? h.tareas.join(", ") : h.tareas}</td>
                                     <td style={{ maxWidth: 140, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{h.referencia}</td>
                                     <td style={{ maxWidth: 80, textAlign: 'center' }}>{h.cantidadAsignada}</td>
                                     <td style={{ maxWidth: 80, textAlign: 'center' }}>{h.cantidadHecha}</td>
                                     <td style={{ maxWidth: 110, fontWeight: 700, color: h.efectividad >= 80 ? '#28a745' : h.efectividad >= 50 ? '#ffc107' : '#dc3545', textAlign: 'center' }}>{h.efectividad || '-'}</td>
                                     <td style={{ maxWidth: 120, textAlign: 'center', fontWeight: 600, color: '#2c3e50' }}>
                                       {h.tiempoTranscurrido ? `${h.tiempoTranscurrido} min` : '-'}
                                     </td>
                                     <td style={{ maxWidth: 100, textAlign: 'center' }}>
                                       <span style={{ 
                                         padding: '4px 8px', 
                                         borderRadius: 4, 
                                         fontSize: 12, 
                                         fontWeight: 600,
                                         backgroundColor: h.estado === 'finalizada' ? '#d4edda' : '#fff3cd',
                                         color: h.estado === 'finalizada' ? '#155724' : '#856404'
                                       }}>
                                         {h.estado === 'finalizada' ? 'Completada' : 'En Progreso'}
                                       </span>
                                     </td>
                                     <td style={{ maxWidth: 180, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{h.observaciones || '-'}</td>
                                   </tr>
                                 ))
                               ) : (
                                 <tr>
                                   <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px', color: '#6c757d', fontSize: 16 }}>
                                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                       <FaChartLine style={{ fontSize: 32, color: '#e3eaf7' }} />
                                       <span style={{ fontWeight: 600 }}>No hay tareas en este período</span>
                                       <span style={{ fontSize: 14 }}>Intenta seleccionar otro día, semana o mes</span>
                                     </div>
                                   </td>
                                 </tr>
                               )}
                             </tbody>
                          </Table>
                        </div>
                      </div>
                        </>
                      )}
                    </>
                  )}

                  {!empleadoSeleccionadoHistorial && (
                    <div style={{ textAlign: 'center', padding: 60, color: '#6c757d' }}>
                      <FaUsers style={{ fontSize: 64, color: '#e3eaf7', marginBottom: 16 }} />
                      <h4 style={{ fontWeight: 600, color: '#6c757d' }}>Selecciona un empleado</h4>
                      <p style={{ fontSize: 16, color: '#6c757d' }}>Elige un empleado del menú desplegable para ver su análisis detallado</p>
                    </div>
                  )}
                </div>
              )}
              {/* Las otras tabs se implementarán después */}
              {activeTab !== "dashboard" && activeTab !== "empleados" && activeTab !== "empleados-detallado" && (
                <Alert variant="info" style={{ fontSize: 18, borderRadius: 10 }}>Esta sección estará disponible próximamente.</Alert>
              )}
            </>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin; 