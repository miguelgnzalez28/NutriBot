# NutriBot - Mistral 7B Installation Script for Windows
# This script installs Ollama and sets up Mistral 7B for NutriBot

Write-Host "🤖 NutriBot - Instalación de Mistral 7B" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check system requirements
Write-Host "🔍 Verificando requisitos del sistema..." -ForegroundColor Yellow

$totalRAM = (Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory / 1GB
$freeSpace = (Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'").FreeSpace / 1GB

Write-Host "RAM Total: $([math]::Round($totalRAM, 1)) GB" -ForegroundColor White
Write-Host "Espacio libre en C:: $([math]::Round($freeSpace, 1)) GB" -ForegroundColor White

if ($totalRAM -lt 8) {
    Write-Host "❌ ADVERTENCIA: Se recomienda al menos 8GB de RAM para Mistral 7B" -ForegroundColor Red
    Write-Host "   Tu sistema tiene $([math]::Round($totalRAM, 1))GB - puede funcionar pero será lento" -ForegroundColor Yellow
    $continue = Read-Host "¿Deseas continuar? (s/n)"
    if ($continue -ne "s") {
        exit 1
    }
}

if ($freeSpace -lt 10) {
    Write-Host "❌ ADVERTENCIA: Se necesitan al menos 10GB de espacio libre" -ForegroundColor Red
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
Start-Sleep -Seconds 10

# Test connection
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
    Write-Host "✅ Servicio Ollama iniciado correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al conectar con Ollama. Verificando..." -ForegroundColor Red
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
        Write-Host "✅ Servicio Ollama iniciado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ No se pudo conectar con Ollama. Por favor, verifica la instalación manualmente." -ForegroundColor Red
        exit 1
    }
}

# Download Mistral 7B model
Write-Host "📥 Descargando modelo Mistral 7B..." -ForegroundColor Yellow
Write-Host "⚠️  Este modelo tiene aproximadamente 4GB y puede tomar 10-20 minutos..." -ForegroundColor Yellow
Write-Host "⚠️  Perfecto para sistemas con 8-16GB de RAM..." -ForegroundColor Yellow

$continue = Read-Host "¿Deseas continuar con la descarga? (s/n)"
if ($continue -ne "s") {
    Write-Host "Puedes descargar el modelo manualmente más tarde con: ollama pull mistral:7b" -ForegroundColor Yellow
} else {
    try {
        Write-Host "🚀 Iniciando descarga de Mistral 7B..." -ForegroundColor Green
        ollama pull mistral:7b
        Write-Host "✅ Modelo Mistral 7B descargado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error al descargar el modelo. Puedes descargarlo manualmente con: ollama pull mistral:7b" -ForegroundColor Red
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
Write-Host "🧪 Probando el modelo Mistral 7B..." -ForegroundColor Yellow
try {
    $testPrompt = "Hola, soy NutriBot. ¿Puedes darme un consejo nutricional breve?"
    $testData = @{
        model = "mistral:7b"
        prompt = $testPrompt
        stream = $false
        options = @{
            temperature = 0.7
            num_predict = 1024
            top_p = 0.9
            top_k = 40
            repeat_penalty = 1.1
        }
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body $testData -ContentType "application/json"
    
    if ($response.response) {
        Write-Host "✅ Modelo Mistral 7B funcionando correctamente" -ForegroundColor Green
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
Write-Host "🔧 Configuración para NutriBot con Mistral 7B:" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "1. Asegúrate de que USE_LOCAL_LLM=true en tu archivo .env" -ForegroundColor White
Write-Host "2. El modelo por defecto es mistral:7b" -ForegroundColor White
Write-Host "3. Ollama se ejecuta en http://localhost:11434" -ForegroundColor White
Write-Host "4. Optimizado para sistemas con 8-16GB de RAM" -ForegroundColor White
Write-Host ""
Write-Host "📝 Comandos útiles:" -ForegroundColor Cyan
Write-Host "  - ollama list                    # Listar modelos" -ForegroundColor Gray
Write-Host "  - ollama pull mistral:7b        # Descargar modelo" -ForegroundColor Gray
Write-Host "  - ollama run mistral:7b         # Ejecutar modelo interactivo" -ForegroundColor Gray
Write-Host "  - ollama serve                  # Iniciar servicio" -ForegroundColor Gray
Write-Host ""
Write-Host "⚡ Optimizaciones para Mistral 7B:" -ForegroundColor Cyan
Write-Host "  - MAX_TOKENS=1024 (configurado automáticamente)" -ForegroundColor Gray
Write-Host "  - TEMPERATURE=0.7 (balance entre creatividad y precisión)" -ForegroundColor Gray
Write-Host "  - Respuestas rápidas y eficientes" -ForegroundColor Gray
Write-Host "  - Excelente para consultas nutricionales" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 ¡Instalación completada! Ahora puedes ejecutar NutriBot con Mistral 7B." -ForegroundColor Green
Write-Host "   Ejecuta: npm run dev" -ForegroundColor Yellow
