# Script para iniciar servidor local - CryptoSocial

Write-Host "🚀 Iniciando CryptoSocial con Firebase..." -ForegroundColor Cyan
Write-Host ""

# Verificar si Python está instalado
$pythonVersion = python --version 2>&1

if ($pythonVersion -match "Python") {
    Write-Host "✅ Python detectado: $pythonVersion" -ForegroundColor Green
    Write-Host "📡 Iniciando servidor HTTP en puerto 8000..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🌐 Abre tu navegador en: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "🧪 Página de prueba: http://localhost:8000/test-firebase.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⏹️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Magenta
    Write-Host ""
    
    # Iniciar servidor Python
    python -m http.server 8000
}
else {
    Write-Host "❌ Python no está instalado o no está en PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Opciones alternativas:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1️⃣  Instalar Python desde: https://www.python.org/downloads/" -ForegroundColor White
    Write-Host "2️⃣  Usar Node.js con http-server:" -ForegroundColor White
    Write-Host "   npm install -g http-server" -ForegroundColor Gray
    Write-Host "   http-server -p 8000" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3️⃣  Usar VS Code con extensión 'Live Server'" -ForegroundColor White
    Write-Host "   - Instalar extensión Live Server" -ForegroundColor Gray
    Write-Host "   - Click derecho en index.html → Open with Live Server" -ForegroundColor Gray
    Write-Host ""
    
    Read-Host "Presiona Enter para salir"
}
