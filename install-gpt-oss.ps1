# NutriBot - GPT-OSS:20B Installation Script for Windows
# This script installs Ollama and sets up gpt-oss:20b for NutriBot

Write-Host "🤖 NutriBot - Instalación de GPT-OSS:20B" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check system requirements
Write-Host "🔍 Verificando requisitos del sistema..." -ForegroundColor Yellow

$totalRAM = (Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory / 1GB
$freeSpace = (Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'").FreeSpace / 1GB

Write-Host "RAM Total: $([math]::Round($totalRAM, 1)) GB" -ForegroundColor White
Write-Host "Espacio libre en C:: $([math]::Round($freeSpace, 1)) GB" -ForegroundColor White

if ($totalRAM -lt 16) {
    Write-Host "❌ ADVERTENCIA: Se recomienda al menos 16GB de RAM para gpt-oss:20b" -ForegroundColor Red
    Write-Host "   El modelo puede funcionar con menos RAM pero será más lento" -ForegroundColor Yellow
    $continue = Read-Host "¿Deseas continuar? (s/n)"
    if ($continue -ne "s") {
        exit 1
    }
}

if ($freeSpace -lt 50) {
    Write-Host "❌ ADVERTENCIA: Se necesitan al menos 50GB de espacio libre" -ForegroundColor Red
    Write-Host "   Espacio disponible: $([math]::Round($freeSpace, 1)) GB" -ForegroundColor Yellow
    $continue = Read-Host "¿Deseas continuar? (s/n)"
    if ($continue -ne "s") {
        exit 1
    }
}

# Check if Ollama is already installed
try {
    $ollamaVersion = ollama --version
    Write-Host "✅ Ollama ya está instalado: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "📥 Ollama no está instalado. Descargando..." -ForegroundColor Yellow
    
    # Download Ollama for Windows
    $ollamaUrl = "https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip"
    $downloadPath = "$env:TEMP\ollama-windows-amd64.zip"
    $extractPath = "$env:TEMP\ollama"
    
    Write-Host "Descargando Ollama desde GitHub..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $ollamaUrl -OutFile $downloadPath
    
    Write-Host "Extrayendo archivos..." -ForegroundColor Yellow
    Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
    
    # Move to Program Files
    $installPath = "C:\Program Files\Ollama"
    if (!(Test-Path $installPath)) {
        New-Item -ItemType Directory -Path $installPath -Force
    }
    
    Copy-Item "$extractPath\ollama.exe" $installPath -Force
    
    # Add to PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    if ($currentPath -notlike "*$installPath*") {
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$installPath", "Machine")
        $env:PATH = "$env:PATH;$installPath"
    }
    
    Write-Host "✅ Ollama instalado en $installPath" -ForegroundColor Green
}

# Start Ollama service
Write-Host "🚀 Iniciando servicio Ollama..." -ForegroundColor Yellow
Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden

# Wait for service to start
Write-Host "⏳ Esperando que el servicio esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test connection
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
    Write-Host "✅ Servicio Ollama iniciado correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al conectar con Ollama. Verificando..." -ForegroundColor Red
    Start-Sleep -Seconds 10
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
        Write-Host "✅ Servicio Ollama iniciado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ No se pudo conectar con Ollama. Por favor, verifica la instalación manualmente." -ForegroundColor Red
        exit 1
    }
}

# Download gpt-oss:20b model
Write-Host "📥 Descargando modelo gpt-oss:20b..." -ForegroundColor Yellow
Write-Host "⚠️  Este modelo tiene aproximadamente 40GB y puede tomar 30-60 minutos..." -ForegroundColor Yellow
Write-Host "⚠️  Asegúrate de tener una conexión estable a internet..." -ForegroundColor Yellow

$continue = Read-Host "¿Deseas continuar con la descarga? (s/n)"
if ($continue -ne "s") {
    Write-Host "Puedes descargar el modelo manualmente más tarde con: ollama pull gpt-oss:20b" -ForegroundColor Yellow
} else {
    try {
        Write-Host "🚀 Iniciando descarga de gpt-oss:20b..." -ForegroundColor Green
        ollama pull gpt-oss:20b
        Write-Host "✅ Modelo gpt-oss:20b descargado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error al descargar el modelo. Puedes descargarlo manualmente con: ollama pull gpt-oss:20b" -ForegroundColor Red
    }
}

# List available models
Write-Host "📋 Modelos disponibles:" -ForegroundColor Cyan
try {
    $models = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
    foreach ($model in $models.models) {
        Write-Host "  - $($model.name)" -ForegroundColor White
    }
} catch {
    Write-Host "  No se pudieron listar los modelos" -ForegroundColor Yellow
}

# Test model if available
Write-Host "🧪 Probando el modelo gpt-oss:20b..." -ForegroundColor Yellow
try {
    $testPrompt = "Hola, soy NutriBot. ¿Puedes darme un consejo nutricional breve?"
    $testData = @{
        model = "gpt-oss:20b"
        prompt = $testPrompt
        stream = $false
        options = @{
            temperature = 0.7
            num_predict = 2048
            top_p = 0.9
            top_k = 40
            repeat_penalty = 1.1
        }
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body $testData -ContentType "application/json"
    
    if ($response.response) {
        Write-Host "✅ Modelo gpt-oss:20b funcionando correctamente" -ForegroundColor Green
        Write-Host "Respuesta de prueba: $($response.response.Substring(0, [Math]::Min(150, $response.response.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ El modelo no respondió correctamente" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error al probar el modelo: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Esto puede ser normal si el modelo aún no está descargado" -ForegroundColor Yellow
}

# Configuration instructions
Write-Host ""
Write-Host "🔧 Configuración para NutriBot con GPT-OSS:20B:" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "1. Asegúrate de que USE_LOCAL_LLM=true en tu archivo .env" -ForegroundColor White
Write-Host "2. El modelo por defecto es gpt-oss:20b" -ForegroundColor White
Write-Host "3. Ollama se ejecuta en http://localhost:11434" -ForegroundColor White
Write-Host "4. Configuración optimizada para nutrición y salud" -ForegroundColor White
Write-Host ""
Write-Host "📝 Comandos útiles:" -ForegroundColor Cyan
Write-Host "  - ollama list                    # Listar modelos" -ForegroundColor Gray
Write-Host "  - ollama pull gpt-oss:20b       # Descargar modelo" -ForegroundColor Gray
Write-Host "  - ollama run gpt-oss:20b        # Ejecutar modelo interactivo" -ForegroundColor Gray
Write-Host "  - ollama serve                  # Iniciar servicio" -ForegroundColor Gray
Write-Host ""
Write-Host "⚡ Optimizaciones para gpt-oss:20b:" -ForegroundColor Cyan
Write-Host "  - MAX_TOKENS=4096 (configurado automáticamente)" -ForegroundColor Gray
Write-Host "  - TEMPERATURE=0.7 (balance entre creatividad y precisión)" -ForegroundColor Gray
Write-Host "  - Respuestas más detalladas y contextuales" -ForegroundColor Gray
Write-Host "  - Mejor comprensión de consultas nutricionales" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 ¡Instalación completada! Ahora puedes ejecutar NutriBot con GPT-OSS:20B." -ForegroundColor Green
Write-Host "   Ejecuta: npm run dev" -ForegroundColor Yellow

