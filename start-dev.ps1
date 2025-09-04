Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INICIANDO DESARROLLO LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Verificando dependencias del backend..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias del backend..." -ForegroundColor Green
    npm install
}
Write-Host "✓ Backend listo" -ForegroundColor Green

Write-Host ""
Write-Host "[2/3] Verificando dependencias del frontend..." -ForegroundColor Yellow
Set-Location ..\frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias del frontend..." -ForegroundColor Green
    npm install
}
Write-Host "✓ Frontend listo" -ForegroundColor Green

Write-Host ""
Write-Host "[3/3] Iniciando servidores..." -ForegroundColor Yellow
Write-Host ""

Write-Host "🚀 Iniciando backend en puerto 3001..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Write-Host ""
Write-Host "⏳ Esperando 3 segundos para que el backend inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🎨 Iniciando frontend en puerto 5173..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DESARROLLO LOCAL INICIADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "🔧 Backend:  http://localhost:3001" -ForegroundColor Green
Write-Host "🏥 Health:   http://localhost:3001/health" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
