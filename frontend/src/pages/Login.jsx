import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { KeyRound, Mail, Compass, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export default function Login() {
  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  // Mode state: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState('password');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // OTP delivery tracking
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  
  // Feedback states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/send-otp', { email, purpose: 'login' });
      if (res.data.status === 'success') {
        setOtpSent(true);
        setMockOtp(res.data.otp || '');
        setSuccess(`A 6-digit verification code has been dispatched to ${email}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      setError('Please provide email and verification code.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await loginWithOtp(email, otp);
      setLoading(false);

      if (res.success) {
        if (res.isNewUser) {
          // Redirect to register with email/otp pre-filled
          alert(res.message);
          navigate(`/register?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
        } else {
          // Logged in!
          navigate('/');
        }
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('OTP verification failed.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto px-4 py-20"
    >
      <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-premium text-center space-y-6">
        <div className="flex flex-col items-center">
          <Compass className="w-12 h-12 text-adventure-yellow mb-2 animate-spin-slow" />
          <h2 className="text-2xl font-black uppercase tracking-wide text-white">Sign In to TrekNest</h2>
          <p className="text-xs text-adventure-muted">Plan your next alpine summit</p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 bg-[#121212] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => {
              setLoginMode('password');
              setError('');
              setSuccess('');
            }}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg text-center transition-all ${loginMode === 'password' ? 'bg-adventure-yellow text-adventure-black' : 'text-adventure-grey'}`}
          >
            Password
          </button>
          <button
            onClick={() => {
              setLoginMode('otp');
              setError('');
              setSuccess('');
            }}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg text-center transition-all ${loginMode === 'otp' ? 'bg-adventure-yellow text-adventure-black' : 'text-adventure-grey'}`}
          >
            Email OTP
          </button>
        </div>

        {error && <div className="text-xs text-adventure-red bg-adventure-red/10 border border-adventure-red/20 py-2.5 rounded-lg">{error}</div>}
        {success && <div className="text-xs text-adventure-green bg-adventure-green/10 border border-adventure-green/20 py-2.5 rounded-lg">{success}</div>}

        {loginMode === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-adventure-muted block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-adventure-muted w-4 h-4" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-adventure-muted block">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 text-adventure-muted w-4 h-4" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow hover:bg-white hover:text-adventure-black"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-adventure-muted block">Email Address</label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Mail className="absolute left-3.5 top-3.5 text-adventure-muted w-4 h-4" />
                  <input
                    required
                    type="email"
                    value={email}
                    disabled={otpSent}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                    placeholder="you@email.com"
                  />
                </div>
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="px-4 bg-white/5 border border-white/10 hover:border-adventure-yellow/30 font-bold text-xs rounded-xl uppercase tracking-wider whitespace-nowrap text-white"
                  >
                    Send OTP
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Enter Verification Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-3.5 text-adventure-muted w-4 h-4" />
                    <input
                      required
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-adventure-yellow font-mono tracking-widest text-center"
                      placeholder="XXXXXX"
                    />
                  </div>
                  {mockOtp && (
                    <span className="text-[10px] text-adventure-yellow bg-adventure-yellow/5 px-2.5 py-1 rounded inline-block font-mono">
                      Local developer OTP: {mockOtp}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-grow py-3.5 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow hover:bg-white"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    className="px-4 border border-white/10 text-white rounded-xl hover:border-adventure-yellow text-xs font-bold uppercase"
                  >
                    Change Email
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        )}

        <div className="text-xs text-adventure-muted border-t border-white/5 pt-4">
          <span>New to TrekNest? </span>
          <Link to="/register" className="text-adventure-yellow hover:underline font-bold">Create an Account</Link>
        </div>
      </div>
    </motion.div>
  );
}
