// File: /home/com2u/src/OrganAIzer/frontend/src/components/LabelEditor.js
// Purpose: CRUD interface for managing entry labels with color and icon picker

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
  TagIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// FontAwesome icon options for labels
const ICON_OPTIONS = [
  { value: 'fas fa-code', label: 'Code', icon: '💻' },
  { value: 'fas fa-briefcase', label: 'Briefcase', icon: '💼' },
  { value: 'fas fa-users', label: 'Users', icon: '👥' },
  { value: 'fas fa-chart-line', label: 'Chart Line', icon: '📈' },
  { value: 'fas fa-shopping-cart', label: 'Shopping Cart', icon: '🛒' },
  { value: 'fas fa-tag', label: 'Tag', icon: '🏷' },
  { value: 'fas fa-tags', label: 'Tags', icon: '🏷️' },
  { value: 'fas fa-bookmark', label: 'Bookmark', icon: '🔖' },
  { value: 'fas fa-star', label: 'Star', icon: '⭐' },
  { value: 'fas fa-heart', label: 'Heart', icon: '❤️' },
  { value: 'fas fa-flag', label: 'Flag', icon: '🚩' },
  { value: 'fas fa-bell', label: 'Bell', icon: '🔔' },
  { value: 'fas fa-lightbulb', label: 'Lightbulb', icon: '💡' },
  { value: 'fas fa-cog', label: 'Settings', icon: '⚙' },
  { value: 'fas fa-wrench', label: 'Wrench', icon: '🔧' },
  { value: 'fas fa-hammer', label: 'Hammer', icon: '🔨' },
  { value: 'fas fa-paint-brush', label: 'Paint Brush', icon: '🖌️' },
  { value: 'fas fa-palette', label: 'Palette', icon: '🎨' },
  { value: 'fas fa-graduation-cap', label: 'Graduation Cap', icon: '🎓' },
  { value: 'fas fa-book', label: 'Book', icon: '📚' },
  { value: 'fas fa-file-alt', label: 'File', icon: '📄' },
  { value: 'fas fa-folder', label: 'Folder', icon: '📁' },
  { value: 'fas fa-database', label: 'Database', icon: '🗄️' },
  { value: 'fas fa-server', label: 'Server', icon: '🖥️' },
  { value: 'fas fa-cloud', label: 'Cloud', icon: '☁️' },
  { value: 'fas fa-globe', label: 'Globe', icon: '🌐' },
  { value: 'fas fa-shield-alt', label: 'Shield', icon: '🛡️' },
  { value: 'fas fa-lock', label: 'Lock', icon: '🔒' },
  { value: 'fas fa-key', label: 'Key', icon: '🔑' },
  { value: 'fas fa-rocket', label: 'Rocket', icon: '🚀' },
];

// Predefined color options
const COLOR_OPTIONS = [
  { value: '#FFC138', label: 'Yellow', preview: '#FFC138' },
  { value: '#D13438', label: 'Red', preview: '#D13438' },
  { value: '#005FFF', label: 'Blue', preview: '#005FFF' },
  { value: '#FD8623', label: 'Orange', preview: '#FD8623' },
  { value: '#B6FF00', label: 'Green', preview: '#B6FF00' },
  { value: '#9C27B0', label: 'Purple', preview: '#9C27B0' },
  { value: '#E91E63', label: 'Pink', preview: '#E91E63' },
  { value: '#00BCD4', label: 'Cyan', preview: '#00BCD4' },
  { value: '#4CAF50', label: 'Green', preview: '#4CAF50' },
  { value: '#FF9800', label: 'Orange', preview: '#FF9800' },
  { value: '#795548', label: 'Brown', preview: '#795548' },
  { value: '#607D8B', label: 'Blue Grey', preview: '#607D8B' },
  { value: '#FF5722', label: 'Deep Orange', preview: '#FF5722' },
  { value: '#3F51B5', label: 'Indigo', preview: '#3F51B5' },
  { value: '#8BC34A', label: 'Light Green', preview: '#8BC34A' },
  { value: '#CDDC39', label: 'Lime', preview: '#CDDC39' },
];

const LabelEditor = () => {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLabel, setEditingLabel] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    color: '#FFC138',
    icon: 'fas fa-tag'
  });

  useEffect(() => {
    loadLabels();
  }, []);

  const loadLabels = async () => {
    try {
      setLoading(true);
      const data = await hasuraService.getLabels();
      setLabels(data.labels || []);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingLabel(null);
    setFormData({
      label: '',
      description: '',
      color: '#FFC138',
      icon: 'fas fa-tag'
    });
  };

  const handleEdit = (label) => {
    setEditingLabel(label.label);
    setIsCreating(false);
    setFormData({
      label: label.label,
      description: label.description || '',
      color: label.color || '#FFC138',
      icon: label.icon || 'fas fa-tag'
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingLabel(null);
    setFormData({
      label: '',
      description: '',
      color: '#FFC138',
      icon: 'fas fa-tag'
    });
  };

  const handleSave = async () => {
    if (!formData.label.trim()) {
      toast.error('Label name is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    if (!formData.color.match(/^#[0-9A-F]{6}$/i)) {
      toast.error('Please provide a valid hex color code');
      return;
    }

    try {
      if (isCreating) {
        await hasuraService.createLabel(formData);
        toast.success('Label created successfully');
      } else {
        await hasuraService.updateLabel(editingLabel, formData);
        toast.success('Label updated successfully');
      }
      
      await loadLabels();
      handleCancel();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (labelId) => {
    if (!window.confirm('Are you sure you want to delete this label? This action cannot be undone.')) {
      return;
    }

    try {
      await hasuraService.deleteLabel(labelId);
      toast.success('Label deleted successfully');
      await loadLabels();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredLabels = labels.filter(label =>
    label.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    label.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Label Management</h1>
          <p className="mt-2 text-gray-600">
            Manage entry labels with custom colors and icons
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary"
          disabled={isCreating || editingLabel}
        >
          <PlusIcon className="h-5 w-5 inline-block mr-2" />
          New Label
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search labels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingLabel) && (
        <div className="card mb-6 bg-gradient-to-br from-pastel-orange/20 to-pastel-yellow/20">
          <h3 className="text-lg font-bold mb-4">
            {isCreating ? 'Create New Label' : 'Edit Label'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Label Name</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="input-field"
                placeholder="Enter label name"
                disabled={editingLabel && !isCreating}
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
              placeholder="Enter label description"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="grid grid-cols-8 md:grid-cols-16 gap-2 mb-3">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded border-2 ${
                    formData.color === color.value ? 'border-black' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.preview }}
                  title={color.label}
                />
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-8 border-2 border-black rounded"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="input-field flex-1"
                placeholder="#FFC138"
                pattern="^#[0-9A-F]{6}$"
              />
            </div>
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
          <button onClick={loadLabels} className="mt-2 btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Labels List */}
      <div className="space-y-4">
        {filteredLabels.length === 0 ? (
          <div className="text-center py-12">
            <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No labels found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search.' : 'Get started by creating your first label.'}
            </p>
            {!searchTerm && (
              <button onClick={handleCreate} className="btn-primary">
                Create Label
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLabels.map((label) => (
              <div key={label.label} className="card card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: label.color }}
                    >
                      {ICON_OPTIONS.find(opt => opt.value === label.icon)?.icon || '🏷'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{label.label}</h3>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(label)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      disabled={isCreating || editingLabel}
                      title="Edit label"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(label.label)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      disabled={isCreating || editingLabel}
                      title="Delete label"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{label.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Color: {label.color}</span>
                  <span>Icon: {label.icon}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      {filteredLabels.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredLabels.length} of {labels.length} labels
          </p>
        </div>
      )}
    </div>
  );
};

export default LabelEditor;
