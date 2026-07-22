import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowLeft, KeyRound } from 'lucide-react';
import { authService } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setError('Invalid reset link.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Invalid Link</h1>
          <p className="text-sm text-[#64748B] mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-[#16A34A] font-bold text-sm">Request a new reset link</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-[#16A34A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Password Reset!</h1>
          <p className="text-sm text-[#64748B] mb-6">Your password has been reset successfully. You can now log in with your new password.</p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all"
          >
            <ArrowLeft size={16} /> Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-[#16A34A]/10 flex items-center justify-center mb-3">
            <KeyRound size={28} className="text-[#16A34A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Set New Password</h1>
          <p className="text-sm text-[#64748B] mt-1">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5 block">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-10 py-3 border border-[#CBD5E1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5 block">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all"
                required
                minLength={6}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'} <KeyRound size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
