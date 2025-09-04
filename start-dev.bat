@echo off
echo ========================================
echo   INICIANDO DESARROLLO LOCAL
echo ========================================
echo.

echo [1/3] Verificando dependencias del backend...
cd backend
if not exist node_modules (
    echo Instalando dependencias del backend...
    npm install
)
echo ✓ Backend listo

echo.
echo [2/3] Verificando dependencias del frontend...
cd ..\frontend
if not exist node_modules (
    echo Instalando dependencias del frontend...
    npm install
)
echo ✓ Frontend listo

echo.
echo [3/3] Iniciando servidores...
echo.
echo 🚀 Iniciando backend en puerto 3001...
start "Backend" cmd /k "cd backend && npm run dev"

echo.
echo ⏳ Esperando 3 segundos para que el backend inicie...
timeout /t 3 /nobreak > nul

echo.
echo 🎨 Iniciando frontend en puerto 5173...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   DESARROLLO LOCAL INICIADO
echo ========================================
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:3001
echo 🏥 Health:   http://localhost:3001/health
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
