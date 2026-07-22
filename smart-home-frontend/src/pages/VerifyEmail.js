import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may be expired or invalid.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center mb-4">
              <Loader2 size={32} className="text-[#16A34A] animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Verifying your email...</h1>
            <p className="text-sm text-[#64748B]">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-[#16A34A]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Email Verified!</h1>
            <p className="text-sm text-[#64748B] mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all"
            >
              <ArrowLeft size={16} /> Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Verification Failed</h1>
            <p className="text-sm text-[#64748B] mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-[#CBD5E1] hover:bg-gray-50 text-[#475569] font-bold text-sm px-6 py-3 rounded-xl transition-all"
              >
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
