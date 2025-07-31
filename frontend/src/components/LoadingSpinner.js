// File: /home/com2u/src/OrganAIzer/frontend/src/components/LoadingSpinner.js
// Purpose: Loading spinner component for async operations

import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`spinner ${sizeClasses[size]}`}></div>
      {message && (
        <p className="mt-4 text-sm text-gray-600 font-mono">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
