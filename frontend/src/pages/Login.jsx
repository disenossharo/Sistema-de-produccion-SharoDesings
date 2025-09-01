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
  const navigate = useNavigate();
  const { login: loginContext } = useAuth();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-control-custom"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                  />
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