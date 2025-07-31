// File: /home/com2u/src/OrganAIzer/frontend/src/services/hasuraService.js
// Purpose: Service for interacting with Hasura GraphQL API via REST endpoints

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

class HasuraService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      credentials: 'include', // Important: include session cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Request failed';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Separate method for checking auth status (not called on every request)
  async getAuthStatus() {
    try {
      const response = await fetch(`${this.baseURL}/auth/status`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        return await response.json();
      }
      return { authenticated: false };
    } catch (error) {
      console.error('Failed to get auth status:', error);
      return { authenticated: false };
    }
  }

  // Helper method to process voting data
  processVotingData(entry, currentUserId = 'dev-user-123') {
    // Calculate total votes from voting array
    const totalVotes = entry.voting ? 
      entry.voting.reduce((sum, vote) => sum + vote.voting, 0) : 0;
    
    // Find current user's vote
    const userVote = entry.voting ? 
      entry.voting.find(vote => vote.user === currentUserId)?.voting || 0 : 0;
    
    // Process labels
    const labels = entry.entrylabels ? 
      entry.entrylabels.map(el => el.label) : [];
    
    return {
      ...entry,
      votes: totalVotes,
      uservote: userVote,
      labels: labels
    };
  }

  // Entries
  async getEntries(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await this.request(`/api/entries?${queryString}`);
    
    // Process voting data for each entry
    if (response.entries) {
      response.entries = response.entries.map(entry => this.processVotingData(entry));
    }
    
    return response;
  }

  async getEntry(id) {
    return this.request(`/api/entries/${id}`);
  }

  async createEntry(entryData) {
    return this.request('/api/entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  async updateEntry(id, entryData) {
    return this.request(`/api/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  }

  async deleteEntry(id) {
    return this.request(`/api/entries/${id}`, {
      method: 'DELETE',
    });
  }

  // Assemblies
  async getAssemblies() {
    return this.request('/api/assemblies');
  }

  async getAssembly(id) {
    return this.request(`/api/assemblies/${id}`);
  }

  async createAssembly(assemblyData) {
    return this.request('/api/assemblies', {
      method: 'POST',
      body: JSON.stringify(assemblyData),
    });
  }

  async updateAssembly(id, assemblyData) {
    return this.request(`/api/assemblies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assemblyData),
    });
  }

  async deleteAssembly(id) {
    return this.request(`/api/assemblies/${id}`, {
      method: 'DELETE',
    });
  }

  async getAssemblyEntries(assemblyId) {
    return this.request(`/api/assemblies/${assemblyId}/entries`);
  }

  // Metadata
  async getMetadata() {
    return this.request('/api/metadata');
  }

  async getTypes() {
    return this.request('/api/types');
  }

  async getStatuses() {
    return this.request('/api/statuses');
  }

  async getLabels() {
    return this.request('/api/labels');
  }

  async getRelations() {
    return this.request('/api/relations');
  }

  async getUsers() {
    // Return mock data for now since we don't have a users endpoint
    return { users: [] };
  }

  async getPermissionGroups() {
    // Return mock data for now since we don't have a permission groups endpoint
    return { permissionGroups: [] };
  }

  async searchEntries(searchTerm) {
    const queryString = new URLSearchParams({ search: searchTerm }).toString();
    const response = await this.request(`/api/entries/search?${queryString}`);
    
    // Process voting data for each entry
    if (response.entries) {
      response.entries = response.entries.map(entry => this.processVotingData(entry));
    }
    
    return response;
  }

  // CRUD operations for metadata
  async createType(typeData) {
    return this.request('/api/types', {
      method: 'POST',
      body: JSON.stringify(typeData),
    });
  }

  async updateType(id, typeData) {
    return this.request(`/api/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(typeData),
    });
  }

  async deleteType(id) {
    return this.request(`/api/types/${id}`, {
      method: 'DELETE',
    });
  }

  async createStatus(statusData) {
    return this.request('/api/statuses', {
      method: 'POST',
      body: JSON.stringify(statusData),
    });
  }

  async updateStatus(id, statusData) {
    return this.request(`/api/statuses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  async deleteStatus(id) {
    return this.request(`/api/statuses/${id}`, {
      method: 'DELETE',
    });
  }

  async createLabel(labelData) {
    return this.request('/api/labels', {
      method: 'POST',
      body: JSON.stringify(labelData),
    });
  }

  async updateLabel(id, labelData) {
    return this.request(`/api/labels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(labelData),
    });
  }

  async deleteLabel(id) {
    return this.request(`/api/labels/${id}`, {
      method: 'DELETE',
    });
  }

  async createRelation(relationData) {
    return this.request('/api/relations', {
      method: 'POST',
      body: JSON.stringify(relationData),
    });
  }

  async updateRelation(id, relationData) {
    return this.request(`/api/relations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(relationData),
    });
  }

  async deleteRelation(id) {
    return this.request(`/api/relations/${id}`, {
      method: 'DELETE',
    });
  }

  // Voting and rating
  async voteEntry(entryKey, vote) {
    return this.request('/api/entries/vote', {
      method: 'POST',
      body: JSON.stringify({ entryKey, vote }),
    });
  }

  async rateEntry(entryKey, rating) {
    return this.request('/api/entries/rate', {
      method: 'POST',
      body: JSON.stringify({ entryKey, rating }),
    });
  }

  // Reordering
  async reorderEntry(entryKey, newRank, assemblyFilter = null) {
    return this.request('/api/entries/reorder', {
      method: 'POST',
      body: JSON.stringify({ entryKey, newRank, assemblyFilter }),
    });
  }

  async getOrderedEntries(assemblyFilter = null) {
    const queryString = assemblyFilter ? 
      `?assemblyFilter=${encodeURIComponent(JSON.stringify(assemblyFilter))}` : '';
    return this.request(`/api/entries/ordered${queryString}`);
  }

  // Report generation
  async generateReport(assemblyId, exportType, entries, options = {}) {
    return this.request('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({
        assemblyId,
        exportType,
        entries,
        options
      }),
    });
  }

  async downloadReport(filename) {
    const response = await fetch(`${this.baseURL}/api/reports/download/${filename}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to download report');
    }
    
    return response.blob();
  }

  // File upload
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}/api/entries/upload`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // Include session cookies
        body: formData, // Don't set Content-Type header, let browser set it with boundary
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Upload failed';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }
}

export const hasuraService = new HasuraService();
