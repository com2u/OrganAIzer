// File: /home/com2u/src/OrganAIzer/frontend/src/components/Dashboard.js
// Purpose: Main dashboard with overview and quick actions

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAssembly } from '../contexts/AssemblyContext';
import { hasuraService } from '../services/hasuraService';
import LoadingSpinner from './LoadingSpinner';
import VotingButtons from './VotingButtons';
import {
  DocumentTextIcon,
  TagIcon,
  FlagIcon,
  LinkIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentAssembly, entries, loading: assemblyLoading } = useAssembly();
  const [stats, setStats] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [isAiChatExpanded, setIsAiChatExpanded] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [currentAssembly]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const [entriesData, metadata] = await Promise.all([
        hasuraService.getEntries({ limit: 10 }),
        hasuraService.getMetadata(),
      ]);

      setRecentEntries(entriesData.entries || []);
      
      // Calculate stats
      const stats = {
        totalEntries: entriesData.total || 0,
        types: metadata.types?.length || 0,
        statuses: metadata.statuses?.length || 0,
        labels: metadata.labels?.length || 0,
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAiPromptSubmit = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;

    try {
      setAiLoading(true);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ai/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          context: 'dashboard',
          assemblyId: currentAssembly?.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAiResponse(data.data.response);
      } else {
        setAiResponse('Sorry, I encountered an error processing your request. Please try again.');
      }
    } catch (error) {
      console.error('AI prompt failed:', error);
      setAiResponse('Sorry, I encountered an error processing your request. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || assemblyLoading) {
    return <LoadingSpinner />;
  }

  const quickActions = [
    {
      name: 'New Entry',
      href: '/entries',
      icon: PlusIcon,
      color: 'from-pastel-blue to-pastel-purple',
      description: 'Create a new entry',
    },
    {
      name: 'View Entries',
      href: '/entries',
      icon: DocumentTextIcon,
      color: 'from-pastel-green to-pastel-cyan',
      description: 'Browse all entries',
    },
    {
      name: 'Manage Assemblies',
      href: '/assemblies',
      icon: ChartBarIcon,
      color: 'from-pastel-orange to-pastel-yellow',
      description: 'Configure assemblies',
    },
    {
      name: 'Edit Types',
      href: '/types',
      icon: TagIcon,
      color: 'from-pastel-pink to-pastel-red',
      description: 'Manage entry types',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Collapsible Overview Section */}
      <div className="mb-8">
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
          <button
            onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
            className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name || user?.email}!
              </h1>
              <p className="mt-1 text-gray-600">
                Here's what's happening with your OrganAIzer workspace.
              </p>
            </div>
            {isOverviewExpanded ? (
              <ChevronUpIcon className="h-6 w-6 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-6 w-6 text-gray-500" />
            )}
          </button>

          {/* Collapsible Content */}
          {isOverviewExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="card card-hover bg-gradient-to-br from-pastel-blue to-pastel-purple">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-6 w-6 text-black" />
                      <div className="ml-3">
                        <p className="text-xs font-medium text-black">Total Entries</p>
                        <p className="text-xl font-bold text-black">{stats.totalEntries}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card card-hover bg-gradient-to-br from-pastel-green to-pastel-cyan">
                    <div className="flex items-center">
                      <TagIcon className="h-6 w-6 text-black" />
                      <div className="ml-3">
                        <p className="text-xs font-medium text-black">Types</p>
                        <p className="text-xl font-bold text-black">{stats.types}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card card-hover bg-gradient-to-br from-pastel-orange to-pastel-yellow">
                    <div className="flex items-center">
                      <FlagIcon className="h-6 w-6 text-black" />
                      <div className="ml-3">
                        <p className="text-xs font-medium text-black">Statuses</p>
                        <p className="text-xl font-bold text-black">{stats.statuses}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card card-hover bg-gradient-to-br from-pastel-pink to-pastel-red">
                    <div className="flex items-center">
                      <LinkIcon className="h-6 w-6 text-black" />
                      <div className="ml-3">
                        <p className="text-xs font-medium text-black">Labels</p>
                        <p className="text-xl font-bold text-black">{stats.labels}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Assembly */}
              {currentAssembly && (
                <div className="card bg-gradient-to-br from-pastel-blue/20 to-pastel-purple/20 mb-6">
                  <h2 className="text-lg font-bold mb-3">Current Assembly: {currentAssembly.name}</h2>
                  {currentAssembly.description && (
                    <p className="text-gray-600 mb-3">{currentAssembly.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {entries.length} entries in this assembly
                    </span>
                    <Link
                      to="/entries"
                      className="btn-primary"
                    >
                      View Entries
                    </Link>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action) => (
                    <Link
                      key={action.name}
                      to={action.href}
                      className={`card card-hover bg-gradient-to-br ${action.color}`}
                    >
                      <div className="text-center">
                        <action.icon className="h-10 w-10 text-black mx-auto mb-2" />
                        <h3 className="text-base font-bold text-black mb-1">{action.name}</h3>
                        <p className="text-xs text-black opacity-75">{action.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Section */}
      <div className="mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
          <button
            onClick={() => setIsAiChatExpanded(!isAiChatExpanded)}
            className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
          >
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
                <p className="mt-1 text-gray-600">
                  Ask questions about your content or get help organizing your workspace.
                </p>
              </div>
            </div>
            {isAiChatExpanded ? (
              <ChevronUpIcon className="h-6 w-6 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-6 w-6 text-gray-500" />
            )}
          </button>

          {/* AI Chat Content */}
          {isAiChatExpanded && (
            <div className="mt-6 pt-6 border-t border-blue-200">
              {/* AI Response Display */}
              {aiResponse && (
                <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-start">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">AI Response:</h4>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{aiResponse}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Prompt Form */}
              <form onSubmit={handleAiPromptSubmit} className="space-y-4">
                <div>
                  <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                    Ask the AI Assistant
                  </label>
                  <textarea
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask me anything about organizing your content, managing tasks, or improving your workflow..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    disabled={aiLoading}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!aiPrompt.trim() || aiLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? (
                      <>
                        <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Quick Prompt Suggestions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Help me organize my meeting notes",
                    "How can I prioritize my tasks?",
                    "Suggest ways to categorize my entries",
                    "What's the best way to use assemblies?"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setAiPrompt(suggestion)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      disabled={aiLoading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Entries</h2>
          <div className="space-y-4">
            {recentEntries.map((entry) => (
              <div key={entry.key} className="card card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{entry.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{entry.content?.substring(0, 100)}...</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="badge badge-blue">{entry.type}</span>
                      <span className="badge badge-green">{entry.status}</span>
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400" />
                        <span className="ml-1 text-sm">{entry.stars}</span>
                      </div>
                      
                      {/* Voting Buttons */}
                      <VotingButtons
                        entryKey={entry.key}
                        initialVotes={entry.votes || 0}
                        initialUserVote={entry.uservote || 0}
                        size="sm"
                        onVoteChange={(voteData) => {
                          // Update the entry in the local state
                          setRecentEntries(prevEntries => 
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
                        <span className="ml-1 text-sm">
                          {new Date(entry.createdat).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/entries/${entry.key}`}
                    className="btn-secondary"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentEntries.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No entries yet</h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first entry or configuring an assembly.
          </p>
          <Link to="/entries" className="btn-primary">
            Create Entry
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
