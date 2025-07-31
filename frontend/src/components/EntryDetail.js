// File: /home/com2u/src/OrganAIzer/frontend/src/components/EntryDetail.js
// Purpose: Complete CRUD interface for individual entries with markdown editor

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hasuraService } from '../services/hasuraService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import VotingButtons from './VotingButtons';
import StarRating from './StarRating';
import MarkdownEditor from './MarkdownEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  DocumentTextIcon,
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  LinkIcon,
  TagIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

const EntryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: '',
    status: '',
    stars: 0
  });
  
  // Metadata
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [labels, setLabels] = useState([]);
  const [relations, setRelations] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [entryRelations, setEntryRelations] = useState([]);
  const [userVote, setUserVote] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    if (id && id !== 'new') {
      loadEntry();
      loadMetadata();
    } else {
      // New entry mode
      setEditing(true);
      setPreviewMode(false);
      setLoading(false);
      loadMetadata(); // Still need to load metadata for dropdowns
    }
  }, [id]);

  const loadEntry = async () => {
    try {
      setLoading(true);
      const data = await hasuraService.getEntry(id);
      // The API returns the entry directly, not wrapped in an entry property
      const entryData = data.entry || data;
      setEntry(entryData);
      setFormData({
        title: entryData.title || '',
        content: entryData.content || '',
        type: entryData.type || '',
        status: entryData.status || '',
        stars: entryData.stars || 0
      });
      setSelectedLabels(entryData.labels || []);
      setEntryRelations(entryData.relations || []);
      setUserVote(entryData.userVote || 0);
      setTotalVotes(entryData.totalVotes || 0);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to load entry');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [typesData, statusesData, labelsData, relationsData] = await Promise.all([
        hasuraService.getTypes(),
        hasuraService.getStatuses(),
        hasuraService.getLabels(),
        hasuraService.getRelations()
      ]);
      
      setTypes(typesData.types || []);
      setStatuses(statusesData.statuses || []);
      setLabels(labelsData.labels || []);
      setRelations(relationsData.relations || []);
    } catch (error) {
      toast.error('Failed to load metadata');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }

    if (!formData.type) {
      toast.error('Type is required');
      return;
    }

    if (!formData.status) {
      toast.error('Status is required');
      return;
    }

    try {
      setSaving(true);
      
      const entryData = {
        ...formData,
        labels: selectedLabels,
        relations: entryRelations
      };

      let savedEntry;
      if (id && id !== 'new') {
        savedEntry = await hasuraService.updateEntry(id, entryData);
        toast.success('Entry updated successfully');
      } else {
        savedEntry = await hasuraService.createEntry(entryData);
        toast.success('Entry created successfully');
        navigate(`/entries/${savedEntry.key}`);
      }
      
      setEntry(savedEntry);
      setEditing(false);
      setPreviewMode(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (id && id !== 'new') {
      // Reset to original values
      setFormData({
        title: entry.title,
        content: entry.content,
        type: entry.type,
        status: entry.status,
        stars: entry.stars || 0
      });
      setSelectedLabels(entry.labels || []);
      setEntryRelations(entry.relations || []);
      setEditing(false);
      setPreviewMode(true);
    } else {
      // New entry - go back
      navigate('/entries');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    try {
      await hasuraService.deleteEntry(id);
      toast.success('Entry deleted successfully');
      navigate('/entries');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleVote = async (vote) => {
    try {
      await hasuraService.voteEntry(id, vote);
      setUserVote(vote);
      // Recalculate total votes
      const newTotal = totalVotes - userVote + vote;
      setTotalVotes(newTotal);
      toast.success('Vote recorded');
    } catch (error) {
      toast.error('Failed to record vote');
    }
  };

  const handleStarRating = async (rating) => {
    try {
      await hasuraService.rateEntry(id, rating);
      setFormData({ ...formData, stars: rating });
      if (entry) {
        setEntry({ ...entry, stars: rating });
      }
      toast.success('Rating updated');
    } catch (error) {
      toast.error('Failed to update rating');
    }
  };

  const addLabel = (label) => {
    if (!selectedLabels.includes(label)) {
      setSelectedLabels([...selectedLabels, label]);
    }
  };

  const removeLabel = (label) => {
    setSelectedLabels(selectedLabels.filter(l => l !== label));
  };

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      const halfFilled = i - 0.5 === rating;
      
      stars.push(
        <button
          key={i}
          onClick={() => interactive && handleStarRating(i)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          disabled={!interactive}
        >
          {filled ? (
            <StarIconSolid className="h-5 w-5 text-yellow-400" />
          ) : halfFilled ? (
            <div className="relative">
              <StarIcon className="h-5 w-5 text-gray-300" />
              <StarIconSolid className="h-5 w-5 text-yellow-400 absolute top-0 left-0 clip-path-half" />
            </div>
          ) : (
            <StarIcon className="h-5 w-5 text-gray-300" />
          )}
        </button>
      );
    }
    return stars;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card bg-gradient-to-br from-pastel-red/20 to-pastel-pink/20">
          <p className="text-red-600">{error}</p>
          <button onClick={() => navigate('/entries')} className="mt-4 btn-secondary">
            Back to Entries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          {editing ? (
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-3xl font-bold bg-transparent border-none outline-none w-full"
              placeholder="Enter entry title"
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900">
              {entry?.title || 'New Entry'}
            </h1>
          )}
          
          {entry && (
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{entry.createdat ? new Date(entry.createdat).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>{entry.updatedat ? new Date(entry.updatedat).toLocaleTimeString() : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <UserIcon className="h-4 w-4" />
                <span>{entry.createdby || 'Unknown'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          {!editing ? (
            <>
              <button
                onClick={() => {
                  setEditing(true);
                  setPreviewMode(false);
                }}
                className="btn-secondary"
              >
                <PencilIcon className="h-5 w-5 inline-block mr-2" />
                Edit
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
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="btn-success"
                disabled={saving}
              >
                <CheckIcon className="h-5 w-5 inline-block mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary"
                disabled={saving}
              >
                <XMarkIcon className="h-5 w-5 inline-block mr-2" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Editor/Viewer */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Content</h3>
            
            {editing ? (
              <MarkdownEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Enter content in Markdown format..."
                height="500px"
                showToolbar={true}
                allowFileUpload={true}
              />
            ) : (
              <div className="prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {formData.content || entry?.content || '*No content*'}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Voting and Rating */}
          {entry && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Community Feedback</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <VotingButtons
                    entryKey={id}
                    initialVotes={totalVotes}
                    initialUserVote={userVote}
                    size="lg"
                    showCount={true}
                    onVoteChange={(voteData) => {
                      setUserVote(voteData.userVote);
                      setTotalVotes(voteData.totalVotes);
                    }}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Rating:</span>
                  <StarRating
                    entryKey={id}
                    initialRating={formData.stars}
                    size="md"
                    interactive={true}
                    showValue={true}
                    precision={0.5}
                    onRatingChange={(ratingData) => {
                      setFormData({ ...formData, stars: ratingData.rating });
                      if (entry) {
                        setEntry({ ...entry, stars: ratingData.rating });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Basic Properties */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Properties</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                {editing ? (
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="select-field"
                  >
                    <option value="">Select type</option>
                    {types.map(type => (
                      <option key={type.type} value={type.type}>
                        {type.type} - {type.description}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="badge badge-blue">{entry?.type}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                {editing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="select-field"
                  >
                    <option value="">Select status</option>
                    {statuses.map(status => (
                      <option key={status.status} value={status.status}>
                        {status.status} - {status.description}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span 
                      className="badge"
                      style={{ backgroundColor: entry?.statusColor || '#gray' }}
                    >
                      {entry?.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Labels</h3>
              <TagIcon className="h-5 w-5 text-gray-600" />
            </div>
            
            {editing && (
              <div className="mb-4">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addLabel(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="select-field"
                >
                  <option value="">Add label</option>
                  {labels.filter(label => !selectedLabels.includes(label.label)).map(label => (
                    <option key={label.label} value={label.label}>
                      {label.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {selectedLabels.map(labelName => {
                const label = labels.find(l => l.label === labelName);
                return (
                  <span
                    key={labelName}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm border-2 border-black"
                    style={{ backgroundColor: label?.color || '#gray' }}
                  >
                    {labelName}
                    {editing && (
                      <button
                        onClick={() => removeLabel(labelName)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Relations */}
          {entry && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Relations</h3>
                <LinkIcon className="h-5 w-5 text-gray-600" />
              </div>
              
              {entryRelations.length > 0 ? (
                <div className="space-y-2">
                  {entryRelations.map((relation, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{relation.type}</span>
                        <span className="text-gray-600 ml-2">{relation.targetTitle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No relations defined</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntryDetail;
