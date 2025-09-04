import React, { useState, useEffect } from "react";
import { Button, Form, Card, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import logo from "../assets/sharo-logo.png";
import * as api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login: loginContext } = useAuth();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const response = await api.login(email, password);
      console.log('Respuesta del login:', response);
      
      loginContext(response.user, response.token);
      
      try {
        await api.updateHeartbeat(response.token);
        console.log('✅ Usuario marcado como online:', email);
      } catch (heartbeatError) {
        console.error('❌ Error al marcar usuario como online:', heartbeatError);
      }
      
      if (response.user.isAdmin) {
        console.log('Redirigiendo a admin');
        navigate("/admin");
      } else {
        console.log('Redirigiendo a empleado');
        navigate("/empleado");
      }
    } catch (err) {
      setError(err.message || "Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Fondo con gradiente y elementos decorativos */}
      <div className="login-background">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
        <div className="bg-circle bg-circle-4"></div>
      </div>

      {/* Contenido principal centrado */}
      <div className="login-content">
        {/* Logo y título */}
        <div className="login-header">
          <div className="logo-container">
            <img src={logo} alt="Logo Diseños Sharo" className="logo-image" />
          </div>
          <h1 className="company-title">DISEÑOS SHARO</h1>
          <p className="company-subtitle">Sistema de Producción</p>
        </div>

        {/* Formulario de login */}
        <div className="login-form-wrapper">
          <Card className="login-card">
            <Card.Body className="login-card-body">
              <h2 className="login-title">Iniciar Sesión</h2>
              <p className="login-description">
                Accede a tu panel de trabajo
              </p>
              
              {error && (
                <Alert variant="danger" className="login-alert">
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit} className="login-form">
                <Form.Group className="form-group">
                  <Form.Label className="form-label">Correo electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-control-custom"
                    placeholder="tu@email.com"
                    autoComplete="username"
                    disabled={loading}
                  />
                </Form.Group>
                
                <Form.Group className="form-group">
                  <Form.Label className="form-label">Contraseña</Form.Label>
                  <div className="password-input-container">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="form-control-custom password-input"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={togglePasswordVisibility}
                      disabled={loading}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </Form.Group>
                
                <Button 
                  type="submit" 
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="button-loading">
                      <Spinner animation="border" size="sm" className="spinner" />
                      <span>Iniciando sesión...</span>
                    </div>
                  ) : (
                    "Ingresar al Sistema"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="footer-text">
            Acceso exclusivo para empleados y administradores
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 