import React, { useState } from 'react';
import { X, Lock, Mail, User, Sparkles, Shield } from 'lucide-react';
import { authAPI } from '../api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (mode === 'login') {
        res = await authAPI.login({ email, password });
      } else {
        res = await authAPI.register({ username, email, password });
      }

      const { token, user } = res.data;
      localStorage.setItem('cinematch_token', token);
      localStorage.setItem('cinematch_user', JSON.stringify(user));
      
      onAuthSuccess(user, mode === 'register');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === 'admin') {
      setEmail('admin@cinematch.ai');
      setPassword('Admin@1234');
      setMode('login');
    } else {
      // Demo user
      setEmail('user@cinematch.ai');
      setPassword('Password123');
      setUsername('Cinephile');
      setMode('login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-violet-500/30 p-8 shadow-2xl shadow-violet-950/60 text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-600/30 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {mode === 'login' ? 'Sign in to access your personalized recommendations' : 'Start discovering movies tailored to your taste'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 mb-6 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${mode === 'login' ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${mode === 'register' ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Cinephile99"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm text-white placeholder-gray-600 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In to CineMatch' : 'Complete Registration')}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <p className="text-[11px] text-center text-gray-500 mb-2">Quick One-Click Test Logins</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-950 border border-violet-800/40 text-[11px] font-medium text-violet-300 hover:bg-violet-950/60 transition-colors"
            >
              <Shield className="w-3 h-3 text-violet-400" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('user')}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-medium text-gray-300 hover:bg-slate-800 transition-colors"
            >
              <User className="w-3 h-3 text-gray-400" />
              <span>User Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
