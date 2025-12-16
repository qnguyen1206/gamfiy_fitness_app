const API_URL = 'http://localhost:5000/api';

export const api = {
  // User endpoints
  async createUser(username: string) {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  },

  async login(username: string, userId: number) {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, userId })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  // Stats endpoints
  async getStats(userId: number) {
    const response = await fetch(`${API_URL}/users/${userId}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async updateStats(userId: number, stats: any) {
    const response = await fetch(`${API_URL}/users/${userId}/stats`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats)
    });
    if (!response.ok) throw new Error('Failed to update stats');
    return response.json();
  },

  // Quest endpoints
  async getQuests(userId: number) {
    const response = await fetch(`${API_URL}/users/${userId}/quests`);
    if (!response.ok) throw new Error('Failed to fetch quests');
    return response.json();
  },

  async updateQuest(userId: number, questId: string, data: any) {
    const response = await fetch(`${API_URL}/users/${userId}/quests/${questId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update quest');
    return response.json();
  }
};
