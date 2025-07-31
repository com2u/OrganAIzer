// File: /home/com2u/src/OrganAIzer/frontend/src/App.js
// Purpose: Main React application component with routing and state management

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EntryList from './components/EntryList';
import EntryDetail from './components/EntryDetail';
import AssemblyList from './components/AssemblyList';
import AssemblyEditor from './components/AssemblyEditor';
import TypeEditor from './components/TypeEditor';
import StatusEditor from './components/StatusEditor';
import LabelEditor from './components/LabelEditor';
import RelationEditor from './components/RelationEditor';
import UserProfile from './components/UserProfile';
import LoadingSpinner from './components/LoadingSpinner';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AssemblyProvider } from './contexts/AssemblyContext';

// Services
import { authService } from './services/authService';
import { hasuraService } from './services/hasuraService';

// Protected Route component (bypassed for development)
const ProtectedRoute = ({ children }) => {
  // Skip authentication for development phase
  return children;
};

// Main App component
function AppContent() {
  const { theme } = useTheme();

  // Skip authentication check for development phase

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          
          <main className="flex-1">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/entries" element={
                <ProtectedRoute>
                  <EntryList />
                </ProtectedRoute>
              } />
              
              <Route path="/entries/:id" element={
                <ProtectedRoute>
                  <EntryDetail />
                </ProtectedRoute>
              } />
              
              <Route path="/assemblies" element={
                <ProtectedRoute>
                  <AssemblyList />
                </ProtectedRoute>
              } />
              
              <Route path="/assemblies/new" element={
                <ProtectedRoute>
                  <AssemblyEditor />
                </ProtectedRoute>
              } />
              
              <Route path="/assemblies/:id/edit" element={
                <ProtectedRoute>
                  <AssemblyEditor />
                </ProtectedRoute>
              } />
              
              <Route path="/assemblies/:id/view" element={
                <ProtectedRoute>
                  <AssemblyList />
                </ProtectedRoute>
              } />
              
              <Route path="/types" element={
                <ProtectedRoute>
                  <TypeEditor />
                </ProtectedRoute>
              } />
              
              <Route path="/statuses" element={
                <ProtectedRoute>
                  <StatusEditor />
                </ProtectedRoute>
              } />
              
              <Route path="/labels" element={
                <ProtectedRoute>
                  <LabelEditor />
                </ProtectedRoute>
              } />
              
              <Route path="/relations" element={
                <ProtectedRoute>
                  <RelationEditor />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </Router>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </div>
  );
}

// Main App with providers
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AssemblyProvider>
          <AppContent />
        </AssemblyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
