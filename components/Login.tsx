import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getUsers } from '../services/dataService';
import { saveSupabaseConfig, getStoredSupabaseConfig, isSupabaseConfigured } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Config Modal State
  const [showConfig, setShowConfig] = useState(false);
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
        if (data.length > 0) {
          setSelectedUsername(data[0].username);
        }
      } catch (e) {
        console.error("Failed to load users", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();

    // Load stored config for the modal
    const stored = getStoredSupabaseConfig();
    setConfigUrl(stored.url);
    setConfigKey(stored.key);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === selectedUsername);

    if (user && user.passwordHash === password) {
      onLogin(user);
    } else {
      setError('Invalid password. Please try again.');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configUrl.trim() || !configKey.trim()) {
      alert("Please enter both Supabase URL and Anon Key.");
      return;
    }
    saveSupabaseConfig(configUrl.trim(), configKey.trim());
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-500 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4">
             <i className="fas fa-truck-loading text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Jay Malhar Enterprises</h1>
          <p className="text-slate-500 text-sm mt-1">Log in to manage operations</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <i className="fas fa-spinner fa-spin text-brand-600 text-2xl"></i>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select User</label>
              <div className="relative">
                <i className="fas fa-user absolute left-3 top-3.5 text-slate-400 text-sm"></i>
                <select
                  required
                  value={selectedUsername}
                  onChange={(e) => setSelectedUsername(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all appearance-none bg-white text-slate-700"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.username}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                   <i className="fas fa-chevron-down text-xs"></i>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-3 text-slate-400 text-sm"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-md transition-colors transform active:scale-95"
            >
              Sign In
            </button>
          </form>
        )}
        
        <div className="mt-6 flex justify-between items-center">
          <span className="text-xs text-slate-400">Arihant Aaradhya Site Supply Manager</span>
          <button 
            onClick={() => setShowConfig(true)}
            className="text-slate-400 hover:text-brand-600 transition-colors"
            title="Database Configuration"
          >
            <i className={`fas fa-cog ${isSupabaseConfigured() ? 'text-brand-500' : 'text-slate-300'}`}></i>
          </button>
        </div>
      </div>

      {/* Database Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800">Database Connection</h2>
              <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <i className="fas fa-info-circle text-blue-500 mr-2"></i>
              Enter your <strong>Supabase Project URL</strong> and <strong>Anon Key</strong> below to sync data to the cloud.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://xyz.supabase.co"
                  value={configUrl}
                  onChange={(e) => setConfigUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Anon API Key</label>
                <input
                  type="password"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                 <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-md transition-colors text-sm"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
