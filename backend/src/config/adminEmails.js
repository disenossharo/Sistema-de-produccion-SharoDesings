// Lista de correos electrónicos de administradores
// Puedes modificar o cargar desde base de datos si lo prefieres
const adminEmails = [
  "admin@sharo.com", // Correo principal del administrador
  "admin@gmail.com", // Correo para pruebas
  "test@admin.com", // Otro correo para pruebas
  
  // Agregar más correos de administradores aquí:
  // "nuevo.admin@sharo.com",
  // "supervisor@sharo.com",
];

// Función para verificar si un email es de admin
const isAdminEmail = (email) => {
  if (!email) return false;
  return adminEmails.includes(email.trim().toLowerCase());
};

// Función para agregar un nuevo admin (útil para futuras expansiones)
const addAdminEmail = (email) => {
  if (email && !adminEmails.includes(email.trim().toLowerCase())) {
    adminEmails.push(email.trim().toLowerCase());
    return true;
  }
  return false;
};

module.exports = {
  adminEmails,
  isAdminEmail,
  addAdminEmail
}; 