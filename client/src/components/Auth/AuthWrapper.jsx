import React, { useState } from 'react';
import { MessageSquare, Shield, Zap, Lock, Mail, User, Eye, EyeOff, Sparkles, CheckCircle2, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AuthWrapper = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    otp: ''
  });

  const { loginUser, requestOtp, registerUser, loading, error } = useAuth();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email) return;

    const res = await requestOtp(formData.email);
    if (res?.success) {
      setOtpSent(true);
      if (res.demoOtp) {
        setDemoOtpCode(res.demoOtp);
        setFormData((prev) => ({ ...prev, otp: res.demoOtp })); // Auto fill for ease of demo testing
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await loginUser(formData.email || formData.username, formData.password);
    } else {
      if (!otpSent) {
        await handleSendOtp(e);
      } else {
        await registerUser(formData.username, formData.email, formData.password, formData.otp);
      }
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
            Real-Time Socket.IO • 12H Self-Deleting Chat Engine
          </span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">ConnectHub</h1>
        </div>
        <p className="text-slate-400 text-sm mt-2 max-w-sm">
          Instant WebSocket communication with Email OTP Auth, search by email, and auto-purged chat history.
        </p>
      </div>

      {/* Card Form */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl z-10 border border-slate-800/80 animate-slide-up">
        {/* Tab Toggle */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setOtpSent(false); }}
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
            onClick={() => { setIsLogin(false); setOtpSent(false); }}
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
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
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
                  className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              {isLogin ? 'Email or Username' : 'Email Address (1 Account per Email)'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type={isLogin ? 'text' : 'email'}
                required
                disabled={!isLogin && otpSent}
                placeholder={isLogin ? 'alex@connecthub.com or alex_dev' : 'alex@connecthub.com'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-60"
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
                className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
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

          {/* OTP Input Field for Registration Step 2 */}
          {!isLogin && otpSent && (
            <div className="animate-fade-in space-y-2">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                <span>📩 OTP Code Sent! Demo Code:</span>
                <span className="font-mono font-bold text-sm bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                  {demoOtpCode}
                </span>
              </div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Enter 6-Digit OTP Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 739201"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  className="w-full bg-slate-900/90 border border-amber-500/60 rounded-xl py-3 pl-10 pr-4 text-sm font-mono text-amber-300 tracking-widest text-center placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <span>Sign In to ConnectHub</span>
                <Zap className="w-4 h-4" />
              </>
            ) : !otpSent ? (
              <>
                <span>Send Email OTP Code</span>
                <Mail className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Verify OTP & Create Account</span>
                <CheckCircle2 className="w-4 h-4" />
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
    </div>
  );
};
