# 🤖 Opciones de LLM para NutriBot

## Resumen

NutriBot puede ejecutarse **sin acceso a la API de OpenAI** utilizando modelos de IA locales que mantienen el cumplimiento completo de las leyes de privacidad españolas (GDPR y LOPDGDD).

---

## 🔄 **Opción 1: LLM Local con Ollama (RECOMENDADA)**

### ✅ **Ventajas:**
- **Privacidad Total**: Todos los datos se procesan localmente
- **Sin Costos**: No hay tarifas de API
- **Cumplimiento Legal**: Cumple GDPR/LOPDGDD automáticamente
- **Control Completo**: Tienes control total sobre el modelo y datos
- **Sin Conexión**: Funciona offline una vez descargado el modelo

### 📋 **Requisitos:**
- Windows 10/11 (64-bit)
- 16GB RAM mínimo (32GB recomendado)
- 40GB espacio libre para el modelo
- Conexión a internet solo para descargar el modelo

### 🚀 **Instalación Rápida:**

1. **Ejecutar script de instalación:**
   ```powershell
   # Ejecutar como administrador
   .\install-ollama.ps1
   ```

2. **Verificar instalación:**
   ```bash
   ollama --version
   ollama list
   ```

3. **Configurar NutriBot:**
   ```env
   USE_LOCAL_LLM=true
   OLLAMA_BASE_URL=http://localhost:11434
   LOCAL_MODEL=gpt-oss:20b
   ```

### 🧪 **Prueba Inmediata:**
- Abre `test-local-llm.html` en tu navegador
- Verifica la conexión con Ollama
- Prueba consultas nutricionales

---

## 🔄 **Opción 2: Respuestas Basadas en Reglas (Fallback)**

### ✅ **Ventajas:**
- **Sin Dependencias**: No requiere instalación adicional
- **Respuesta Instantánea**: Sin latencia de red
- **Privacidad Garantizada**: 100% local
- **Funcionalidad Básica**: Cubre consultas comunes

### 📋 **Funcionalidades:**
- Respuestas predefinidas para consultas nutricionales
- Evaluaciones de salud básicas
- Planes de comidas simples
- Consejos de salud general

### 🚀 **Configuración:**
```env
USE_LOCAL_LLM=true
# El sistema usará respuestas basadas en reglas automáticamente
```

---

## 🔄 **Opción 3: Modelos Alternativos**

### **Ollama Models Disponibles:**

| Modelo | Tamaño | RAM Requerida | Calidad | Velocidad |
|--------|--------|---------------|---------|-----------|
| `gpt-oss:20b` | 40GB | 32GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| `llama2:7b` | 4GB | 8GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| `llama2:13b` | 8GB | 16GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| `mistral:7b` | 4GB | 8GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| `codellama:7b` | 4GB | 8GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### **Comandos Útiles:**
```bash
# Listar modelos disponibles
ollama list

# Descargar modelo específico
ollama pull gpt-oss:20b

# Probar modelo interactivo
ollama run gpt-oss:20b

# Iniciar servicio
ollama serve
```

---

## 🔒 **Cumplimiento de Privacidad**

### **GDPR y LOPDGDD Compliance:**

| Aspecto | LLM Local | OpenAI API |
|---------|-----------|------------|
| **Procesamiento de Datos** | ✅ Local | ❌ Servidor externo |
| **Almacenamiento** | ✅ Dispositivo local | ❌ Servidores OpenAI |
| **Transferencia** | ✅ No hay transferencia | ❌ Datos enviados a EE.UU. |
| **Control del Usuario** | ✅ Control total | ❌ Limitado |
| **Derecho al Olvido** | ✅ Eliminación inmediata | ❌ Depende de OpenAI |
| **Anonimización** | ✅ Automática | ⚠️ Requiere configuración |

### **Medidas de Seguridad Implementadas:**

1. **Encriptación Local**: Todos los datos se encriptan antes del procesamiento
2. **Anonimización Automática**: Identificadores personales se eliminan
3. **Auditoría Completa**: Registros de todas las operaciones
4. **Control de Acceso**: Autenticación y autorización granular
5. **Retención de Datos**: Configuración automática de expiración

---

## 🚀 **Guía de Ejecución Rápida**

### **Paso 1: Instalar Ollama**
```powershell
# Ejecutar como administrador
.\install-ollama.ps1
```

### **Paso 2: Verificar Instalación**
```bash
ollama --version
ollama list
```

### **Paso 3: Probar Funcionalidad**
- Abrir `test-local-llm.html`
- Verificar conexión
- Probar consultas nutricionales

### **Paso 4: Configurar NutriBot**
```env
USE_LOCAL_LLM=true
OLLAMA_BASE_URL=http://localhost:11434
LOCAL_MODEL=gpt-oss:20b
```

### **Paso 5: Ejecutar Aplicación**
```bash
npm install
npm run dev
```

---

## 🔧 **Solución de Problemas**

### **Problema: Ollama no se conecta**
```bash
# Verificar si el servicio está ejecutándose
ollama serve

# Verificar puerto
netstat -an | findstr 11434
```

### **Problema: Modelo no responde**
```bash
# Verificar modelos disponibles
ollama list

# Re-descargar modelo
ollama pull gpt-oss:20b
```

### **Problema: Memoria insuficiente**
- Usar modelo más pequeño: `llama2:7b` o `mistral:7b`
- Cerrar otras aplicaciones
- Aumentar RAM virtual
- Considerar usar `gpt-oss:20b` solo en sistemas con 32GB+ RAM

### **Problema: Respuestas lentas**
- Usar modelo más pequeño
- Ajustar parámetros de temperatura
- Verificar recursos del sistema

---

## 📊 **Comparación de Opciones**

| Característica | LLM Local | Reglas | OpenAI |
|----------------|-----------|--------|--------|
| **Privacidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Costo** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| **Calidad** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Velocidad** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Instalación** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Cumplimiento Legal** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

---

## 🎯 **Recomendación Final**

**Para cumplimiento máximo de privacidad y costos cero:**
1. **Usar LLM Local con Ollama** como opción principal
2. **Respuestas basadas en reglas** como fallback
3. **Configurar anonimización automática**
4. **Implementar auditoría completa**

**Para desarrollo y pruebas:**
1. **Empezar con respuestas basadas en reglas**
2. **Migrar a LLM local cuando sea necesario**
3. **Usar OpenAI solo para funcionalidades avanzadas**

---

## 📞 **Soporte**

- **Documentación**: `MANUAL_USUARIO.md`
- **Pruebas**: `test-local-llm.html`
- **Instalación**: `install-ollama.ps1`
- **Configuración**: `env.example`

**¡NutriBot está listo para ejecutarse con privacidad total y cumplimiento legal completo!** 🎉
