// File: /home/com2u/src/OrganAIzer/frontend/src/components/DragDropTable.js
// Purpose: Drag & Drop table component for reordering entries

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { hasuraService } from '../services/hasuraService';
import { toast } from 'react-toastify';
import VotingButtons from './VotingButtons';
import StarRating from './StarRating';
import {
  Bars3Icon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

const DragDropTable = ({
  entries = [],
  columns = [],
  assemblyFilter = null,
  onEntriesChange,
  onEntryEdit,
  onEntryDelete,
  onEntryToggleHide,
  className = ''
}) => {
  const [localEntries, setLocalEntries] = useState(entries);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  const handleDragStart = (start) => {
    const draggedEntry = localEntries.find(entry => entry.key === start.draggableId);
    setDraggedItem(draggedEntry);
  };

  const handleDragEnd = async (result) => {
    setDraggedItem(null);

    // If dropped outside the list or no movement
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    const entryKey = result.draggableId;

    // Optimistic update - reorder locally first
    const newEntries = Array.from(localEntries);
    const [movedEntry] = newEntries.splice(sourceIndex, 1);
    newEntries.splice(destinationIndex, 0, movedEntry);

    // Update ranks based on new positions
    const updatedEntries = newEntries.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    setLocalEntries(updatedEntries);

    try {
      setIsReordering(true);

      // Calculate new rank (1-based indexing)
      const newRank = destinationIndex + 1;

      // Call backend to update ranks
      const result = await hasuraService.reorderEntry(entryKey, newRank, assemblyFilter);

      if (result.success) {
        toast.success('Entry reordered successfully');
        
        // Notify parent component of changes
        if (onEntriesChange) {
          onEntriesChange(updatedEntries);
        }
      } else {
        throw new Error(result.message || 'Failed to reorder entry');
      }

    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to reorder entry: ' + error.message);
      
      // Revert optimistic update on error
      setLocalEntries(entries);
    } finally {
      setIsReordering(false);
    }
  };

  const renderCellContent = (entry, column) => {
    switch (column.key) {
      case 'dragHandle':
        return (
          <div className="flex items-center justify-center">
            <Bars3Icon className="h-5 w-5 text-gray-400 cursor-grab" />
          </div>
        );

      case 'title':
        return (
          <div className="font-medium text-gray-900 truncate max-w-xs" title={entry.title}>
            {entry.title}
          </div>
        );

      case 'content':
        return (
          <div className="text-sm text-gray-600 truncate max-w-xs" title={entry.content}>
            {entry.content?.substring(0, 100)}
            {entry.content?.length > 100 && '...'}
          </div>
        );

      case 'type':
        return entry.type ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border-2 border-black">
            {entry.type}
          </span>
        ) : null;

      case 'status':
        return entry.status ? (
          <span 
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-2 border-black"
            style={{ 
              backgroundColor: entry.statusColor || '#e5e7eb',
              color: entry.statusTextColor || '#1f2937'
            }}
          >
            {entry.status}
          </span>
        ) : null;

      case 'labels':
        return entry.labels && entry.labels.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {entry.labels.slice(0, 2).map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-gray-300"
                style={{ backgroundColor: label.color || '#f3f4f6' }}
              >
                {label.name || label}
              </span>
            ))}
            {entry.labels.length > 2 && (
              <span className="text-xs text-gray-500">
                +{entry.labels.length - 2} more
              </span>
            )}
          </div>
        ) : null;

      case 'stars':
        return (
          <StarRating
            entryKey={entry.key}
            initialRating={entry.stars || 0}
            size="sm"
            interactive={true}
            showValue={false}
            precision={0.5}
          />
        );

      case 'votes':
        return (
          <VotingButtons
            entryKey={entry.key}
            initialVotes={entry.totalVotes || 0}
            initialUserVote={entry.userVote || 0}
            size="sm"
            showCount={true}
            layout="horizontal"
          />
        );

      case 'timestamp':
        return entry.updatedAt ? (
          <div className="text-sm text-gray-500">
            {new Date(entry.updatedAt).toLocaleDateString()}
          </div>
        ) : null;

      case 'actions':
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEntryEdit && onEntryEdit(entry)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Edit entry"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onEntryToggleHide && onEntryToggleHide(entry)}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              title={entry.hidden ? "Show entry" : "Hide entry"}
            >
              {entry.hidden ? (
                <EyeIcon className="h-4 w-4" />
              ) : (
                <EyeSlashIcon className="h-4 w-4" />
              )}
            </button>
            
            <button
              onClick={() => onEntryDelete && onEntryDelete(entry)}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Delete entry"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        );

      default:
        return entry[column.key] || '';
    }
  };

  const getRowClassName = (entry, isDragging) => {
    let className = 'bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors';
    
    if (isDragging) {
      className += ' shadow-lg bg-blue-50 border-blue-200';
    }
    
    if (entry.hidden) {
      className += ' opacity-50';
    }
    
    return className;
  };

  return (
    <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg ${className}`}>
      {isReordering && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm font-medium text-gray-700">Reordering entries...</span>
          </div>
        </div>
      )}

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <table className="min-w-full divide-y divide-gray-300">
          {/* Table Header */}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.key === 'dragHandle' ? 'w-12' : ''
                  } ${column.key === 'actions' ? 'w-32' : ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <Droppable droppableId="entries-table">
            {(provided, snapshot) => (
              <tbody
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`bg-white divide-y divide-gray-200 ${
                  snapshot.isDraggingOver ? 'bg-blue-50' : ''
                }`}
              >
                {localEntries.map((entry, index) => (
                  <Draggable
                    key={entry.key}
                    draggableId={entry.key}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={getRowClassName(entry, snapshot.isDragging)}
                        style={{
                          ...provided.draggableProps.style,
                          ...(snapshot.isDragging && {
                            transform: `${provided.draggableProps.style?.transform} rotate(2deg)`,
                          }),
                        }}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className="px-6 py-4 whitespace-nowrap text-sm"
                            {...(column.key === 'dragHandle' ? provided.dragHandleProps : {})}
                          >
                            {renderCellContent(entry, column)}
                          </td>
                        ))}
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                
                {/* Empty state */}
                {localEntries.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No entries found. Create your first entry to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </Droppable>
        </table>
      </DragDropContext>
    </div>
  );
};

export default DragDropTable;
