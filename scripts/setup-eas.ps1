# 🚀 Script de Setup EAS Build para Windows PowerShell
# Ejecutar con: .\scripts\setup-eas.ps1

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  🚀 Setup de EAS Build - brigadaDigital" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar si un comando existe
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# 1. Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Node.js NO instalado" -ForegroundColor Red
    Write-Host "   Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar/Instalar EAS CLI
Write-Host ""
Write-Host "🔧 Verificando EAS CLI..." -ForegroundColor Yellow
if (Test-Command "eas") {
    $easVersion = eas --version
    Write-Host "   ✅ EAS CLI instalado: $easVersion" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️ EAS CLI no instalado" -ForegroundColor Yellow
    Write-Host "   Instalando EAS CLI globalmente..." -ForegroundColor Cyan
    
    npm install -g eas-cli
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ EAS CLI instalado correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Error al instalar EAS CLI" -ForegroundColor Red
        exit 1
    }
}

# 3. Verificar login
Write-Host ""
Write-Host "🔐 Verificando login en Expo..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1

if ($LASTEXITCODE -eq 0 -and $whoami -notmatch "not logged in") {
    Write-Host "   ✅ Sesión activa: $whoami" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️ No has iniciado sesión" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   ¿Tienes cuenta de Expo?" -ForegroundColor Cyan
    Write-Host "   [1] Sí, iniciar sesión" -ForegroundColor White
    Write-Host "   [2] No, crear cuenta" -ForegroundColor White
    Write-Host "   [3] Cancelar" -ForegroundColor White
    
    $choice = Read-Host "   Selecciona una opción (1/2/3)"
    
    switch ($choice) {
        "1" {
            Write-Host "   Iniciando sesión..." -ForegroundColor Cyan
            eas login
        }
        "2" {
            Write-Host "   Creando cuenta..." -ForegroundColor Cyan
            eas register
        }
        default {
            Write-Host "   Cancelado" -ForegroundColor Yellow
            exit 0
        }
    }
}

# 4. Verificar configuración del proyecto
Write-Host ""
Write-Host "⚙️ Verificando configuración del proyecto..." -ForegroundColor Yellow

if (Test-Path "eas.json") {
    Write-Host "   ✅ eas.json encontrado" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️ eas.json no encontrado" -ForegroundColor Yellow
    Write-Host "   Configurando proyecto..." -ForegroundColor Cyan
    eas build:configure
}

# 5. Verificar app.json
if (Test-Path "app.json") {
    Write-Host "   ✅ app.json encontrado" -ForegroundColor Green
    
    $appJson = Get-Content "app.json" | ConvertFrom-Json
    
    # Verificar package name
    if ($appJson.expo.android -and $appJson.expo.android.package) {
        $package = $appJson.expo.android.package
        Write-Host "   📦 Package Android: $package" -ForegroundColor Cyan
    }
    else {
        Write-Host "   ⚠️ Falta android.package en app.json" -ForegroundColor Yellow
    }
    
    # Verificar bundle identifier
    if ($appJson.expo.ios -and $appJson.expo.ios.bundleIdentifier) {
        $bundle = $appJson.expo.ios.bundleIdentifier
        Write-Host "   📦 Bundle iOS: $bundle" -ForegroundColor Cyan
    }
    else {
        Write-Host "   ⚠️ Falta ios.bundleIdentifier en app.json" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ❌ app.json no encontrado" -ForegroundColor Red
    exit 1
}

# 6. Verificar dependencias
Write-Host ""
Write-Host "📚 Verificando dependencias..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules encontrado" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️ node_modules no encontrado" -ForegroundColor Yellow
    Write-Host "   Instalando dependencias..." -ForegroundColor Cyan
    npm install
}

# 7. Verificar fuente Pacifico
Write-Host ""
Write-Host "🔤 Verificando fuente Pacifico..." -ForegroundColor Yellow

$fontPath = "assets\fonts\Pacifico-Regular.ttf"
if (Test-Path $fontPath) {
    $fontSize = (Get-Item $fontPath).Length / 1KB
    Write-Host "   ✅ Fuente encontrada ($([math]::Round($fontSize, 2)) KB)" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️ Fuente no encontrada" -ForegroundColor Yellow
    Write-Host "   Ejecuta: npm run setup:splash-font" -ForegroundColor Cyan
}

# 8. Resumen y siguiente paso
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ✅ Setup Completo!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Siguiente paso: Crear build de desarrollo" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Para Android:" -ForegroundColor Cyan
Write-Host "   eas build --profile development --platform android" -ForegroundColor White
Write-Host ""
Write-Host "   Para iOS:" -ForegroundColor Cyan
Write-Host "   eas build --profile development --platform ios" -ForegroundColor White
Write-Host ""
Write-Host "   Para ambos:" -ForegroundColor Cyan
Write-Host "   eas build --profile development --platform all" -ForegroundColor White
Write-Host ""
Write-Host "⏱️ Tiempo de build: 10-15 minutos" -ForegroundColor Yellow
Write-Host "📱 Descarga el APK/IPA y prueba tu splash screen!" -ForegroundColor Green
Write-Host ""

# Preguntar si quiere crear build ahora
Write-Host "¿Quieres crear un build AHORA?" -ForegroundColor Cyan
Write-Host "[1] Sí, Android" -ForegroundColor White
Write-Host "[2] Sí, iOS" -ForegroundColor White
Write-Host "[3] Sí, ambos" -ForegroundColor White
Write-Host "[4] No, lo haré después" -ForegroundColor White
Write-Host ""
$buildChoice = Read-Host "Selecciona una opción (1/2/3/4)"

switch ($buildChoice) {
    "1" {
        Write-Host ""
        Write-Host "🏗️ Creando build para Android..." -ForegroundColor Cyan
        eas build --profile development --platform android
    }
    "2" {
        Write-Host ""
        Write-Host "🏗️ Creando build para iOS..." -ForegroundColor Cyan
        eas build --profile development --platform ios
    }
    "3" {
        Write-Host ""
        Write-Host "🏗️ Creando builds para Android e iOS..." -ForegroundColor Cyan
        eas build --profile development --platform all
    }
    default {
        Write-Host ""
        Write-Host "👍 Perfecto. Cuando estés listo, ejecuta:" -ForegroundColor Green
        Write-Host "   eas build --profile development --platform android" -ForegroundColor White
        Write-Host ""
    }
}

Write-Host "✨ ¡Listo! ✨" -ForegroundColor Green
Write-Host ""
