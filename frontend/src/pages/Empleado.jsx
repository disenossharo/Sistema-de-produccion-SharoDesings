import React, { useState, useEffect } from "react";
import { Button, Form, Card, Row, Col, Alert, ProgressBar, Accordion, Modal, Table, Nav, Navbar, Container, Spinner, Badge } from "react-bootstrap";
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
import { FaUserCircle, FaCheckCircle, FaChartLine, FaMedal, FaRandom, FaTasks } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import logo from "../assets/sharo-logo.png";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import '../App.css';
import * as api from "../services/api";
import { useAuth } from "../context/AuthContext";


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Datos por defecto (se cargarán desde la base de datos)
const referencias = [];





const Empleado = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  // Reloj en tiempo real
  const [horaActual, setHoraActual] = useState(new Date());
  const [horaFormateada, setHoraFormateada] = useState('');
  
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

  // Formulario de inicio
  const [tareasSeleccionadas, setTareasSeleccionadas] = useState([]); // array de nombres
  const [referencia, setReferencia] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [enProgreso, setEnProgreso] = useState(false);
  const [cantidadHecha, setCantidadHecha] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [efectividad, setEfectividad] = useState(null);
  const [error, setError] = useState("");
  const [horaEstimadaFin, setHoraEstimadaFin] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [historial, setHistorial] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState("inicio");
  const [filtroHistorial, setFiltroHistorial] = useState('semana');
  // Estado para guardar el ID de la tarea en progreso
  const [tareaIdEnProgreso, setTareaIdEnProgreso] = useState(null);
  // Estado para la tarea en progreso recuperada del servidor
  const [tareaEnProgreso, setTareaEnProgreso] = useState(null);
  const [tareaEnProgresoCargando, setTareaEnProgresoCargando] = useState(false);
  const [navbarExpanded, setNavbarExpanded] = useState(false);

  // Perfil personalizable (Firestore)
  const [perfil, setPerfil] = useState({
    nombre: "",
    apellidos: "",
    cedula: "",
  });
  const [perfilCargando, setPerfilCargando] = useState(false);
  const [perfilGuardado, setPerfilGuardado] = useState(false);
  const [perfilError, setPerfilError] = useState("");

  // Estado para usuario autenticado
  const [usuario, setUsuario] = useState(null);
  const [usuarioCargando, setUsuarioCargando] = useState(true);

  // Estado para la fecha seleccionada en el filtro de día (debe estar aquí arriba)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  // Estados para operaciones y referencias dinámicas
  const [operaciones, setOperaciones] = useState([]);
  const [referencias, setReferencias] = useState([]);
  const [operacionesCargando, setOperacionesCargando] = useState(true);
  const [referenciasCargando, setReferenciasCargando] = useState(true);


  // Presencia en línea: marcar online al entrar y offline al salir
  useEffect(() => {
    if (usuario && usuario.email && token) {
      // Enviar heartbeat inicial
      const sendHeartbeat = async () => {
        try {
          await api.updateHeartbeat(token);
        } catch (error) {
          console.error('❌ Error enviando heartbeat:', error);
          // Si hay error de autenticación, redirigir al login
          if (error.message && error.message.includes('401')) {
            console.log('🔐 Sesión expirada, redirigiendo al login...');
            logout();
            navigate("/login");
          }
        }
      };
      
      sendHeartbeat();
      
      // Enviar heartbeat cada 30 segundos
      const heartbeatInterval = setInterval(sendHeartbeat, 30000);
      
      // Marcar offline al cerrar pestaña o navegar fuera
      const handleOffline = async () => {
        try {
          if (usuario && usuario.email && token) {
            await api.logout(token);
          }
        } catch (error) {
          console.error('❌ Error al marcar usuario como offline:', error);
        }
      };
      
      // Event listener para antes de cerrar la pestaña
      window.addEventListener("beforeunload", handleOffline);
      
      // Event listener para cuando se pierde el foco de la ventana
      const handleVisibilityChange = () => {
        if (document.hidden) {
          handleOffline();
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
    }
  }, [usuario, token, logout, navigate]);

  // Obtener perfil al cargar
  useEffect(() => {
    async function fetchPerfil() {
      if (!token) {
        setUsuarioCargando(false);
        return;
      }
      
      try {
        const perfilData = await api.getPerfil(token);
        
        // Convertir cargoMaquina de string a array para los checkboxes
        const perfilProcesado = {
          ...perfilData,
          cargoMaquina: perfilData.cargoMaquina && typeof perfilData.cargoMaquina === 'string' 
            ? perfilData.cargoMaquina.split(', ').filter(cargo => cargo.trim() !== '')
            : (Array.isArray(perfilData.cargoMaquina) ? perfilData.cargoMaquina : [])
        };
        
        setPerfil(perfilProcesado);
        setUsuario({ email: perfilData.email });
      } catch (e) {
        console.error('Error al cargar perfil:', e);
        setPerfil(null);
        setUsuario(null);
        // Si hay error de autenticación, redirigir al login
        if (e.message && e.message.includes('401')) {
          logout();
          navigate("/login");
        }
      } finally {
        setUsuarioCargando(false);
      }
    }
    fetchPerfil();
  }, [token, logout, navigate]);

  // Cargar operaciones y referencias activas
  useEffect(() => {
    async function fetchOperacionesYReferencias() {
      if (!token) return;
      
      try {
        // Cargar operaciones activas
        const operacionesData = await api.getOperacionesActivas(token);
        setOperaciones(operacionesData);
        setOperacionesCargando(false);
        
        // Cargar referencias activas
        const referenciasData = await api.getReferenciasActivas(token);
        setReferencias(referenciasData);
        setReferenciasCargando(false);
        
      } catch (e) {
        console.error('Error al cargar operaciones/referencias:', e);
        setOperacionesCargando(false);
        setReferenciasCargando(false);
        // Si hay error de autenticación, redirigir al login
        if (e.message && e.message.includes('401')) {
          logout();
          navigate("/login");
        }
      }
    }
    
    fetchOperacionesYReferencias();
    
    // Actualizar operaciones y referencias cada 30 segundos para mantener sincronizado
    const interval = setInterval(fetchOperacionesYReferencias, 30000);
    
    return () => clearInterval(interval);
  }, [token, logout, navigate]);


  // Obtener historial al cargar
  useEffect(() => {
    async function fetchHistorial() {
      if (!usuario || !token) return;
      
      try {
        const historialData = await api.getHistorial(token);
        setHistorial(historialData);
      } catch (e) {
        console.error('Error al cargar historial:', e);
        setHistorial([]);
        // Si hay error de autenticación, redirigir al login
        if (e.message && e.message.includes('401')) {
          logout();
          navigate("/login");
        }
      }
    }
    if (usuario) fetchHistorial();
  }, [usuario, token, logout, navigate]);

  // Obtener tarea en progreso al cargar
  useEffect(() => {
    async function fetchTareaEnProgreso() {
      if (!usuario || !token) return;
      
      setTareaEnProgresoCargando(true);
      try {
        const tareaData = await api.getTareaEnProgreso(token);
        
        if (tareaData) {
          setTareaEnProgreso(tareaData);
          setTareaIdEnProgreso(tareaData.id);
          setTareasSeleccionadas(tareaData.tareas || []);
          setReferencia(tareaData.referencia || "");
          setCantidad(tareaData.cantidadAsignada || "");
          
          // Manejar la fecha de inicio correctamente
          let horaInicioDate = null;
          if (tareaData.horaInicio) {
            try {
              // Si es un timestamp de Firestore
              if (tareaData.horaInicio.toDate) {
                horaInicioDate = tareaData.horaInicio.toDate();
              } 
              // Si es un string de fecha
              else if (typeof tareaData.horaInicio === 'string') {
                horaInicioDate = new Date(tareaData.horaInicio);
              }
              // Si es un objeto Date o timestamp
              else {
                horaInicioDate = new Date(tareaData.horaInicio);
              }
              
              // Verificar que la fecha sea válida
              if (isNaN(horaInicioDate.getTime())) {
                console.error('Fecha de inicio inválida:', tareaData.horaInicio);
                horaInicioDate = new Date(); // Usar fecha actual como fallback
              }
            } catch (error) {
              console.error('Error al parsear fecha de inicio:', error);
              horaInicioDate = new Date(); // Usar fecha actual como fallback
            }
          }
          
          setHoraInicio(horaInicioDate);
          setCantidadHecha(tareaData.cantidadHecha || "");
          setObservaciones(tareaData.observaciones || "");
          setEnProgreso(true);
          
          // Calcular hora estimada de fin
          if (tareaData.tiempoEstimado && horaInicioDate) {
            const fin = new Date(horaInicioDate.getTime() + tareaData.tiempoEstimado * 60000);
            setHoraEstimadaFin(fin);
          }
        }
              } catch (e) {
          setTareaEnProgreso(null);
          setTareaIdEnProgreso(null);
          setTareasSeleccionadas([]);
          setReferencia("");
          setCantidad("");
          setHoraInicio(null);
          setCantidadHecha("");
          setEnProgreso(false);
        } finally {
        setTareaEnProgresoCargando(false);
      }
    }
    
    fetchTareaEnProgreso();
  }, [usuario, token]);

  // Estado para mes y semana seleccionados (solo año actual)
  const anioActual = new Date().getFullYear();
  const mesesDelAnio = Array.from({ length: 12 }, (_, i) => new Date(anioActual, i, 1));
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [semanaEnMesSeleccionada, setSemanaEnMesSeleccionada] = useState(0); // 0-3 para semana 1-4

  // Sincronizar semanaSeleccionada y mesSeleccionado cuando cambian los arrays base
  useEffect(() => {
    if (semanaEnMesSeleccionada >= 4) { // 4 semanas en un mes
      setSemanaEnMesSeleccionada(3); // Mantener la última semana
    }
  }, [semanaEnMesSeleccionada]);
  useEffect(() => {
    if (mesSeleccionado >= mesesDelAnio.length) {
      setMesSeleccionado(mesesDelAnio.length - 1 >= 0 ? mesesDelAnio.length - 1 : 0);
    }
  }, [mesesDelAnio]);




  // En el filtro de semana, permitir elegir el mes y luego la semana específica (1-4)
  const getRangoSemanaEnMes = (mesIdx, semanaIdx) => {
    const mes = mesesDelAnio[mesIdx];
    if (!mes) return "";
    const inicio = new Date(mes);
    inicio.setDate(semanaIdx * 7 + 1);
    const fin = new Date(mes);
    fin.setDate(Math.min((semanaIdx + 1) * 7, new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()));
    return `${inicio.toLocaleDateString()} al ${fin.toLocaleDateString()}`;
  };

    // Filtrar historial por día seleccionado
    const historialFiltradoDia = historial.filter(h => {
      if (!h.fecha || typeof h.fecha !== 'string') return false;
      // Extraer solo la parte de la fecha (dd/mm/yyyy)
      const fechaRegistro = h.fecha.split(',')[0].trim();
      const fechaSel = fechaSeleccionada;
      const dia = fechaSel.getDate().toString().padStart(2, '0');
      const mes = (fechaSel.getMonth() + 1).toString().padStart(2, '0');
      const anio = fechaSel.getFullYear();
      const fechaSeleccionadaStr = `${dia}/${mes}/${anio}`;
      return fechaRegistro === fechaSeleccionadaStr;
    });

  // Modificar getChartDataFromHistorial para el nuevo filtro de semana
  const getChartDataFromHistorial = () => {
    if (historial.length === 0) return { labels: [], data: [] };
    if (filtroHistorial === "dia") {
      // Mostrar un punto por cada registro del día
      const labels = historialFiltradoDia.map(h => h.fecha.split(' ')[1]?.slice(0, 5) || '');
      const data = historialFiltradoDia.map(h => h.efectividad);
      return { labels, data };
    } else if (filtroHistorial === "semana") {
      // Mostrar semana específica del mes seleccionado (lunes a domingo)
      const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      const suma = Array(7).fill(0);
      const cuenta = Array(7).fill(0);
      const mes = mesesDelAnio[mesSeleccionado];
      if (!mes) return { labels: dias, data: Array(7).fill(0) };
      // Calcular el primer día (lunes) de la semana seleccionada
      const semanaBase = new Date(mes.getFullYear(), mes.getMonth(), 1 + semanaEnMesSeleccionada * 7);
      let lunes = new Date(semanaBase);
      // Ajustar para que sea lunes
      while (lunes.getDay() !== 1) {
        lunes.setDate(lunes.getDate() - 1);
      }
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      // Recorrer historial y sumar efectividad por día de la semana
      historial.forEach(h => {
        // Convertir h.fecha a Date robustamente
        let fecha;
        if (h.fecha instanceof Date) {
          fecha = h.fecha;
        } else if (h.fecha && typeof h.fecha === 'string') {
          // h.fecha es string tipo 'dd/mm/yyyy, hh:mm:ss'
          const partes = h.fecha.split(",")[0].split("/");
          if (partes.length === 3) {
            // Formato: dd/mm/yyyy
            fecha = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          } else {
            fecha = new Date(h.fecha);
          }
        } else {
          // Si no hay fecha válida, saltar este registro
          return;
        }
        // Limpiar hora para comparar solo fecha
        fecha.setHours(0,0,0,0);
        if (fecha >= lunes && fecha <= domingo) {
          let dia = fecha.getDay();
          // Ajustar para que lunes=0, ..., domingo=6
          dia = dia === 0 ? 6 : dia - 1;
          suma[dia] += Number(h.efectividad);
          cuenta[dia]++;
        }
      });
      const data = suma.map((s, i) => cuenta[i] ? (s / cuenta[i]).toFixed(1) : 0);
      return {
        labels: dias,
        data
      };
    } else {
      // Mes completo, mostrar 4 semanas
      const semanas = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
      const suma = Array(4).fill(0);
      const cuenta = Array(4).fill(0);
      const mesInicio = mesesDelAnio[mesSeleccionado];
      if (!mesInicio) return { labels: semanas, data: Array(4).fill(0) };
      const mesFin = new Date(mesInicio.getFullYear(), mesInicio.getMonth() + 1, 0);
      historial.forEach(h => {
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
        if (fecha >= mesInicio && fecha <= mesFin) {
          const semana = Math.min(3, Math.floor((fecha.getDate() - 1) / 7));
          suma[semana] += Number(h.efectividad);
          cuenta[semana]++;
        }
      });
      const data = suma.map((s, i) => cuenta[i] ? (s / cuenta[i]).toFixed(1) : 0);
      return {
        labels: semanas,
        data
      };
    }
  };

  // Mejorar visibilidad e interactividad de la gráfica
  const chartData = {
    labels: getChartDataFromHistorial().labels,
    datasets: [
      {
        label: 'Productividad (%)',
        data: getChartDataFromHistorial().data,
        fill: false,
        borderColor: '#0d6efd',
        backgroundColor: '#0d6efd',
        tension: 0.3,
        pointRadius: 5, // antes 10
        pointHoverRadius: 8, // antes 16
        borderWidth: 3, // antes 5
        spanGaps: true,
        hoverBackgroundColor: '#ffc107',
        hoverBorderColor: '#28a745',
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // <-- Añadido para mejor responsividad
    aspectRatio: 6, // Puedes dejarlo o quitarlo, pero maintainAspectRatio: false tiene prioridad
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Productividad' },
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
      datalabels: {
        display: true,
        color: '#2c3e50',
        font: { weight: 'bold', size: 16 },
        formatter: v => v ? `${v}%` : '',
      },
    },
    onClick: (e, elements) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        alert(`Día/Semana: ${chartData.labels[idx]}\nEfectividad: ${chartData.datasets[0].data[idx]}%`);
      }
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


 
  const [tiempoEfectivo, setTiempoEfectivo] = useState(0); // en minutos

  // Configuración de jornada y descansos automáticos
  const JORNADA_INICIO = { hour: 7, minute: 30 };
  const JORNADA_FIN = { hour: 16, minute: 30 };
  const DESAYUNO = { hour: 9, minute: 0, duracion: 15 };
  const ALMUERZO = { hour: 12, minute: 30, duracion: 30 };

  // Función para saber si la hora actual está en el rango de descanso
  const isInDescanso = (date) => {
    const minutos = date.getHours() * 60 + date.getMinutes();
    const desayunoInicio = DESAYUNO.hour * 60 + DESAYUNO.minute;
    const desayunoFin = desayunoInicio + DESAYUNO.duracion;
    const almuerzoInicio = ALMUERZO.hour * 60 + ALMUERZO.minute;
    const almuerzoFin = almuerzoInicio + ALMUERZO.duracion;
    if (minutos >= desayunoInicio && minutos < desayunoFin) return 'desayuno';
    if (minutos >= almuerzoInicio && minutos < almuerzoFin) return 'almuerzo';
    return null;
  };

  // Función para saber si la hora actual está dentro de la jornada
  const isInJornada = (date) => {
    const minutos = date.getHours() * 60 + date.getMinutes();
    const inicio = JORNADA_INICIO.hour * 60 + JORNADA_INICIO.minute;
    const fin = JORNADA_FIN.hour * 60 + JORNADA_FIN.minute;
    return minutos >= inicio && minutos < fin;
  };

  // El turno es automático: siempre activo entre 7:30am y 4:30pm
  const turnoActivo = isInJornada(horaActual);
  const horaInicioTurno = new Date(horaActual);
  horaInicioTurno.setHours(JORNADA_INICIO.hour, JORNADA_INICIO.minute, 0, 0);
  const horaFinTurno = new Date(horaActual);
  horaFinTurno.setHours(JORNADA_FIN.hour, JORNADA_FIN.minute, 0, 0);

  // Calcular tiempo transcurrido en el turno
  let tiempoTranscurrido = 0;
  if (horaActual >= horaInicioTurno && horaActual <= horaFinTurno) {
    tiempoTranscurrido = Math.floor((horaActual - horaInicioTurno) / 60000);
  } else if (horaActual > horaFinTurno) {
    tiempoTranscurrido = Math.floor((horaFinTurno - horaInicioTurno) / 60000);
  }

  // Calcular tiempo efectivo trabajado automáticamente (ajustado para turno automático)
  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date();
      let minutos = 0;
      const inicioJornada = new Date(ahora);
      inicioJornada.setHours(JORNADA_INICIO.hour, JORNADA_INICIO.minute, 0, 0);
      let t = new Date(inicioJornada);
      while (t < ahora && isInJornada(t)) {
        const descanso = isInDescanso(t);
        if (!descanso) minutos++;
        t.setMinutes(t.getMinutes() + 1);
      }
      setTiempoEfectivo(minutos);
    }, 1000);
    return () => clearInterval(interval);
  }, [horaActual]);

  // Mensaje de descanso automático
  const descansoActual = isInDescanso(horaActual);
  const mensajeDescanso = descansoActual === 'desayuno'
    ? '¡Es hora de tu desayuno! Disfruta tus 15 minutos de descanso.'
    : descansoActual === 'almuerzo'
      ? '¡Es hora de tu almuerzo! Disfruta tus 30 minutos de descanso.'
      : null;

  // --- AVISO DE PRÓXIMO DESCANSO ---
  const getMinutosParaDescanso = (date) => {
    const minutosActual = date.getHours() * 60 + date.getMinutes();
    const desayunoInicio = DESAYUNO.hour * 60 + DESAYUNO.minute;
    const desayunoFin = desayunoInicio + DESAYUNO.duracion;
    const almuerzoInicio = ALMUERZO.hour * 60 + ALMUERZO.minute;
    const almuerzoFin = almuerzoInicio + ALMUERZO.duracion;
    let minutosParaDesayuno = desayunoInicio - minutosActual;
    let minutosParaAlmuerzo = almuerzoInicio - minutosActual;
    let minutosParaFinDesayuno = desayunoFin - minutosActual;
    let minutosParaFinAlmuerzo = almuerzoFin - minutosActual;
    if (minutosParaDesayuno < 0) minutosParaDesayuno = Infinity;
    if (minutosParaAlmuerzo < 0) minutosParaAlmuerzo = Infinity;
    if (minutosParaFinDesayuno < 0) minutosParaFinDesayuno = Infinity;
    if (minutosParaFinAlmuerzo < 0) minutosParaFinAlmuerzo = Infinity;
    return {
      tipo: minutosParaDesayuno < minutosParaAlmuerzo ? 'desayuno' : 'almuerzo',
      minutos: Math.min(minutosParaDesayuno, minutosParaAlmuerzo),
      minutosParaFinDesayuno,
      minutosParaFinAlmuerzo
    };
  };
  const avisoDescanso = (() => {
    const { tipo, minutos, minutosParaFinDesayuno, minutosParaFinAlmuerzo } = getMinutosParaDescanso(horaActual);
    if (minutos === 5) {
      return tipo === 'desayuno'
        ? 'En 5 minutos comienza tu desayuno.'
        : 'En 5 minutos comienza tu almuerzo.';
    }
    if (minutosParaFinDesayuno === 5) {
      return 'En 5 minutos termina tu desayuno.';
    }
    if (minutosParaFinAlmuerzo === 5) {
      return 'En 5 minutos termina tu almuerzo.';
    }
    return null;
  })();


  // Botón de cerrar sesión
  const handleLogout = async () => {
    try {
      if (usuario && usuario.email && token) {
        // Marcar empleado como offline en la base de datos
        await api.logout(token);
      }
    } catch (error) {
      console.error('❌ Error al marcar usuario como offline:', error);
      // Continuar con el logout aunque falle la API
    }
    
    logout();
    navigate("/login");
    window.location.reload();
  };

  // Función para manejar el cambio de pestaña y cerrar el menú
  const handleTabChange = (selectedKey) => {
    setActiveTab(selectedKey);
    setNavbarExpanded(false); // Cerrar el menú hamburguesa
  };

  // Formato de hora
  const formatHora = (date) => {
    if (!date || isNaN(date.getTime())) return "No disponible";
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };
  
  const formatHoraSimple = (date) => {
    if (!date || isNaN(date.getTime())) return "No disponible";
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Calcular tiempo estimado total con validaciones robustas
  const tiempoEstimado = (() => {
    // Validar que tengamos todos los datos necesarios
    if (!cantidad || !tareasSeleccionadas || tareasSeleccionadas.length === 0 || !operaciones || operaciones.length === 0) {
      return 0;
    }

    try {
      const cantidadNum = Number(cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        return 0;
      }

      // Calcular tiempo total de todas las operaciones seleccionadas
      const tiempoTotalOperaciones = tareasSeleccionadas.reduce((acc, nombreTarea) => {
        const operacionObj = operaciones.find(op => op.nombre === nombreTarea);
        if (!operacionObj) {
          return acc;
        }
        
        const tiempoOperacion = Number(operacionObj.tiempo_por_unidad);
        if (isNaN(tiempoOperacion) || tiempoOperacion <= 0) {
          return acc;
        }
        
        return acc + tiempoOperacion;
      }, 0);

      // Multiplicar por la cantidad
      const tiempoTotal = tiempoTotalOperaciones * cantidadNum;
      
      return tiempoTotal;
    } catch (error) {
      console.error('❌ Error calculando tiempo estimado:', error);
      return 0;
    }
  })();

  // Validar que el tiempo estimado sea un número válido
  const tiempoEstimadoValido = isNaN(tiempoEstimado) || tiempoEstimado <= 0 ? 0 : tiempoEstimado;


  // Iniciar tarea
  const handleComenzar = async () => {
    // Validaciones mejoradas
    if (tareasSeleccionadas.length === 0) {
      setError("Por favor selecciona al menos una operación.");
      return;
    }
    
    if (!referencia || referencia.trim().length === 0) {
      setError("Por favor selecciona una referencia.");
      return;
    }
    
    if (!cantidad || isNaN(cantidad) || Number(cantidad) <= 0) {
      setError("Por favor ingresa una cantidad válida mayor a 0.");
      return;
    }
    
    if (!token) {
      setError("Error de autenticación. Por favor, vuelve a iniciar sesión.");
      logout();
      navigate("/login");
      return;
    }
    
    setError("");
    setHoraInicio(horaActual);
    
    // Calcular hora estimada de fin
    const fin = new Date(horaActual.getTime() + tiempoEstimadoValido * 60000);
    setHoraEstimadaFin(fin);
    setEnProgreso(true);
    
    // Crear tarea en progreso en el backend
    try {
      const tareaEnProgreso = await api.crearTareaEnProgreso(token, {
        tareas: tareasSeleccionadas,
        referencia: referencia.trim(),
        cantidadAsignada: Number(cantidad),
        tiempoEstimado: tiempoEstimadoValido
      });
      
      setTareaIdEnProgreso(tareaEnProgreso.id);
      setTareaEnProgreso(tareaEnProgreso);
      
      // Redirigir automáticamente a la pestaña "Tarea"
      setActiveTab("tarea");
      setSuccessMsg("¡Tarea iniciada exitosamente! Redirigiendo a la gestión de tareas...");
      
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccessMsg(""), 5000);
      
    } catch (e) {
      console.error('Error al crear tarea en progreso:', e);
      
      // Manejo específico de errores
      if (e.message && e.message.includes('401')) {
        setError("Error de autenticación. Por favor, vuelve a iniciar sesión.");
        logout();
        navigate("/login");
      } else if (e.message && e.message.includes('409')) {
        setError("Ya tienes una tarea en progreso. Finaliza la tarea actual antes de iniciar una nueva.");
      } else {
        setError("Error al crear la tarea. Intenta de nuevo.");
      }
      
      setEnProgreso(false);
      setHoraInicio("");
      setHoraEstimadaFin(null);
    }
  };

  // Función mejorada para manejar el cambio de selección de tareas
  const handleTareaCheckbox = (nombreTarea) => {
    setTareasSeleccionadas(prev => {
      const nuevasTareas = prev.includes(nombreTarea)
        ? prev.filter(t => t !== nombreTarea)
        : [...prev, nombreTarea];
      
      return nuevasTareas;
    });
  };

  // Función para finalizar la tarea
  const handleFinalizar = () => {
    // Validaciones antes de finalizar
    if (!cantidadHecha || isNaN(cantidadHecha) || Number(cantidadHecha) < 0) {
      setError("Por favor ingresa una cantidad hecha válida.");
      return;
    }
    
    const cantidadNum = Number(cantidad);
    const cantidadHechaNum = Number(cantidadHecha);
    
    if (cantidadHechaNum > cantidadNum) {
      setError("La cantidad hecha no puede ser mayor a la cantidad asignada.");
      return;
    }
    
    // Calcular efectividad basada en cantidad hecha vs asignada
    let efectividadCantidad = 100;
    if (cantidadNum > 0) {
      efectividadCantidad = Math.max(0, Math.min(100, (cantidadHechaNum / cantidadNum) * 100));
    }
    
    // Calcular efectividad basada en tiempo (si hay tiempo estimado)
    let efectividadTiempo = 100;
    let tiempoTranscurridoTarea = 0;
    
    if (horaInicio && tiempoEstimadoValido) {
      tiempoTranscurridoTarea = (new Date() - horaInicio) / 60000; // en minutos
      if (tiempoTranscurridoTarea > tiempoEstimadoValido) {
        // Si se excedió el tiempo, la efectividad baja proporcionalmente
        efectividadTiempo = Math.max(0, (tiempoEstimadoValido / tiempoTranscurridoTarea) * 100);
      }
    }
    
    // La efectividad final es el promedio ponderado (70% cantidad, 30% tiempo)
    const efectividadFinal = Math.round(
      (efectividadCantidad * 0.7 + efectividadTiempo * 0.3) * 10
    ) / 10;
    
    setEfectividad(efectividadFinal);
    setHoraFin(new Date());
    setEnProgreso(false);
    setShowModal(true);
    setError(""); // Limpiar errores previos
  };

  // Función para guardar el perfil del usuario
  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    if (!usuario || !token) return;
    
    // Validaciones básicas
    if (!perfil?.nombre || perfil.nombre.trim().length === 0) {
      setPerfilError("El nombre es requerido.");
      return;
    }
    
    setPerfilCargando(true);
    setPerfilError("");
    setPerfilGuardado(false);
    
    try {
      // Preparar datos del perfil
      const perfilData = {
        nombre: perfil.nombre.trim(),
        apellidos: perfil.apellidos ? perfil.apellidos.trim() : '',
        cedula: perfil.cedula ? perfil.cedula.trim() : '',
        cargoMaquina: Array.isArray(perfil.cargoMaquina) ? perfil.cargoMaquina.join(', ') : (perfil.cargoMaquina || '')
      };
      
      // Si el perfil ya tiene nombre o apellidos, actualiza; si no, crea
      if (perfil?.nombre || perfil?.apellidos) {
        await api.actualizarPerfilEmpleado(token, perfilData);
      } else {
        await api.crearPerfilEmpleado(token, perfilData);
      }
      
      setPerfilGuardado(true);
      setPerfil(prev => ({ ...prev, ...perfilData }));
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setPerfilGuardado(false), 3000);
      
    } catch (e) {
      console.error('Error al guardar perfil:', e);
      if (e.message && e.message.includes('401')) {
        logout();
        navigate("/login");
      } else {
        setPerfilError("Error al guardar el perfil. Intenta de nuevo.");
      }
    } finally {
      setPerfilCargando(false);
    }
  };

  // Función para manejar los cambios en los campos del perfil
  const handlePerfilChange = (e) => {
    const { name, value } = e.target;
    setPerfil(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (perfilError) {
      setPerfilError("");
    }
  };

  // Mostrar loader si usuario está cargando
  if (usuarioCargando) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#0d6efd' }}>Cargando...</div>;
  }

  if (!usuario && !usuarioCargando) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'red' }}>No se pudo cargar el usuario. Por favor, vuelve a iniciar sesión.</div>;
  }
  if (perfilError) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'red' }}>Error al cargar el perfil: {perfilError}</div>;
  }
  // El formulario de perfil ya se muestra correctamente en la pestaña 'perfil', así que no se debe bloquear su renderizado.

  // Calcular efectividad en tiempo real o promedio del día
  let efectividadEnTiempo = 100;
  if (enProgreso && horaInicio && horaEstimadaFin && !isNaN(horaInicio.getTime())) {
    const transcurrido = (horaActual - horaInicio) / 60000; // minutos
    if (transcurrido <= tiempoEstimadoValido) {
      efectividadEnTiempo = 100;
    } else {
      efectividadEnTiempo = Math.max(0, (tiempoEstimadoValido / transcurrido) * 100).toFixed(1);
    }
  } else if (!enProgreso && historial.length > 0) {
    // Calcular promedio de efectividad solo de las tareas del día actual
    const fechaSel = new Date();
    const dia = fechaSel.getDate().toString().padStart(2, '0');
    const mes = (fechaSel.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaSel.getFullYear();
    const fechaHoyStr = `${dia}/${mes}/${anio}`;
    const tareasHoy = historial.filter(h => typeof h.fecha === 'string' && h.fecha.split(',')[0].trim() === fechaHoyStr);
    if (tareasHoy.length > 0) {
      const suma = tareasHoy.reduce((acc, h) => acc + Number(h.efectividad), 0);
      efectividadEnTiempo = (suma / tareasHoy.length).toFixed(1);
    } else {
      efectividadEnTiempo = 100;
    }
  } else if (!enProgreso && efectividad !== null) {
    efectividadEnTiempo = efectividad;
  }

  // Guardar y cerrar modal de observaciones
  const handleGuardarModal = async (fueCancelado = false) => {
    if (!token) {
      setError("Error de autenticación. Por favor, vuelve a iniciar sesión.");
      logout();
      navigate("/login");
      return;
    }
    
    setShowModal(false);
    let obs = observaciones;
    if (fueCancelado || !obs || obs.trim() === "") {
      obs = "Sin observaciones";
    }
    
    try {
      // Si hay una tarea en progreso, actualizarla
      if (tareaIdEnProgreso) {
        // Calcular tiempo transcurrido real
        let tiempoTranscurridoReal = 0;
        if (horaInicio) {
          tiempoTranscurridoReal = (new Date() - horaInicio) / 60000; // en minutos
        }
        
        await api.actualizarTareaFinalizada(token, tareaIdEnProgreso, {
          cantidadHecha: Number(cantidadHecha),
          efectividad: Number(efectividad),
          tiempoTranscurrido: tiempoTranscurridoReal,
          observaciones: obs.trim()
        });
      } else {
        // Fallback: crear tarea completa (para compatibilidad)
        const tiempoTranscurridoFallback = horaInicio ? (new Date() - horaInicio) / 60000 : 0;
        
        await api.crearProduccion(token, {
          tareas: tareasSeleccionadas,
          referencia,
          cantidadAsignada: Number(cantidad),
          cantidadHecha: Number(cantidadHecha),
          horaInicio,
          horaFin: new Date(),
          efectividad: Number(efectividad),
          tiempoTranscurrido: tiempoTranscurridoFallback,
          observaciones: obs.trim(),
          fechaRegistro: new Date()
        });
      }
      
      setSuccessMsg("¡Registro guardado exitosamente!");
      
      // Forzar recarga del historial tras guardar
      if (usuario) {
        try {
          const historialData = await api.getHistorial(token);
          setHistorial(historialData);
        } catch (historialError) {
          console.error('Error al recargar historial:', historialError);
        }
      }
      
      // Limpiar estado para nueva tarea
      setTareasSeleccionadas([]);
      setReferencia("");
      setCantidad("");
      setCantidadHecha("");
      setHoraInicio("");
      setHoraFin("");
      setEfectividad(null);
      setObservaciones("");
      setHoraEstimadaFin(null);
      setTareaIdEnProgreso(null);
      setTareaEnProgreso(null);
      setEnProgreso(false);
      
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccessMsg(""), 5000);
      
    } catch (e) {
      console.error('Error al guardar registro:', e);
      
      if (e.message && e.message.includes('401')) {
        setError("Error de autenticación. Por favor, vuelve a iniciar sesión.");
        logout();
        navigate("/login");
      } else if (e.message && e.message.includes('404')) {
        setError("Tarea no encontrada. Es posible que haya sido eliminada.");
      } else {
        setError("Error al guardar el registro. Intenta de nuevo.");
      }
    }
  };

  const cargosMaquina = [
    "Operario máquina plana",
    "Operario máquina fileteadora",
    "Operario máquina collarín",
    "Operario máquina ojaladora",
    "Operario máquina botonadora",
    "Plancha",
    "Manualidades",
    "Cortador",
    "Cortador auxiliar"
  ];




  return (
    <div className="bg-light min-vh-100 responsive-app" style={{ fontFamily: 'Montserrat, sans-serif', background: '#e9f1fb' }}>
      {/* Barra de navegación superior */}
      <Navbar 
        bg="white" 
        expand="xl" 
        expanded={navbarExpanded}
        onToggle={(expanded) => setNavbarExpanded(expanded)}
        className="shadow-sm custom-navbar" 
        style={{ borderRadius: 18, margin: 0, padding: '0.5rem 2rem 0.5rem 2rem' }}
      >
        <Container>
          <Navbar.Brand style={{ fontWeight: 900, letterSpacing: 2, fontSize: 28, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={logo} alt="Logo Diseños Sharo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: '50%', background: '#fff', border: '2px solid #e9ecef', marginRight: 10 }} />
            <span className="completo d-none d-md-inline">DISEÑOS SHARO</span>
            <span className="abreviado d-inline d-md-none">D. SHARO</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="empleado-navbar-nav" />
          <Navbar.Collapse id="empleado-navbar-nav">
            <Nav className="me-auto" activeKey={activeTab} onSelect={handleTabChange} style={{ fontWeight: 600, fontSize: 18 }}>
              <Nav.Link eventKey="inicio">Inicio</Nav.Link>
              <Nav.Link eventKey="historial">Historial</Nav.Link>
              <Nav.Link eventKey="tarea">Tarea</Nav.Link>
              <Nav.Link eventKey="perfil">Perfil</Nav.Link>
            </Nav>
            <div className="nav-user-colapsado d-flex align-items-center" style={{ fontWeight: 600, fontSize: 18 }}>
              <FaUserCircle style={{ fontSize: 26, marginRight: 6 }} />{perfil?.nombre || usuario?.email}
              <Button variant="outline-danger" size="sm" onClick={handleLogout} style={{ fontWeight: 600, fontSize: 16, borderRadius: 8, marginLeft: 10 }}>Cerrar sesión</Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Sidebar móvil */}
      <div className={`mobile-sidebar ${navbarExpanded ? 'show' : ''}`} onClick={() => setNavbarExpanded(false)}>
        <div className="mobile-sidebar-content" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-sidebar-header">
            <div className="mobile-sidebar-brand">
              <img src={logo} alt="Logo Diseños Sharo" className="mobile-sidebar-logo" />
              <span className="mobile-sidebar-title">D. SHARO</span>
            </div>
            <button 
              className="mobile-sidebar-close" 
              onClick={() => setNavbarExpanded(false)}
              aria-label="Cerrar menú"
            >
              ×
            </button>
          </div>
          
          <div className="mobile-sidebar-nav">
            <Nav activeKey={activeTab} onSelect={handleTabChange} className="flex-column">
              <Nav.Link eventKey="inicio" className="mobile-nav-link">
                <span className="mobile-nav-icon">🏠</span>
                Inicio
              </Nav.Link>
              <Nav.Link eventKey="historial" className="mobile-nav-link">
                <span className="mobile-nav-icon">📊</span>
                Historial
              </Nav.Link>
              <Nav.Link eventKey="tarea" className="mobile-nav-link">
                <span className="mobile-nav-icon">✅</span>
                Tarea
              </Nav.Link>
              <Nav.Link eventKey="perfil" className="mobile-nav-link">
                <span className="mobile-nav-icon">👤</span>
                Perfil
              </Nav.Link>
            </Nav>
          </div>
          
          <div className="mobile-sidebar-footer">
            <div className="mobile-user-info">
              <FaUserCircle className="mobile-user-icon" />
              <span className="mobile-user-name">{perfil?.nombre || usuario?.email}</span>
            </div>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={handleLogout} 
              className="mobile-logout-btn"
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      <Container className="d-flex justify-content-center align-items-start responsive-container" style={{ minHeight: '80vh', width: '100%', marginTop: 16 }}>
        <div className="w-100" style={{ padding: 0, margin: 0 }}>
          {avisoDescanso && (
            <Alert variant="warning" style={{ fontWeight: 700, fontSize: 18, borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
              {avisoDescanso}
            </Alert>
          )}
          {activeTab === "inicio" && (
            <>
              <div className="text-center mb-4">
                <h2 style={{ fontWeight: 900, color: '#0d6efd', fontSize: 32, marginBottom: 6, letterSpacing: 1 }}>¡Bienvenido/a!</h2>
                <div style={{ fontSize: 20, color: '#2c3e50', fontWeight: 600, marginBottom: 8 }}>Hoy es un gran día para avanzar en tus metas 🚀</div>
                <div className="mb-2 clock-display time-text" style={{ fontSize: 18, color: '#6c757d', fontWeight: 500 }}>{horaFormateada}</div>
              </div>
              <div className="mb-4 p-4" style={{ background: 'linear-gradient(90deg, #e3f0ff 0%, #f8fafc 100%)', borderRadius: 18, boxShadow: '0 2px 12px rgba(44,62,80,0.07)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#2c3e50', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FaChartLine style={{ color: '#0d6efd', fontSize: 28 }} /> Progreso del día
                </div>
                <div style={{ fontSize: 16, color: '#6c757d', marginBottom: 10 }}>¡Sigue así, cada tarea te acerca a tu meta!</div>
                <ProgressBar now={efectividadEnTiempo} label={`${efectividadEnTiempo}%`} style={{ height: 28, fontSize: 18, borderRadius: 14, background: '#e9ecef', boxShadow: '0 1px 6px #b6c6e0' }} variant={efectividadEnTiempo >= 80 ? "success" : efectividadEnTiempo >= 50 ? "warning" : "danger"} animated />
                <div style={{ fontSize: 18, color: '#0d6efd', fontWeight: 700, marginTop: 10 }}>
                  {efectividadEnTiempo >= 80 ? <span><FaCheckCircle style={{ color: '#28a745', marginRight: 6 }} />¡Excelente trabajo!</span> : efectividadEnTiempo >= 50 ? "¡Vas muy bien!" : "¡Ánimo, tú puedes!"}
                </div>
              </div>
              <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 16, background: '#f8fafc' }}>
                <Card.Body>
                  <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-2" style={{ fontSize: 17, fontWeight: 600 }}>
                    <div>
                      <strong>Estado del turno:</strong> {turnoActivo ? "Activo" : "Fuera de jornada"}
                    </div>
                    <div>
                      <strong>Tiempo efectivo trabajado:</strong> {tiempoEfectivo} min
                    </div>
                    <div>
                      <strong>Tiempo transcurrido en el turno:</strong> {tiempoTranscurrido} min
                    </div>
                  </div>
                  {descansoActual && (
                    <Alert variant="info" style={{ fontSize: 18, borderRadius: 10, fontWeight: 600, color: '#0d6efd' }}>
                      {mensajeDescanso}
                    </Alert>
                  )}
                </Card.Body>
              </Card>
              {error && <Alert variant="danger" style={{ fontSize: 17, borderRadius: 10 }}>{error}</Alert>}
              {successMsg && <Alert variant="success" style={{ fontSize: 17, borderRadius: 10 }}>{successMsg}</Alert>}
              {!enProgreso && efectividad === null && (
                <Form style={{ background: '#f8fafc', borderRadius: 16, padding: '24px 18px', boxShadow: '0 1px 8px #e3eaf7', marginBottom: 18 }}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 700, fontSize: 18 }}>Operaciones</Form.Label>
                    <Accordion alwaysOpen>
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>Selecciona las operaciones</Accordion.Header>
                        <Accordion.Body style={{ textAlign: 'left' }}>
                          {operacionesCargando ? (
                            <div className="text-center py-3">
                              <Spinner animation="border" size="sm" variant="primary" />
                              <span className="ms-2">Cargando operaciones...</span>
                            </div>
                          ) : operaciones.length === 0 ? (
                            <div className="text-center py-3 text-muted">
                              No hay operaciones disponibles
                            </div>
                          ) : (
                            <>
                              {operaciones.map((operacion, idx) => (
                                <Form.Check
                                  key={operacion.id}
                                  type="checkbox"
                                  id={`tarea-${idx}`}
                                  label={
                                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                                      {operacion.nombre}
                                      <span className="text-muted ms-2">
                                        ({operacion.tiempo_por_unidad || 0} min/unidad)
                                      </span>
                                    </span>
                                  }
                                  checked={tareasSeleccionadas.includes(operacion.nombre)}
                                  onChange={() => handleTareaCheckbox(operacion.nombre)}
                                  className="mb-2"
                                />
                              ))}
                              {tareasSeleccionadas.length > 0 && (
                                <div className="mt-3 p-2 bg-light rounded">
                                  <small className="text-muted">
                                    ✅ {tareasSeleccionadas.length} operación(es) seleccionada(s)
                                  </small>
                                </div>
                              )}
                            </>
                          )}
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                    <Form.Text className="text-muted">Marca una o varias operaciones.</Form.Text>
                  </Form.Group>
                  {tareasSeleccionadas.length > 0 && (
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: 700, fontSize: 18 }}>Detalles de las operaciones seleccionadas</Form.Label>
                      <Accordion alwaysOpen>
                        {tareasSeleccionadas.map((nombre, idx) => {
                          const operacion = operaciones.find(op => op.nombre === nombre);
                          if (!operacion) return null;
                          return (
                            <Accordion.Item eventKey={String(idx)} key={nombre}>
                              <Accordion.Header>{operacion.nombre}</Accordion.Header>
                              <Accordion.Body style={{ textAlign: 'left' }}>
                                <div><strong>Descripción:</strong> {operacion.descripcion || 'Sin descripción'}</div>
                                <div><strong>Categoría:</strong> 
                                  <Badge bg="primary" variant="outline" className="ms-2" style={{ fontSize: 12 }}>
                                    {operacion.categoria || 'Sin categoría'}
                                  </Badge>
                                </div>
                                <div><strong>Tiempo por unidad:</strong> {operacion.tiempo_por_unidad || 0} minutos</div>
                                {operacion.video_tutorial && (
                                  <div className="mt-2">
                                    <a href={operacion.video_tutorial} target="_blank" rel="noopener noreferrer" style={{ color: '#0d6efd', textDecoration: 'underline', fontWeight: 500 }}>
                                      Tutorial
                                    </a>
                                  </div>
                                )}
                              </Accordion.Body>
                            </Accordion.Item>
                          );
                        })}
                      </Accordion>
                      
                      {/* Mostrar tiempo estimado total */}
                      {cantidad && tiempoEstimadoValido > 0 && (
                        <div className="mt-3 p-3 bg-info bg-opacity-10 rounded border border-info">
                          <div className="text-center">
                            <strong className="text-info">⏱️ Tiempo Estimado Total:</strong>
                            <div className="h4 text-info mb-0">{tiempoEstimadoValido} minutos</div>
                            <small className="text-muted">
                              {tareasSeleccionadas.length} operación(es) × {cantidad} unidad(es)
                            </small>
                          </div>
                        </div>
                      )}
                    </Form.Group>
                  )}
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 700, fontSize: 18 }}>Referencia</Form.Label>
                    <Form.Select value={referencia} onChange={e => setReferencia(e.target.value)} style={{ fontSize: 16, borderRadius: 8 }}>
                      <option value="">Selecciona una referencia</option>
                      {referenciasCargando ? (
                        <option disabled>Cargando referencias...</option>
                      ) : referencias.length === 0 ? (
                        <option disabled>No hay referencias disponibles</option>
                      ) : (
                        referencias.map((ref) => (
                          <option key={ref.id} value={ref.codigo}>
                            {ref.codigo} - {ref.nombre}
                          </option>
                        ))
                      )}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 700, fontSize: 18 }}>Cantidad</Form.Label>
                    <Form.Control type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} style={{ fontSize: 16, borderRadius: 8 }} />
                  </Form.Group>
                  <Button className="w-100 fw-bold" variant="primary" onClick={handleComenzar} style={{ fontSize: 20, borderRadius: 10, padding: '12px 0', marginTop: 8 }}>
                    Comenzar tarea
                  </Button>
                </Form>
              )}
              {enProgreso && (
                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 16, background: '#f8fafc' }}>
                  <Card.Body className="text-center">
                    <div style={{ fontSize: 24, color: '#0d6efd', fontWeight: 600, marginBottom: 16 }}>
                      ¡Tarea iniciada exitosamente!
                    </div>
                    <div style={{ fontSize: 18, color: '#6c757d', marginBottom: 20 }}>
                      Ve a la pestaña "Tarea" para gestionar tu tarea en progreso
                    </div>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={() => setActiveTab("tarea")}
                      style={{ fontSize: 18, borderRadius: 10, padding: '12px 24px' }}
                    >
                      Ir a Tarea
                    </Button>
                  </Card.Body>
                </Card>
              )}
              <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                  <Modal.Title>Observaciones</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form.Group>
                    <Form.Label>¿Deseas agregar alguna observación?</Form.Label>
                    <Form.Control as="textarea" rows={3} value={observaciones} onChange={e => setObservaciones(e.target.value)} />
                  </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => {
                    // Si cancela, guardar igual pero con observaciones null o amigable
                    setObservaciones('');
                    handleGuardarModal(true); // true = fue cancelado
                  }}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={() => handleGuardarModal(false)}>
                    Guardar
                  </Button>
                </Modal.Footer>
              </Modal>
            </>
          )}
          {activeTab === "historial" && (
            <div style={{ width: '100%', maxWidth: 1000, margin: '0 auto', padding: '32px 12px 32px 12px', boxShadow: '0 4px 24px rgba(44,62,80,0.10)', borderRadius: 18, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'visible' }}>
              <div style={{ margin: '0 0 10px 0', textAlign: 'center', width: '100%' }}>
                <h3 style={{ fontWeight: 900, color: '#0d6efd', fontSize: 28, marginBottom: 4, letterSpacing: 1, marginTop: 0 }}> <FaChartLine style={{ color: '#0d6efd', fontSize: 28, marginRight: 8 }} />Historial de producción</h3>
                <div style={{ fontSize: 18, color: '#2c3e50', fontWeight: 600, marginBottom: 8 }}>¡Mira tu progreso y celebra tus logros!</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'center', marginBottom: 18, width: '100%' }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>Ver por:</span>
                <Form.Select style={{ width: 120, fontSize: 16, borderRadius: 8 }} value={filtroHistorial} onChange={e => setFiltroHistorial(e.target.value)}>
                  <option value="dia">Día</option>
                  <option value="semana">Semana</option>
                  <option value="mes">Mes</option>
                </Form.Select>
                {filtroHistorial === "dia" && (
                  <div className="d-flex align-items-center gap-2" style={{ marginLeft: 8 }}>
                    <span style={{ fontWeight: 600, color: '#0d6efd', fontSize: 16 }}>Selecciona un día:</span>
                    <DatePicker
                      selected={fechaSeleccionada}
                      onChange={date => setFechaSeleccionada(date)}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                      maxDate={new Date()}
                      showPopperArrow={false}
                      popperPlacement="bottom"
                      calendarClassName="w-100"
                    />
                  </div>
                )}
                {filtroHistorial === "semana" && (
                  <>
                    <Form.Select style={{ width: 140, fontSize: 16, borderRadius: 8 }} value={mesSeleccionado} onChange={e => setMesSeleccionado(Number(e.target.value))}>
                      {mesesDelAnio.map((d, idx) => <option key={idx} value={idx}>{d.toLocaleString('default', { month: 'long' })}</option>)}
                    </Form.Select>
                    <Form.Select style={{ width: 140, fontSize: 16, borderRadius: 8 }} value={semanaEnMesSeleccionada} onChange={e => setSemanaEnMesSeleccionada(Number(e.target.value))}>
                      {[0,1,2,3].map(idx => <option key={idx} value={idx}>{`Semana ${idx+1}`}</option>)}
                    </Form.Select>
                    <span style={{ fontWeight: 600, color: '#0d6efd' }}>{getRangoSemanaEnMes(mesSeleccionado, semanaEnMesSeleccionada)}</span>
                  </>
                )}
                {filtroHistorial === "mes" && (
                  <>
                    <Form.Select style={{ width: 180, fontSize: 16, borderRadius: 8 }} value={mesSeleccionado} onChange={e => setMesSeleccionado(Number(e.target.value))}>
                      {mesesDelAnio.map((d, idx) => <option key={idx} value={idx}>{d.toLocaleString('default', { month: 'long', year: 'numeric' })}</option>)}
                    </Form.Select>
                    <span style={{ fontWeight: 600, color: '#0d6efd' }}>{mesesDelAnio[mesSeleccionado].toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                  </>
                )}
              </div>
              <div className="responsive-graph-container" style={{ background: 'transparent', boxShadow: 'none', borderRadius: 0, width: '100%', maxWidth: 900, margin: '0 auto 24px auto', padding: 0, overflowX: 'auto' }}>
                <div style={{ width: '100%', minWidth: 320, maxWidth: 900, margin: '0 auto', height: '220px' }}>
                  <Line data={chartData} options={chartOptions} style={{ width: '100%', maxWidth: 900, minWidth: 320, height: '220px', margin: '0 auto' }} />
                </div>
              </div>
              {/* Tabla filtrada por día seleccionado */}
              {filtroHistorial === "dia" && (
                <div className="responsive-table-card" style={{ background: 'white', boxShadow: '0 2px 12px rgba(44,62,80,0.07)', borderRadius: 12, width: '100%', maxWidth: 1000, margin: '0 auto', overflowX: 'auto', marginTop: 18 }}>
                  <div style={{ width: '100%' }}>
                    <Table striped bordered hover size="sm" responsive="md" style={{ fontSize: 15, borderRadius: 0, width: '100%', marginBottom: 0, background: 'white', boxShadow: 'none' }}>
                      <thead style={{ background: '#e3f0ff', fontWeight: 700, fontSize: 16 }}>
                        <tr>
                          <th style={{ minWidth: 110 }}>Fecha</th>
                          <th style={{ minWidth: 120 }}>Operaciones</th>
                          <th style={{ minWidth: 120 }}>Referencia</th>
                          <th style={{ minWidth: 80 }}>Asignada</th>
                          <th style={{ minWidth: 80 }}>Hecha</th>
                          <th style={{ minWidth: 110 }}>Efectividad (%)</th>
                          <th style={{ minWidth: 140 }}>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialFiltradoDia.map((h, idx) => (
                          <tr key={idx} style={{ background: h.efectividad >= 80 ? '#e8fbe8' : h.efectividad >= 50 ? '#fffbe8' : '#fbe8e8', wordBreak: 'break-word' }}>
                            <td style={{ maxWidth: 120, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{h.fecha}</td>
                            <td style={{ maxWidth: 140, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{h.tareas.join(", ")}</td>
                            <td style={{ maxWidth: 140, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{h.referencia}</td>
                            <td style={{ maxWidth: 80, textAlign: 'center' }}>{h.cantidadAsignada}</td>
                            <td style={{ maxWidth: 80, textAlign: 'center' }}>{h.cantidadHecha}</td>
                            <td style={{ maxWidth: 110, fontWeight: 700, color: h.efectividad >= 80 ? '#28a745' : h.efectividad >= 50 ? '#ffc107' : '#dc3545', textAlign: 'center' }}>{h.efectividad}</td>
                            <td style={{ maxWidth: 180, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{h.observaciones}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "tarea" && (
            <>
              <div className="text-center mb-4">
                <h2 style={{ fontWeight: 900, color: '#0d6efd', fontSize: 32, marginBottom: 6, letterSpacing: 1 }}>
                  <FaTasks style={{ color: '#0d6efd', fontSize: 28, marginRight: 8 }} />Gestión de Tareas
                </h2>
                <div style={{ fontSize: 20, color: '#2c3e50', fontWeight: 600, marginBottom: 8 }}>
                  {tareaEnProgresoCargando ? "Cargando tarea..." : 
                   tareaEnProgreso ? "¡Gestiona tu tarea en progreso!" : 
                   "No hay tareas en progreso"}
                </div>
              </div>
              
              {tareaEnProgresoCargando && (
                <div className="text-center">
                  <div style={{ fontSize: 24, color: '#0d6efd', fontWeight: 600 }}>Cargando tarea en progreso...</div>
                </div>
              )}
              
              {!tareaEnProgresoCargando && !tareaEnProgreso && (
                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 16, background: '#f8fafc' }}>
                  <Card.Body className="text-center">
                    <div style={{ fontSize: 24, color: '#6c757d', fontWeight: 600, marginBottom: 16 }}>
                      No tienes tareas en progreso
                    </div>
                    <div style={{ fontSize: 18, color: '#6c757d', marginBottom: 20 }}>
                      Ve a la pestaña "Inicio" para crear una nueva tarea
                    </div>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={() => setActiveTab("inicio")}
                      style={{ fontSize: 18, borderRadius: 10, padding: '12px 24px' }}
                    >
                      Ir a Inicio
                    </Button>
                  </Card.Body>
                </Card>
              )}
              
              {!tareaEnProgresoCargando && tareaEnProgreso && enProgreso && (
                <div style={{ background: '#f8fafc', borderRadius: 16, padding: '24px 18px', boxShadow: '0 1px 8px #e3eaf7', marginBottom: 18 }}>
                  <div className="mb-3">
                    <h4 style={{ fontWeight: 700, color: '#2c3e50', marginBottom: 16 }}>
                      Tarea en Progreso
                    </h4>
                  </div>
                  
                  <Row className="mb-3">
                    <Col><strong>Operaciones:</strong> {tareasSeleccionadas.join(", ")}</Col>
                    <Col><strong>Referencia:</strong> {referencia}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col><strong>Cantidad asignada:</strong> {cantidad}</Col>
                    <Col><strong>Tiempo estimado:</strong> {tiempoEstimadoValido} min</Col>
                  </Row>
                  <div className="mb-2">
                    <strong>Hora de inicio:</strong> {formatHora(horaInicio)}
                  </div>
                  <div className="mb-2">
                    <strong>Hora estimada de fin:</strong> {formatHoraSimple(horaEstimadaFin)}
                  </div>
                  <div className="mb-2">
                    <strong>Tiempo transcurrido:</strong> {horaInicio && !isNaN(horaInicio.getTime()) ? `${Math.floor((horaActual - horaInicio) / 60000)} min ${Math.floor(((horaActual - horaInicio) % 60000) / 1000)} seg` : "No disponible"}
                  </div>
                  <div className="mb-3">
                    <strong>Efectividad en tiempo real:</strong> {efectividadEnTiempo}%
                    <ProgressBar now={efectividadEnTiempo} label={`${efectividadEnTiempo}%`} className="mt-1" style={{ height: 22, fontSize: 16, borderRadius: 10, background: '#e9ecef', boxShadow: '0 1px 6px #b6c6e0' }} variant={efectividadEnTiempo >= 80 ? "success" : efectividadEnTiempo >= 50 ? "warning" : "danger"} animated />
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 700, fontSize: 18 }}>Cantidad hecha</Form.Label>
                    <Form.Control type="number" value={cantidadHecha} onChange={e => setCantidadHecha(e.target.value)} style={{ fontSize: 16, borderRadius: 8 }} min={0} max={cantidad} />
                  </Form.Group>
                  <Button className="w-100 fw-bold" variant="success" onClick={handleFinalizar} style={{ fontSize: 20, borderRadius: 10, padding: '12px 0', marginTop: 8 }}>
                    Finalizar tarea
                  </Button>
                </div>
              )}
              
              <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                  <Modal.Title>Observaciones</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form.Group>
                    <Form.Label>¿Deseas agregar alguna observación?</Form.Label>
                    <Form.Control as="textarea" rows={3} value={observaciones} onChange={e => setObservaciones(e.target.value)} />
                  </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => {
                    setObservaciones('');
                    handleGuardarModal(true);
                  }}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={() => handleGuardarModal(false)}>
                    Guardar
                  </Button>
                </Modal.Footer>
              </Modal>
            </>
          )}
          {activeTab === "perfil" && (
            <>
              <div className="mb-4 text-center">
                <h3 style={{ fontWeight: 900, color: '#0d6efd', fontSize: 28, marginBottom: 6, letterSpacing: 1 }}>
                  <FaUserCircle style={{ color: '#0d6efd', fontSize: 28, marginRight: 8 }} />Perfil del empleado
                </h3>
                <div style={{ fontSize: 18, color: '#2c3e50', fontWeight: 600, marginBottom: 8 }}>
                  ¡Personaliza tu información y mantente actualizado!
                </div>
              </div>
              <Form onSubmit={handleGuardarPerfil} style={{ background: '#f8fafc', borderRadius: 16, padding: '24px 18px', boxShadow: '0 1px 8px #e3eaf7', marginBottom: 18 }}>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label style={{ fontWeight: 700, fontSize: 18 }}>Nombre</Form.Label>
                    <Form.Control name="nombre" value={perfil?.nombre} onChange={handlePerfilChange} disabled={perfilCargando} style={{ fontSize: 16, borderRadius: 8 }} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label style={{ fontWeight: 700, fontSize: 18 }}>Apellidos</Form.Label>
                    <Form.Control name="apellidos" value={perfil?.apellidos} onChange={handlePerfilChange} disabled={perfilCargando} style={{ fontSize: 16, borderRadius: 8 }} />
                  </Col>
                </Row>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label style={{ fontWeight: 700, fontSize: 18 }}>Cédula</Form.Label>
                    <Form.Control name="cedula" value={perfil?.cedula} onChange={handlePerfilChange} disabled={perfilCargando} style={{ fontSize: 16, borderRadius: 8 }} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label style={{ fontWeight: 700, fontSize: 18 }}>Cargo/Máquina</Form.Label>
                    <Accordion alwaysOpen>
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>Selecciona el cargo o máquina</Accordion.Header>
                        <Accordion.Body>
                          {cargosMaquina.map((cargo, idx) => (
                            <Form.Check
                              key={cargo}
                              type="checkbox"
                              id={`cargo-${idx}`}
                              label={<span style={{ fontWeight: 600, fontSize: 16 }}>{cargo}</span>}
                              checked={Array.isArray(perfil?.cargoMaquina) && perfil?.cargoMaquina.includes(cargo)}
                              onChange={() => {
                                setPerfil(prev => {
                                  const actual = Array.isArray(prev?.cargoMaquina) ? prev?.cargoMaquina : [];
                                  if (actual.includes(cargo)) {
                                    return { ...prev, cargoMaquina: actual.filter(c => c !== cargo) };
                                  } else {
                                    return { ...prev, cargoMaquina: [...actual, cargo] };
                                  }
                                });
                              }}
                              className="mb-2"
                              name="cargoMaquina"
                            />
                          ))}
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                    <Form.Text className="text-muted">Puedes seleccionar uno o varios cargos o máquinas.</Form.Text>
                  </Col>
                </Row>
                {perfilError && <Alert variant="danger" style={{ fontSize: 17, borderRadius: 10 }}>{perfilError}</Alert>}
                {perfilGuardado && <Alert variant="success" style={{ fontSize: 17, borderRadius: 10 }}>¡Perfil guardado!</Alert>}
                <Button className="w-100 fw-bold" variant="primary" type="submit" disabled={perfilCargando} style={{ fontSize: 20, borderRadius: 10, padding: '12px 0', marginTop: 8 }}>
                  {perfilCargando ? "Guardando..." : "Guardar cambios"}
                </Button>
              </Form>
            </>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Empleado;