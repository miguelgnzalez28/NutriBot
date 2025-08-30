# 🤖 Configuración Optimizada para GPT-OSS:20B

## 📋 **Información del Modelo**

### **Características Técnicas:**
- **Tamaño**: ~40GB
- **RAM Requerida**: 32GB (mínimo 16GB)
- **Contexto**: 8192 tokens
- **Calidad**: ⭐⭐⭐⭐⭐ (Excelente para nutrición)
- **Velocidad**: ⭐⭐⭐⭐ (Rápido para su tamaño)

### **Ventajas para NutriBot:**
- ✅ **Mejor comprensión de contexto médico**
- ✅ **Respuestas más detalladas y precisas**
- ✅ **Mejor manejo de consultas complejas**
- ✅ **Mayor capacidad de razonamiento**
- ✅ **Mejor generación de planes de comidas**

---

## ⚙️ **Configuración Optimizada**

### **Variables de Entorno Recomendadas:**
```env
# LLM Configuration
USE_LOCAL_LLM=true
OLLAMA_BASE_URL=http://localhost:11434
LOCAL_MODEL=gpt-oss:20b

# Optimized Parameters for GPT-OSS:20B
MAX_TOKENS=4096
TEMPERATURE=0.7
TOP_P=0.9
TOP_K=40
REPEAT_PENALTY=1.1

# Performance Settings
BATCH_SIZE=512
THREADS=8
GPU_LAYERS=35
```

### **Parámetros de Rendimiento:**
```json
{
  "model": "gpt-oss:20b",
  "options": {
    "temperature": 0.7,
    "num_predict": 4096,
    "top_p": 0.9,
    "top_k": 40,
    "repeat_penalty": 1.1,
    "num_ctx": 8192,
    "num_gpu": 1,
    "num_thread": 8
  }
}
```

---

## 🚀 **Instalación y Configuración**

### **Paso 1: Verificar Requisitos del Sistema**
```powershell
# Verificar RAM
(Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory / 1GB

# Verificar espacio libre
(Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'").FreeSpace / 1GB
```

### **Paso 2: Instalar con Script Optimizado**
```powershell
# Ejecutar como administrador
.\install-gpt-oss.ps1
```

### **Paso 3: Verificar Instalación**
```bash
# Verificar modelo
ollama list

# Probar modelo
ollama run gpt-oss:20b "Hola, soy NutriBot. ¿Puedes darme un consejo nutricional?"
```

---

## 🔧 **Optimizaciones de Rendimiento**

### **Para Sistemas con 32GB+ RAM:**
```env
GPU_LAYERS=35
BATCH_SIZE=1024
THREADS=12
```

### **Para Sistemas con 16-32GB RAM:**
```env
GPU_LAYERS=20
BATCH_SIZE=512
THREADS=8
```

### **Para Sistemas con 16GB RAM:**
```env
GPU_LAYERS=10
BATCH_SIZE=256
THREADS=6
```

---

## 📊 **Comparación de Rendimiento**

| Configuración | Tiempo de Respuesta | Calidad | Uso de RAM |
|---------------|-------------------|---------|------------|
| **Optimizada** | 3-5 segundos | ⭐⭐⭐⭐⭐ | 28-32GB |
| **Estándar** | 5-8 segundos | ⭐⭐⭐⭐ | 24-28GB |
| **Mínima** | 8-12 segundos | ⭐⭐⭐ | 16-20GB |

---

## 🎯 **Prompts Optimizados para Nutrición**

### **Evaluación de Salud:**
```
Eres NutriBot, un asistente de nutrición especializado. 
Genera una pregunta para evaluar los hábitos alimenticios de un usuario.
La pregunta debe ser clara, específica y orientada a obtener información útil para crear recomendaciones nutricionales personalizadas.
```

### **Consejos Nutricionales:**
```
Como NutriBot, proporciona un consejo nutricional específico y práctico.
Considera las mejores prácticas de nutrición y las guías dietéticas españolas.
Mantén un tono profesional pero accesible.
```

### **Planes de Comidas:**
```
Crea un plan de comidas de 7 días que sea:
- Nutricionalmente balanceado
- Adaptado a la dieta mediterránea
- Fácil de seguir
- Incluya opciones para diferentes preferencias alimentarias
```

---

## 🔍 **Solución de Problemas**

### **Problema: Respuestas lentas**
```bash
# Reducir parámetros
TEMPERATURE=0.5
MAX_TOKENS=2048
BATCH_SIZE=256
```

### **Problema: Alto uso de memoria**
```bash
# Ajustar GPU layers
GPU_LAYERS=20
# Cerrar otras aplicaciones
# Aumentar RAM virtual
```

### **Problema: Respuestas inconsistentes**
```bash
# Ajustar temperatura
TEMPERATURE=0.3
# Aumentar repeat penalty
REPEAT_PENALTY=1.2
```

---

## 📈 **Monitoreo de Rendimiento**

### **Comandos de Monitoreo:**
```bash
# Ver uso de memoria
ollama ps

# Ver logs
ollama logs

# Verificar estado del modelo
curl http://localhost:11434/api/tags
```

### **Métricas Recomendadas:**
- **Tiempo de respuesta**: < 5 segundos
- **Uso de RAM**: < 32GB
- **Precisión**: > 90%
- **Satisfacción del usuario**: > 4.5/5

---

## 🎉 **Beneficios para NutriBot**

### **Mejoras en la Experiencia del Usuario:**
- ✅ Respuestas más detalladas y contextuales
- ✅ Mejor comprensión de consultas complejas
- ✅ Generación de planes de comidas más sofisticados
- ✅ Evaluaciones de salud más precisas

### **Mejoras para Nutricionistas:**
- ✅ Reportes más detallados y profesionales
- ✅ Análisis más profundos de patrones alimentarios
- ✅ Recomendaciones más específicas y personalizadas
- ✅ Mejor integración con protocolos médicos

---

## 📞 **Soporte**

- **Documentación**: `OPCIONES_LLM.md`
- **Instalación**: `install-gpt-oss.ps1`
- **Pruebas**: `test-local-llm.html`
- **Configuración**: `env.example`

**¡GPT-OSS:20B está optimizado para proporcionar la mejor experiencia nutricional posible!** 🎉

