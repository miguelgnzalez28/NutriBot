# NutriBot - Ollama Installation Script for Windows
# This script installs Ollama and sets up a local LLM for NutriBot

Write-Host "🤖 NutriBot - Instalación de Ollama para LLM Local" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

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

# Download recommended model
Write-Host "📥 Descargando modelo recomendado (gpt-oss:20b)..." -ForegroundColor Yellow
Write-Host "⚠️  Esto puede tomar varios minutos dependiendo de tu conexión a internet..." -ForegroundColor Yellow
Write-Host "⚠️  Este modelo requiere aproximadamente 40GB de espacio libre..." -ForegroundColor Yellow

try {
    ollama pull gpt-oss:20b
    Write-Host "✅ Modelo gpt-oss:20b descargado correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al descargar el modelo. Puedes descargarlo manualmente con: ollama pull gpt-oss:20b" -ForegroundColor Red
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

# Test model
Write-Host "🧪 Probando el modelo..." -ForegroundColor Yellow
try {
    $testPrompt = "Hola, ¿cómo estás?"
    $testData = @{
        model = "gpt-oss:20b"
        prompt = $testPrompt
        stream = $false
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body $testData -ContentType "application/json"
    
    if ($response.response) {
        Write-Host "✅ Modelo funcionando correctamente" -ForegroundColor Green
        Write-Host "Respuesta de prueba: $($response.response.Substring(0, [Math]::Min(100, $response.response.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ El modelo no respondió correctamente" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error al probar el modelo: $($_.Exception.Message)" -ForegroundColor Red
}

# Configuration instructions
Write-Host ""
Write-Host "🔧 Configuración para NutriBot:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "1. Asegúrate de que USE_LOCAL_LLM=true en tu archivo .env" -ForegroundColor White
Write-Host "2. El modelo por defecto es gpt-oss:20b" -ForegroundColor White
Write-Host "3. Ollama se ejecuta en http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "📝 Comandos útiles:" -ForegroundColor Cyan
Write-Host "  - ollama list                    # Listar modelos" -ForegroundColor Gray
Write-Host "  - ollama pull gpt-oss:20b       # Descargar modelo" -ForegroundColor Gray
Write-Host "  - ollama run gpt-oss:20b        # Ejecutar modelo interactivo" -ForegroundColor Gray
Write-Host "  - ollama serve                  # Iniciar servicio" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 ¡Instalación completada! Ahora puedes ejecutar NutriBot con LLM local." -ForegroundColor Green
Write-Host "   Ejecuta: npm run dev" -ForegroundColor Yellow
