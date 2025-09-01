import React, { createContext, useContext, useState, useEffect } from "react";
import * as api from "../services/api";

// AuthContext permite compartir el usuario y el token en toda la app
// sin necesidad de pasar props manualmente (prop drilling)
export const AuthContext = createContext();

// Hook personalizado para consumir el contexto fácilmente
export function useAuth() {
  return useContext(AuthContext);
}

// Proveedor del contexto: envuelve la app y gestiona el estado global de autenticación
export function AuthProvider({ children }) {
  // Estado global: usuario y token
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("isAdmin") === "true");
  const [isLoading, setIsLoading] = useState(true);

  // Verificar token al cargar la página
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem("token");
      const storedIsAdmin = localStorage.getItem("isAdmin") === "true";
      
      if (storedToken && storedToken.trim() !== "") {
        try {
          console.log('🔍 Verificando token almacenado...');
          // Verificar si el token es válido
          const userData = await api.getPerfil(storedToken);
          
          // Token válido, restaurar sesión
          setUser(userData);
          setToken(storedToken);
          setIsAdmin(storedIsAdmin);
          
          console.log('✅ Sesión restaurada automáticamente:', userData.email);
        } catch (error) {
          console.log('❌ Token inválido o expirado, limpiando sesión...', error.message);
          // Token inválido, limpiar sesión
          localStorage.removeItem("token");
          localStorage.removeItem("isAdmin");
          setUser(null);
          setToken("");
          setIsAdmin(false);
        }
      } else {
        console.log('ℹ️ No hay token almacenado');
      }
      
      // Siempre marcar como no cargando al final
      setIsLoading(false);
    };

    // Solo verificar si hay un token válido
    if (localStorage.getItem("token")) {
      verifyToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Función para iniciar sesión (guarda usuario y token)
  const login = (userData, tokenValue) => {
    console.log('🔐 Iniciando sesión para:', userData.email);
    setUser(userData);
    setToken(tokenValue);
    setIsAdmin(userData.isAdmin || false);
    localStorage.setItem("token", tokenValue);
    // También guardar isAdmin en localStorage para persistencia
    if (userData.isAdmin) {
      localStorage.setItem("isAdmin", "true");
    } else {
      localStorage.removeItem("isAdmin");
    }
    console.log('✅ Sesión iniciada exitosamente');
  };

  // Función para cerrar sesión (limpia usuario y token)
  const logout = () => {
    console.log('🚪 Cerrando sesión...');
    setUser(null);
    setToken("");
    setIsAdmin(false);
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    console.log('✅ Sesión cerrada');
  };

  // Función para actualizar datos del usuario
  const updateUser = (newUserData) => {
    setUser(newUserData);
    // También actualizar isAdmin si cambió
    if (newUserData.isAdmin !== isAdmin) {
      setIsAdmin(newUserData.isAdmin || false);
      if (newUserData.isAdmin) {
        localStorage.setItem("isAdmin", "true");
      } else {
        localStorage.removeItem("isAdmin");
      }
    }
  };

  // Puedes agregar más funciones aquí (por ejemplo, actualizar perfil, refrescar token, etc.)

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAdmin, 
      isLoading,
      login, 
      logout, 
      setUser,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
} 