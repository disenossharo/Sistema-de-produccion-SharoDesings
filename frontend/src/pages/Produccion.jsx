import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Button, 
  Card, 
  Row, 
  Col, 
  Table, 
  Modal, 
  Form, 
  Alert,
  Spinner, 
  Nav, 
  Navbar, 
  Container,
  Badge,
  InputGroup
} from "react-bootstrap";
import { 
  FaCogs, 
  FaTshirt, 
  FaUsers, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaEyeSlash,
  FaYoutube,
  FaClock,
  FaTag,
  FaUserPlus,
  FaKey,
  FaSignOutAlt,
  FaUserCircle,
  FaChartLine
} from "react-icons/fa";
import logo from "../assets/sharo-logo.png";
import '../App.css';
import * as api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Produccion = () => {
  const { user, token, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("operaciones");
  const [navbarExpanded, setNavbarExpanded] = useState(false);
  const navigate = useNavigate();

  // --- NUEVO: breakpoint para layout responsivo (admin producción) ---
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : true);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // --- FIN NUEVO ---

  // Debug logs
  useEffect(() => {
    console.log('🔍 Produccion - Componente montado');
    console.log('🔍 Produccion - Usuario:', user?.email);
    console.log('🔍 Produccion - Es admin:', isAdmin);
    console.log('🔍 Produccion - Token presente:', !!token);
  }, [user, isAdmin, token]);

  // Estados para operaciones
  const [operaciones, setOperaciones] = useState([]);
  const [filtroOperaciones, setFiltroOperaciones] = useState('');
  const [filtroActivaOperaciones, setFiltroActivaOperaciones] = useState('todas'); // 'todas', 'activas', 'ocultas'
  const [showOperacionModal, setShowOperacionModal] = useState(false);
  const [operacionEditando, setOperacionEditando] = useState(null);
  const [formOperacion, setFormOperacion] = useState({
    nombre: '',
    descripcion: '',
    tiempo_por_unidad: 1.0,
    video_tutorial: '',
    categoria: '',
    activa: true
  });

  // Estados para referencias
  const [referencias, setReferencias] = useState([]);
  const [filtroReferencias, setFiltroReferencias] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [filtroActivaReferencias, setFiltroActivaReferencias] = useState('todas'); // 'todas', 'activas', 'ocultas'
  const [showReferenciaModal, setShowReferenciaModal] = useState(false);
  const [referenciaEditando, setReferenciaEditando] = useState(null);
  const [formReferencia, setFormReferencia] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    activa: true
  });

  // Estados para usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [filtroUsuarios, setFiltroUsuarios] = useState('');
  const [filtroActivoUsuarios, setFiltroActivoUsuarios] = useState('todos'); // 'todos', 'activos', 'inactivos'
  const [showUsuarioModal, setShowUsuarioModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [usuarioPassword, setUsuarioPassword] = useState(null);
  const [formUsuario, setFormUsuario] = useState({
    email: '',
    password: '',
    rol: 'empleado',
    activo: true
  });

  // Estados generales
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Protección de ruta para admin
  useEffect(() => {
    // Esperar a que esté disponible el token
    if (token === undefined || token === null) {
      // Si explícitamente no hay token, redirigir al login
      if (token === null) window.location.href = '/login';
      return;
    }
    // No decidir hasta que isAdmin sea true/false explícito
    if (typeof isAdmin === 'undefined') return;

    if (!token) {
      window.location.href = '/login';
    } else if (isAdmin === false) {
      window.location.href = '/empleado';
    }
  }, [isAdmin, token]);

  // Cargar datos iniciales - OPTIMIZADO
  useEffect(() => {
    if (token && isAdmin) {
      cargarDatos();
    }
  }, [token, isAdmin]);

  // Memoizar función de carga de datos para evitar re-renders innecesarios
  const cargarDatos = useCallback(async () => {
    if (!token || !isAdmin) return;
    
    setCargando(true);
    setError("");
    
    try {
      // Cargar datos en paralelo para mayor velocidad
      const [operacionesData, referenciasData, usuariosData] = await Promise.all([
        api.getOperaciones(token),
        api.getReferencias(token),
        api.getUsuarios(token)
      ]);
      
      setOperaciones(operacionesData);
      setReferencias(referenciasData);
      setUsuarios(usuariosData);
    } catch (e) {
      console.error('Error al cargar datos:', e);
      if (e.message && e.message.includes('401')) {
        setError("Error de autenticación. Por favor, vuelve a iniciar sesión.");
        logout();
        navigate('/login');
      } else {
        setError("Error al cargar los datos. Intenta de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  }, [token, isAdmin, logout, navigate]);

  // Filtrar operaciones - OPTIMIZADO con useMemo
  const operacionesFiltradas = useMemo(() => {
    let filtradas = operaciones;

    // Filtrar por texto (nombre, descripción, categoría)
    if (filtroOperaciones.trim()) {
      const textoFiltro = filtroOperaciones.toLowerCase().trim();
      filtradas = filtradas.filter(operacion => 
        operacion.nombre.toLowerCase().includes(textoFiltro) ||
        (operacion.descripcion && operacion.descripcion.toLowerCase().includes(textoFiltro)) ||
        (operacion.categoria && operacion.categoria.toLowerCase().includes(textoFiltro))
      );
    }

    // Filtrar por estado activa/oculta
    if (filtroActivaOperaciones !== 'todas') {
      filtradas = filtradas.filter(operacion => {
        if (filtroActivaOperaciones === 'activas') {
          return operacion.activa === true;
        } else if (filtroActivaOperaciones === 'ocultas') {
          return operacion.activa === false;
        }
        return true;
      });
    }

    return filtradas;
  }, [operaciones, filtroOperaciones, filtroActivaOperaciones]);

  // Filtrar referencias - OPTIMIZADO con useMemo
  const referenciasFiltradas = useMemo(() => {
    let filtradas = referencias;

    // Filtrar por texto (código, nombre, descripción)
    if (filtroReferencias.trim()) {
      const textoFiltro = filtroReferencias.toLowerCase().trim();
      filtradas = filtradas.filter(referencia => 
        referencia.codigo.toLowerCase().includes(textoFiltro) ||
        referencia.nombre.toLowerCase().includes(textoFiltro) ||
        (referencia.descripcion && referencia.descripcion.toLowerCase().includes(textoFiltro))
      );
    }

    // Filtrar por categoría
    if (categoriaFiltro) {
      filtradas = filtradas.filter(referencia => 
        referencia.categoria === categoriaFiltro
      );
    }

    // Filtrar por estado activa/oculta
    if (filtroActivaReferencias !== 'todas') {
      filtradas = filtradas.filter(referencia => {
        if (filtroActivaReferencias === 'activas') {
          return referencia.activa === true;
        } else if (filtroActivaReferencias === 'ocultas') {
          return referencia.activa === false;
        }
        return true;
      });
    }

    return filtradas;
  }, [referencias, filtroReferencias, categoriaFiltro, filtroActivaReferencias]);


  // Obtener categorías únicas para el filtro de referencias
  const getCategoriasUnicas = () => {
    // Categorías predefinidas
    const categoriasPredefinidas = ['Línea', 'Conjunto'];
    
    // Categorías existentes en la base de datos
    const categoriasExistentes = [...new Set(referencias.map(ref => ref.categoria).filter(Boolean))];
    
    // Combinar y eliminar duplicados
    const todasLasCategorias = [...new Set([...categoriasPredefinidas, ...categoriasExistentes])];
    
    return todasLasCategorias.sort();
  };


  // Limpiar filtros de referencias
  const limpiarFiltros = () => {
    setFiltroReferencias('');
    setCategoriaFiltro('');
    setFiltroActivaReferencias('todas');
  };

  // Limpiar filtros de operaciones
  const limpiarFiltrosOperaciones = () => {
    setFiltroOperaciones('');
    setFiltroActivaOperaciones('todas');
  };

  // Limpiar filtros de usuarios
  const limpiarFiltrosUsuarios = () => {
    setFiltroUsuarios('');
    setFiltroActivoUsuarios('todos');
  };

  // Filtrar usuarios - OPTIMIZADO con useMemo
  const usuariosFiltrados = useMemo(() => {
    let filtrados = usuarios;

    if (filtroUsuarios.trim()) {
      const texto = filtroUsuarios.toLowerCase().trim();
      filtrados = filtrados.filter(u =>
        (u.nombre && u.nombre.toLowerCase().includes(texto)) ||
        (u.apellidos && u.apellidos.toLowerCase().includes(texto)) ||
        (u.email && u.email.toLowerCase().includes(texto))
      );
    }

    if (filtroActivoUsuarios !== 'todos') {
      filtrados = filtrados.filter(u => {
        if (filtroActivoUsuarios === 'activos') return u.activo !== false;
        if (filtroActivoUsuarios === 'inactivos') return u.activo === false;
        return true;
      });
    }

    return filtrados;
  }, [usuarios, filtroUsuarios, filtroActivoUsuarios]);

  // ===== FUNCIONES PARA OPERACIONES =====

  const handleOpenOperacionModal = (operacion = null) => {
    if (operacion) {
      setOperacionEditando(operacion);
      setFormOperacion({
        nombre: operacion.nombre,
        descripcion: operacion.descripcion || '',
        tiempo_por_unidad: operacion.tiempo_por_unidad,
        video_tutorial: operacion.video_tutorial || '',
        categoria: operacion.categoria || '',
        activa: operacion.activa
      });
    } else {
      setOperacionEditando(null);
      setFormOperacion({
        nombre: '',
        descripcion: '',
        tiempo_por_unidad: 1.0,
        video_tutorial: '',
        activa: true
      });
    }
    setShowOperacionModal(true);
  };

  const handleSaveOperacion = async () => {
    try {
      if (operacionEditando) {
        await api.updateOperacion(token, operacionEditando.id, formOperacion);
        setSuccessMsg("Operación actualizada exitosamente");
      } else {
        await api.createOperacion(token, formOperacion);
        setSuccessMsg("Operación creada exitosamente");
      }
      
      setShowOperacionModal(false);
      cargarDatos();
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleDeleteOperacion = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta operación?")) {
      try {
        await api.deleteOperacion(token, id);
        setSuccessMsg("Operación eliminada exitosamente");
        cargarDatos();
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (error) {
        setError(error.message);
        setTimeout(() => setError(""), 5000);
      }
    }
  };

  // ===== FUNCIONES PARA REFERENCIAS =====

  const handleOpenReferenciaModal = (referencia = null) => {
    if (referencia) {
      setReferenciaEditando(referencia);
      setFormReferencia({
        codigo: referencia.codigo,
        nombre: referencia.nombre,
        descripcion: referencia.descripcion || '',
        categoria: referencia.categoria || '',
        activa: referencia.activa
      });
    } else {
      setReferenciaEditando(null);
      setFormReferencia({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria: '',
        activa: true
      });
    }
    setShowReferenciaModal(true);
  };

  const handleSaveReferencia = async () => {
    try {
      if (referenciaEditando) {
        await api.updateReferencia(token, referenciaEditando.id, formReferencia);
        setSuccessMsg("Referencia actualizada exitosamente");
      } else {
        await api.createReferencia(token, formReferencia);
        setSuccessMsg("Referencia creada exitosamente");
      }
      
      setShowReferenciaModal(false);
      cargarDatos();
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleDeleteReferencia = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta referencia?")) {
      try {
        await api.deleteReferencia(token, id);
        setSuccessMsg("Referencia eliminada exitosamente");
        cargarDatos();
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (error) {
        setError(error.message);
        setTimeout(() => setError(""), 5000);
      }
    }
  };

  // ===== FUNCIONES PARA USUARIOS =====

  const handleOpenUsuarioModal = (usuario = null) => {
    if (usuario) {
      setUsuarioEditando(usuario);
      setFormUsuario({
        email: usuario.email,
        password: '',
        rol: usuario.is_admin ? 'admin' : 'empleado',
        activo: usuario.activo !== false,
        nombre: usuario.nombre || '',
        apellidos: usuario.apellidos || '',
        cedula: usuario.cedula || ''
      });
    } else {
      setUsuarioEditando(null);
      setFormUsuario({
        email: '',
        password: '',
        rol: 'empleado',
        activo: true,
        nombre: '',
        apellidos: '',
        cedula: ''
      });
    }
    setShowUsuarioModal(true);
  };

  const handleSaveUsuario = async () => {
    try {
      console.log('🚀 Iniciando guardado de usuario...');
      console.log('📝 Datos del formulario:', formUsuario);
      
      if (usuarioEditando) {
        console.log('✏️ Editando usuario existente...');
        const datosActualizar = { ...formUsuario };
        // Solo incluir contraseña si se proporcionó una nueva
        if (!datosActualizar.password || datosActualizar.password.trim() === '') {
          delete datosActualizar.password;
        }
        console.log('📝 Datos a actualizar:', datosActualizar);
        await api.updateUsuario(token, usuarioEditando.id, datosActualizar);
        setSuccessMsg("Usuario actualizado exitosamente");
      } else {
        console.log('🆕 Creando nuevo usuario...');
        console.log('📤 Enviando datos a la API:', formUsuario);
        const resultado = await api.createUsuario(token, formUsuario);
        console.log('✅ Respuesta de la API:', resultado);
        setSuccessMsg("Usuario creado exitosamente");
      }
      
      setShowUsuarioModal(false);
      console.log('🔄 Recargando datos...');
      await cargarDatos();
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error('❌ Error en handleSaveUsuario:', error);
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleDeleteUsuario = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres ELIMINAR COMPLETAMENTE este usuario de la base de datos? Esta acción no se puede deshacer.")) {
      try {
        await api.deleteUsuario(token, id);
        setSuccessMsg("Usuario eliminado completamente de la base de datos");
        cargarDatos();
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (error) {
        setError(error.message);
        setTimeout(() => setError(""), 5000);
      }
    }
  };

  const handleOpenPasswordModal = (usuario) => {
    setUsuarioPassword(usuario);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (password) => {
    try {
      await api.cambiarPassword(token, usuarioPassword.id, password);
      setSuccessMsg("Contraseña actualizada exitosamente");
      setShowPasswordModal(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  const handleTabChange = (selectedKey) => {
    setActiveTab(selectedKey);
  };

  if (cargando) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#e9f1fb'
      }}>
        <Spinner animation="border" variant="primary" size="lg" />
        <span style={{ color: '#2c3e50', marginLeft: 15, fontSize: 18, fontWeight: 600 }}>Cargando sistema de producción...</span>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 responsive-app" style={{ fontFamily: 'Montserrat, sans-serif', background: '#e9f1fb' }}>
      {/* Layout con sidebar */}
      <div className="d-flex" style={{ minHeight: '100vh' }}>
        {/* Sidebar - Visible en desktop, oculta en móvil */}
        <div className="sidebar-desktop d-none d-lg-block" style={{ 
          width: '280px', 
          background: 'white', 
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)', 
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 1000,
          overflowY: 'auto'
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
              Gestión de Producción
            </div>
          </div>

          {/* Navegación */}
          <Nav className="flex-column" activeKey={activeTab} onSelect={handleTabChange} style={{ padding: '20px 0' }}>
            <Nav.Link 
              eventKey="operaciones" 
              style={{ 
                fontWeight: 600, 
                fontSize: 16, 
                padding: '15px 25px',
                borderLeft: activeTab === 'operaciones' ? '4px solid #0d6efd' : '4px solid transparent',
                background: activeTab === 'operaciones' ? '#f8f9fa' : 'transparent',
                color: activeTab === 'operaciones' ? '#0d6efd' : '#495057'
              }}
            >
              <FaCogs style={{ marginRight: 10, fontSize: 18 }} />
              Operaciones
            </Nav.Link>
            <Nav.Link 
              eventKey="referencias" 
              style={{ 
                fontWeight: 600, 
                fontSize: 16, 
                padding: '15px 25px',
                borderLeft: activeTab === 'referencias' ? '4px solid #0d6efd' : '4px solid transparent',
                background: activeTab === 'referencias' ? '#f8f9fa' : 'transparent',
                color: activeTab === 'referencias' ? '#0d6efd' : '#495057'
              }}
            >
              <FaTshirt style={{ marginRight: 10, fontSize: 18 }} />
              Referencias
            </Nav.Link>
            <Nav.Link 
              eventKey="usuarios" 
              style={{ 
                fontWeight: 600, 
                fontSize: 16, 
                padding: '15px 25px',
                borderLeft: activeTab === 'usuarios' ? '4px solid #0d6efd' : '4px solid transparent',
                background: activeTab === 'usuarios' ? '#f8f9fa' : 'transparent',
                color: activeTab === 'usuarios' ? '#0d6efd' : '#495057'
              }}
            >
              <FaUsers style={{ marginRight: 10, fontSize: 18 }} />
              Usuarios
            </Nav.Link>
            <Nav.Link 
              onClick={() => navigate('/admin')}
              style={{ 
                fontWeight: 600, 
                fontSize: 16, 
                padding: '15px 25px',
                borderLeft: '4px solid transparent',
                background: 'transparent',
                color: '#495057',
                cursor: 'pointer'
              }}
            >
              <FaChartLine style={{ marginRight: 10, fontSize: 18 }} />
              ← Volver al Dashboard
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
          marginLeft: isDesktop ? '280px' : '0',
          minHeight: '100vh',
          width: isDesktop ? 'calc(100vw - 280px)' : '100vw',
          maxWidth: '100%',
          overflowX: 'hidden'
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
              <Navbar.Toggle aria-controls="produccion-navbar-nav" />
              <Navbar.Collapse id="produccion-navbar-nav">
                <Nav className="me-auto" activeKey={activeTab} onSelect={handleTabChange} style={{ fontWeight: 600, fontSize: 16 }}>
                  <Nav.Link eventKey="operaciones">Operaciones</Nav.Link>
                  <Nav.Link eventKey="referencias">Referencias</Nav.Link>
                  <Nav.Link eventKey="usuarios">Usuarios</Nav.Link>
                  <Nav.Link onClick={() => navigate('/admin')}>← Dashboard</Nav.Link>
                </Nav>
                <Nav>
                  <Button variant="outline-danger" size="sm" onClick={handleLogout} style={{ fontWeight: 600 }}>
                    Cerrar sesión
                  </Button>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>

          {/* Contenido de las pestañas */}
          <Container fluid style={{ padding: '24px' }}>
            {/* Mensajes de estado */}
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")}>
                {error}
              </Alert>
            )}
            
            {successMsg && (
              <Alert variant="success" dismissible onClose={() => setSuccessMsg("")}>
                {successMsg}
              </Alert>
            )}

            {/* Contenido de Operaciones */}
            {activeTab === "operaciones" && (
              <div>
                <div className={"d-flex justify-content-between align-items-center mb-4"} style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 0 : 12, alignItems: isDesktop ? 'center' : 'stretch' }}>
                  <h2 style={{ fontWeight: 700, color: '#2c3e50', margin: 0, fontSize: isDesktop ? 28 : 22, textAlign: isDesktop ? 'left' : 'center' }}>
                    <FaCogs className="me-3" />
                    Gestión de Operaciones
                  </h2>
                  <Button 
                    variant="primary" 
                    onClick={() => handleOpenOperacionModal()}
                    style={{ borderRadius: 12, fontWeight: 600, width: isDesktop ? 'auto' : '100%' }}
                  >
                    <FaPlus className="me-2" />
                    Nueva Operación
                  </Button>
                </div>

                {/* Sistema de Búsqueda para Operaciones */}
                <Card className="mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none' }}>
                  <Card.Body>
                    <Row className="align-items-end">
                      <Col md={6} className="mb-3 mb-md-0">
                        <Form.Group>
                          <Form.Label style={{ fontWeight: 600, color: '#2c3e50' }}>
                            <FaCogs className="me-2" />
                            Buscar por nombre, descripción o categoría
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Ej: Coser cuello, Corte, Confección..."
                            value={filtroOperaciones}
                            onChange={(e) => setFiltroOperaciones(e.target.value)}
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3} className="mb-3 mb-md-0">
                        <Form.Group>
                          <Form.Label style={{ fontWeight: 600, color: '#2c3e50' }}>
                            Estado
                          </Form.Label>
                          <Form.Select
                            value={filtroActivaOperaciones}
                            onChange={(e) => setFiltroActivaOperaciones(e.target.value)}
                            style={{ borderRadius: 8 }}
                          >
                            <option value="todas">Todas</option>
                            <option value="activas">Activas</option>
                            <option value="ocultas">Ocultas</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Button
                          variant="outline-secondary"
                          onClick={limpiarFiltrosOperaciones}
                          style={{ borderRadius: 8, fontWeight: 600, width: '100%' }}
                        >
                          Limpiar
                        </Button>
                      </Col>
                    </Row>
                    {filtroOperaciones && (
                      <div className="mt-3">
                        <small className="text-muted">
                          Mostrando {operacionesFiltradas.length} de {operaciones.length} operaciones
                          {filtroOperaciones && ` • Buscando: "${filtroOperaciones}"`}
                        </small>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>
                  <Card.Body>
                    <Table responsive hover>
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th style={{ fontWeight: 700 }}>Nombre</th>
                          <th style={{ fontWeight: 700 }}>Descripción</th>
                          <th style={{ fontWeight: 700 }}>Categoría</th>
                          <th style={{ fontWeight: 700 }}>Tiempo (min)</th>
                          <th style={{ fontWeight: 700 }}>Tutorial</th>
                          <th style={{ fontWeight: 700 }}>Estado</th>
                          <th style={{ fontWeight: 700 }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operacionesFiltradas.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-4">
                              <div className="text-muted">
                                <FaCogs size={48} className="mb-3" style={{ opacity: 0.3 }} />
                                <h5 className="mb-2">No se encontraron operaciones</h5>
                                <p className="mb-0">
                                  {filtroOperaciones 
                                    ? "Intenta ajustar el filtro de búsqueda" 
                                    : "No hay operaciones registradas aún"}
                                </p>
                                {filtroOperaciones && (
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="mt-2"
                                    onClick={limpiarFiltrosOperaciones}
                                  >
                                    Limpiar filtros
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          operacionesFiltradas.map(operacion => (
                          <tr key={operacion.id} style={{ 
                            opacity: operacion.activa ? 1 : 0.6,
                            background: operacion.activa ? 'transparent' : '#f8f9fa'
                          }}>
                            <td style={{ fontWeight: 600 }}>
                              {operacion.nombre}
                            </td>
                            <td>{operacion.descripcion || '-'}</td>
                            <td>
                              <Badge bg="primary" variant="outline" style={{ fontSize: 12 }}>
                                {operacion.categoria || 'Sin categoría'}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="info" style={{ fontSize: 12 }}>
                                <FaClock className="me-1" />
                                {operacion.tiempo_por_unidad}
                              </Badge>
                            </td>
                            <td>
                              {operacion.video_tutorial ? (
                                <a 
                                  href={operacion.video_tutorial} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: '#dc3545', textDecoration: 'none' }}
                                >
                                  <FaYoutube /> Ver
                                </a>
                              ) : (
                                <span style={{ color: '#6c757d' }}>-</span>
                              )}
                            </td>
                            <td>
                              <Badge bg={operacion.activa ? "success" : "secondary"}>
                                {operacion.activa ? "Activa" : "Oculta"}
                              </Badge>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleOpenOperacionModal(operacion)}
                              >
                                <FaEdit />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteOperacion(operacion.id)}
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Contenido de Referencias */}
            {activeTab === "referencias" && (
              <div>
                <div className={"d-flex justify-content-between align-items-center mb-4"} style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 0 : 12, alignItems: isDesktop ? 'center' : 'stretch' }}>
                  <h2 style={{ fontWeight: 700, color: '#2c3e50', margin: 0, fontSize: isDesktop ? 28 : 22, textAlign: isDesktop ? 'left' : 'center' }}>
                    <FaTshirt className="me-3" />
                    Gestión de Referencias
                  </h2>
                  <Button 
                    variant="primary" 
                    onClick={() => handleOpenReferenciaModal()}
                    style={{ borderRadius: 12, fontWeight: 600, width: isDesktop ? 'auto' : '100%' }}
                  >
                    <FaPlus className="me-2" />
                    Nueva Referencia
                  </Button>
                </div>

                {/* Sistema de Búsqueda y Filtros */}
                <Card className="mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none' }}>
                  <Card.Body>
                    <Row className="align-items-end">
                      <Col md={4} className="mb-3 mb-md-0">
                        <Form.Group>
                          <Form.Label style={{ fontWeight: 600, color: '#2c3e50' }}>
                            <FaTag className="me-2" />
                            Buscar por código, nombre o descripción
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Ej: REF-10806, Blusa, Satin..."
                            value={filtroReferencias}
                            onChange={(e) => setFiltroReferencias(e.target.value)}
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3} className="mb-3 mb-md-0">
                        <Form.Group>
                          <Form.Label style={{ fontWeight: 600, color: '#2c3e50' }}>
                            Filtrar por categoría
                          </Form.Label>
                          <Form.Select
                            value={categoriaFiltro}
                            onChange={(e) => setCategoriaFiltro(e.target.value)}
                            style={{ borderRadius: 8 }}
                          >
                            <option value="">Todas las categorías</option>
                            {getCategoriasUnicas().map(categoria => (
                              <option key={categoria} value={categoria}>
                                {categoria}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3} className="mb-3 mb-md-0">
                        <Form.Group>
                          <Form.Label style={{ fontWeight: 600, color: '#2c3e50' }}>
                            Estado
                          </Form.Label>
                          <Form.Select
                            value={filtroActivaReferencias}
                            onChange={(e) => setFiltroActivaReferencias(e.target.value)}
                            style={{ borderRadius: 8 }}
                          >
                            <option value="todas">Todas</option>
                            <option value="activas">Activas</option>
                            <option value="ocultas">Ocultas</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Button
                          variant="outline-secondary"
                          onClick={limpiarFiltros}
                          style={{ borderRadius: 8, fontWeight: 600, width: '100%' }}
                        >
                          Limpiar
                        </Button>
                      </Col>
                    </Row>
                    {(filtroReferencias || categoriaFiltro) && (
                      <div className="mt-3">
                        <small className="text-muted">
                          Mostrando {referenciasFiltradas.length} de {referencias.length} referencias
                          {filtroReferencias && ` • Buscando: "${filtroReferencias}"`}
                          {categoriaFiltro && ` • Categoría: "${categoriaFiltro}"`}
                        </small>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>
                  <Card.Body>
                    <Table responsive hover>
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th style={{ fontWeight: 700 }}>Código</th>
                          <th style={{ fontWeight: 700 }}>Nombre</th>
                          <th style={{ fontWeight: 700 }}>Descripción</th>
                          <th style={{ fontWeight: 700 }}>Categoría</th>
                          <th style={{ fontWeight: 700 }}>Estado</th>
                          <th style={{ fontWeight: 700 }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referenciasFiltradas.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4">
                              <div className="text-muted">
                                <FaTshirt size={48} className="mb-3" style={{ opacity: 0.3 }} />
                                <h5 className="mb-2">No se encontraron referencias</h5>
                                <p className="mb-0">
                                  {filtroReferencias || categoriaFiltro 
                                    ? "Intenta ajustar los filtros de búsqueda" 
                                    : "No hay referencias registradas aún"}
                                </p>
                                {(filtroReferencias || categoriaFiltro) && (
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="mt-2"
                                    onClick={limpiarFiltros}
                                  >
                                    Limpiar filtros
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          referenciasFiltradas.map(referencia => (
                            <tr key={referencia.id} style={{ 
                              opacity: referencia.activa ? 1 : 0.6,
                              background: referencia.activa ? 'transparent' : '#f8f9fa'
                            }}>
                              <td style={{ fontWeight: 600 }}>
                                <Badge bg="primary" style={{ fontSize: 12 }}>
                                  <FaTag className="me-1" />
                                  {referencia.codigo}
                                </Badge>
                              </td>
                              <td style={{ fontWeight: 600 }}>{referencia.nombre}</td>
                              <td>{referencia.descripcion || '-'}</td>
                              <td>
                                <Badge bg="info" variant="outline">
                                  {referencia.categoria || 'Sin categoría'}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={referencia.activa ? "success" : "secondary"}>
                                  {referencia.activa ? "Activa" : "Oculta"}
                                </Badge>
                              </td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  className="me-2"
                                  onClick={() => handleOpenReferenciaModal(referencia)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteReferencia(referencia.id)}
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Contenido de Usuarios */}
            {activeTab === "usuarios" && (
              <div>
                <div className={"d-flex justify-content-between align-items-center mb-4"} style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 0 : 12, alignItems: isDesktop ? 'center' : 'stretch' }}>
                  <h2 style={{ fontWeight: 700, color: '#2c3e50', margin: 0, fontSize: isDesktop ? 28 : 22, textAlign: isDesktop ? 'left' : 'center' }}>
                    <FaUsers className="me-3" />
                    Gestión de Usuarios
                  </h2>
                  <Button 
                    variant="primary" 
                    onClick={() => handleOpenUsuarioModal()}
                    style={{ borderRadius: 12, fontWeight: 600, width: isDesktop ? 'auto' : '100%' }}
                  >
                    <FaUserPlus className="me-2" />
                    Nuevo Usuario
                  </Button>
                </div>
                {/* Sistema de Búsqueda y Filtros de Usuarios */}
                <Card className="mb-4" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none' }}>
                  <Card.Body>
                    <Row className="align-items-end">
                      <Col md={6} className="mb-3 mb-md-0">
                        <Form.Group>
                          <Form.Label style={{ fontWeight: 600, color: '#2c3e50' }}>
                            Buscar por nombre, apellidos o email
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Ej: María, Pérez, usuario@empresa.com"
                            value={filtroUsuarios}
                            onChange={(e) => setFiltroUsuarios(e.target.value)}
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3} className="mb-3 mb-md-0">
                        <Form.Group>
                          <Form.Label style={{ fontWeight: 600, color: '#2c3e50' }}>
                            Estado
                          </Form.Label>
                          <Form.Select
                            value={filtroActivoUsuarios}
                            onChange={(e) => setFiltroActivoUsuarios(e.target.value)}
                            style={{ borderRadius: 8 }}
                          >
                            <option value="todos">Todos</option>
                            <option value="activos">Activos</option>
                            <option value="inactivos">Inactivos</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Button
                          variant="outline-secondary"
                          onClick={limpiarFiltrosUsuarios}
                          style={{ borderRadius: 8, fontWeight: 600, width: '100%' }}
                        >
                          Limpiar
                        </Button>
                      </Col>
                    </Row>
                    {(filtroUsuarios || filtroActivoUsuarios !== 'todos') && (
                      <div className="mt-3">
                        <small className="text-muted">
                          Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
                          {filtroUsuarios && ` • Buscando: "${filtroUsuarios}"`}
                          {filtroActivoUsuarios !== 'todos' && ` • Estado: ${filtroActivoUsuarios}`}
                        </small>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>
                  <Card.Body>
                    <Table responsive hover>
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th style={{ fontWeight: 700 }}>Nombre</th>
                          <th style={{ fontWeight: 700 }}>Email</th>
                          <th style={{ fontWeight: 700 }}>Rol</th>
                          <th style={{ fontWeight: 700 }}>Estado</th>
                          <th style={{ fontWeight: 700 }}>Fecha Creación</th>
                          <th style={{ fontWeight: 700 }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuariosFiltrados.map(usuario => (
                          <tr key={usuario.id} style={{ 
                            opacity: usuario.activo === false ? 0.6 : 1,
                            background: usuario.activo === false ? '#f8f9fa' : 'transparent'
                          }}>
                            <td style={{ fontWeight: 600 }}>
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#2c3e50' }}>
                                  {usuario.nombre && usuario.apellidos 
                                    ? `${usuario.nombre} ${usuario.apellidos}`.trim()
                                    : usuario.nombre || 'Sin nombre'
                                  }
                                </div>
                                {usuario.activo === false && (
                                  <Badge bg="secondary" style={{ fontSize: 10 }}>
                                    INACTIVO
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td style={{ fontSize: 14, color: '#6c757d' }}>
                              {usuario.email}
                            </td>
                            <td>
                              <Badge bg={usuario.is_admin ? "danger" : "success"}>
                                {usuario.is_admin ? 'Administrador' : 'Empleado'}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={usuario.activo === false ? "secondary" : "success"}>
                                {usuario.activo === false ? "Inactivo" : "Activo"}
                              </Badge>
                            </td>
                            <td>
                              {new Date(usuario.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleOpenUsuarioModal(usuario)}
                              >
                                <FaEdit />
                              </Button>
                              <Button 
                                variant="outline-warning" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleOpenPasswordModal(usuario)}
                              >
                                <FaKey />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteUsuario(usuario.id)}
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </div>
            )}
          </Container>
        </div>
      </div>

      {/* Modal para Operaciones */}
      <Modal show={showOperacionModal} onHide={() => setShowOperacionModal(false)} size="lg">
        <Modal.Header closeButton style={{ background: '#e3f0ff' }}>
          <Modal.Title style={{ fontWeight: 700, color: '#0d6efd' }}>
            {operacionEditando ? 'Editar Operación' : 'Nueva Operación'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600 }}>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formOperacion.nombre}
                    onChange={(e) => setFormOperacion({...formOperacion, nombre: e.target.value})}
                    placeholder="Ej: Coser cuello"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600 }}>Tiempo por unidad (minutos) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formOperacion.tiempo_por_unidad}
                    onChange={(e) => setFormOperacion({...formOperacion, tiempo_por_unidad: parseFloat(e.target.value)})}
                    placeholder="1.5"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formOperacion.descripcion}
                onChange={(e) => setFormOperacion({...formOperacion, descripcion: e.target.value})}
                placeholder="Descripción detallada de la operación..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Video Tutorial (URL)</Form.Label>
              <Form.Control
                type="url"
                value={formOperacion.video_tutorial}
                onChange={(e) => setFormOperacion({...formOperacion, video_tutorial: e.target.value})}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Categoría</Form.Label>
              <Form.Select
                value={formOperacion.categoria}
                onChange={(e) => setFormOperacion({...formOperacion, categoria: e.target.value})}
              >
                <option value="">Seleccionar categoría</option>
                <option value="Fusionado">Fusionado</option>
                <option value="Manualidades">Manualidades</option>
                <option value="Plancha">Plancha</option>
                <option value="Op basicas">Op basicas</option>
                <option value="Tiempos basicos">Tiempos basicos</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <div className="toggle-label">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formOperacion.activa}
                    onChange={(e) => setFormOperacion({...formOperacion, activa: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-text">
                  {formOperacion.activa ? "Operación activa" : "Operación inactiva"}
                </span>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOperacionModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveOperacion}>
            {operacionEditando ? 'Actualizar' : 'Crear'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Referencias */}
      <Modal show={showReferenciaModal} onHide={() => setShowReferenciaModal(false)} size="lg">
        <Modal.Header closeButton style={{ background: '#e3f0ff' }}>
          <Modal.Title style={{ fontWeight: 700, color: '#0d6efd' }}>
            {referenciaEditando ? 'Editar Referencia' : 'Nueva Referencia'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600 }}>Código *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formReferencia.codigo}
                    onChange={(e) => setFormReferencia({...formReferencia, codigo: e.target.value})}
                    placeholder="Ej: REF-101"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600 }}>Categoría</Form.Label>
                  <Form.Select
                    value={formReferencia.categoria}
                    onChange={(e) => setFormReferencia({...formReferencia, categoria: e.target.value})}
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="Línea">Línea</option>
                    <option value="Conjunto">Conjunto</option>
                    {getCategoriasUnicas()
                      .filter(cat => !['Línea', 'Conjunto'].includes(cat))
                      .map(categoria => (
                        <option key={categoria} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Nombre *</Form.Label>
              <Form.Control
                type="text"
                value={formReferencia.nombre}
                onChange={(e) => setFormReferencia({...formReferencia, nombre: e.target.value})}
                placeholder="Ej: Blusa Clásica"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formReferencia.descripcion}
                onChange={(e) => setFormReferencia({...formReferencia, descripcion: e.target.value})}
                placeholder="Descripción detallada de la prenda..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <div className="toggle-label">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formReferencia.activa}
                    onChange={(e) => setFormReferencia({...formReferencia, activa: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-text">
                  {formReferencia.activa ? "Referencia activa" : "Referencia inactiva"}
                </span>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReferenciaModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveReferencia}>
            {referenciaEditando ? 'Actualizar' : 'Crear'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Usuarios */}
      <Modal show={showUsuarioModal} onHide={() => setShowUsuarioModal(false)} size="lg">
        <Modal.Header closeButton style={{ background: '#e3f0ff' }}>
          <Modal.Title style={{ fontWeight: 700, color: '#0d6efd' }}>
            {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600 }}>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formUsuario.email}
                    onChange={(e) => setFormUsuario({...formUsuario, email: e.target.value})}
                    placeholder="usuario@ejemplo.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600 }}>Rol *</Form.Label>
                  <Form.Select
                    value={formUsuario.rol}
                    onChange={(e) => setFormUsuario({...formUsuario, rol: e.target.value})}
                  >
                    <option value="empleado">Empleado</option>
                    <option value="admin">Administrador</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600 }}>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    value={formUsuario.nombre}
                    onChange={(e) => setFormUsuario({...formUsuario, nombre: e.target.value})}
                    placeholder="Nombre del usuario (opcional)"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600 }}>Apellidos</Form.Label>
                  <Form.Control
                    type="text"
                    value={formUsuario.apellidos}
                    onChange={(e) => setFormUsuario({...formUsuario, apellidos: e.target.value})}
                    placeholder="Apellidos del usuario (opcional)"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {/* Campo de cédula solo para edición */}
            {usuarioEditando && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 600 }}>Cédula</Form.Label>
                    <Form.Control
                      type="text"
                      value={formUsuario.cedula}
                      onChange={(e) => setFormUsuario({...formUsuario, cedula: e.target.value})}
                      placeholder="Número de cédula"
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>
                {usuarioEditando ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
              </Form.Label>
              <Form.Control
                type="password"
                value={formUsuario.password}
                onChange={(e) => setFormUsuario({...formUsuario, password: e.target.value})}
                placeholder={usuarioEditando ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <div className="toggle-label">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formUsuario.activo !== false}
                    onChange={(e) => setFormUsuario({...formUsuario, activo: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-text">
                  {formUsuario.activo !== false ? "Usuario activo" : "Usuario inactivo"}
                </span>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUsuarioModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveUsuario}>
            {usuarioEditando ? 'Actualizar' : 'Crear'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Cambiar Contraseña */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton style={{ background: '#e3f0ff' }}>
          <Modal.Title style={{ fontWeight: 700, color: '#0d6efd' }}>
            Cambiar Contraseña
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Usuario:</strong> {usuarioPassword?.email}</p>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600 }}>Nueva Contraseña *</Form.Label>
            <Form.Control
              type="password"
              id="newPassword"
              placeholder="Mínimo 6 caracteres"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              const password = document.getElementById('newPassword').value;
              if (password.length >= 6) {
                handleChangePassword(password);
              } else {
                setError("La contraseña debe tener al menos 6 caracteres");
              }
            }}
          >
            Cambiar Contraseña
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Produccion;
