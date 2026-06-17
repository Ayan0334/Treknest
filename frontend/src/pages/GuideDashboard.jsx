import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Milestone, Settings, Award, IndianRupee, Users, ShieldAlert, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ClimbingLoader } from '../components/CustomAnimations';
import ImageUploader from '../components/ImageUploader';

export default function GuideDashboard() {
  const { user, token, loading: authLoading, refreshUserData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // States
  const [guideProfile, setGuideProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // User profile states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileCountryCode, setProfileCountryCode] = useState('+91');
  const [profileLocalPhone, setProfileLocalPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');

  // Form edit states
  const [location, setLocation] = useState('Darjeeling');
  const [selectedServices, setSelectedServices] = useState([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [charge, setCharge] = useState(49);
  const [updating, setUpdating] = useState(false);

  // Subscription / Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');

  useEffect(() => {
    if (token) {
      fetchGuideProfile();
    }
  }, [token]);

  const parsePhone = (phoneStr) => {
    if (!phoneStr) return { code: '+91', local: '' };
    const cleanStr = phoneStr.trim();
    const codes = ['+91', '+977', '+975', '+880', '+1', '+44'];
    for (const code of codes) {
      if (cleanStr.startsWith(code)) {
        return {
          code,
          local: cleanStr.slice(code.length).trim()
        };
      }
    }
    if (cleanStr.startsWith('+')) {
      const parts = cleanStr.split(' ');
      if (parts.length > 1) {
        return { code: parts[0], local: parts.slice(1).join(' ') };
      }
    }
    return { code: '+91', local: cleanStr };
  };

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      const parsed = parsePhone(user.phone || '');
      setProfileCountryCode(parsed.code);
      setProfileLocalPhone(parsed.local);
      setProfilePhoto(user.profilePhoto || '');
    }
  }, [user]);

  const fetchGuideProfile = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        const profile = res.data.data.profile;
        if (profile) {
          setGuideProfile(profile);
          setLocation(profile.location);
          setSelectedServices(profile.services || []);
          setWhatsappNumber(profile.whatsappNumber);
          setCharge(profile.charge || 49);
        }
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowSubscribeModal = () => {
    setUpiId('');
    setPaymentMethod('upi');
    setShowPaymentModal(true);
  };

  const processSubscribePayment = async (e) => {
    if (e) e.preventDefault();
    if (!token) return;

    setPaymentLoading(true);
    try {
      // Step 1: Create subscription order
      const orderRes = await axios.post('http://localhost:5000/api/guides/subscribe-order', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (orderRes.data.status === 'success') {
        const { orderId, amount, currency, isMock, key } = orderRes.data.data;

        if (isMock) {
          // Simulate Razorpay UPI/Card Verification delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          const paymentId = `pay_guidesub_${Math.random().toString(36).substr(2, 9)}`;

          // Verify subscription payment on backend
          const verifyRes = await axios.post('http://localhost:5000/api/guides/subscribe-verify', {
            orderId,
            paymentId,
            status: 'success'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (verifyRes.data.status === 'success') {
            setShowPaymentModal(false);
            alert('Listing active! Your guide profile is now hosted and you have earned the Verified Local Guide badge.');
            fetchGuideProfile();
          }
        } else {
          // Real Razorpay Checkout Integration
          const scriptLoaded = await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });

          if (!scriptLoaded) {
            alert('Razorpay SDK failed to load. Are you online?');
            setPaymentLoading(false);
            return;
          }

          const options = {
            key: key,
            amount: amount,
            currency: currency,
            name: "TrekNest Guide Hosting",
            description: "1 Month Guide Registration Fee",
            order_id: orderId,
            handler: async function (response) {
              try {
                setPaymentLoading(true);
                const verifyRes = await axios.post('http://localhost:5000/api/guides/subscribe-verify', {
                  orderId: orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  status: 'success'
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                if (verifyRes.data.status === 'success') {
                  setShowPaymentModal(false);
                  alert('Listing active! Your guide profile is now hosted and you have earned the Verified Local Guide badge.');
                  fetchGuideProfile();
                }
              } catch (err) {
                alert(err.response?.data?.message || 'Payment verification failed.');
              } finally {
                setPaymentLoading(false);
              }
            },
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
              contact: user?.phone || ''
            },
            theme: {
              color: "#FBBF24"
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment verification failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    // Country-based validation
    const cleanedLocal = profileLocalPhone.replace(/\D/g, '');
    let isValid = false;
    let errorMsg = '';
    
    if (profileCountryCode === '+91') {
      isValid = /^[6-9]\d{9}$/.test(cleanedLocal);
      errorMsg = 'Indian mobile numbers must be 10 digits and start with 6-9.';
    } else if (profileCountryCode === '+977') {
      isValid = /^9\d{9}$/.test(cleanedLocal);
      errorMsg = 'Nepalese mobile numbers must be 10 digits and start with 9.';
    } else if (profileCountryCode === '+975') {
      isValid = /^[17]\d{7}$/.test(cleanedLocal);
      errorMsg = 'Bhutanese mobile numbers must be 8 digits.';
    } else if (profileCountryCode === '+880') {
      isValid = /^1[3-9]\d{8}$/.test(cleanedLocal);
      errorMsg = 'Bangladeshi mobile numbers must be 10 digits (e.g. 17XXXXXXXX).';
    } else {
      isValid = /^\d{4,12}$/.test(cleanedLocal);
      errorMsg = 'Please enter a valid local phone number (4 to 12 digits).';
    }
    
    if (profileLocalPhone && !isValid) {
      alert(errorMsg);
      return;
    }

    setUpdating(true);
    const fullPhone = profileLocalPhone ? `${profileCountryCode} ${cleanedLocal}` : '';

    try {
      setUpdating(true);
      // 1. Update user profile details
      await axios.put('http://localhost:5000/api/auth/profile', {
        name: profileName,
        phone: fullPhone,
        profilePhoto
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Update guide profile details
      const res = await axios.put('http://localhost:5000/api/guides/profile', {
        location,
        services: selectedServices,
        whatsappNumber: fullPhone,
        charge
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === 'success') {
        alert('Guide profile updated successfully!');
        fetchGuideProfile();
        if (typeof refreshUserData === 'function') {
          await refreshUserData(token);
        }
      }
    } catch (err) {
      alert('Failed to update guide profile.');
    } finally {
      setUpdating(false);
    }
  };

  const toggleService = (srv) => {
    if (selectedServices.includes(srv)) {
      setSelectedServices(selectedServices.filter(s => s !== srv));
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const regions = [
    'Darjeeling', 'Kurseong', 'Kalimpong', 'Sandakphu', 'Phalut',
    'Tonglu', 'Tumling', 'Sikkim', 'Shillong', 'Meghalaya', 'North Bengal Himalayan Region'
  ];

  const servicesList = [
    'Permit assistance', 'Local support', 'Transport arrangements', 'Emergency help', 'Homestay arrangements'
  ];

  if (loading || authLoading || !user) return <div className="py-20"><ClimbingLoader message="Syncing marketplace registry..." /></div>;

  const totalUnlocks = guideProfile?.unlockedBy?.length || 0;
  const now = new Date();
  const isActive = guideProfile?.verificationStatus === 'approved' && 
                   (guideProfile?.activeUntil && new Date(guideProfile.activeUntil) > now);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8"
    >
      {/* Earnings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-adventure-muted uppercase font-bold block">Marketplace Status</span>
            <span className={`text-base font-black uppercase ${isActive ? 'text-adventure-green' : 'text-adventure-yellow'}`}>
              {isActive ? 'Hosted / Active' : 'Inactive / Expired'}
            </span>
          </div>
          <Award className="text-adventure-yellow w-8 h-8 opacity-45" />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-adventure-muted uppercase font-bold block">Trekkers Contacted</span>
            <span className="text-2xl font-black text-white">{totalUnlocks}</span>
            <span className="text-[10px] text-adventure-muted block mt-0.5">Contact details unlocked</span>
          </div>
          <Users className="text-adventure-yellow w-8 h-8 opacity-45" />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-adventure-muted uppercase font-bold block">Hosting Expiry</span>
            <span className="text-sm font-black text-white">
              {guideProfile?.activeUntil 
                ? new Date(guideProfile.activeUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Payment Required'}
            </span>
            <span className="text-[10px] text-adventure-muted block mt-0.5">₹50 listing subscription</span>
          </div>
          <IndianRupee className="text-adventure-yellow w-8 h-8 opacity-45" />
        </div>
      </div>

      {/* Expiry Warning / Pay Banner */}
      {!isActive && (
        <div className="bg-adventure-yellow/10 border border-adventure-yellow/30 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-black uppercase text-adventure-yellow tracking-wider flex items-center justify-center md:justify-start space-x-1.5">
              <ShieldAlert size={14} />
              <span>Listing Inactive / Expired</span>
            </span>
            <p className="text-xs text-adventure-muted">
              To host your profile and appear in the Guides Marketplace with a Verified Local Guide badge, pay a nominal ₹50 fee valid for 1 month.
            </p>
          </div>
          <button
            onClick={handleShowSubscribeModal}
            className="py-2.5 px-6 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-yellow-glow flex-shrink-0"
          >
            Pay Hosting Fee (₹50)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 columns: Edit Profile */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
          <h3 className="font-extrabold text-sm uppercase text-adventure-yellow tracking-widest border-b border-white/5 pb-3">Edit Guide Profile</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Full Name</label>
                <input
                  required
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-adventure-yellow"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Phone / WhatsApp Number</label>
                <div className="flex gap-2">
                  <select
                    value={profileCountryCode}
                    onChange={(e) => setProfileCountryCode(e.target.value)}
                    className="bg-[#121212] border border-white/10 rounded-xl px-2 text-xs text-white focus:outline-none focus:border-adventure-yellow w-28"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+977">🇳🇵 +977</option>
                    <option value="+975">🇧🇹 +975</option>
                    <option value="+880">🇧🇩 +880</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <input
                    required
                    type="tel"
                    value={profileLocalPhone}
                    onChange={(e) => setProfileLocalPhone(e.target.value)}
                    className="flex-grow bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                    placeholder="9876543210"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <ImageUploader
                  label="Profile Photo (DP)"
                  presetUrl={profilePhoto}
                  onUploadSuccess={(url) => setProfilePhoto(url)}
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Location Region</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-adventure-yellow"
                  >
                    {regions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Contact Unlock Fee</label>
                  <select
                    value={charge}
                    onChange={(e) => setCharge(parseInt(e.target.value))}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-adventure-yellow"
                  >
                    <option value="49">₹49 (Standard)</option>
                    <option value="99">₹99 (Premium)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1">Services Offered</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {servicesList.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleService(s)}
                    className={`p-3 text-[10px] font-bold text-left rounded-lg border flex items-center space-x-1.5 transition-colors ${selectedServices.includes(s) ? 'border-adventure-yellow bg-adventure-yellow/15 text-adventure-yellow' : 'border-white/5 bg-[#121212] text-adventure-muted'}`}
                  >
                    <Milestone size={12} />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-3 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow hover:bg-white"
            >
              {updating ? 'Saving...' : 'Update Marketplace Profile'}
            </button>
          </form>
        </div>

        {/* Right 1 Column: Unlock History */}
        <div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 shadow-premium">
            <h3 className="font-extrabold text-sm uppercase text-white tracking-wide border-b border-white/5 pb-2">Unlock History</h3>
            
            {totalUnlocks === 0 ? (
              <p className="text-xs text-adventure-muted py-6 text-center">No unlock records yet. Get approved and list your services to attract trekkers.</p>
            ) : (
              <div className="space-y-2.5">
                {guideProfile?.unlockedBy && guideProfile.unlockedBy.map((hiker, idx) => (
                  <div key={idx} className="p-3.5 bg-white/5 rounded-xl border border-white/5 text-xs space-y-1">
                    <span className="font-bold text-white block">{hiker.name || 'Hiker'}</span>
                    <div className="text-[10px] text-adventure-muted space-y-0.5 mt-1">
                      <div>Phone: <a href={`tel:${hiker.phone}`} className="text-adventure-yellow hover:underline">{hiker.phone || 'N/A'}</a></div>
                      <div>Email: <a href={`mailto:${hiker.email}`} className="text-adventure-yellow hover:underline">{hiker.email || 'N/A'}</a></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Checkout Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel p-6 rounded-3xl border border-adventure-yellow/30 max-w-sm w-full text-center space-y-6 shadow-premium relative overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-black text-sm uppercase text-white tracking-wider">TrekNest Secure Checkout</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-adventure-muted hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 text-left space-y-2">
              <span className="text-[9px] text-adventure-muted uppercase block font-bold text-left">Listing Hosting Plan</span>
              <span className="text-base font-black text-adventure-yellow uppercase">1 Month Guide Listing</span>
              <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-white/5 mt-2">
                <span className="text-white">Amount Due</span>
                <span className="text-adventure-yellow text-base font-black">₹50</span>
              </div>
            </div>

            <form onSubmit={processSubscribePayment} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border text-center transition-all ${paymentMethod === 'upi' ? 'border-adventure-yellow bg-adventure-yellow/15 text-adventure-yellow' : 'border-white/5 bg-[#121212] text-adventure-grey'}`}
                  >
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border text-center transition-all ${paymentMethod === 'card' ? 'border-adventure-yellow bg-adventure-yellow/15 text-adventure-yellow' : 'border-white/5 bg-[#121212] text-adventure-grey'}`}
                  >
                    Credit / Debit Card
                  </button>
                </div>
              </div>

              {paymentMethod === 'upi' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Enter UPI ID</label>
                  <input
                    required
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                    placeholder="username@okaxis"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-adventure-muted block">Card Number</label>
                    <input
                      required
                      type="text"
                      maxLength="19"
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none"
                      placeholder="XXXX XXXX XXXX XXXX"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-adventure-muted block">Expiry Date</label>
                      <input
                        required
                        type="text"
                        maxLength="5"
                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-adventure-muted block">CVV</label>
                      <input
                        required
                        type="password"
                        maxLength="3"
                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none"
                        placeholder="•••"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={paymentLoading}
                className="w-full py-4 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow hover:bg-white"
              >
                {paymentLoading ? 'Authenticating Gateway...' : 'Pay ₹50 Securely'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
