import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-[#16A34A]/10 flex items-center justify-center mb-3">
            <Lock size={28} className="text-[#16A34A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Reset Password</h1>
          <p className="text-sm text-[#64748B] mt-1">Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-[#16A34A]" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">Check Your Email</h2>
            <p className="text-sm text-[#64748B] mb-6">
              If an account with <strong>{email}</strong> exists, we've sent a password reset link.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[#16A34A] hover:text-[#15803D] font-bold text-sm"
            >
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <AlertTriangle size={16} /> {error}
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-[#CBD5E1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'} <Send size={16} />
            </button>
            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-medium text-[#64748B] hover:text-[#16A34A] flex items-center justify-center gap-1">
                <ArrowLeft size={12} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
