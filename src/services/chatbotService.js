const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { anonymizeData } = require('../utils/dataAnonymizer');
const { Assessment, User, Nutritionist } = require('../database/models');
const { encryptData, decryptData } = require('../utils/encryption');
const { LocalLLMService } = require('./localLLMService');

/**
 * ChatbotService - Handles LLM interactions for nutritionist assistant
 * Implements privacy-by-design principles for GDPR/LOPDGDD compliance
 * Supports both OpenAI and local LLM options
 */
class ChatbotService {
  constructor() {
    // Initialize LLM services
    this.useLocalLLM = process.env.USE_LOCAL_LLM === 'true' || !process.env.OPENAI_API_KEY;
    
    if (this.useLocalLLM) {
      this.localLLM = new LocalLLMService();
      logger.info('Using local LLM service', { 
        model: process.env.LOCAL_MODEL || 'llama2:7b',
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
      });
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.model = process.env.OPENAI_MODEL || 'gpt-4';
      this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 2000;
      this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
      logger.info('Using OpenAI service', { model: this.model });
    }
  }

  /**
   * Generate response using available LLM service
   */
  async generateLLMResponse(prompt, context = {}, privacyContext = {}) {
    try {
      if (this.useLocalLLM) {
        return await this.localLLM.generateResponse(prompt, context, privacyContext);
      } else {
        return await this.generateOpenAIResponse(prompt, context, privacyContext);
      }
    } catch (error) {
      logger.error('Error generating LLM response:', error);
      
      // Fallback to local LLM if OpenAI fails
      if (!this.useLocalLLM && this.localLLM) {
        logger.info('Falling back to local LLM');
        return await this.localLLM.generateResponse(prompt, context, privacyContext);
      }
      
      throw error;
    }
  }

  /**
   * Generate response using OpenAI
   */
  async generateOpenAIResponse(prompt, context = {}, privacyContext = {}) {
    try {
      // Anonymize data before sending to OpenAI
      const anonymizedPrompt = privacyContext.anonymization 
        ? await anonymizeData(prompt, 'openai_request')
        : prompt;

      const systemPrompt = this.buildSystemPrompt(context);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: anonymizedPrompt }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: false
      });

      const generatedText = response.choices[0].message.content;

      logger.info('OpenAI response generated', {
        model: this.model,
        responseLength: generatedText.length,
        privacyCompliant: true
      });

      return {
        success: true,
        response: generatedText,
        model: this.model,
        privacyCompliant: true,
        processingTime: response.usage?.total_tokens || 0
      };

    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Start a new health assessment
   */
  async startHealthAssessment({ userId, healthData, privacyContext }) {
    try {
      // Anonymize health data before LLM processing
      const anonymizedData = privacyContext.anonymization 
        ? anonymizeData(healthData, 'health_assessment')
        : healthData;

      // Create assessment record
      const assessment = await Assessment.create({
        id: uuidv4(),
        userId,
        status: 'in_progress',
        healthData: encryptData(JSON.stringify(healthData)),
        anonymizedData: encryptData(JSON.stringify(anonymizedData)),
        progress: 0,
        currentQuestion: 1,
        totalQuestions: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Generate first question using LLM
      const firstQuestion = await this.generateAssessmentQuestion({
        assessmentId: assessment.id,
        questionNumber: 1,
        healthData: anonymizedData,
        previousAnswers: [],
        privacyContext
      });

      // Update assessment with first question
      await assessment.update({
        currentQuestion: firstQuestion,
        nextQuestion: firstQuestion
      });

      logger.info('Health assessment started', {
        assessmentId: assessment.id,
        userId,
        anonymized: privacyContext.anonymization,
        llmType: this.useLocalLLM ? 'local' : 'openai'
      });

      return {
        id: assessment.id,
        status: assessment.status,
        nextQuestion: firstQuestion,
        progress: assessment.progress,
        estimatedCompletion: this.calculateEstimatedCompletion(assessment.totalQuestions)
      };

    } catch (error) {
      logger.error('Error starting health assessment:', error);
      throw new Error('Failed to start health assessment');
    }
  }

  /**
   * Process user answer and generate next question
   */
  async processAnswer({ userId, assessmentId, questionId, answer, confidence, privacyContext }) {
    try {
      // Retrieve assessment
      const assessment = await Assessment.findOne({
        where: { id: assessmentId, userId }
      });

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Decrypt and update assessment data
      const healthData = JSON.parse(decryptData(assessment.healthData));
      const answers = assessment.answers ? JSON.parse(decryptData(assessment.answers)) : [];
      
      // Add new answer
      answers.push({
        questionId,
        answer,
        confidence,
        timestamp: new Date()
      });

      // Calculate progress
      const progress = Math.round((answers.length / assessment.totalQuestions) * 100);

      // Generate next question or final recommendations
      let nextQuestion = null;
      let status = assessment.status;

      if (answers.length >= assessment.totalQuestions) {
        // Generate final recommendations
        const recommendations = await this.generateFinalRecommendations({
          assessmentId,
          healthData,
          answers,
          privacyContext
        });

        status = 'completed';
        
        // Update assessment with recommendations
        await assessment.update({
          status,
          progress: 100,
          answers: encryptData(JSON.stringify(answers)),
          recommendations: encryptData(JSON.stringify(recommendations)),
          completedAt: new Date()
        });

        return {
          status: 'completed',
          recommendations,
          progress: 100
        };
      } else {
        // Generate next question
        nextQuestion = await this.generateAssessmentQuestion({
          assessmentId,
          questionNumber: answers.length + 1,
          healthData,
          previousAnswers: answers,
          privacyContext
        });

        // Update assessment
        await assessment.update({
          currentQuestion: answers.length + 1,
          answers: encryptData(JSON.stringify(answers)),
          progress,
          nextQuestion
        });
      }

      logger.info('Answer processed', {
        assessmentId,
        userId,
        progress,
        llmType: this.useLocalLLM ? 'local' : 'openai'
      });

      return {
        status,
        nextQuestion,
        progress,
        estimatedCompletion: this.calculateEstimatedCompletion(assessment.totalQuestions)
      };

    } catch (error) {
      logger.error('Error processing answer:', error);
      throw new Error('Failed to process answer');
    }
  }

  /**
   * Get personalized nutrition advice
   */
  async getPersonalizedAdvice({ userId, query, context, privacyContext }) {
    try {
      const prompt = this.buildAdvicePrompt(query, context);
      
      const response = await this.generateLLMResponse(prompt, context, privacyContext);

      // Log the interaction for privacy compliance
      logger.info('Personalized advice generated', {
        userId,
        queryLength: query.length,
        responseLength: response.response.length,
        privacyCompliant: true,
        llmType: this.useLocalLLM ? 'local' : 'openai'
      });

      return {
        advice: response.response,
        model: response.model,
        privacyCompliant: response.privacyCompliant,
        processingTime: response.processingTime
      };

    } catch (error) {
      logger.error('Error generating personalized advice:', error);
      throw new Error('Failed to generate personalized advice');
    }
  }

  /**
   * Generate meal plan
   */
  async generateMealPlan({ userId, duration, preferences, restrictions, privacyContext }) {
    try {
      const prompt = this.buildMealPlanPrompt({ duration, preferences, restrictions });
      
      const response = await this.generateLLMResponse(prompt, { preferences, restrictions }, privacyContext);

      logger.info('Meal plan generated', {
        userId,
        duration,
        preferences: preferences ? 'specified' : 'none',
        restrictions: restrictions ? 'specified' : 'none',
        privacyCompliant: true,
        llmType: this.useLocalLLM ? 'local' : 'openai'
      });

      return {
        mealPlan: response.response,
        model: response.model,
        privacyCompliant: response.privacyCompliant,
        processingTime: response.processingTime
      };

    } catch (error) {
      logger.error('Error generating meal plan:', error);
      throw new Error('Failed to generate meal plan');
    }
  }

  /**
   * Track user progress
   */
  async trackProgress({ userId, metrics, date, privacyContext }) {
    try {
      const prompt = this.buildInsightsPrompt(metrics, date);
      
      const response = await this.generateLLMResponse(prompt, { metrics }, privacyContext);

      logger.info('Progress insights generated', {
        userId,
        metricsCount: Object.keys(metrics).length,
        privacyCompliant: true,
        llmType: this.useLocalLLM ? 'local' : 'openai'
      });

      return {
        insights: response.response,
        model: response.model,
        privacyCompliant: response.privacyCompliant,
        processingTime: response.processingTime
      };

    } catch (error) {
      logger.error('Error tracking progress:', error);
      throw new Error('Failed to track progress');
    }
  }

  /**
   * Get assessment details
   */
  async getAssessment({ userId, assessmentId, privacyContext }) {
    try {
      const assessment = await Assessment.findOne({
        where: { id: assessmentId, userId }
      });

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Decrypt data based on privacy context
      const healthData = privacyContext.includeHealthData 
        ? JSON.parse(decryptData(assessment.healthData))
        : null;

      const answers = assessment.answers 
        ? JSON.parse(decryptData(assessment.answers))
        : [];

      const recommendations = assessment.recommendations
        ? JSON.parse(decryptData(assessment.recommendations))
        : null;

      return {
        id: assessment.id,
        status: assessment.status,
        progress: assessment.progress,
        healthData,
        answers,
        recommendations,
        createdAt: assessment.createdAt,
        completedAt: assessment.completedAt
      };

    } catch (error) {
      logger.error('Error retrieving assessment:', error);
      throw new Error('Failed to retrieve assessment');
    }
  }

  /**
   * Delete assessment (right to be forgotten)
   */
  async deleteAssessment({ userId, assessmentId, privacyContext }) {
    try {
      const assessment = await Assessment.findOne({
        where: { id: assessmentId, userId }
      });

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Permanently delete the assessment
      await assessment.destroy();

      logger.info('Assessment deleted', {
        assessmentId,
        userId,
        privacyCompliant: true,
        rightToBeForgotten: true
      });

      return { success: true, message: 'Assessment permanently deleted' };

    } catch (error) {
      logger.error('Error deleting assessment:', error);
      throw new Error('Failed to delete assessment');
    }
  }

  // Private helper methods
  async generateAssessmentQuestion({ assessmentId, questionNumber, healthData, previousAnswers, privacyContext }) {
    const prompt = this.buildQuestionPrompt(questionNumber, healthData, previousAnswers);
    const response = await this.generateLLMResponse(prompt, { healthData, previousAnswers }, privacyContext);
    return response.response;
  }

  async generateFinalRecommendations({ assessmentId, healthData, answers, privacyContext }) {
    const prompt = this.buildRecommendationsPrompt(healthData, answers);
    const response = await this.generateLLMResponse(prompt, { healthData, answers }, privacyContext);
    return response.response;
  }

  async generateProgressInsights({ userId, metrics, date, privacyContext }) {
    const prompt = this.buildInsightsPrompt(metrics, date);
    const response = await this.generateLLMResponse(prompt, { metrics }, privacyContext);
    return response.response;
  }

  getSystemPrompt(context) {
    return `Eres NutriBot, un asistente de nutrición especializado que cumple con las leyes de privacidad españolas (GDPR y LOPDGDD).

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
${context.healthGoals ? `Objetivos: ${context.healthGoals}` : ''}`;
  }

  buildAdvicePrompt(query, userContext, additionalContext = '') {
    return `${this.getSystemPrompt(userContext)}

CONSULTA DEL USUARIO: ${query}

${additionalContext}

Proporciona consejos nutricionales específicos y útiles:`;
  }

  buildQuestionPrompt(questionNumber, healthData, previousAnswers) {
    return `${this.getSystemPrompt({})}

EVALUACIÓN DE SALUD - PREGUNTA ${questionNumber}

DATOS DE SALUD DEL USUARIO:
${JSON.stringify(healthData, null, 2)}

RESPUESTAS PREVIAS:
${JSON.stringify(previousAnswers, null, 2)}

Genera la siguiente pregunta de la evaluación de salud, considerando las respuestas previas:`;
  }

  buildMealPlanPrompt(userData, duration, preferences, restrictions) {
    return `${this.getSystemPrompt({})}

PLAN DE COMIDAS

DURACIÓN: ${duration} días
PREFERENCIAS: ${preferences || 'Ninguna especificada'}
RESTRICCIONES: ${restrictions || 'Ninguna especificada'}

Genera un plan de comidas detallado y personalizado:`;
  }

  buildRecommendationsPrompt(healthData, answers) {
    return `${this.getSystemPrompt({})}

RECOMENDACIONES FINALES

DATOS DE SALUD:
${JSON.stringify(healthData, null, 2)}

RESPUESTAS DE LA EVALUACIÓN:
${JSON.stringify(answers, null, 2)}

Genera recomendaciones nutricionales personalizadas basadas en la evaluación:`;
  }

  buildInsightsPrompt(metrics, date) {
    return `${this.getSystemPrompt({})}

ANÁLISIS DE PROGRESO

MÉTRICAS:
${JSON.stringify(metrics, null, 2)}
FECHA: ${date}

Proporciona insights sobre el progreso y sugerencias de mejora:`;
  }

  calculateEstimatedCompletion(totalQuestions) {
    const avgTimePerQuestion = 2; // minutes
    return totalQuestions * avgTimePerQuestion;
  }

  /**
   * Health check for LLM services
   */
  async healthCheck() {
    try {
      if (this.useLocalLLM) {
        return await this.localLLM.healthCheck();
      } else {
        // Test OpenAI connection
        await this.openai.models.list();
        return {
          status: 'healthy',
          available: true,
          service: 'openai',
          model: this.model
        };
      }
    } catch (error) {
      logger.error('LLM health check failed:', error);
      return {
        status: 'unhealthy',
        available: false,
        error: error.message,
        service: this.useLocalLLM ? 'local' : 'openai'
      };
    }
  }
}

module.exports = { ChatbotService };
