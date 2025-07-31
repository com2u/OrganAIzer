// File: /home/com2u/src/OrganAIzer/frontend/src/components/Header.js
// Purpose: Application header with navigation and user controls

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAssembly } from '../contexts/AssemblyContext';
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  HomeIcon,
  ListBulletIcon,
  AdjustmentsHorizontalIcon,
  TagIcon,
  FlagIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentAssembly } = useAssembly();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Entries', href: '/entries', icon: ListBulletIcon },
    { name: 'Assemblies', href: '/assemblies', icon: AdjustmentsHorizontalIcon },
    { name: 'Types', href: '/types', icon: TagIcon },
    { name: 'Statuses', href: '/statuses', icon: FlagIcon },
    { name: 'Labels', href: '/labels', icon: TagIcon },
    { name: 'Relations', href: '/relations', icon: LinkIcon },
  ];

  return (
    <header className="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/organaizer.svg"
                alt="OrganAIzer"
                className="h-8 w-8"
                onError={(e) => {
                  // Fallback to blue circle if SVG fails to load
                  e.target.outerHTML = `<div class="h-8 w-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center border-2 border-black"><span class="text-white font-bold text-lg font-mono">O</span></div>`;
                }}
              />
              <span className="text-xl font-bold">organAIzer.app</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Current Assembly */}
            {currentAssembly && (
              <div className="hidden lg:block">
                <span className="text-sm text-gray-600">Assembly:</span>
                <span className="ml-2 font-medium">{currentAssembly.name}</span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <MoonIcon className="h-5 w-5" />
              ) : (
                <SunIcon className="h-5 w-5" />
              )}
            </button>

            {/* User Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <UserCircleIcon className="h-6 w-6" />
                  <span className="hidden sm:block text-sm">{user.name || user.email}</span>
                </button>
              </div>
            )}

            {/* Settings */}
            <button
              onClick={() => navigate('/assemblies')}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>

            {/* Logout */}
            {user && (
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
