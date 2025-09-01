# Scripts de Mantenimiento

Este directorio contiene scripts útiles para el mantenimiento y administración del sistema.

## 📁 Estructura

```
scripts/
├── maintenance/
│   ├── maintenance.js          # Script principal de mantenimiento
│   ├── createProductionTables.js # Crear tablas de producción
│   ├── fixPresenciaTable.js    # Corregir tabla de presencia
│   ├── cleanupPresenciaTable.js # Limpiar tabla de presencia
│   └── backupImportantUsers.js # Respaldo de usuarios importantes
└── README.md                   # Este archivo
```

## 🚀 Uso

### Mantenimiento Automático
```bash
# Ejecutar mantenimiento completo
node scripts/maintenance/maintenance.js

# O desde el directorio raíz
node backend/scripts/maintenance/maintenance.js
```

### Mantenimiento Manual
```bash
# Solo limpiar tabla de presencia
node -e "require('./maintenance/maintenance.js').cleanupPresenciaTable()"

# Solo verificar salud de la BD
node -e "require('./maintenance/maintenance.js').checkDatabaseHealth()"
```

## 🔧 Funciones Disponibles

- **`runMaintenance()`** - Ejecuta mantenimiento completo
- **`cleanupPresenciaTable()`** - Limpia registros antiguos de presencia
- **`createProductionTables()`** - Crea tablas de producción si no existen
- **`fixUserStatus()`** - Corrige estado de usuarios
- **`backupImportantUsers()`** - Crea respaldo de usuarios importantes
- **`checkDatabaseHealth()`** - Verifica estado general de la BD

## 📅 Programación

Para ejecutar mantenimiento automático, puedes configurar un cron job:

```bash
# Ejecutar cada día a las 2:00 AM
0 2 * * * cd /path/to/project && node backend/scripts/maintenance/maintenance.js

# Ejecutar cada hora
0 * * * * cd /path/to/project && node backend/scripts/maintenance/maintenance.js
```

## ⚠️ Notas Importantes

- Los scripts requieren acceso a la base de datos PostgreSQL
- Asegúrate de que las variables de entorno estén configuradas
- Los scripts son seguros y no eliminan datos importantes
- Siempre revisa los logs antes de ejecutar en producción
