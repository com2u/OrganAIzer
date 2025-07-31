// File: /home/com2u/src/OrganAIzer/frontend/src/components/EntryList.js
// Purpose: List view for entries with filtering, sorting, and drag & drop reordering

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { hasuraService } from '../services/hasuraService';
import LoadingSpinner from './LoadingSpinner';
import VotingButtons from './VotingButtons';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  TagIcon,
  FlagIcon,
  DocumentTextIcon,
  Bars3Icon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const EntryList = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    label: '',
  });
  const [metadata, setMetadata] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  useEffect(() => {
    loadData();
  }, [pagination.page, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [entriesData, metadataData] = await Promise.all([
        hasuraService.getEntries({
          ...filters,
          limit: pagination.limit,
          offset: (pagination.page - 1) * pagination.limit,
        }),
        hasuraService.getMetadata(),
      ]);

      setEntries(entriesData.entries || []);
      setFilteredEntries(entriesData.entries || []);
      setMetadata(metadataData);
      setPagination(prev => ({ ...prev, total: entriesData.total || 0 }));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter entries based on search term
    const filtered = entries.filter(entry =>
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEntries(filtered);
  }, [searchTerm, entries]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ type: '', status: '', label: '' });
    setSearchTerm('');
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle entry deletion
  const handleDeleteEntry = async (entryKey, entryTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${entryTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await hasuraService.deleteEntry(entryKey);
      
      // Remove the entry from local state
      setEntries(prevEntries => prevEntries.filter(e => e.key !== entryKey));
      setFilteredEntries(prevEntries => prevEntries.filter(e => e.key !== entryKey));
      
      // Update pagination total
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      
      // Show success message
      alert('Entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  };

  // Handle manual entry reordering with up/down buttons
  const moveEntry = async (fromIndex, toIndex) => {
    console.log('moveEntry called with:', { fromIndex, toIndex, totalEntries: filteredEntries.length });
    
    // Validate indices
    if (toIndex < 0 || toIndex >= filteredEntries.length || fromIndex === toIndex) {
      console.log('Invalid move - out of bounds or same position');
      return;
    }

    console.log(`Moving entry from index ${fromIndex} to ${toIndex}`);

    // Create a copy of the entries array
    const reorderedEntries = Array.from(filteredEntries);
    const [movedEntry] = reorderedEntries.splice(fromIndex, 1);
    reorderedEntries.splice(toIndex, 0, movedEntry);

    console.log('Moved entry:', movedEntry.title);

    // Update local state immediately for better UX
    setFilteredEntries(reorderedEntries);

    try {
      // Calculate new rank based on position
      const newRank = toIndex + 1;

      console.log(`Updating rank for entry ${movedEntry.key} to ${newRank}`);

      // Call backend API to update rank using hasuraService
      const result = await hasuraService.reorderEntry(
        movedEntry.key,
        newRank,
        {
          types: filters.type ? [filters.type] : [],
          statuses: filters.status ? [filters.status] : [],
          labels: filters.label ? [filters.label] : [],
        }
      );

      console.log('Rank updated successfully:', result);

      // Reload data to get the updated ranks from server
      await loadData();

    } catch (error) {
      console.error('Error updating entry rank:', error);
      // Revert the local state change on error
      setFilteredEntries(filteredEntries);
      alert('Failed to update entry order. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Entries</h1>
          <p className="mt-2 text-gray-600">
            Manage and organize your entries
          </p>
        </div>
        <Link to="/entries/new" className="btn-primary">
          <PlusIcon className="h-5 w-5 inline-block mr-2" />
          New Entry
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Type Filter */}
          {metadata?.types && (
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="select-field"
            >
              <option value="">All Types</option>
              {metadata.types.map(type => (
                <option key={type.type} value={type.type}>{type.type}</option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          {metadata?.statuses && (
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="select-field"
            >
              <option value="">All Statuses</option>
              {metadata.statuses.map(status => (
                <option key={status.status} value={status.status}>{status.status}</option>
              ))}
            </select>
          )}

          {/* Label Filter */}
          {metadata?.labels && (
            <select
              value={filters.label}
              onChange={(e) => handleFilterChange('label', e.target.value)}
              className="select-field"
            >
              <option value="">All Labels</option>
              {metadata.labels.map(label => (
                <option key={label.label} value={label.label}>{label.label}</option>
              ))}
            </select>
          )}

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="btn-secondary"
            title="Clear all filters"
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredEntries.length} of {pagination.total} entries
        </p>
      </div>

      {/* Entries List with Manual Drag & Drop */}
      <div className="space-y-4">
        {filteredEntries.map((entry, index) => (
          <div key={entry.key} className="card card-hover">
            <div className="flex items-start justify-between">
              {/* Manual Reorder Buttons */}
              <div className="flex flex-col mr-3 mt-1 space-y-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Up button clicked for index:', index);
                    moveEntry(index, index - 1);
                  }}
                  disabled={index === 0}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Down button clicked for index:', index);
                    moveEntry(index, index + 1);
                  }}
                  disabled={index === filteredEntries.length - 1}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">{entry.title}</h3>
                <p className="text-gray-600 mb-3">
                  {entry.content?.substring(0, 200)}
                  {entry.content?.length > 200 && '...'}
                </p>
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className="badge badge-blue">{entry.type}</span>
                  <span className="badge badge-green">{entry.status}</span>
                  
                  {entry.labels?.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <TagIcon className="h-4 w-4 text-gray-400" />
                      {entry.labels.map((label, labelIndex) => (
                        <span key={labelIndex} className="badge badge-purple">
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                    <span className="ml-1">{entry.stars}</span>
                  </div>
                  
                  {/* Voting Buttons */}
                  <VotingButtons
                    entryKey={entry.key}
                    initialVotes={entry.votes || 0}
                    initialUserVote={entry.uservote || 0}
                    size="sm"
                    onVoteChange={(voteData) => {
                      // Update the entry in the local state
                      setEntries(prevEntries => 
                        prevEntries.map(e => 
                          e.key === voteData.entryKey 
                            ? { ...e, votes: voteData.totalVotes, uservote: voteData.userVote }
                            : e
                        )
                      );
                      setFilteredEntries(prevEntries => 
                        prevEntries.map(e => 
                          e.key === voteData.entryKey 
                            ? { ...e, votes: voteData.totalVotes, uservote: voteData.userVote }
                            : e
                        )
                      );
                    }}
                  />
                  
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <span className="ml-1">
                      {new Date(entry.createdat).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Rank indicator */}
                  <div className="flex items-center text-xs text-gray-500">
                    <span>#{entry.rank || index + 1}</span>
                  </div>
                </div>
              </div>
              
              <div className="ml-4 flex-shrink-0 flex flex-col space-y-2">
                <Link
                  to={`/entries/${entry.key}`}
                  className="btn-secondary"
                >
                  View
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteEntry(entry.key, entry.title);
                  }}
                  className="btn-danger flex items-center justify-center"
                  title="Delete entry"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.values(filters).some(v => v)
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first entry.'}
          </p>
          <Link to="/entries/new" className="btn-primary">
            Create Entry
          </Link>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default EntryList;
