import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Empleado from "./pages/Empleado";
import Produccion from "./pages/Produccion";
import { AuthProvider } from "./context/AuthContext"; // Proveedor de autenticación global

function App() {
  return (
    // AuthProvider permite que toda la app acceda al usuario y token globalmente
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/empleado" element={<Empleado />} />
          <Route path="/produccion" element={<Produccion />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
