// File: /home/com2u/src/OrganAIzer/frontend/src/components/RelationEditor.js
// Purpose: CRUD interface for managing entry relations with color picker

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
  LinkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// Predefined color options for relations
const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Blue', preview: '#3B82F6' },
  { value: '#10B981', label: 'Green', preview: '#10B981' },
  { value: '#F59E0B', label: 'Orange', preview: '#F59E0B' },
  { value: '#EF4444', label: 'Red', preview: '#EF4444' },
  { value: '#8B5CF6', label: 'Purple', preview: '#8B5CF6' },
  { value: '#EC4899', label: 'Pink', preview: '#EC4899' },
  { value: '#06B6D4', label: 'Cyan', preview: '#06B6D4' },
  { value: '#84CC16', label: 'Lime', preview: '#84CC16' },
  { value: '#F97316', label: 'Orange', preview: '#F97316' },
  { value: '#6366F1', label: 'Indigo', preview: '#6366F1' },
  { value: '#14B8A6', label: 'Teal', preview: '#14B8A6' },
  { value: '#A855F7', label: 'Violet', preview: '#A855F7' },
  { value: '#64748B', label: 'Slate', preview: '#64748B' },
  { value: '#6B7280', label: 'Gray', preview: '#6B7280' },
  { value: '#78716C', label: 'Stone', preview: '#78716C' },
  { value: '#DC2626', label: 'Red', preview: '#DC2626' },
];

// Common relation types with descriptions
const RELATION_TEMPLATES = [
  {
    name: 'blocks',
    description: 'This entry blocks the completion of another entry',
    color: '#EF4444'
  },
  {
    name: 'blocked_by',
    description: 'This entry is blocked by another entry',
    color: '#F59E0B'
  },
  {
    name: 'depends_on',
    description: 'This entry depends on another entry',
    color: '#3B82F6'
  },
  {
    name: 'consists_of',
    description: 'This entry consists of multiple sub-entries',
    color: '#10B981'
  },
  {
    name: 'part_of',
    description: 'This entry is part of a larger entry',
    color: '#8B5CF6'
  },
  {
    name: 'relates_to',
    description: 'This entry is related to another entry',
    color: '#06B6D4'
  },
  {
    name: 'duplicates',
    description: 'This entry duplicates another entry',
    color: '#EC4899'
  },
  {
    name: 'supersedes',
    description: 'This entry supersedes another entry',
    color: '#84CC16'
  }
];

const RelationEditor = () => {
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRelation, setEditingRelation] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    loadRelations();
  }, []);

  const loadRelations = async () => {
    try {
      setLoading(true);
      const data = await hasuraService.getRelations();
      setRelations(data.relations || []);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to load relations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingRelation(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
  };

  const handleCreateFromTemplate = (template) => {
    setIsCreating(true);
    setEditingRelation(null);
    setFormData({
      name: template.name,
      description: template.description,
      color: template.color
    });
  };

  const handleEdit = (relation) => {
    setEditingRelation(relation.name);
    setIsCreating(false);
    setFormData({
      name: relation.name,
      description: relation.description || '',
      color: relation.color || '#3B82F6'
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingRelation(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Relation name is required');
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
        await hasuraService.createRelation(formData);
        toast.success('Relation created successfully');
      } else {
        await hasuraService.updateRelation(editingRelation, formData);
        toast.success('Relation updated successfully');
      }
      
      await loadRelations();
      handleCancel();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (relationId) => {
    if (!window.confirm('Are you sure you want to delete this relation? This action cannot be undone.')) {
      return;
    }

    try {
      await hasuraService.deleteRelation(relationId);
      toast.success('Relation deleted successfully');
      await loadRelations();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredRelations = relations.filter(relation =>
    relation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableTemplates = RELATION_TEMPLATES.filter(template =>
    !relations.some(relation => relation.name === template.name)
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relation Management</h1>
          <p className="mt-2 text-gray-600">
            Manage entry relationships and dependencies
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary"
          disabled={isCreating || editingRelation}
        >
          <PlusIcon className="h-5 w-5 inline-block mr-2" />
          New Relation
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search relations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Relation Templates */}
      {availableTemplates.length > 0 && !isCreating && !editingRelation && (
        <div className="card mb-6 bg-gradient-to-br from-pastel-cyan/20 to-pastel-blue/20">
          <h3 className="text-lg font-bold mb-4">Quick Templates</h3>
          <p className="text-gray-600 mb-4">
            Create common relation types with predefined settings
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {availableTemplates.map((template) => (
              <button
                key={template.name}
                onClick={() => handleCreateFromTemplate(template)}
                className="p-3 border-2 border-gray-300 rounded-lg hover:border-black transition-colors text-left"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: template.color }}
                  />
                  <span className="font-medium">{template.name}</span>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingRelation) && (
        <div className="card mb-6 bg-gradient-to-br from-pastel-purple/20 to-pastel-pink/20">
          <h3 className="text-lg font-bold mb-4">
            {isCreating ? 'Create New Relation' : 'Edit Relation'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Relation Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Enter relation name (e.g., blocks, depends_on)"
                disabled={editingRelation && !isCreating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use lowercase with underscores (e.g., depends_on, consists_of)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="grid grid-cols-8 gap-2 mb-3">
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
                  placeholder="#3B82F6"
                  pattern="^#[0-9A-F]{6}$"
                />
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="textarea-field"
              rows="3"
              placeholder="Describe what this relation means (e.g., 'This entry blocks the completion of another entry')"
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
          <button onClick={loadRelations} className="mt-2 btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Relations List */}
      <div className="space-y-4">
        {filteredRelations.length === 0 ? (
          <div className="text-center py-12">
            <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No relations found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search.' : 'Get started by creating your first relation or using a template.'}
            </p>
            {!searchTerm && (
              <button onClick={handleCreate} className="btn-primary">
                Create Relation
              </button>
            )}
          </div>
        ) : (
          filteredRelations.map((relation) => (
            <div key={relation.name} className="card card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded border-2 border-black"
                      style={{ backgroundColor: relation.color }}
                    />
                    <LinkIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{relation.name}</h3>
                    <p className="text-gray-600">{relation.description}</p>
                    <p className="text-sm text-gray-400 mt-1">Color: {relation.color}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(relation)}
                    className="btn-secondary"
                    disabled={isCreating || editingRelation}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(relation.name)}
                    className="btn-danger"
                    disabled={isCreating || editingRelation}
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
      {filteredRelations.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredRelations.length} of {relations.length} relations
          </p>
        </div>
      )}

      {/* Usage Examples */}
      {relations.length === 0 && !isCreating && !editingRelation && (
        <div className="card mt-6 bg-gradient-to-br from-gray-50 to-gray-100">
          <h3 className="text-lg font-bold mb-4">Common Relation Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Dependency Relations:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>depends_on</strong> - Entry A depends on Entry B</li>
                <li>• <strong>blocks</strong> - Entry A blocks Entry B</li>
                <li>• <strong>blocked_by</strong> - Entry A is blocked by Entry B</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Structural Relations:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>consists_of</strong> - Entry A consists of Entry B</li>
                <li>• <strong>part_of</strong> - Entry A is part of Entry B</li>
                <li>• <strong>relates_to</strong> - Entry A relates to Entry B</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationEditor;
