// File: /home/com2u/src/OrganAIzer/frontend/src/components/ExportDialog.js
// Purpose: Dialog for selecting PDF export options and generating reports

import React, { useState } from 'react';
import { hasuraService } from '../services/hasuraService';
import LoadingSpinner from './LoadingSpinner';
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const ExportDialog = ({ 
  isOpen, 
  onClose, 
  assembly, 
  entries = [], 
  assemblyFilter = null 
}) => {
  const [exportType, setExportType] = useState('agenda');
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState({
    meetingDate: '',
    meetingTime: '',
    duration: '',
    location: '',
    attendees: '',
    decisions: '',
    includeVoting: true,
    includeRatings: true,
    includeContent: true,
    includeTimestamps: false,
  });

  const exportTypes = [
    {
      id: 'agenda',
      name: 'Meeting Agenda',
      description: 'Structured agenda with time allocations and discussion points',
      icon: '📋',
    },
    {
      id: 'protocol',
      name: 'Meeting Protocol',
      description: 'Detailed meeting minutes with discussions and decisions',
      icon: '📝',
    },
    {
      id: 'todo',
      name: 'Action Items',
      description: 'Task list with priorities and due dates',
      icon: '✅',
    },
    {
      id: 'report',
      name: 'Assembly Report',
      description: 'Comprehensive overview with statistics and details',
      icon: '📊',
    },
  ];

  const handleOptionChange = (key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenerate = async () => {
    if (!assembly || !exportType) {
      toast.error('Please select an export type');
      return;
    }

    try {
      setIsGenerating(true);

      // Prepare options based on export type
      const exportOptions = { ...options };
      
      // Convert attendees string to array
      if (exportOptions.attendees) {
        exportOptions.attendees = exportOptions.attendees
          .split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0);
      }

      // Convert decisions string to array
      if (exportOptions.decisions) {
        exportOptions.decisions = exportOptions.decisions
          .split('\n')
          .map(decision => decision.trim())
          .filter(decision => decision.length > 0);
      }

      // Generate the report
      const result = await hasuraService.generateReport(
        assembly.id,
        exportType,
        entries,
        exportOptions
      );

      if (result.success) {
        // Download the file
        const blob = await hasuraService.downloadReport(result.filename);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(`${exportTypes.find(t => t.id === exportType)?.name} generated successfully`);
        onClose();
      } else {
        throw new Error('Failed to generate report');
      }

    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to generate ${exportTypes.find(t => t.id === exportType)?.name}: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const selectedType = exportTypes.find(t => t.id === exportType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Export Assembly</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate PDF report for "{assembly?.name}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isGenerating}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exportTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setExportType(type.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    exportType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isGenerating}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{type.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                    </div>
                    {exportType === type.id && (
                      <CheckIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Export Options */}
          {selectedType && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedType.name} Options
              </h3>

              {/* Meeting Details (for Agenda and Protocol) */}
              {(exportType === 'agenda' || exportType === 'protocol') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarIcon className="h-4 w-4 inline-block mr-1" />
                      Meeting Date
                    </label>
                    <input
                      type="date"
                      value={options.meetingDate}
                      onChange={(e) => handleOptionChange('meetingDate', e.target.value)}
                      className="input-field"
                      disabled={isGenerating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ClockIcon className="h-4 w-4 inline-block mr-1" />
                      Meeting Time
                    </label>
                    <input
                      type="time"
                      value={options.meetingTime}
                      onChange={(e) => handleOptionChange('meetingTime', e.target.value)}
                      className="input-field"
                      disabled={isGenerating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={options.duration}
                      onChange={(e) => handleOptionChange('duration', e.target.value)}
                      placeholder="e.g., 60"
                      className="input-field"
                      disabled={isGenerating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPinIcon className="h-4 w-4 inline-block mr-1" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={options.location}
                      onChange={(e) => handleOptionChange('location', e.target.value)}
                      placeholder="e.g., Conference Room A"
                      className="input-field"
                      disabled={isGenerating}
                    />
                  </div>
                </div>
              )}

              {/* Protocol-specific options */}
              {exportType === 'protocol' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserGroupIcon className="h-4 w-4 inline-block mr-1" />
                      Attendees (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={options.attendees}
                      onChange={(e) => handleOptionChange('attendees', e.target.value)}
                      placeholder="e.g., John Doe, Jane Smith, Bob Johnson"
                      className="input-field"
                      disabled={isGenerating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decisions Made (one per line)
                    </label>
                    <textarea
                      value={options.decisions}
                      onChange={(e) => handleOptionChange('decisions', e.target.value)}
                      placeholder="e.g., Approved budget for Q2&#10;Scheduled next review for March 15"
                      rows={3}
                      className="input-field"
                      disabled={isGenerating}
                    />
                  </div>
                </div>
              )}

              {/* Content Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Include in Export
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeContent}
                      onChange={(e) => handleOptionChange('includeContent', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isGenerating}
                    />
                    <span className="ml-2 text-sm text-gray-700">Entry content/descriptions</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeVoting}
                      onChange={(e) => handleOptionChange('includeVoting', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isGenerating}
                    />
                    <span className="ml-2 text-sm text-gray-700">Voting results</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeRatings}
                      onChange={(e) => handleOptionChange('includeRatings', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isGenerating}
                    />
                    <span className="ml-2 text-sm text-gray-700">Star ratings</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeTimestamps}
                      onChange={(e) => handleOptionChange('includeTimestamps', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isGenerating}
                    />
                    <span className="ml-2 text-sm text-gray-700">Timestamps</span>
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Assembly: {assembly?.name}</div>
                  <div>Entries: {entries.length}</div>
                  <div>Type: {selectedType.name}</div>
                  {options.meetingDate && <div>Date: {options.meetingDate}</div>}
                  {options.meetingTime && <div>Time: {options.meetingTime}</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="btn-primary"
            disabled={isGenerating || !exportType}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Generate PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
