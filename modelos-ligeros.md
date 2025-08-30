# 🚀 Modelos Ligeros para NutriBot - Guía Completa

## 📊 **Comparación de Modelos por RAM**

| Modelo | Tamaño | RAM Mínima | RAM Recomendada | Velocidad | Calidad | Descarga |
|--------|--------|------------|-----------------|-----------|---------|----------|
| **Mistral 7B** | 4GB | 8GB | 12GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 10-20 min |
| **Llama2 7B** | 4GB | 8GB | 12GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 10-20 min |
| **Phi-2** | 2.7GB | 4GB | 6GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 5-10 min |
| **TinyLlama** | 1.1GB | 2GB | 4GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 3-5 min |
| **GPT4All** | 3.8GB | 6GB | 8GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 8-15 min |

---

## 🥇 **RECOMENDACIÓN PRINCIPAL: Mistral 7B**

### **✅ Ventajas:**
- **Excelente rendimiento** en consultas nutricionales
- **Rápido y eficiente** (mejor que Llama2 7B)
- **Calidad superior** para respuestas médicas
- **Compatible** con tu sistema (15.1GB RAM)
- **Activamente mantenido** y mejorado

### **📋 Instalación:**
```powershell
# Ejecutar como administrador
.\install-mistral.ps1
```

### **⚙️ Configuración:**
```env
USE_LOCAL_LLM=true
OLLAMA_BASE_URL=http://localhost:11434
LOCAL_MODEL=mistral:7b
MAX_TOKENS=1024
TEMPERATURE=0.7
```

---

## 🥈 **ALTERNATIVA: Llama2 7B**

### **✅ Ventajas:**
- **Muy estable** y probado
- **Buena documentación**
- **Compatible** con tu sistema
- **Respuestas consistentes**

### **📋 Instalación:**
```powershell
# Ejecutar como administrador
.\install-llama2.ps1
```

### **⚙️ Configuración:**
```env
USE_LOCAL_LLM=true
OLLAMA_BASE_URL=http://localhost:11434
LOCAL_MODEL=llama2:7b
MAX_TOKENS=1024
TEMPERATURE=0.7
```

---

## 🥉 **PARA SISTEMAS MUY LIMITADOS**

### **Phi-2 (Microsoft)**
```bash
ollama pull phi:2.7b
```
- **RAM**: 4GB mínimo, 6GB recomendado
- **Tamaño**: 2.7GB
- **Velocidad**: Muy rápida
- **Calidad**: Buena para consultas simples

### **TinyLlama**
```bash
ollama pull tinyllama:1.1b
```
- **RAM**: 2GB mínimo, 4GB recomendado
- **Tamaño**: 1.1GB
- **Velocidad**: Ultra rápida
- **Calidad**: Básica pero funcional

---

## 🔧 **Optimizaciones para tu Sistema (15.1GB RAM)**

### **Configuración Recomendada:**
```env
# Para Mistral 7B (RECOMENDADO)
USE_LOCAL_LLM=true
OLLAMA_BASE_URL=http://localhost:11434
LOCAL_MODEL=mistral:7b
MAX_TOKENS=1024
TEMPERATURE=0.7
TOP_P=0.9
TOP_K=40
REPEAT_PENALTY=1.1

# Parámetros de rendimiento
BATCH_SIZE=512
THREADS=6
GPU_LAYERS=0  # CPU only para tu sistema
```

### **Comandos de Optimización:**
```bash
# Verificar uso de memoria
ollama ps

# Ajustar parámetros en tiempo real
ollama run mistral:7b --num-predict 512 --temperature 0.5

# Monitorear rendimiento
ollama logs
```

---

## 📈 **Rendimiento Esperado**

### **Mistral 7B en tu Sistema:**
- **Tiempo de respuesta**: 2-4 segundos
- **Uso de RAM**: 6-8GB
- **Calidad de respuestas**: ⭐⭐⭐⭐⭐
- **Estabilidad**: Excelente

### **Llama2 7B en tu Sistema:**
- **Tiempo de respuesta**: 3-5 segundos
- **Uso de RAM**: 6-8GB
- **Calidad de respuestas**: ⭐⭐⭐⭐
- **Estabilidad**: Muy buena

---

## 🚀 **Instalación Rápida**

### **Paso 1: Elegir Modelo**
```powershell
# Para Mistral 7B (RECOMENDADO)
.\install-mistral.ps1

# O para Llama2 7B
.\install-llama2.ps1
```

### **Paso 2: Verificar Instalación**
```bash
ollama list
ollama run mistral:7b "Hola, ¿cómo estás?"
```

### **Paso 3: Configurar NutriBot**
```env
USE_LOCAL_LLM=true
LOCAL_MODEL=mistral:7b  # o llama2:7b
```

### **Paso 4: Probar**
```bash
npm run dev
```

---

## 🔍 **Solución de Problemas**

### **Problema: Respuestas lentas**
```env
# Reducir parámetros
MAX_TOKENS=512
TEMPERATURE=0.5
BATCH_SIZE=256
```

### **Problema: Alto uso de memoria**
```bash
# Cerrar otras aplicaciones
# Usar modelo más pequeño
ollama pull phi:2.7b
```

### **Problema: Modelo no responde**
```bash
# Reiniciar servicio
ollama serve
# Verificar conexión
curl http://localhost:11434/api/tags
```

---

## 🎯 **Recomendación Final**

**Para tu sistema con 15.1GB RAM:**

1. **🥇 Mistral 7B** - Mejor opción general
2. **🥈 Llama2 7B** - Alternativa estable
3. **🥉 Phi-2** - Si necesitas más velocidad

**Comando de instalación recomendado:**
```powershell
.\install-mistral.ps1
```

**¡Mistral 7B te dará el mejor balance entre rendimiento y calidad para NutriBot!** 🎉
