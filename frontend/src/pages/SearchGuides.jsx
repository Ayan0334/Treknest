import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Phone, Mail, Award, CheckCircle2, MessageSquare, Star, Search, ShieldCheck, MapPin } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ClimbingLoader } from '../components/CustomAnimations';

export default function SearchGuides() {
  const { user, token } = useAuth();
  
  // States
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [service, setService] = useState('');
  const [unlockingGuideId, setUnlockingGuideId] = useState(null);
  const [unlockLoading, setUnlockLoading] = useState(false);

  useEffect(() => {
    fetchGuides();
  }, [location, service]);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/guides';
      let params = [];
      if (location) params.push(`location=${location}`);
      if (service) params.push(`service=${service}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await axios.get(url);
      if (res.data.status === 'success') {
        setGuides(res.data.data.guides);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockContact = async (guideId) => {
    if (!user || !token) {
      alert('Please sign in to unlock guide contact information.');
      return;
    }

    try {
      setUnlockingGuideId(guideId);
      setUnlockLoading(true);

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Step 1: Create Order
      const orderRes = await axios.post(`http://localhost:5000/api/guides/${guideId}/unlock-order`, {}, config);

      if (orderRes.data.status === 'success') {
        const { orderId, amount, currency, isMock, key } = orderRes.data.data;

        if (isMock) {
          // Simulate a small Razorpay payment delay
          setTimeout(async () => {
            try {
              const res = await axios.post(`http://localhost:5000/api/guides/${guideId}/unlock-verify`, {
                orderId,
                paymentId: `pay_unlock_${Math.random().toString(36).substr(2, 9)}`,
                status: 'success'
              }, config);
              if (res.data.status === 'success') {
                alert('Guide contact successfully unlocked!');
                fetchGuides(); // Reload guide list to reflect unlocked fields
              }
            } catch (err) {
              alert('Failed to unlock contact. Please try again.');
            } finally {
              setUnlockingGuideId(null);
              setUnlockLoading(false);
            }
          }, 1500);
        } else {
          // Real Razorpay payment integration!
          const scriptLoaded = await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });

          if (!scriptLoaded) {
            alert('Razorpay SDK failed to load. Are you online?');
            setUnlockingGuideId(null);
            setUnlockLoading(false);
            return;
          }

          const options = {
            key: key,
            amount: amount,
            currency: currency,
            name: "TrekNest Guide Marketplace",
            description: "Unlock Guide Contact Details",
            order_id: orderId,
            handler: async function (response) {
              try {
                setUnlockLoading(true);
                const verifyRes = await axios.post(`http://localhost:5000/api/guides/${guideId}/unlock-verify`, {
                  orderId: orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  status: 'success'
                }, config);

                if (verifyRes.data.status === 'success') {
                  alert('Guide contact successfully unlocked!');
                  fetchGuides();
                }
              } catch (err) {
                alert(err.response?.data?.message || 'Payment verification failed.');
              } finally {
                setUnlockingGuideId(null);
                setUnlockLoading(false);
              }
            },
            prefill: {
              name: user.name,
              email: user.email,
              contact: user.phone
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
      alert(err.response?.data?.message || 'Failed to unlock contact.');
      setUnlockingGuideId(null);
      setUnlockLoading(false);
    }
  };

  const regions = [
    'Darjeeling', 'Kurseong', 'Kalimpong', 'Sandakphu', 'Phalut',
    'Tonglu', 'Tumling', 'Sikkim', 'Shillong', 'Meghalaya', 'North Bengal Himalayan Region'
  ];

  const servicesList = [
    'Permit assistance', 'Local support', 'Transport arrangements', 'Emergency help', 'Homestay arrangements'
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-wide">Guides Marketplace</h1>
        <p className="text-xs text-adventure-muted mt-1">Hire certified, local experts for high-altitude support and permissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Panel */}
        <div className="glass-panel p-6 rounded-2xl h-fit border border-white/5 space-y-4">
          <h3 className="font-extrabold text-sm uppercase text-adventure-yellow tracking-widest mb-4">Guide Filters</h3>

          <div>
            <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1.5">Region Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
            >
              <option value="">All Regions</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1.5">Required Service</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
            >
              <option value="">Any Service</option>
              {servicesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Guides List */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <ClimbingLoader message="Scanning guides marketplace..." />
          ) : guides.length === 0 ? (
            <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center">
              <Lock size={32} className="text-adventure-muted mb-3" />
              <h3 className="text-lg font-bold text-white uppercase mb-1">No Guides Listed</h3>
              <p className="text-xs text-adventure-muted max-w-sm">No guides matching this filter criteria have listed their profiles yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guides.map((g) => (
                <div 
                  key={g._id}
                  className="rounded-2xl glass-panel p-6 border border-white/5 shadow-premium flex flex-col h-full space-y-4 hover:border-white/10"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={g.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'} 
                        alt={g.name} 
                        className="w-12 h-12 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wide">{g.name}</h3>
                          {g.badges?.includes('Verified Local Guide') ? (
                            <ShieldCheck size={14} className="text-adventure-yellow fill-adventure-yellow/15" title="Verified Local Guide" />
                          ) : (
                            <ShieldCheck size={14} className="text-adventure-grey opacity-45" title="Unverified Listing" />
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-adventure-muted text-[11px] mt-0.5">
                          <MapPin size={10} className="text-adventure-yellow" />
                          <span>{g.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-adventure-yellow text-[10px] font-bold bg-adventure-yellow/10 border border-adventure-yellow/20 px-2 py-0.5 rounded-full">
                      <Star size={8} className="fill-adventure-yellow text-adventure-yellow" />
                      <span>{g.ratings}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-adventure-muted uppercase block font-bold">Services offered</span>
                    <div className="flex flex-wrap gap-1.5">
                      {g.services.map((s, idx) => (
                        <span key={idx} className="bg-white/5 px-2.5 py-1 rounded text-[10px] text-adventure-grey border border-white/5">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Unlock details card */}
                  <div className="border-t border-white/5 pt-4 mt-auto space-y-3">
                    {g.isUnlocked ? (
                      <div className="bg-adventure-green/5 border border-adventure-green/20 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center space-x-1 text-adventure-green text-xs font-bold uppercase tracking-wide">
                          <Unlock size={12} />
                          <span>Contact Unlocked</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                          <Phone size={12} className="text-adventure-green" />
                          <span>{g.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                          <Mail size={12} className="text-adventure-green" />
                          <span>{g.email}</span>
                        </div>
                        <a 
                          href={`https://wa.me/${g.whatsappNumber.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center space-x-2 py-2 bg-adventure-green text-white font-extrabold text-xs uppercase tracking-wider rounded-lg hover:bg-white hover:text-adventure-green transition-colors mt-2"
                        >
                          <CheckCircle2 size={12} />
                          <span>WhatsApp Guide</span>
                        </a>
                      </div>
                    ) : (
                      <div className="bg-[#151515] border border-white/5 rounded-xl p-4 text-center space-y-3">
                        <div className="flex items-center justify-center space-x-1 text-adventure-muted text-xs font-bold uppercase">
                          <Lock size={12} className="text-adventure-yellow" />
                          <span>Contact details hidden</span>
                        </div>
                        <p className="text-[10px] text-adventure-muted">Unlock direct access to this guide's phone, email and Whatsapp.</p>
                        
                        <button
                          onClick={() => handleUnlockContact(g._id)}
                          disabled={unlockingGuideId === g._id}
                          className="w-full py-2.5 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white hover:text-adventure-black transition-all shadow-yellow-glow flex items-center justify-center space-x-1.5"
                        >
                          <span>{unlockingGuideId === g._id ? 'Processing UPI...' : `Unlock Contact for ₹${g.charge}`}</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
