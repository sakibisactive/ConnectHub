import React, { useState } from 'react';
import { MessageSquare, Shield, Zap, Lock, Mail, User, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AuthWrapper = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const { loginUser, registerUser, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await loginUser(formData.email || formData.username, formData.password);
    } else {
      await registerUser(formData.username, formData.email, formData.password);
    }
  };

  const handleDemoLogin = (email, password) => {
    loginUser(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden p-4">
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 z-10 animate-fade-in">
        <div className="inline-flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
            Real-Time Socket.IO & Redis Engine
          </span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">ConnectHub</h1>
        </div>
        <p className="text-slate-400 text-sm mt-2 max-w-sm">
          Next-generation real-time messaging with instant presence, typing feedback, and read receipts.
        </p>
      </div>

      {/* Card Form */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl z-10 border border-slate-800/80 animate-slide-up">
        {/* Tab Toggle */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              isLogin
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              !isLogin
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. alex_dev"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              {isLogin ? 'Email or Username' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type={isLogin ? 'text' : 'email'}
                required
                placeholder={isLogin ? 'alex@connecthub.com or alex_dev' : 'alex@connecthub.com'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In to ConnectHub' : 'Create Account'}</span>
                <Zap className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Accounts Helper */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-400 font-medium mb-3 text-center">
            🚀 Quick Demo Login Accounts (Click to test):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('alex@connecthub.com', 'password123')}
              className="py-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl text-left border border-slate-700/50 transition-all flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Alex (Dev)</span>
            </button>
            <button
              onClick={() => handleDemoLogin('sarah@connecthub.com', 'password123')}
              className="py-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl text-left border border-slate-700/50 transition-all flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Sarah (Design)</span>
            </button>
            <button
              onClick={() => handleDemoLogin('john@connecthub.com', 'password123')}
              className="py-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl text-left border border-slate-700/50 transition-all flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span>John (Admin)</span>
            </button>
            <button
              onClick={() => handleDemoLogin('emily@connecthub.com', 'password123')}
              className="py-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl text-left border border-slate-700/50 transition-all flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Emily (Tech)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-slate-500 text-xs z-10 flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-blue-400" /> End-to-End JWT Auth
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Redis Cache Engine
        </span>
      </div>
    </div>
  );
};
