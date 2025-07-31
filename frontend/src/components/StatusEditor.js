// File: /home/com2u/src/OrganAIzer/frontend/src/components/StatusEditor.js
// Purpose: CRUD interface for managing entry statuses with color and icon picker

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

// FontAwesome icon options for statuses
const ICON_OPTIONS = [
  { value: 'fas fa-folder-open', label: 'Folder Open', icon: '📂' },
  { value: 'fas fa-check-circle', label: 'Check Circle', icon: '✅' },
  { value: 'fas fa-spinner', label: 'Spinner', icon: '⏳' },
  { value: 'fas fa-ban', label: 'Ban', icon: '🚫' },
  { value: 'fas fa-play-circle', label: 'Play', icon: '▶️' },
  { value: 'fas fa-pause-circle', label: 'Pause', icon: '⏸️' },
  { value: 'fas fa-stop-circle', label: 'Stop', icon: '⏹️' },
  { value: 'fas fa-clock', label: 'Clock', icon: '🕐' },
  { value: 'fas fa-hourglass', label: 'Hourglass', icon: '⏳' },
  { value: 'fas fa-flag', label: 'Flag', icon: '🚩' },
  { value: 'fas fa-flag-checkered', label: 'Checkered Flag', icon: '🏁' },
  { value: 'fas fa-exclamation-circle', label: 'Exclamation', icon: '❗' },
  { value: 'fas fa-question-circle', label: 'Question', icon: '❓' },
  { value: 'fas fa-info-circle', label: 'Info', icon: '🛈' },
  { value: 'fas fa-times-circle', label: 'Times Circle', icon: '❌' },
  { value: 'fas fa-dot-circle', label: 'Dot Circle', icon: '🔘' },
  { value: 'fas fa-circle', label: 'Circle', icon: '⚪' },
  { value: 'fas fa-square', label: 'Square', icon: '⬜' },
  { value: 'fas fa-star', label: 'Star', icon: '⭐' },
  { value: 'fas fa-heart', label: 'Heart', icon: '❤️' },
];

// Predefined color options
const COLOR_OPTIONS = [
  { value: '#54FF7E', label: 'Green', preview: '#54FF7E' },
  { value: '#4261FF', label: 'Blue', preview: '#4261FF' },
  { value: '#FFAC68', label: 'Orange', preview: '#FFAC68' },
  { value: '#686868', label: 'Gray', preview: '#686868' },
  { value: '#FF6B6B', label: 'Red', preview: '#FF6B6B' },
  { value: '#FFE66D', label: 'Yellow', preview: '#FFE66D' },
  { value: '#A8E6CF', label: 'Light Green', preview: '#A8E6CF' },
  { value: '#FFB3BA', label: 'Light Pink', preview: '#FFB3BA' },
  { value: '#BFBFFF', label: 'Light Blue', preview: '#BFBFFF' },
  { value: '#FFFFBA', label: 'Light Yellow', preview: '#FFFFBA' },
  { value: '#C7CEEA', label: 'Lavender', preview: '#C7CEEA' },
  { value: '#FFDAC1', label: 'Peach', preview: '#FFDAC1' },
];

const StatusEditor = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    status: '',
    description: '',
    color: '#54FF7E',
    icon: 'fas fa-folder-open'
  });

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const data = await hasuraService.getStatuses();
      setStatuses(data.statuses || []);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to load statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingStatus(null);
    setFormData({
      status: '',
      description: '',
      color: '#54FF7E',
      icon: 'fas fa-folder-open'
    });
  };

  const handleEdit = (status) => {
    setEditingStatus(status.status);
    setIsCreating(false);
    setFormData({
      status: status.status,
      description: status.description || '',
      color: status.color || '#54FF7E',
      icon: status.icon || 'fas fa-folder-open'
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingStatus(null);
    setFormData({
      status: '',
      description: '',
      color: '#54FF7E',
      icon: 'fas fa-folder-open'
    });
  };

  const handleSave = async () => {
    if (!formData.status.trim()) {
      toast.error('Status name is required');
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
        await hasuraService.createStatus(formData);
        toast.success('Status created successfully');
      } else {
        await hasuraService.updateStatus(editingStatus, formData);
        toast.success('Status updated successfully');
      }
      
      await loadStatuses();
      handleCancel();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (statusId) => {
    if (!window.confirm('Are you sure you want to delete this status? This action cannot be undone.')) {
      return;
    }

    try {
      await hasuraService.deleteStatus(statusId);
      toast.success('Status deleted successfully');
      await loadStatuses();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredStatuses = statuses.filter(status =>
    status.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    status.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Status Management</h1>
          <p className="mt-2 text-gray-600">
            Manage entry statuses with custom colors and icons
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary"
          disabled={isCreating || editingStatus}
        >
          <PlusIcon className="h-5 w-5 inline-block mr-2" />
          New Status
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search statuses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingStatus) && (
        <div className="card mb-6 bg-gradient-to-br from-pastel-green/20 to-pastel-cyan/20">
          <h3 className="text-lg font-bold mb-4">
            {isCreating ? 'Create New Status' : 'Edit Status'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status Name</label>
              <input
                type="text"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
                placeholder="Enter status name"
                disabled={editingStatus && !isCreating}
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
              placeholder="Enter status description"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2 mb-3">
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
                placeholder="#54FF7E"
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
          <button onClick={loadStatuses} className="mt-2 btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Statuses List */}
      <div className="space-y-4">
        {filteredStatuses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No statuses found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search.' : 'Get started by creating your first status.'}
            </p>
            {!searchTerm && (
              <button onClick={handleCreate} className="btn-primary">
                Create Status
              </button>
            )}
          </div>
        ) : (
          filteredStatuses.map((status) => (
            <div key={status.status} className="card card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border-2 border-black"
                      style={{ backgroundColor: status.color }}
                    />
                    <div className="text-2xl">
                      {ICON_OPTIONS.find(opt => opt.value === status.icon)?.icon || '📂'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{status.status}</h3>
                    <p className="text-gray-600">{status.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                      <span>Color: {status.color}</span>
                      <span>Icon: {status.icon}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(status)}
                    className="btn-secondary"
                    disabled={isCreating || editingStatus}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(status.status)}
                    className="btn-danger"
                    disabled={isCreating || editingStatus}
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
      {filteredStatuses.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredStatuses.length} of {statuses.length} statuses
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusEditor;
