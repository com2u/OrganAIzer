// File: /home/com2u/src/OrganAIzer/frontend/src/components/TypeEditor.js
// Purpose: CRUD interface for managing entry types with FontAwesome icon picker

import React, { useState, useEffect } from 'react';
import { hasuraService } from '../services/hasuraService';
import LoadingSpinner from './LoadingSpinner';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// FontAwesome icon options for types
const ICON_OPTIONS = [
  { value: 'fas fa-info-circle', label: 'Info Circle', icon: '🛈' },
  { value: 'fas fa-tasks', label: 'Tasks', icon: '☑' },
  { value: 'fas fa-sticky-note', label: 'Sticky Note', icon: '📝' },
  { value: 'fas fa-toggle-on', label: 'Toggle', icon: '🔘' },
  { value: 'fas fa-lightbulb', label: 'Lightbulb', icon: '💡' },
  { value: 'fas fa-exclamation-triangle', label: 'Warning', icon: '⚠' },
  { value: 'fas fa-question-circle', label: 'Question', icon: '❓' },
  { value: 'fas fa-bell', label: 'Bell', icon: '🔔' },
  { value: 'fas fa-calendar', label: 'Calendar', icon: '📅' },
  { value: 'fas fa-clock', label: 'Clock', icon: '🕐' },
  { value: 'fas fa-flag', label: 'Flag', icon: '🚩' },
  { value: 'fas fa-star', label: 'Star', icon: '⭐' },
  { value: 'fas fa-bookmark', label: 'Bookmark', icon: '🔖' },
  { value: 'fas fa-tag', label: 'Tag', icon: '🏷' },
  { value: 'fas fa-paperclip', label: 'Paperclip', icon: '📎' },
  { value: 'fas fa-file-text', label: 'File Text', icon: '📄' },
  { value: 'fas fa-folder', label: 'Folder', icon: '📁' },
  { value: 'fas fa-archive', label: 'Archive', icon: '📦' },
  { value: 'fas fa-cog', label: 'Settings', icon: '⚙' },
  { value: 'fas fa-wrench', label: 'Wrench', icon: '🔧' },
];

const TypeEditor = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    icon: 'fas fa-info-circle'
  });

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const data = await hasuraService.getTypes();
      setTypes(data.types || []);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to load types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingType(null);
    setFormData({
      type: '',
      description: '',
      icon: 'fas fa-info-circle'
    });
  };

  const handleEdit = (type) => {
    setEditingType(type.type);
    setIsCreating(false);
    setFormData({
      type: type.type,
      description: type.description || '',
      icon: type.icon || 'fas fa-info-circle'
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingType(null);
    setFormData({
      type: '',
      description: '',
      icon: 'fas fa-info-circle'
    });
  };

  const handleSave = async () => {
    if (!formData.type.trim()) {
      toast.error('Type name is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    try {
      if (isCreating) {
        await hasuraService.createType(formData);
        toast.success('Type created successfully');
      } else {
        await hasuraService.updateType(editingType, formData);
        toast.success('Type updated successfully');
      }
      
      await loadTypes();
      handleCancel();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (typeId) => {
    if (!window.confirm('Are you sure you want to delete this type? This action cannot be undone.')) {
      return;
    }

    try {
      await hasuraService.deleteType(typeId);
      toast.success('Type deleted successfully');
      await loadTypes();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredTypes = types.filter(type =>
    type.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Type Management</h1>
          <p className="mt-2 text-gray-600">
            Manage entry types with custom icons and descriptions
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary"
          disabled={isCreating || editingType}
        >
          <PlusIcon className="h-5 w-5 inline-block mr-2" />
          New Type
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingType) && (
        <div className="card mb-6 bg-gradient-to-br from-pastel-blue/20 to-pastel-purple/20">
          <h3 className="text-lg font-bold mb-4">
            {isCreating ? 'Create New Type' : 'Edit Type'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type Name</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input-field"
                placeholder="Enter type name"
                disabled={editingType && !isCreating}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="select-field"
              >
                {ICON_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="textarea-field"
              rows="3"
              placeholder="Enter type description"
            />
          </div>
          
          <div className="flex space-x-3">
            <button onClick={handleSave} className="btn-success">
              <CheckIcon className="h-5 w-5 inline-block mr-2" />
              Save
            </button>
            <button onClick={handleCancel} className="btn-secondary">
              <XMarkIcon className="h-5 w-5 inline-block mr-2" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="card mb-6 bg-gradient-to-br from-pastel-red/20 to-pastel-pink/20">
          <p className="text-red-600">{error}</p>
          <button onClick={loadTypes} className="mt-2 btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Types List */}
      <div className="space-y-4">
        {filteredTypes.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No types found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search.' : 'Get started by creating your first type.'}
            </p>
            {!searchTerm && (
              <button onClick={handleCreate} className="btn-primary">
                Create Type
              </button>
            )}
          </div>
        ) : (
          filteredTypes.map((type) => (
            <div key={type.type} className="card card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {ICON_OPTIONS.find(opt => opt.value === type.icon)?.icon || '📄'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{type.type}</h3>
                    <p className="text-gray-600">{type.description}</p>
                    <p className="text-sm text-gray-400 mt-1">Icon: {type.icon}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(type)}
                    className="btn-secondary"
                    disabled={isCreating || editingType}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(type.type)}
                    className="btn-danger"
                    disabled={isCreating || editingType}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results Count */}
      {filteredTypes.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredTypes.length} of {types.length} types
          </p>
        </div>
      )}
    </div>
  );
};

export default TypeEditor;
