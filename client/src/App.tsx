import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { PrivacyProvider } from './contexts/PrivacyContext';
import { AuthProvider } from './contexts/AuthContext';
import { ChatbotProvider } from './contexts/ChatbotContext';

// Components
import Layout from './components/Layout/Layout';
import PrivacyBanner from './components/Privacy/PrivacyBanner';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import ChatbotPage from './pages/ChatbotPage';
import HealthAssessmentPage from './pages/HealthAssessmentPage';
import PrivacyPage from './pages/PrivacyPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NutritionistPortalPage from './pages/NutritionistPortalPage';

// Protected Route Component
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Styles
import './styles/globals.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <PrivacyProvider>
            <ChatbotProvider>
              <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
                {/* Privacy Compliance Banner */}
                <PrivacyBanner />
                
                {/* Main App Content */}
                <Layout>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    
                    {/* Protected Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route
                      path="/chatbot"
                      element={
                        <ProtectedRoute>
                          <ChatbotPage />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route
                      path="/assessment"
                      element={
                        <ProtectedRoute>
                          <HealthAssessmentPage />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route
                      path="/nutritionist"
                      element={
                        <ProtectedRoute requireNutritionist>
                          <NutritionistPortalPage />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* 404 Route */}
                    <Route
                      path="*"
                      element={
                        <div className="flex items-center justify-center min-h-screen">
                          <div className="text-center">
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                              404 - Página no encontrada
                            </h1>
                            <p className="text-gray-600 mb-8">
                              La página que buscas no existe.
                            </p>
                            <button
                              onClick={() => window.history.back()}
                              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Volver
                            </button>
                          </div>
                        </div>
                      }
                    />
                  </Routes>
                </Layout>
                
                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10B981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#EF4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </ChatbotProvider>
          </PrivacyProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

