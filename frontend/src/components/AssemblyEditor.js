// File: /home/com2u/src/OrganAIzer/frontend/src/components/AssemblyEditor.js
// Purpose: Complete Assembly filter management with include/exclude lists and AND filters

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hasuraService } from '../services/hasuraService';
import { useAuth } from '../contexts/AuthContext';
import { useAssembly } from '../contexts/AssemblyContext';
import { buildApiUrl } from '../config/api';
import LoadingSpinner from './LoadingSpinner';
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  EyeSlashIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  StarIcon,
  HandThumbUpIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const AssemblyEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentAssembly } = useAssembly();
  
  const [assembly, setAssembly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 'Rank'
  });
  
  // Include/Exclude lists
  const [includeList, setIncludeList] = useState([]);
  const [excludeList, setExcludeList] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    date: { enabled: false, visible: true, from: '', to: '' },
    type: { enabled: false, visible: true, values: [] },
    label: { enabled: false, visible: true, values: [] },
    status: { enabled: false, visible: true, values: [] },
    voting: { enabled: false, visible: true, minimum: 0 },
    stars: { enabled: false, visible: true, minimum: 0 },
    users: { enabled: false, visible: true, values: [] },
    permissions: { enabled: false, visible: true, values: [] }
  });
  
  // Metadata
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [labels, setLabels] = useState([]);
  const [users, setUsers] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  
  // Search states
  const [entrySearch, setEntrySearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadAssembly();
    } else {
      // New assembly mode
      setLoading(false);
    }
    loadMetadata();
  }, [id]);

  const loadAssembly = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`/api/assemblies/${id}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load assembly');
      }
      setAssembly(data.assembly);
      setFormData({
        name: data.assembly.name,
        description: data.assembly.description || '',
        sortOrder: data.assembly.sortOrder || 'Rank'
      });
      setIncludeList(data.assembly.includes || []);
      setExcludeList(data.assembly.excludes || []);
      
      // Parse filters
      const assemblyFilters = data.assembly.filters || {};
      const newFilters = { ...filters };
      
      // Convert filters object to array format for processing
      const filterArray = [];
      Object.entries(assemblyFilters).forEach(([filterType, filterValues]) => {
        if (Array.isArray(filterValues)) {
          filterValues.forEach(filterValue => {
            filterArray.push({
              filterType: filterType,
              value: typeof filterValue === 'object' ? filterValue.value : filterValue,
              visibleInView: typeof filterValue === 'object' ? filterValue.visible : true
            });
          });
        }
      });
      
      filterArray.forEach(filter => {
        switch (filter.filterType) {
          case 'Date':
            const [from, to] = filter.value.split('|');
            newFilters.date = {
              enabled: true,
              visible: filter.visibleInView,
              from: from || '',
              to: to || ''
            };
            break;
          case 'Type':
            newFilters.type = {
              enabled: true,
              visible: filter.visibleInView,
              values: filter.value.split(',')
            };
            break;
          case 'Label':
            newFilters.label = {
              enabled: true,
              visible: filter.visibleInView,
              values: filter.value.split(',')
            };
            break;
          case 'Status':
            newFilters.status = {
              enabled: true,
              visible: filter.visibleInView,
              values: filter.value.split(',')
            };
            break;
          case 'Voting':
            newFilters.voting = {
              enabled: true,
              visible: filter.visibleInView,
              minimum: parseInt(filter.value)
            };
            break;
          case 'Stars':
            newFilters.stars = {
              enabled: true,
              visible: filter.visibleInView,
              minimum: parseInt(filter.value)
            };
            break;
          case 'Users':
            newFilters.users = {
              enabled: true,
              visible: filter.visibleInView,
              values: filter.value.split(',')
            };
            break;
          case 'Permissions':
            newFilters.permissions = {
              enabled: true,
              visible: filter.visibleInView,
              values: filter.value.split(',')
            };
            break;
        }
      });
      
      setFilters(newFilters);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to load assembly');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [typesData, statusesData, labelsData, usersData, permissionsData] = await Promise.all([
        hasuraService.getTypes(),
        hasuraService.getStatuses(),
        hasuraService.getLabels(),
        hasuraService.getUsers(),
        hasuraService.getPermissionGroups()
      ]);
      
      setTypes(typesData.types || []);
      setStatuses(statusesData.statuses || []);
      setLabels(labelsData.labels || []);
      setUsers(usersData.users || []);
      setPermissionGroups(permissionsData.permissionGroups || []);
    } catch (error) {
      toast.error('Failed to load metadata');
    }
  };

  const searchEntries = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const data = await hasuraService.searchEntries(searchTerm);
      setSearchResults(data.entries || []);
    } catch (error) {
      toast.error('Failed to search entries');
    } finally {
      setSearchLoading(false);
    }
  };

  const addToIncludeList = (entry) => {
    if (!includeList.find(e => e.key === entry.key)) {
      setIncludeList([...includeList, entry]);
    }
    setEntrySearch('');
    setSearchResults([]);
  };

  const removeFromIncludeList = (entryKey) => {
    setIncludeList(includeList.filter(e => e.key !== entryKey));
  };

  const addToExcludeList = (entry) => {
    if (!excludeList.find(e => e.key === entry.key)) {
      setExcludeList([...excludeList, entry]);
    }
    setEntrySearch('');
    setSearchResults([]);
  };

  const removeFromExcludeList = (entryKey) => {
    setExcludeList(excludeList.filter(e => e.key !== entryKey));
  };

  const updateFilter = (filterType, updates) => {
    setFilters({
      ...filters,
      [filterType]: {
        ...filters[filterType],
        ...updates
      }
    });
  };

  const addFilterValue = (filterType, value) => {
    const currentValues = filters[filterType].values || [];
    if (!currentValues.includes(value)) {
      updateFilter(filterType, {
        values: [...currentValues, value]
      });
    }
  };

  const removeFilterValue = (filterType, value) => {
    const currentValues = filters[filterType].values || [];
    updateFilter(filterType, {
      values: currentValues.filter(v => v !== value)
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Assembly name is required');
      return;
    }

    try {
      setSaving(true);
      // Prepare filters as an object keyed by filterType
      const filtersData = {};
      Object.entries(filters).forEach(([filterType, config]) => {
        if (config.enabled) {
          let value;
          switch (filterType) {
            case 'date':
              value = `${config.from}|${config.to}`;
              break;
            case 'voting':
            case 'stars':
              value = config.minimum.toString();
              break;
            default:
              value = (config.values || []).join(',');
          }
          if (value) {
            const key = filterType.charAt(0).toUpperCase() + filterType.slice(1);
            if (!filtersData[key]) {
              filtersData[key] = [];
            }
            filtersData[key].push({
              value,
              visible: config.visible
            });
          }
        }
      });

      const assemblyData = {
        ...formData,
        includes: includeList.map(e => e.key),
        excludes: excludeList.map(e => e.key),
        filters: filtersData
      };

      let response;
      if (id) {
        response = await fetch(buildApiUrl(`/api/assemblies/${id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assemblyData),
        });
      } else {
        response = await fetch(buildApiUrl('/api/assemblies'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assemblyData),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save assembly');
      }

      const savedAssembly = data.assembly;
      
      if (id) {
        toast.success('Assembly updated successfully');
      } else {
        toast.success('Assembly created successfully');
        navigate(`/assemblies/${savedAssembly.id}/edit`);
      }
      
      setAssembly(savedAssembly);
      setCurrentAssembly(savedAssembly);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this assembly? This action cannot be undone.')) {
      return;
    }

    try {
      await hasuraService.deleteAssembly(id);
      toast.success('Assembly deleted successfully');
      navigate('/assemblies');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card bg-gradient-to-br from-pastel-red/20 to-pastel-pink/20">
          <p className="text-red-600">{error}</p>
          <button onClick={() => navigate('/assemblies')} className="mt-4 btn-secondary">
            Back to Assemblies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Edit Assembly' : 'Create Assembly'}
          </h1>
          <p className="mt-2 text-gray-600">
            Configure filters and entry lists for your assembly view
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            className="btn-success"
            disabled={saving}
          >
            <CheckIcon className="h-5 w-5 inline-block mr-2" />
            {saving ? 'Saving...' : 'Save Assembly'}
          </button>
          
          {id && (
            <button
              onClick={handleDelete}
              className="btn-danger"
            >
              <TrashIcon className="h-5 w-5 inline-block mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Assembly Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter assembly name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea-field"
                  rows="3"
                  placeholder="Optional description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Sort Order</label>
                <select
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  className="select-field"
                >
                  <option value="Rank">Rank</option>
                  <option value="Voting">Voting</option>
                  <option value="Stars">Stars</option>
                  <option value="Type">Type</option>
                  <option value="Status">Status</option>
                  <option value="CreatedAt">Created Date</option>
                  <option value="UpdatedAt">Updated Date</option>
                </select>
              </div>
            </div>
          </div>

          {/* Include/Exclude Lists */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Entry Lists</h3>
            
            {/* Entry Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Search Entries</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={entrySearch}
                  onChange={(e) => {
                    setEntrySearch(e.target.value);
                    searchEntries(e.target.value);
                  }}
                  className="input-field pl-10"
                  placeholder="Search entries to add..."
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-2 border-2 border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {searchResults.map(entry => (
                    <div key={entry.key} className="p-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{entry.title}</h4>
                          <p className="text-sm text-gray-600">{entry.type} - {entry.status}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => addToIncludeList(entry)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                          >
                            Include
                          </button>
                          <button
                            onClick={() => addToExcludeList(entry)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                          >
                            Exclude
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Include List */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Always Include ({includeList.length})</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {includeList.map(entry => (
                  <div key={entry.key} className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm">{entry.title}</span>
                    <button
                      onClick={() => removeFromIncludeList(entry.key)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exclude List */}
            <div>
              <h4 className="font-medium mb-2">Always Exclude ({excludeList.length})</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {excludeList.map(entry => (
                  <div key={entry.key} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm">{entry.title}</span>
                    <button
                      onClick={() => removeFromExcludeList(entry.key)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <FunnelIcon className="h-6 w-6 text-gray-600" />
              <h3 className="text-lg font-bold">AND Filters</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              All enabled filters must match for an entry to be shown. Uncheck visibility to hide the column while keeping the filter active.
            </p>

            {/* Date Filter */}
            <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={filters.date.enabled}
                    onChange={(e) => updateFilter('date', { enabled: e.target.checked })}
                  />
                  <CalendarIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Date Range</span>
                </div>
                <button
                  onClick={() => updateFilter('date', { visible: !filters.date.visible })}
                  className={`p-1 rounded ${filters.date.visible ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {filters.date.visible ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                </button>
              </div>
              
              {filters.date.enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">From</label>
                    <input
                      type="date"
                      value={filters.date.from}
                      onChange={(e) => updateFilter('date', { from: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">To</label>
                    <input
                      type="date"
                      value={filters.date.to}
                      onChange={(e) => updateFilter('date', { to: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Type Filter */}
            <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={filters.type.enabled}
                    onChange={(e) => updateFilter('type', { enabled: e.target.checked })}
                  />
                  <TagIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Types</span>
                </div>
                <button
                  onClick={() => updateFilter('type', { visible: !filters.type.visible })}
                  className={`p-1 rounded ${filters.type.visible ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {filters.type.visible ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                </button>
              </div>
              
              {filters.type.enabled && (
                <div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addFilterValue('type', e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="select-field text-sm mb-2"
                  >
                    <option value="">Add type</option>
                    {types.filter(type => !filters.type.values.includes(type.type)).map(type => (
                      <option key={type.type} value={type.type}>
                        {type.type}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex flex-wrap gap-2">
                    {filters.type.values.map(value => (
                      <span key={value} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {value}
                        <button
                          onClick={() => removeFilterValue('type', value)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={filters.status.enabled}
                    onChange={(e) => updateFilter('status', { enabled: e.target.checked })}
                  />
                  <span className="font-medium">Status</span>
                </div>
                <button
                  onClick={() => updateFilter('status', { visible: !filters.status.visible })}
                  className={`p-1 rounded ${filters.status.visible ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {filters.status.visible ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                </button>
              </div>
              
              {filters.status.enabled && (
                <div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addFilterValue('status', e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="select-field text-sm mb-2"
                  >
                    <option value="">Add status</option>
                    {statuses.filter(status => !filters.status.values.includes(status.status)).map(status => (
                      <option key={status.status} value={status.status}>
                        {status.status}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex flex-wrap gap-2">
                    {filters.status.values.map(value => (
                      <span key={value} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        {value}
                        <button
                          onClick={() => removeFilterValue('status', value)}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Voting Filter */}
            <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={filters.voting.enabled}
                    onChange={(e) => updateFilter('voting', { enabled: e.target.checked })}
                  />
                  <HandThumbUpIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Minimum Votes</span>
                </div>
                <button
                  onClick={() => updateFilter('voting', { visible: !filters.voting.visible })}
                  className={`p-1 rounded ${filters.voting.visible ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {filters.voting.visible ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                </button>
              </div>
              
              {filters.voting.enabled && (
                <input
                  type="number"
                  value={filters.voting.minimum}
                  onChange={(e) => updateFilter('voting', { minimum: parseInt(e.target.value) || 0 })}
                  className="input-field text-sm"
                  placeholder="Minimum vote count"
                />
              )}
            </div>

            {/* Stars Filter */}
            <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={filters.stars.enabled}
                    onChange={(e) => updateFilter('stars', { enabled: e.target.checked })}
                  />
                  <StarIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Minimum Stars</span>
                </div>
                <button
                  onClick={() => updateFilter('stars', { visible: !filters.stars.visible })}
                  className={`p-1 rounded ${filters.stars.visible ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {filters.stars.visible ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                </button>
              </div>
              
              {filters.stars.enabled && (
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.stars.minimum}
                  onChange={(e) => updateFilter('stars', { minimum: parseFloat(e.target.value) || 0 })}
                  className="input-field text-sm"
                  placeholder="Minimum star rating"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssemblyEditor;
