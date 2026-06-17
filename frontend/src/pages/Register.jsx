import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Compass, Milestone, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  // URL query params pre-fill
  const paramEmail = queryParams.get('email') || '';
  const paramOtp = queryParams.get('otp') || '';

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState(paramEmail);
  const [countryCode, setCountryCode] = useState('+91');
  const [localPhone, setLocalPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('trekker');
  const [otp, setOtp] = useState(paramOtp);

  // Guide specific fields
  const [location, setLocation] = useState('Darjeeling');
  const [selectedServices, setSelectedServices] = useState(['Local support']);

  // OTP delivery tracking
  const [otpSent, setOtpSent] = useState(!!paramOtp);
  const [mockOtp, setMockOtp] = useState(paramOtp ? 'Pre-verified from Login' : '');

  // Feedback states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(paramOtp ? 'Email pre-verified successfully!' : '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paramEmail) setEmail(paramEmail);
    if (paramOtp) {
      setOtp(paramOtp);
      setOtpSent(true);
      setMockOtp('Pre-verified from Login');
      setSuccess('Email pre-verified successfully!');
    }
  }, [paramEmail, paramOtp]);

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please provide an email address first.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/send-otp', { email, purpose: 'register' });
      if (res.data.status === 'success') {
        setOtpSent(true);
        setMockOtp(res.data.otp || '');
        setSuccess(`Verification OTP code dispatched to ${email}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Email verification code is required to complete registration.');
      return;
    }

    // Country-based phone validation
    const cleanedLocal = localPhone.replace(/\D/g, '');
    let isValid = false;
    let errorMsg = '';
    
    if (countryCode === '+91') {
      isValid = /^[6-9]\d{9}$/.test(cleanedLocal);
      errorMsg = 'Indian mobile numbers must be 10 digits and start with 6-9.';
    } else if (countryCode === '+977') {
      isValid = /^9\d{9}$/.test(cleanedLocal);
      errorMsg = 'Nepalese mobile numbers must be 10 digits and start with 9.';
    } else if (countryCode === '+975') {
      isValid = /^[17]\d{7}$/.test(cleanedLocal);
      errorMsg = 'Bhutanese mobile numbers must be 8 digits.';
    } else if (countryCode === '+880') {
      isValid = /^1[3-9]\d{8}$/.test(cleanedLocal);
      errorMsg = 'Bangladeshi mobile numbers must be 10 digits (e.g. 17XXXXXXXX).';
    } else {
      isValid = /^\d{4,12}$/.test(cleanedLocal);
      errorMsg = 'Please enter a valid local phone number (4 to 12 digits).';
    }
    
    if (localPhone && !isValid) {
      setError(errorMsg);
      return;
    }

    setError('');
    setLoading(true);

    const fullPhone = localPhone ? `${countryCode} ${cleanedLocal}` : '';

    const payload = {
      name,
      email,
      phone: fullPhone,
      password,
      role,
      otp
    };

    if (role === 'guide') {
      payload.location = location;
      payload.services = selectedServices;
    }

    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const regions = [
    'Darjeeling', 'Kurseong', 'Kalimpong', 'Sandakphu', 'Phalut',
    'Tonglu', 'Tumling', 'Sikkim', 'Shillong', 'Meghalaya', 'North Bengal Himalayan Region'
  ];

  const servicesList = [
    'Permit assistance', 'Local support', 'Transport arrangements', 'Emergency help', 'Homestay arrangements'
  ];

  const toggleService = (srv) => {
    if (selectedServices.includes(srv)) {
      setSelectedServices(selectedServices.filter(s => s !== srv));
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto px-4 py-12"
    >
      <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-premium text-center space-y-6">
        
        <div className="flex flex-col items-center">
          <Compass className="w-12 h-12 text-adventure-yellow mb-2 animate-spin-slow" />
          <h2 className="text-2xl font-black uppercase tracking-wide text-white">Create an Account</h2>
          <p className="text-xs text-adventure-muted">Begin your Himalayan booking journey</p>
        </div>

        {error && <div className="text-xs text-adventure-red bg-adventure-red/10 border border-adventure-red/20 py-2.5 rounded-lg">{error}</div>}
        {success && <div className="text-xs text-adventure-green bg-adventure-green/10 border border-adventure-green/20 py-2.5 rounded-lg">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-adventure-muted block">Account Role</label>
            <div className="grid grid-cols-3 gap-2">
              {['trekker', 'organizer', 'guide'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border text-center transition-all ${role === r ? 'border-adventure-yellow bg-adventure-yellow/15 text-adventure-yellow' : 'border-white/5 bg-[#121212] text-adventure-grey'}`}
                >
                  {r === 'trekker' ? 'Trekker' : r === 'organizer' ? 'Leader' : 'Local Guide'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-adventure-muted block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-adventure-muted w-4 h-4" />
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                placeholder="John Doe"
              />
            </div>
          </div>

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
                  className="px-4 bg-white/5 border border-white/10 hover:border-adventure-yellow/30 font-bold text-xs rounded-xl uppercase tracking-wider text-white"
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
                    disabled={!!paramOtp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-adventure-yellow font-mono tracking-widest text-center"
                    placeholder="XXXXXX"
                  />
                </div>
                {mockOtp && mockOtp !== 'Pre-verified from Login' && (
                  <span className="text-[10px] text-adventure-yellow bg-adventure-yellow/5 px-2.5 py-1 rounded inline-block font-mono">
                    Local developer OTP: {mockOtp}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-adventure-muted block">Phone Number</label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-[#121212] border border-white/10 rounded-xl px-2 text-xs text-white focus:outline-none focus:border-adventure-yellow w-28"
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+977">🇳🇵 +977</option>
                <option value="+975">🇧🇹 +975</option>
                <option value="+880">🇧🇩 +880</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
              </select>
              <div className="relative flex-grow">
                <Phone className="absolute left-3.5 top-3.5 text-adventure-muted w-4 h-4" />
                <input
                  required
                  type="tel"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                  placeholder="9876543210"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-adventure-muted block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-adventure-muted w-4 h-4" />
              <input
                required
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Guide fields */}
          {role === 'guide' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-white/10 pt-4 space-y-4"
            >
              <div>
                <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1">Guide Location Region</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                >
                  {regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1">Services Offered</label>
                <div className="grid grid-cols-2 gap-2">
                  {servicesList.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleService(s)}
                      className={`p-2 text-[9px] font-bold text-left rounded-lg border flex items-center space-x-1.5 transition-colors ${selectedServices.includes(s) ? 'border-adventure-yellow bg-adventure-yellow/15 text-adventure-yellow' : 'border-white/5 bg-[#121212] text-adventure-muted'}`}
                    >
                      <Milestone size={10} />
                      <span className="truncate">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || !otpSent}
            className="w-full py-3.5 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow disabled:opacity-50 hover:bg-white hover:text-adventure-black"
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>

        <div className="text-xs text-adventure-muted border-t border-white/5 pt-4">
          <span>Already have an account? </span>
          <Link to="/login" className="text-adventure-yellow hover:underline font-bold">Sign In</Link>
        </div>

      </div>
    </motion.div>
  );
}
