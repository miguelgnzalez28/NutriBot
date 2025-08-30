import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { usePrivacy } from '../../hooks/usePrivacy';

const PrivacyBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const { privacySettings, updatePrivacySettings } = usePrivacy();

  const handleAcceptAll = () => {
    updatePrivacySettings({
      anonymization: true,
      dataMinimization: true,
      consentValid: true,
      analytics: true,
      personalization: true
    });
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    updatePrivacySettings({
      anonymization: true,
      dataMinimization: true,
      consentValid: true,
      analytics: false,
      personalization: false
    });
    setIsVisible(false);
  };

  const handleDecline = () => {
    updatePrivacySettings({
      anonymization: false,
      dataMinimization: false,
      consentValid: false,
      analytics: false,
      personalization: false
    });
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-blue-600 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-blue-200" />
                <div>
                  <h3 className="text-sm font-medium">
                    🛡️ Cumplimiento GDPR/LOPDGDD
                  </h3>
                  <p className="text-xs text-blue-200 mt-1">
                    NutriBot cumple con las leyes de privacidad españolas. 
                    Gestionamos tus datos de forma segura y transparente.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-blue-200 hover:text-white text-xs flex items-center space-x-1"
                >
                  <Info className="w-4 h-4" />
                  <span>Detalles</span>
                </button>

                <button
                  onClick={() => setIsVisible(false)}
                  className="text-blue-200 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Detailed Privacy Information */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t border-blue-500"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Privacy Features */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-300" />
                        <span>Características de Privacidad</span>
                      </h4>
                      <ul className="text-xs text-blue-200 space-y-2">
                        <li className="flex items-start space-x-2">
                          <span className="text-green-300">✓</span>
                          <span>Anonimización automática de datos sensibles</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-green-300">✓</span>
                          <span>Encriptación de extremo a extremo</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-green-300">✓</span>
                          <span>Derecho al olvido (eliminación completa)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-green-300">✓</span>
                          <span>Portabilidad de datos (exportación)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-green-300">✓</span>
                          <span>Consentimiento granular y revocable</span>
                        </li>
                      </ul>
                    </div>

                    {/* Compliance Status */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-300" />
                        <span>Estado de Cumplimiento</span>
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>GDPR (UE)</span>
                          <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs">
                            Cumplido
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>LOPDGDD (España)</span>
                          <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs">
                            Cumplido
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>AEPD</span>
                          <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs">
                            Registrado
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>AESIA</span>
                          <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs">
                            Cumplido
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Consent Options */}
                  <div className="mt-4 pt-4 border-t border-blue-500">
                    <h4 className="text-sm font-medium mb-3">Opciones de Consentimiento</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleAcceptAll}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                      >
                        Aceptar Todo
                      </button>
                      <button
                        onClick={handleAcceptEssential}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                      >
                        Solo Esenciales
                      </button>
                      <button
                        onClick={handleDecline}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>

                  {/* Data Processing Information */}
                  <div className="mt-4 pt-4 border-t border-blue-500">
                    <h4 className="text-sm font-medium mb-2">Información sobre el Procesamiento</h4>
                    <div className="text-xs text-blue-200 space-y-1">
                      <p>
                        <strong>Responsable:</strong> NutriBot S.L. - Calle Example 123, 28001 Madrid, España
                      </p>
                      <p>
                        <strong>DPO:</strong> dpo@nutribot.com - +34 900 123 456
                      </p>
                      <p>
                        <strong>Finalidad:</strong> Asistencia nutricional personalizada mediante IA
                      </p>
                      <p>
                        <strong>Base Legal:</strong> Consentimiento explícito del usuario
                      </p>
                      <p>
                        <strong>Conservación:</strong> 730 días (configurable)
                      </p>
                      <p>
                        <strong>Derechos:</strong> Acceso, rectificación, supresión, portabilidad, limitación y oposición
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            {!showDetails && (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleAcceptAll}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                  >
                    Aceptar Todo
                  </button>
                  <button
                    onClick={handleAcceptEssential}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                  >
                    Solo Esenciales
                  </button>
                  <button
                    onClick={handleDecline}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                  >
                    Rechazar
                  </button>
                </div>

                <div className="text-xs text-blue-200">
                  <span>Retención: {process.env.REACT_APP_DATA_RETENTION_DAYS || 730} días</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrivacyBanner;

