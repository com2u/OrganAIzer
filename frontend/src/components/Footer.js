// File: /home/com2u/src/OrganAIzer/frontend/src/components/Footer.js
// Purpose: Application footer with links and copyright

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img
                src="/organaizer.svg"
                alt="OrganAIzer"
                className="h-8 w-8"
                onError={(e) => {
                  // Fallback to blue circle if SVG fails to load
                  e.target.outerHTML = `<div class="h-8 w-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center border-2 border-black"><span class="text-white font-bold text-lg font-mono">O</span></div>`;
                }}
              />
              <span className="text-lg font-bold">organAIzer.app</span>
            </div>
            <p className="text-sm text-gray-600">
              Collaborative meeting and task management platform. 
              Organize, structure, and execute meetings with AI-powered insights.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/entries" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Entries
                </Link>
              </li>
              <li>
                <Link to="/assemblies" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Assemblies
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/com2u/OrganAIzer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@organaizer.app"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a 
                  href="https://organaizer.app/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a 
                  href="https://organaizer.app/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            © {currentYear} OrganAIzer.App. All rights reserved. 
            Built with React, Tailwind CSS, and Hasura GraphQL.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
