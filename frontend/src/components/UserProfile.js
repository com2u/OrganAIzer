// File: /home/com2u/src/OrganAIzer/frontend/src/components/UserProfile.js
// Purpose: User profile management with Azure ID integration and preferences

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from './LoadingSpinner';
import {
  UserIcon,
  CogIcon,
  MoonIcon,
  SunIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BellIcon,
  CheckIcon,
  XMarkIcon,
  KeyIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    language: 'en',
    notifications: {
      email: true,
      browser: true,
      mentions: true,
      updates: false
    },
    preferences: {
      defaultView: 'dashboard',
      itemsPerPage: 20,
      autoSave: true,
      compactMode: false
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        language: user.language || 'en',
        notifications: {
          email: user.notifications?.email ?? true,
          browser: user.notifications?.browser ?? true,
          mentions: user.notifications?.mentions ?? true,
          updates: user.notifications?.updates ?? false
        },
        preferences: {
          defaultView: user.preferences?.defaultView || 'dashboard',
          itemsPerPage: user.preferences?.itemsPerPage || 20,
          autoSave: user.preferences?.autoSave ?? true,
          compactMode: user.preferences?.compactMode ?? false
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateUser(formData);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset form data
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        language: user.language || 'en',
        notifications: {
          email: user.notifications?.email ?? true,
          browser: user.notifications?.browser ?? true,
          mentions: user.notifications?.mentions ?? true,
          updates: user.notifications?.updates ?? false
        },
        preferences: {
          defaultView: user.preferences?.defaultView || 'dashboard',
          itemsPerPage: user.preferences?.itemsPerPage || 20,
          autoSave: user.preferences?.autoSave ?? true,
          compactMode: user.preferences?.compactMode ?? false
        }
      });
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="btn-primary"
          >
            <CogIcon className="h-5 w-5 inline-block mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="btn-success"
              disabled={loading}
            >
              <CheckIcon className="h-5 w-5 inline-block mr-2" />
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="btn-secondary"
              disabled={loading}
            >
              <XMarkIcon className="h-5 w-5 inline-block mr-2" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <UserIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-bold">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.name || 'Not set'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <CogIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-bold">Preferences</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  {editing ? (
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="select-field"
                    >
                      <option value="en">English</option>
                      <option value="de">Deutsch</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 py-2">
                      {formData.language === 'en' ? 'English' : 'Deutsch'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Default View</label>
                  {editing ? (
                    <select
                      value={formData.preferences.defaultView}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, defaultView: e.target.value }
                      })}
                      className="select-field"
                    >
                      <option value="dashboard">Dashboard</option>
                      <option value="entries">Entries List</option>
                      <option value="assemblies">Assemblies</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 py-2 capitalize">
                      {formData.preferences.defaultView}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Items per Page</label>
                {editing ? (
                  <select
                    value={formData.preferences.itemsPerPage}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, itemsPerPage: parseInt(e.target.value) }
                    })}
                    className="select-field"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                ) : (
                  <p className="text-gray-900 py-2">{formData.preferences.itemsPerPage}</p>
                )}
              </div>
              
              {editing && (
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferences.autoSave}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, autoSave: e.target.checked }
                      })}
                      className="mr-3"
                    />
                    <span className="text-sm">Auto-save changes</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferences.compactMode}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, compactMode: e.target.checked }
                      })}
                      className="mr-3"
                    />
                    <span className="text-sm">Compact mode</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <BellIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-bold">Notifications</h2>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Email notifications</span>
                <input
                  type="checkbox"
                  checked={formData.notifications.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    notifications: { ...formData.notifications, email: e.target.checked }
                  })}
                  disabled={!editing}
                  className="ml-3"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Browser notifications</span>
                <input
                  type="checkbox"
                  checked={formData.notifications.browser}
                  onChange={(e) => setFormData({
                    ...formData,
                    notifications: { ...formData.notifications, browser: e.target.checked }
                  })}
                  disabled={!editing}
                  className="ml-3"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Mentions and comments</span>
                <input
                  type="checkbox"
                  checked={formData.notifications.mentions}
                  onChange={(e) => setFormData({
                    ...formData,
                    notifications: { ...formData.notifications, mentions: e.target.checked }
                  })}
                  disabled={!editing}
                  className="ml-3"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">System updates</span>
                <input
                  type="checkbox"
                  checked={formData.notifications.updates}
                  onChange={(e) => setFormData({
                    ...formData,
                    notifications: { ...formData.notifications, updates: e.target.checked }
                  })}
                  disabled={!editing}
                  className="ml-3"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              {theme === 'dark' ? (
                <MoonIcon className="h-6 w-6 text-gray-600" />
              ) : (
                <SunIcon className="h-6 w-6 text-gray-600" />
              )}
              <h3 className="text-lg font-bold">Theme</h3>
            </div>
            
            <button
              onClick={toggleTheme}
              className="w-full btn-secondary"
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </div>

          {/* Account Info */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-gray-600" />
              <h3 className="text-lg font-bold">Account</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono text-xs">{user.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Azure ID:</span>
                <span className="font-mono text-xs">{user.azureId || 'Not linked'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="capitalize">{user.role || 'User'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span>{user.department || 'Not set'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Member since:</span>
                <span>{new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Last login:</span>
                <span>{new Date(user.lastLogin || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Azure Integration */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <BuildingOfficeIcon className="h-6 w-6 text-gray-600" />
              <h3 className="text-lg font-bold">Azure Integration</h3>
            </div>
            
            <div className="space-y-3">
              {user.azureId ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckIcon className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">Connected to Azure AD</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Your account is linked to Azure Active Directory
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <KeyIcon className="h-5 w-5 text-yellow-600" />
                    <span className="text-yellow-800 font-medium">Not connected</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    Link your account to Azure AD for SSO
                  </p>
                  <button className="mt-2 btn-secondary text-sm">
                    Connect to Azure AD
                  </button>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                <p>Azure integration provides:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Single Sign-On (SSO)</li>
                  <li>Automatic user provisioning</li>
                  <li>Enhanced security</li>
                  <li>Group-based permissions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            
            <div className="space-y-2">
              <button className="w-full btn-secondary text-left">
                Export Data
              </button>
              <button className="w-full btn-secondary text-left">
                Download Backup
              </button>
              <button className="w-full btn-danger text-left">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
