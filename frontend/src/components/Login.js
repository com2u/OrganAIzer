// File: /home/com2u/src/OrganAIzer/frontend/src/components/Login.js
// Purpose: Login page with Entra ID authentication

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-blue/20 to-pastel-purple/20">
      <div className="max-w-md w-full mx-4">
        <div className="card card-hover">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-pastel-blue rounded-full flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-black" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Welcome to OrganAIzer
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in with your Microsoft account to continue
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={handleLogin}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <span>Sign in with Microsoft</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Secure authentication</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <a href="/terms" className="font-medium text-pastel-blue hover:text-pastel-purple">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="font-medium text-pastel-blue hover:text-pastel-purple">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            New to OrganAIzer?{' '}
            <a 
              href="https://organaizer.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-pastel-blue hover:text-pastel-purple"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
