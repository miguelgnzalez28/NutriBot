import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  User, 
  Bot, 
  Shield, 
  Settings, 
  Download, 
  Trash2,
  MessageCircle,
  Brain,
  Leaf,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import ChatMessage from '../components/Chat/ChatMessage';
import PrivacyControls from '../components/Privacy/PrivacyControls';
import ConsentBanner from '../components/Privacy/ConsentBanner';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';

// Hooks
import { useChatbot } from '../hooks/useChatbot';
import { usePrivacy } from '../hooks/usePrivacy';
import { useAuth } from '../hooks/useAuth';

// Types
import { Message, MessageType } from '../types/chat';

// Utils
import { formatTimestamp } from '../utils/dateUtils';

interface ChatFormData {
  message: string;
}

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showPrivacyControls, setShowPrivacyControls] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChatFormData>();
  
  const { user } = useAuth();
  const { privacySettings, updatePrivacySettings } = usePrivacy();
  const { 
    sendMessage, 
    startHealthAssessment, 
    generateMealPlan,
    isLoading,
    error 
  } = useChatbot();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          type: MessageType.BOT,
          content: `¡Hola ${user?.name || 'usuario'}! Soy tu asistente nutricional inteligente. 

Estoy aquí para ayudarte con:
• 🍎 Consejos nutricionales personalizados
• 📊 Evaluaciones de salud
• 🍽️ Planes de comidas
• 📈 Seguimiento de progreso

¿En qué puedo ayudarte hoy?`,
          timestamp: new Date(),
          metadata: {
            isWelcome: true,
            suggestions: [
              'Quiero empezar una evaluación de salud',
              'Necesito consejos nutricionales',
              'Generar un plan de comidas',
              'Revisar mi progreso'
            ]
          }
        }
      ]);
    }
  }, [user?.name]);

  const onSubmit = async (data: ChatFormData) => {
    if (!data.message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: MessageType.USER,
      content: data.message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    reset();

    try {
      const response = await sendMessage({
        message: data.message,
        userId: user?.id || '',
        privacyContext: privacySettings
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: MessageType.BOT,
        content: response.response,
        timestamp: new Date(),
        metadata: {
          confidence: response.confidence,
          sources: response.sources,
          disclaimers: response.disclaimers,
          aiGenerated: true,
          suggestions: response.suggestions || []
        }
      };

      setMessages(prev => [...prev, botMessage]);
      toast.success('Respuesta generada con éxito');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    const actionMessage: Message = {
      id: Date.now().toString(),
      type: MessageType.USER,
      content: action,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, actionMessage]);
    setIsTyping(true);

    try {
      let response;
      
      switch (action) {
        case 'Quiero empezar una evaluación de salud':
          response = await startHealthAssessment({
            userId: user?.id || '',
            privacyContext: privacySettings
          });
          break;
          
        case 'Generar un plan de comidas':
          response = await generateMealPlan({
            userId: user?.id || '',
            duration: '7_days',
            privacyContext: privacySettings
          });
          break;
          
        default:
          response = await sendMessage({
            message: action,
            userId: user?.id || '',
            privacyContext: privacySettings
          });
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: MessageType.BOT,
        content: response.response || response.message,
        timestamp: new Date(),
        metadata: {
          confidence: response.confidence,
          sources: response.sources,
          disclaimers: response.disclaimers,
          aiGenerated: true,
          suggestions: response.suggestions || []
        }
      };

      setMessages(prev => [...prev, botMessage]);
      toast.success('Acción completada con éxito');
    } catch (error) {
      console.error('Error with quick action:', error);
      toast.error('Error al procesar la acción');
    } finally {
      setIsTyping(false);
    }
  };

  const handlePrivacyToggle = (setting: string, value: boolean) => {
    updatePrivacySettings({ [setting]: value });
    toast.success('Configuración de privacidad actualizada');
  };

  const exportChatHistory = () => {
    const chatData = {
      messages,
      user: user?.name,
      exportDate: new Date().toISOString(),
      privacySettings
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_history_${user?.id}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Historial de chat exportado');
  };

  const clearChatHistory = () => {
    setMessages([]);
    toast.success('Historial de chat borrado');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  NutriBot Assistant
                </h1>
                <p className="text-sm text-gray-500">
                  Asistente nutricional con IA
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrivacyControls(!showPrivacyControls)}
                className="flex items-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>Privacidad</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportChatHistory}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearChatHistory}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Privacy Controls */}
        <AnimatePresence>
          {showPrivacyControls && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-blue-50 border-b border-blue-200"
            >
              <PrivacyControls
                settings={privacySettings}
                onToggle={handlePrivacyToggle}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Consent Banner */}
        <AnimatePresence>
          {showConsentBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-yellow-50 border-b border-yellow-200"
            >
              <ConsentBanner
                onAccept={() => setShowConsentBanner(false)}
                onDecline={() => setShowConsentBanner(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ChatMessage
                  message={message}
                  onQuickAction={handleQuickAction}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 text-gray-500"
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">NutriBot está escribiendo...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-4">
            <div className="flex-1">
              <Input
                {...register('message', { 
                  required: 'El mensaje es requerido',
                  minLength: { value: 1, message: 'El mensaje no puede estar vacío' }
                })}
                placeholder="Escribe tu mensaje aquí..."
                disabled={isLoading}
                className="w-full"
                error={errors.message?.message}
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Enviar</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Acciones Rápidas
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('Quiero empezar una evaluación de salud')}
                className="w-full justify-start"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Evaluación de Salud
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('Generar un plan de comidas')}
                className="w-full justify-start"
              >
                <Leaf className="w-4 h-4 mr-2" />
                Plan de Comidas
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('Revisar mi progreso')}
                className="w-full justify-start"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Revisar Progreso
              </Button>
            </div>
          </div>

          {/* Privacy Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Estado de Privacidad
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Anonimización</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  privacySettings.anonymization 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {privacySettings.anonymization ? 'Activada' : 'Desactivada'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Consentimiento</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  privacySettings.consentValid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {privacySettings.consentValid ? 'Válido' : 'Pendiente'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Retención de Datos</span>
                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {process.env.REACT_APP_DATA_RETENTION_DAYS || 730} días
                </span>
              </div>
            </div>
          </div>

          {/* AI Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Información Importante</p>
                <p>
                  Este asistente utiliza inteligencia artificial. Los consejos proporcionados 
                  son informativos y no sustituyen la consulta con profesionales de la salud.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;

