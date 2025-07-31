// File: /home/com2u/src/OrganAIzer/frontend/src/contexts/AssemblyContext.js
// Purpose: Assembly context for managing filtered views and assemblies

import React, { createContext, useContext, useState, useEffect } from 'react';
import { hasuraService } from '../services/hasuraService';
import { buildApiUrl } from '../config/api';

const AssemblyContext = createContext();

export const useAssembly = () => {
  const context = useContext(AssemblyContext);
  if (!context) {
    throw new Error('useAssembly must be used within an AssemblyProvider');
  }
  return context;
};

export const AssemblyProvider = ({ children }) => {
  const [assemblies, setAssemblies] = useState([]);
  const [currentAssembly, setCurrentAssembly] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load assemblies on mount
  useEffect(() => {
    loadAssemblies();
  }, []);

  const loadAssemblies = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(buildApiUrl('/api/assemblies'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      // Handle 304 Not Modified responses
      if (response.status === 304) {
        // Data hasn't changed, keep current assemblies
        console.log('Assemblies data not modified (304), keeping current data');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both response formats: {success: true, assemblies: [...]} and {assemblies: [...]}
      const assemblies = data.success ? data.assemblies : data.assemblies || [];
      
      if (assemblies) {
        setAssemblies(assemblies);
        
        // Set default assembly if none selected
        if (!currentAssembly && assemblies.length > 0) {
          setCurrentAssembly(assemblies[0]);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch assemblies');
      }
    } catch (error) {
      console.error('Error loading assemblies:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAssemblyEntries = async (assemblyId) => {
    try {
      setLoading(true);
      const data = await hasuraService.getAssemblyEntries(assemblyId);
      setEntries(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createAssembly = async (assemblyData) => {
    try {
      const response = await fetch(buildApiUrl('/api/assemblies'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assemblyData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const newAssembly = data.assembly;
        setAssemblies([...assemblies, newAssembly]);
        return newAssembly;
      } else {
        throw new Error(data.error || 'Failed to create assembly');
      }
    } catch (error) {
      throw error;
    }
  };

  const updateAssembly = async (id, assemblyData) => {
    try {
      const response = await fetch(buildApiUrl(`/api/assemblies/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assemblyData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const updatedAssembly = data.assembly;
        setAssemblies(assemblies.map(a => a.id === id ? updatedAssembly : a));
        
        if (currentAssembly?.id === id) {
          setCurrentAssembly(updatedAssembly);
        }
        
        return updatedAssembly;
      } else {
        throw new Error(data.error || 'Failed to update assembly');
      }
    } catch (error) {
      throw error;
    }
  };

  const deleteAssembly = async (id) => {
    try {
      const response = await fetch(buildApiUrl(`/api/assemblies/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAssemblies(assemblies.filter(a => a.id !== id));
        
        if (currentAssembly?.id === id) {
          const nextAssembly = assemblies.find(a => a.id !== id) || null;
          setCurrentAssembly(nextAssembly);
        }
      } else {
        throw new Error(data.error || 'Failed to delete assembly');
      }
    } catch (error) {
      throw error;
    }
  };

  const setCurrentAssemblyAndLoad = async (assembly) => {
    setCurrentAssembly(assembly);
    if (assembly) {
      await loadAssemblyEntries(assembly.id);
    }
  };

  const refreshCurrentAssembly = async () => {
    if (currentAssembly) {
      await loadAssemblyEntries(currentAssembly.id);
    }
  };

  const value = {
    assemblies,
    currentAssembly,
    entries,
    loading,
    error,
    loadAssemblies,
    loadAssemblyEntries,
    createAssembly,
    updateAssembly,
    deleteAssembly,
    setCurrentAssembly: setCurrentAssemblyAndLoad,
    refreshCurrentAssembly,
  };

  return (
    <AssemblyContext.Provider value={value}>
      {children}
    </AssemblyContext.Provider>
  );
};
