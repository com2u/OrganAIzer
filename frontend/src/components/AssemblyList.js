// File: /home/com2u/src/OrganAIzer/frontend/src/components/AssemblyList.js
// Purpose: Display and manage list of assemblies

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { hasuraService } from '../services/hasuraService';
import { buildApiUrl } from '../config/api';
import LoadingSpinner from './LoadingSpinner';

const AssemblyList = () => {
  const [assemblies, setAssemblies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssemblies();
  }, []);

  const fetchAssemblies = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(buildApiUrl('/api/assemblies'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both response formats: {success: true, assemblies: [...]} and {assemblies: [...]}
      const assemblies = data.success ? data.assemblies : data.assemblies || [];
      
      if (assemblies) {
        setAssemblies(assemblies);
      } else {
        throw new Error(data.error || 'Failed to fetch assemblies');
      }
    } catch (error) {
      console.error('Error fetching assemblies:', error);
      setError(error.message);
      toast.error('Failed to load assemblies');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssembly = async (assemblyId, assemblyName) => {
    if (!window.confirm(`Are you sure you want to delete the assembly "${assemblyName}"?`)) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/api/assemblies/${assemblyId}`), {
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
        toast.success('Assembly deleted successfully');
        // Remove the deleted assembly from the list
        setAssemblies(assemblies.filter(assembly => assembly.id !== assemblyId));
      } else {
        throw new Error(data.error || 'Failed to delete assembly');
      }
    } catch (error) {
      console.error('Error deleting assembly:', error);
      toast.error('Failed to delete assembly');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchAssemblies}
            className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assemblies
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your assembly configurations and filters
          </p>
        </div>
        <Link
          to="/assemblies/new"
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg border-2 border-black hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
        >
          <i className="fas fa-plus mr-2"></i>
          Create Assembly
        </Link>
      </div>

      {/* Assembly List */}
      {assemblies.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-pastel-blue to-blue-200 border-2 border-black rounded-lg p-8 shadow-lg">
            <i className="fas fa-layer-group text-5xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Assemblies Found</h3>
            <p className="text-gray-600 mb-6">
              Create your first assembly to start organizing your entries with custom filters and views.
            </p>
            <Link
              to="/assemblies/new"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg border-2 border-black hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <i className="fas fa-plus mr-2"></i>
              Create Your First Assembly
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assemblies.map((assembly) => (
            <div
              key={assembly.id}
              className="bg-gradient-to-br from-pastel-blue to-blue-200 border-2 border-black rounded-lg p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Assembly Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {assembly.name}
                  </h3>
                  {assembly.description && (
                    <p className="text-gray-700 text-sm mb-3">
                      {assembly.description}
                    </p>
                  )}
                </div>
                {assembly.isdefault && (
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    DEFAULT
                  </span>
                )}
              </div>

              {/* Assembly Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sort Order:</span>
                  <span className="font-medium">{assembly.sortorder || 'Rank'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{formatDate(assembly.createdat)}</span>
                </div>
                {assembly.updatedat && assembly.updatedat !== assembly.createdat && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Updated:</span>
                    <span className="font-medium">{formatDate(assembly.updatedat)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Link
                  to={`/assemblies/${assembly.id}/view`}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-2 px-4 rounded-lg border-2 border-black hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg text-center text-sm"
                >
                  <i className="fas fa-eye mr-1"></i>
                  View
                </Link>
                <Link
                  to={`/assemblies/${assembly.id}/edit`}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold py-2 px-4 rounded-lg border-2 border-black hover:from-yellow-600 hover:to-yellow-700 transform hover:scale-105 transition-all duration-300 shadow-lg text-center text-sm"
                >
                  <i className="fas fa-edit mr-1"></i>
                  Edit
                </Link>
                <button
                  onClick={() => handleDeleteAssembly(assembly.id, assembly.name)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-2 px-4 rounded-lg border-2 border-black hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-300 shadow-lg text-sm"
                >
                  <i className="fas fa-trash mr-1"></i>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssemblyList;
