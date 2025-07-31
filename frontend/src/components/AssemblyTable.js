// File: /home/com2u/src/OrganAIzer/frontend/src/components/AssemblyTable.js
// Purpose: Assembly table component using DragDropTable for reordering entries

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasuraService } from '../services/hasuraService';
import { useAuth } from '../contexts/AuthContext';
import { useAssembly } from '../contexts/AssemblyContext';
import LoadingSpinner from './LoadingSpinner';
import DragDropTable from './DragDropTable';
import SearchDialog from './SearchDialog';
import ExportDialog from './ExportDialog';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const AssemblyTable = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentAssembly } = useAssembly();
  
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [hiddenEntries, setHiddenEntries] = useState([]);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Bulk operations
  const [bulkType, setBulkType] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Metadata
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [labels, setLabels] = useState([]);
  
  // Table columns configuration
  const [columns, setColumns] = useState([
    { key: 'dragHandle', label: '', visible: true },
    { key: 'title', label: 'Title', visible: true },
    { key: 'type', label: 'Type', visible: true },
    { key: 'content', label: 'Content', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'labels', label: 'Labels', visible: true },
    { key: 'stars', label: 'Stars', visible: true },
    { key: 'votes', label: 'Votes', visible: true },
    { key: 'timestamp', label: 'Updated', visible: true },
    { key: 'actions', label: 'Actions', visible: true },
  ]);

  useEffect(() => {
    loadEntries();
    loadMetadata();
  }, [currentAssembly]);

  useEffect(() => {
    setShowBulkActions(selectedEntries.length > 0);
  }, [selectedEntries]);

  useEffect(() => {
    // Update column visibility based on assembly filter
    if (currentAssembly?.filter) {
      const updatedColumns = columns.map(col => ({
        ...col,
        visible: currentAssembly.filter.visibleColumns?.[col.key] !== false
      }));
      setColumns(updatedColumns);
    }
  }, [currentAssembly]);

  const loadEntries = async () => {
    if (!currentAssembly) return;
    
    try {
      setLoading(true);
      
      // Use the ordered entries endpoint with assembly filter
      const data = await hasuraService.getOrderedEntries(currentAssembly.filter);
      setEntries(data.entries || []);
      
    } catch (error) {
      console.error('Failed to load entries:', error);
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
      toast.error('Failed to load metadata');
    }
  };

  const handleEntriesChange = (updatedEntries) => {
    setEntries(updatedEntries);
  };

  const handleEntryEdit = (entry) => {
    navigate(`/entries/${entry.key}`);
  };

  const handleEntryDelete = async (entry) => {
    if (!window.confirm(`Are you sure you want to delete "${entry.title}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await hasuraService.deleteEntry(entry.key);
      setEntries(entries.filter(e => e.key !== entry.key));
      setSelectedEntries(selectedEntries.filter(key => key !== entry.key));
      toast.success('Entry deleted successfully');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const handleEntryToggleHide = (entry) => {
    if (hiddenEntries.includes(entry.key)) {
      setHiddenEntries(hiddenEntries.filter(key => key !== entry.key));
      toast.success('Entry shown');
    } else {
      setHiddenEntries([...hiddenEntries, entry.key]);
      toast.success('Entry hidden (session only)');
    }
  };

  const handleSelectEntry = (entryKey) => {
    setSelectedEntries(prev => 
      prev.includes(entryKey) 
        ? prev.filter(key => key !== entryKey)
        : [...prev, entryKey]
    );
  };

  const handleSelectAll = () => {
    const visibleEntryKeys = entries
      .filter(entry => !hiddenEntries.includes(entry.key))
      .map(entry => entry.key);
    
    if (selectedEntries.length === visibleEntryKeys.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(visibleEntryKeys);
    }
  };

  const handleBulkSetType = async () => {
    if (!bulkType || selectedEntries.length === 0) return;
    
    try {
      // Update each entry individually (could be optimized with bulk endpoint)
      const updatePromises = selectedEntries.map(entryKey => 
        hasuraService.updateEntry(entryKey, { type: bulkType })
      );
      
      await Promise.all(updatePromises);
      
      // Update local state
      setEntries(entries.map(entry => 
        selectedEntries.includes(entry.key) 
          ? { ...entry, type: bulkType }
          : entry
      ));
      
      setSelectedEntries([]);
      setBulkType('');
      toast.success(`Updated type for ${selectedEntries.length} entries`);
    } catch (error) {
      console.error('Failed to update entries:', error);
      toast.error('Failed to update entries');
    }
  };

  const handleBulkSetStatus = async () => {
    if (!bulkStatus || selectedEntries.length === 0) return;
    
    try {
      // Update each entry individually (could be optimized with bulk endpoint)
      const updatePromises = selectedEntries.map(entryKey => 
        hasuraService.updateEntry(entryKey, { status: bulkStatus })
      );
      
      await Promise.all(updatePromises);
      
      // Update local state
      setEntries(entries.map(entry => 
        selectedEntries.includes(entry.key) 
          ? { ...entry, status: bulkStatus }
          : entry
      ));
      
      setSelectedEntries([]);
      setBulkStatus('');
      toast.success(`Updated status for ${selectedEntries.length} entries`);
    } catch (error) {
      console.error('Failed to update entries:', error);
      toast.error('Failed to update entries');
    }
  };

  const handleAddEntry = () => {
    navigate('/entries/new');
  };

  const handleExportPDF = () => {
    setShowExportDialog(true);
  };

  const handleExportWeb = async () => {
    try {
      // This would generate a web page view
      toast.info('Web export functionality coming soon');
    } catch (error) {
      toast.error('Failed to export web page');
    }
  };

  const visibleEntries = entries.filter(entry => !hiddenEntries.includes(entry.key));
  const visibleColumns = columns.filter(col => col.visible);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentAssembly) {
    return (
      <div className="text-center py-12">
        <div className="card bg-gradient-to-br from-pastel-blue/20 to-pastel-purple/20">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assembly Selected</h3>
          <p className="text-gray-600 mb-4">
            Please select or create an assembly to view and manage entries.
          </p>
          <button
            onClick={() => navigate('/assemblies')}
            className="btn-primary"
          >
            Manage Assemblies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900">{currentAssembly.name}</h2>
          {currentAssembly.description && (
            <p className="text-gray-600 mt-1">{currentAssembly.description}</p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>{visibleEntries.length} entries</span>
            {selectedEntries.length > 0 && (
              <span>{selectedEntries.length} selected</span>
            )}
            {hiddenEntries.length > 0 && (
              <span>{hiddenEntries.length} hidden</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSelectAll}
            className="btn-secondary"
          >
            {selectedEntries.length === visibleEntries.length && visibleEntries.length > 0 
              ? 'Unselect All' 
              : 'Select All'
            }
          </button>
          
          <button
            onClick={() => setShowSearchDialog(true)}
            className="btn-secondary"
          >
            <MagnifyingGlassIcon className="h-5 w-5 inline-block mr-2" />
            Search
          </button>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleExportPDF}
              className="btn-secondary"
              title="Export as PDF"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleExportWeb}
              className="btn-secondary"
              title="Export as Web Page"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          </div>
          
          <button
            onClick={handleAddEntry}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 inline-block mr-2" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="card bg-gradient-to-r from-pastel-blue/20 to-pastel-purple/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-gray-900">
                {selectedEntries.length} entries selected
              </span>
              
              <div className="flex items-center space-x-2">
                <select
                  value={bulkType}
                  onChange={(e) => setBulkType(e.target.value)}
                  className="select-field text-sm"
                >
                  <option value="">Set Type</option>
                  {types.map(type => (
                    <option key={type.type} value={type.type}>
                      {type.type}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkSetType}
                  disabled={!bulkType}
                  className="btn-secondary text-sm"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="select-field text-sm"
                >
                  <option value="">Set Status</option>
                  {statuses.map(status => (
                    <option key={status.status} value={status.status}>
                      {status.status}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkSetStatus}
                  disabled={!bulkStatus}
                  className="btn-secondary text-sm"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedEntries([])}
              className="btn-secondary text-sm"
              title="Clear selection"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Table */}
      <DragDropTable
        entries={visibleEntries}
        columns={visibleColumns}
        assemblyFilter={currentAssembly.filter}
        onEntriesChange={handleEntriesChange}
        onEntryEdit={handleEntryEdit}
        onEntryDelete={handleEntryDelete}
        onEntryToggleHide={handleEntryToggleHide}
        className="relative"
      />

      {/* Hidden Entries */}
      {hiddenEntries.length > 0 && (
        <div className="card bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-700">
              Hidden Entries ({hiddenEntries.length})
            </h3>
            <button
              onClick={() => setHiddenEntries([])}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Show All
            </button>
          </div>
          
          <div className="space-y-2">
            {hiddenEntries.map(entryKey => {
              const entry = entries.find(e => e.key === entryKey);
              return entry ? (
                <div key={entryKey} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium text-sm">{entry.title}</div>
                    <div className="text-xs text-gray-500">{entry.type} • {entry.status}</div>
                  </div>
                  <button
                    onClick={() => handleEntryToggleHide(entry)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Show
                  </button>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Search Dialog */}
      {showSearchDialog && (
        <SearchDialog
          onClose={() => setShowSearchDialog(false)}
          onAddEntry={(entry) => {
            // Add entry to current assembly
            setEntries([...entries, entry]);
            setShowSearchDialog(false);
            toast.success('Entry added to assembly');
          }}
        />
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          assembly={currentAssembly}
          entries={visibleEntries}
          assemblyFilter={currentAssembly?.filter}
        />
      )}
    </div>
  );
};

export default AssemblyTable;
