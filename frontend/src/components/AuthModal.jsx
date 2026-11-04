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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#17151B]/95 border border-white/[0.12] p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] text-[#F1E9DF] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#30243B]/30 rounded-full blur-[80px] pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-[#E5BD72] shadow-[0_0_20px_rgba(229,189,114,0.15)] mb-3">
            <Sparkles className="w-6 h-6 text-[#E5BD72]" />
          </div>
          <h2 className="text-2xl font-black font-['Outfit'] text-[#F1E9DF]">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' ? 'Sign in to access your personalized recommendations' : 'Start discovering movies tailored to your taste'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 mb-6 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold relative z-10">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${mode === 'login' ? 'bg-gradient-to-r from-[#E5BD72] to-[#F1E9DF] text-[#101014] font-bold shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${mode === 'register' ? 'bg-gradient-to-r from-[#E5BD72] to-[#F1E9DF] text-[#101014] font-bold shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs relative z-10">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Cinephile99"
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-[#F1E9DF] placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-[#F1E9DF] placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-[#F1E9DF] placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl glass-btn-gold font-bold text-sm shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In to CineMatch' : 'Complete Registration')}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] relative z-10">
          <p className="text-[11px] text-center text-slate-400 mb-2 font-medium">Quick One-Click Test Logins</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/[0.04] border border-[#E5BD72]/30 text-[11px] font-semibold text-[#E5BD72] hover:bg-white/[0.08] transition-colors"
            >
              <Shield className="w-3 h-3 text-[#E5BD72]" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('user')}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-slate-300 hover:bg-white/[0.08] transition-colors"
            >
              <User className="w-3 h-3 text-slate-400" />
              <span>User Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
