// File: /home/com2u/src/OrganAIzer/frontend/src/components/SearchDialog.js
// Purpose: Modal dialogs for entry search and selection

import React, { useState, useEffect, useRef } from 'react';
import { hasuraService } from '../services/hasuraService';
import LoadingSpinner from './LoadingSpinner';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  FunnelIcon,
  TagIcon,
  CalendarIcon,
  StarIcon,
  HandThumbUpIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

const SearchDialog = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  multiSelect = false, 
  selectedEntries = [], 
  title = 'Search Entries',
  excludeEntries = [],
  filters = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(selectedEntries);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState({
    types: [],
    statuses: [],
    labels: [],
    dateFrom: '',
    dateTo: '',
    minStars: 0,
    minVotes: 0,
    hasContent: null,
    ...filters
  });
  
  // Metadata for filters
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [labels, setLabels] = useState([]);
  
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadEntries();
      loadMetadata();
      setSelectedItems(selectedEntries);
      // Focus search input when dialog opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, selectedEntries]);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, advancedFilters]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await hasuraService.getAllEntries();
      const filteredData = data.entries.filter(entry => 
        !excludeEntries.includes(entry.key)
      );
      setEntries(filteredData || []);
    } catch (error) {
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [typesData, statusesData, labelsData] = await Promise.all([
        hasuraService.getTypes(),
        hasuraService.getStatuses(),
        hasuraService.getLabels()
      ]);
      
      setTypes(typesData.types || []);
      setStatuses(statusesData.statuses || []);
      setLabels(labelsData.labels || []);
    } catch (error) {
      console.error('Failed to load metadata:', error);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    // Text search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(term) ||
        entry.content.toLowerCase().includes(term) ||
        (entry.labels || []).some(label => 
          label.name.toLowerCase().includes(term)
        )
      );
    }

    // Advanced filters
    if (advancedFilters.types.length > 0) {
      filtered = filtered.filter(entry => 
        advancedFilters.types.includes(entry.type)
      );
    }

    if (advancedFilters.statuses.length > 0) {
      filtered = filtered.filter(entry => 
        advancedFilters.statuses.includes(entry.status)
      );
    }

    if (advancedFilters.labels.length > 0) {
      filtered = filtered.filter(entry => 
        (entry.labels || []).some(label => 
          advancedFilters.labels.includes(label.name)
        )
      );
    }

    if (advancedFilters.dateFrom) {
      filtered = filtered.filter(entry => 
        new Date(entry.updatedAt) >= new Date(advancedFilters.dateFrom)
      );
    }

    if (advancedFilters.dateTo) {
      filtered = filtered.filter(entry => 
        new Date(entry.updatedAt) <= new Date(advancedFilters.dateTo)
      );
    }

    if (advancedFilters.minStars > 0) {
      filtered = filtered.filter(entry => 
        (entry.stars || 0) >= advancedFilters.minStars
      );
    }

    if (advancedFilters.minVotes > 0) {
      filtered = filtered.filter(entry => 
        (entry.totalVotes || 0) >= advancedFilters.minVotes
      );
    }

    if (advancedFilters.hasContent !== null) {
      filtered = filtered.filter(entry => 
        advancedFilters.hasContent 
          ? entry.content && entry.content.trim().length > 0
          : !entry.content || entry.content.trim().length === 0
      );
    }

    setFilteredEntries(filtered);
  };

  const handleSelect = (entry) => {
    if (multiSelect) {
      setSelectedItems(prev => 
        prev.includes(entry.key)
          ? prev.filter(key => key !== entry.key)
          : [...prev, entry.key]
      );
    } else {
      onSelect(entry);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (multiSelect) {
      const selectedEntryObjects = entries.filter(entry => 
        selectedItems.includes(entry.key)
      );
      onSelect(selectedEntryObjects);
    }
    onClose();
  };

  const handleFilterChange = (filterType, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleMultiSelectFilter = (filterType, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearFilters = () => {
    setAdvancedFilters({
      types: [],
      statuses: [],
      labels: [],
      dateFrom: '',
      dateTo: '',
      minStars: 0,
      minVotes: 0,
      hasContent: null
    });
    setSearchTerm('');
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i}>
          {i <= rating ? (
            <StarIconSolid className="h-3 w-3 text-yellow-400" />
          ) : (
            <StarIcon className="h-3 w-3 text-gray-300" />
          )}
        </span>
      );
    }
    return stars;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Input */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search entries by title, content, or labels..."
              className="input-field pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="btn-secondary text-sm"
            >
              <FunnelIcon className="h-4 w-4 inline-block mr-2" />
              Advanced Filters
              {Object.values(advancedFilters).some(v => 
                Array.isArray(v) ? v.length > 0 : v !== '' && v !== 0 && v !== null
              ) && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </button>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{filteredEntries.length} of {entries.length} entries</span>
              {multiSelect && selectedItems.length > 0 && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {selectedItems.length} selected
                </span>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="card bg-gray-50 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Advanced Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Types */}
                <div>
                  <label className="block text-sm font-medium mb-2">Types</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {types.map(type => (
                      <label key={type.type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedFilters.types.includes(type.type)}
                          onChange={() => handleMultiSelectFilter('types', type.type)}
                          className="mr-2"
                        />
                        <span className="text-sm">{type.type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Statuses */}
                <div>
                  <label className="block text-sm font-medium mb-2">Statuses</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {statuses.map(status => (
                      <label key={status.status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedFilters.statuses.includes(status.status)}
                          onChange={() => handleMultiSelectFilter('statuses', status.status)}
                          className="mr-2"
                        />
                        <span className="text-sm">{status.status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <label className="block text-sm font-medium mb-2">Labels</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {labels.map(label => (
                      <label key={label.name} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedFilters.labels.includes(label.name)}
                          onChange={() => handleMultiSelectFilter('labels', label.name)}
                          className="mr-2"
                        />
                        <span className="text-sm">{label.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Date From</label>
                  <input
                    type="date"
                    value={advancedFilters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date To</label>
                  <input
                    type="date"
                    value={advancedFilters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                {/* Ratings */}
                <div>
                  <label className="block text-sm font-medium mb-2">Min Stars</label>
                  <select
                    value={advancedFilters.minStars}
                    onChange={(e) => handleFilterChange('minStars', parseInt(e.target.value))}
                    className="select-field text-sm"
                  >
                    <option value={0}>Any</option>
                    <option value={1}>1+ Stars</option>
                    <option value={2}>2+ Stars</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={5}>5 Stars</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Min Votes</label>
                  <input
                    type="number"
                    value={advancedFilters.minVotes}
                    onChange={(e) => handleFilterChange('minVotes', parseInt(e.target.value) || 0)}
                    className="input-field text-sm"
                    min="0"
                  />
                </div>

                {/* Content Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <select
                    value={advancedFilters.hasContent === null ? '' : advancedFilters.hasContent.toString()}
                    onChange={(e) => handleFilterChange('hasContent', 
                      e.target.value === '' ? null : e.target.value === 'true'
                    )}
                    className="select-field text-sm"
                  >
                    <option value="">Any</option>
                    <option value="true">Has Content</option>
                    <option value="false">No Content</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {searchTerm || Object.values(advancedFilters).some(v => 
                    Array.isArray(v) ? v.length > 0 : v !== '' && v !== 0 && v !== null
                  ) ? 'No entries match your search criteria' : 'No entries found'}
                </div>
              ) : (
                filteredEntries.map(entry => (
                  <div
                    key={entry.key}
                    className={`p-4 border-2 border-black rounded-lg cursor-pointer transition-all duration-200 ${
                      multiSelect && selectedItems.includes(entry.key)
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelect(entry)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {multiSelect && (
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(entry.key)}
                              onChange={() => handleSelect(entry)}
                              className="mr-2"
                            />
                          )}
                          <h3 className="font-medium text-lg">{entry.title}</h3>
                          <span className="badge badge-blue text-xs">{entry.type}</span>
                          <span 
                            className="badge text-xs"
                            style={{ backgroundColor: entry.statusColor || '#gray' }}
                          >
                            {entry.status}
                          </span>
                        </div>
                        
                        {entry.content && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {entry.content.substring(0, 150)}
                            {entry.content.length > 150 && '...'}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Updated: {new Date(entry.updatedAt).toLocaleDateString()}</span>
                          
                          {(entry.stars || 0) > 0 && (
                            <div className="flex items-center space-x-1">
                              <div className="flex">
                                {renderStars(entry.stars || 0)}
                              </div>
                              <span>{entry.stars}</span>
                            </div>
                          )}
                          
                          {(entry.totalVotes || 0) !== 0 && (
                            <div className="flex items-center space-x-1">
                              <HandThumbUpIcon className="h-3 w-3" />
                              <span>{entry.totalVotes || 0}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        {(entry.labels || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-end">
                            {(entry.labels || []).slice(0, 3).map(label => (
                              <span
                                key={label.name}
                                className="badge text-xs"
                                style={{ backgroundColor: label.color }}
                              >
                                {label.name}
                              </span>
                            ))}
                            {(entry.labels || []).length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{(entry.labels || []).length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-300">
          <div className="text-sm text-gray-600">
            {multiSelect ? (
              `${selectedItems.length} of ${filteredEntries.length} entries selected`
            ) : (
              `${filteredEntries.length} entries found`
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            
            {multiSelect && (
              <button
                onClick={handleConfirmSelection}
                className="btn-primary"
                disabled={selectedItems.length === 0}
              >
                <CheckIcon className="h-5 w-5 inline-block mr-2" />
                Select {selectedItems.length} Entries
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
