const axios = require('axios');
const { logger } = require('../utils/logger');
const { anonymizeData } = require('../utils/dataAnonymizer');
const { encryptData, decryptData } = require('../utils/encryption');

class LocalLLMService {
  constructor() {
    this.baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.LOCAL_MODEL || 'mistral:7b';
    this.maxTokens = parseInt(process.env.MAX_TOKENS) || 1024;
    this.temperature = parseFloat(process.env.TEMPERATURE) || 0.7;
  }

  async generateResponse(prompt, context = {}, privacyContext = {}) {
    try {
      // Anonymize data before processing
      const anonymizedPrompt = await this.anonymizePrompt(prompt, privacyContext);
      
      const requestData = {
        model: this.model,
        prompt: this.buildSystemPrompt(context) + anonymizedPrompt,
        stream: false,
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens,
          top_p: 0.9,
          top_k: 40,
          repeat_penalty: 1.1
        }
      };

      logger.info('Sending request to local LLM', {
        model: this.model,
        promptLength: anonymizedPrompt.length,
        privacyLevel: privacyContext.anonymizationLevel
      });

      const response = await axios.post(`${this.baseURL}/api/generate`, requestData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.response) {
        const generatedText = response.data.response;
        
        // Log privacy-compliant metrics
        logger.info('Local LLM response generated', {
          responseLength: generatedText.length,
          modelUsed: this.model,
          privacyCompliant: true
        });

        return {
          success: true,
          response: generatedText,
          model: this.model,
          privacyCompliant: true,
          processingTime: response.data.eval_duration || 0
        };
      } else {
        throw new Error('Invalid response format from local LLM');
      }

    } catch (error) {
      logger.error('Error generating response from local LLM', {
        error: error.message,
        model: this.model,
        privacyContext: privacyContext.anonymizationLevel
      });

      // Fallback to rule-based responses
      return this.getFallbackResponse(prompt, context);
    }
  }

  async anonymizePrompt(prompt, privacyContext) {
    try {
      // Apply anonymization based on privacy level
      const anonymizationLevel = privacyContext.anonymizationLevel || 'medium';
      
      switch (anonymizationLevel) {
        case 'high':
          return await anonymizeData(prompt, { 
            removeNames: true, 
            removeLocations: true, 
            removeDates: true,
            removePersonalInfo: true 
          });
        case 'medium':
          return await anonymizeData(prompt, { 
            removeNames: true, 
            removeLocations: false, 
            removeDates: false,
            removePersonalInfo: false 
          });
        case 'low':
        default:
          return prompt; // Minimal anonymization
      }
    } catch (error) {
      logger.warn('Anonymization failed, using original prompt', { error: error.message });
      return prompt;
    }
  }

  buildSystemPrompt(context) {
    const basePrompt = `Eres NutriBot, un asistente de nutrición especializado que cumple con las leyes de privacidad españolas (GDPR y LOPDGDD). 

INSTRUCCIONES IMPORTANTES:
- Proporciona consejos nutricionales basados en evidencia científica
- Siempre menciona que no eres un sustituto de un profesional de la salud
- Respeta la privacidad del usuario y no solicites información personal innecesaria
- Usa un tono profesional pero amigable
- Responde en español
- Mantén las respuestas concisas pero informativas

CONTEXTO DEL USUARIO:
${context.userProfile ? `Perfil: ${context.userProfile}` : 'Perfil no disponible'}
${context.dietaryRestrictions ? `Restricciones: ${context.dietaryRestrictions}` : ''}
${context.healthGoals ? `Objetivos: ${context.healthGoals}` : ''}

Ahora responde a la siguiente consulta del usuario:`;

    return basePrompt;
  }

  getFallbackResponse(prompt, context) {
    // Rule-based fallback responses when LLM is unavailable
    const lowerPrompt = prompt.toLowerCase();
    
    const fallbackResponses = {
      'hola': '¡Hola! Soy NutriBot, tu asistente de nutrición. ¿En qué puedo ayudarte hoy?',
      'nutrición': 'Puedo ayudarte con consejos nutricionales, planes de comidas y evaluaciones de salud. ¿Qué te interesa específicamente?',
      'evaluación': 'Te ayudo a realizar una evaluación de salud personalizada. ¿Estás listo para comenzar?',
      'plan': 'Puedo crear un plan de comidas adaptado a tus necesidades. ¿Tienes alguna preferencia o restricción alimentaria?',
      'peso': 'Para ayudarte con objetivos de peso, necesitaría conocer tu situación actual. ¿Te gustaría hacer una evaluación completa?',
      'energía': 'Los alimentos ricos en nutrientes como frutas, verduras, proteínas magras y granos enteros pueden ayudarte a mantener niveles de energía estables.',
      'ejercicio': 'La nutrición y el ejercicio van de la mano. ¿Te gustaría consejos sobre qué comer antes, durante o después del ejercicio?',
      'vegetariano': 'Una dieta vegetariana bien planificada puede ser muy saludable. ¿Te gustaría consejos sobre cómo asegurar una nutrición completa?',
      'vegano': 'Las dietas veganas requieren atención especial a ciertos nutrientes como B12, hierro y calcio. ¿Te gustaría más información?',
      'gluten': 'Si tienes sensibilidad al gluten, hay muchas alternativas deliciosas disponibles. ¿Te gustaría sugerencias de alimentos?',
      'diabetes': 'La gestión de la diabetes requiere atención especial a los carbohidratos y el control del azúcar en sangre. Siempre consulta con tu médico.',
      'colesterol': 'Una dieta baja en grasas saturadas y rica en fibra puede ayudar a controlar el colesterol. ¿Te gustaría consejos específicos?',
      'presión': 'Reducir el sodio y aumentar el potasio puede ayudar con la presión arterial. ¿Te gustaría más información?',
      'digestión': 'Los alimentos ricos en fibra, probióticos y una buena hidratación pueden mejorar la digestión.',
      'sueño': 'Evitar comidas pesadas antes de dormir y alimentos con cafeína puede mejorar la calidad del sueño.',
      'estrés': 'Alimentos ricos en omega-3, vitaminas B y magnesio pueden ayudar a manejar el estrés.',
      'privacidad': 'Tu privacidad es nuestra prioridad. Todos los datos están encriptados y anonimizados según las leyes españolas de protección de datos.',
      'ayuda': 'Puedo ayudarte con: evaluaciones de salud, consejos nutricionales, planes de comidas, y seguimiento de progreso. ¿Qué necesitas?'
    };

    // Find the best matching fallback response
    for (const [key, response] of Object.entries(fallbackResponses)) {
      if (lowerPrompt.includes(key)) {
        return {
          success: true,
          response: response,
          model: 'fallback-rule-based',
          privacyCompliant: true,
          processingTime: 0
        };
      }
    }

    // Default response
    return {
      success: true,
      response: 'Gracias por tu consulta. Soy NutriBot y estoy aquí para ayudarte con nutrición y salud. ¿Puedes ser más específico sobre lo que necesitas?',
      model: 'fallback-default',
      privacyCompliant: true,
      processingTime: 0
    };
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });
      
      return {
        status: 'healthy',
        available: true,
        models: response.data.models || [],
        baseURL: this.baseURL
      };
    } catch (error) {
      logger.warn('Local LLM health check failed', { error: error.message });
      return {
        status: 'unavailable',
        available: false,
        error: error.message,
        fallbackAvailable: true
      };
    }
  }

  async listAvailableModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      logger.error('Failed to list models', { error: error.message });
      return [];
    }
  }
}

module.exports = { LocalLLMService };
