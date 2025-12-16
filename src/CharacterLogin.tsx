import React, { useState } from 'react';
import { User, LogIn, UserPlus } from 'lucide-react';
import { api } from './api';

interface User {
  id: number;
  username: string;
}

interface CharacterLoginProps {
  onLogin: (user: User) => void;
}

const CharacterLogin: React.FC<CharacterLoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'create'>('login');
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !userId.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await api.login(username, parseInt(userId));
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Invalid username or user ID');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    try {
      const newUser = await api.createUser(username.trim());
      
      alert(`Character created successfully!\n\nUsername: ${newUser.username}\nUser ID: ${newUser.id}\n\nPlease save your User ID - you'll need it to log in!`);
      
      onLogin(newUser);
    } catch (err: any) {
      setError(err.message || 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <User size={48} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Fitness Tracker</h1>
          <p className="text-gray-600 mt-2">Create your character or login</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode('login');
              setError('');
              setUsername('');
              setUserId('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
              mode === 'login'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <LogIn size={18} className="inline mr-2" />
            Login
          </button>
          <button
            onClick={() => {
              setMode('create');
              setError('');
              setUsername('');
              setUserId('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
              mode === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <UserPlus size={18} className="inline mr-2" />
            Create
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="number"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your user ID"
                min="1"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700 mb-1">
                Choose Username
              </label>
              <input
                type="text"
                id="newUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a unique username"
                disabled={loading}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After creating your character, you'll receive a User ID. 
                Save it - you'll need both your username and User ID to log in!
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Character'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CharacterLogin;
