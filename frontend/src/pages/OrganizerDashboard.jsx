import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Calendar, Plus, Users, Award, ShieldAlert, Sparkles, MapPin, IndianRupee, Activity, CreditCard, Mountain, Flag, Check, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ClimbingLoader } from '../components/CustomAnimations';
import ImageUploader from '../components/ImageUploader';
import MultiImageUploader from '../components/MultiImageUploader';


export default function OrganizerDashboard() {
  const { user, token, loading: authLoading, refreshUserData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // States
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('Sandakphu');
  const [description, setDescription] = useState('');
  const [itinerary, setItinerary] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [whatToBring, setWhatToBring] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [difficulty, setDifficulty] = useState('moderate');
  const [duration, setDuration] = useState('3 Days / 2 Nights');
  const [totalSlots, setTotalSlots] = useState(15);
  const [price, setPrice] = useState(6500);
  const [advanceAmount, setAdvanceAmount] = useState(1499);
  const [imageUrls, setImageUrls] = useState([]);
  const [startDate, setStartDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  // Subscriptions states
  const [subPlan, setSubPlan] = useState('none');
  const [subLimit, setSubLimit] = useState(0);
  const [subscribing, setSubscribing] = useState(false);
  const [orgProfile, setOrgProfile] = useState(null);

  // Profile Edit states
  const [profileName, setProfileName] = useState('');
  const [profileCountryCode, setProfileCountryCode] = useState('+91');
  const [profileLocalPhone, setProfileLocalPhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profileExp, setProfileExp] = useState(0);
  const [profileCerts, setProfileCerts] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Success Publication Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Checkout Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState('');
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');

  useEffect(() => {
    if (token) {
      fetchOrganizerData();
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
    if (orgProfile) {
      setProfileName(user?.name || '');
      const parsed = parsePhone(orgProfile.whatsappNumber || user?.phone || '');
      setProfileCountryCode(parsed.code);
      setProfileLocalPhone(parsed.local);
      setProfileImage(orgProfile.profileImage || user?.profilePhoto || '');
      setProfileExp(orgProfile.experienceYears || 0);
      setProfileCerts(orgProfile.certifications?.join(', ') || '');
    }
  }, [orgProfile, user]);

  const fetchOrganizerData = async (showSpinner = true) => {
    if (!token) return;
    try {
      if (showSpinner) setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch treks created
      const treksRes = await axios.get('http://localhost:5000/api/treks?includeCompleted=true');
      const profileRes = await axios.get('http://localhost:5000/api/auth/profile', config);
      
      if (profileRes.data.status === 'success') {
        const orgProfileData = profileRes.data.data.profile;
        if (orgProfileData) {
          setOrgProfile(orgProfileData);
          const plan = orgProfileData.subscription?.plan || 'none';
          const activeUntil = orgProfileData.subscription?.activeUntil;
          const isExpired = activeUntil && new Date(activeUntil) < new Date();
          setSubPlan(isExpired ? 'none' : plan);
          setSubLimit(orgProfileData.subscription?.activeEventsCount || 0);

          if (treksRes.data.status === 'success') {
            const myEvents = treksRes.data.data.treks.filter(
              t => t.organizerId && t.organizerId._id && t.organizerId._id.toString() === orgProfileData._id.toString()
            );
            setEvents(myEvents);
          }
        }
      }

      // Fetch bookings registered
      const bookingsRes = await axios.get('http://localhost:5000/api/bookings/organizer-bookings', config);
      if (bookingsRes.data.status === 'success') {
        setBookings(bookingsRes.data.data.bookings);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (subPlan === 'none') {
      alert('No active subscription found. Please subscribe to a Basic or Premium plan in the Subscription tab first.');
      setActiveTab('subscription');
      return;
    }

    if (subPlan === 'basic' && subLimit >= 5) {
      alert('Subscription limit reached. Basic plan allows maximum 5 active events. Please upgrade to Premium for unlimited listings.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(startDate) < today) {
      alert('Starting date cannot be in the past.');
      return;
    }

    try {
      setCreating(true);
      const res = await axios.post('http://localhost:5000/api/treks', {
        title,
        destination,
        description,
        itinerary,
        inclusions,
        exclusions,
        whatToBring,
        pickupLocation,
        difficulty,
        duration,
        totalSlots,
        price,
        startDate,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        coordinates: { lat: 27.0622, lng: 88.0016 } // default
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === 'success') {
        setTitle('');
        setDescription('');
        setItinerary('');
        setInclusions('');
        setExclusions('');
        setWhatToBring('');
        setPickupLocation('');
        setImageUrls([]);
        setActiveTab('events');
        fetchOrganizerData();
        setShowSuccessModal(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Event creation failed.');
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmAttendance = async (bookingId) => {
    if (!token) return;
    try {
      const res = await axios.post('http://localhost:5000/api/bookings/confirm-attendance', {
        bookingId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        alert('Attendance confirmed!');
        // Update local booking status immediately
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, attendanceConfirmed: true } : b));
        fetchOrganizerData(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm attendance.');
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    if (!token) return;
    try {
      const res = await axios.post('http://localhost:5000/api/bookings/confirm-booking', {
        bookingId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        alert('Booking confirmed!');
        // Update local booking status immediately
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, bookingStatus: 'confirmed' } : b));
        fetchOrganizerData(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm booking.');
    }
  };

  const handleReactivateTrek = async (trekId, startDate) => {
    if (!token) return;
    try {
      const res = await axios.put(`http://localhost:5000/api/treks/${trekId}`, {
        startDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        alert('Trek successfully reactivated with new start date!');
        fetchOrganizerData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reactivate trek.');
    }
  };

  const handleMarkTrekComplete = async (trekId) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to mark this trek as complete? It will be removed from the exploration catalog.')) return;
    try {
      const res = await axios.put(`http://localhost:5000/api/treks/${trekId}`, {
        isCompleted: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        alert('Trek successfully marked as complete!');
        fetchOrganizerData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark trek as complete.');
    }
  };

  const handleDeleteTrek = async (trekId) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this trek listing?')) return;

    try {
      const res = await axios.delete(`http://localhost:5000/api/treks/${trekId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        alert('Trek listing successfully deleted!');
        fetchOrganizerData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete trek.');
    }
  };

  const handleUpgradeSubscription = async (planType) => {
    if (!token) return;
    const amount = planType === 'basic' ? 299 : 999;
    setCheckoutPlan(planType);
    setCheckoutAmount(amount);
    setUpiId('');
    setPaymentMethod('upi');
    setShowPaymentModal(true);
  };

  const processUpgradePayment = async (e) => {
    if (e) e.preventDefault();
    if (!token) return;

    setPaymentLoading(true);
    try {
      // Step 1: Create Order
      const orderRes = await axios.post('http://localhost:5000/api/subscriptions/order', {
        plan: checkoutPlan
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (orderRes.data.status === 'success') {
        const { orderId, amount, currency, isMock, key } = orderRes.data.data;

        if (isMock) {
          // Mock payment simulation
          await new Promise(resolve => setTimeout(resolve, 2000));
          const paymentId = `pay_sub_${Math.random().toString(36).substr(2, 9)}`;

          const res = await axios.post('http://localhost:5000/api/subscriptions/upgrade', {
            plan: checkoutPlan,
            paymentId,
            status: 'success'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.data.status === 'success') {
            setShowPaymentModal(false);
            alert(`Upgrade confirmed! Your subscription tier has been upgraded to ${checkoutPlan.toUpperCase()}.`);
            fetchOrganizerData();
            refreshUserData();
          }
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
            setPaymentLoading(false);
            return;
          }

          const options = {
            key: key,
            amount: amount,
            currency: currency,
            name: "TrekNest Partner Subscription",
            description: `Upgrade to ${checkoutPlan.toUpperCase()} Plan`,
            order_id: orderId,
            handler: async function (response) {
              try {
                setPaymentLoading(true);
                const verifyRes = await axios.post('http://localhost:5000/api/subscriptions/upgrade', {
                  plan: checkoutPlan,
                  orderId: orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  status: 'success'
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                if (verifyRes.data.status === 'success') {
                  setShowPaymentModal(false);
                  alert(`Upgrade confirmed! Your subscription tier has been upgraded to ${checkoutPlan.toUpperCase()}.`);
                  fetchOrganizerData();
                  refreshUserData();
                }
              } catch (err) {
                alert(err.response?.data?.message || 'Upgrade payment verification failed.');
              } finally {
                setPaymentLoading(false);
              }
            },
            modal: {
              ondismiss: function () {
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
      alert(err.response?.data?.message || 'Upgrade payment initiation failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
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

    setSavingProfile(true);
    const fullPhone = profileLocalPhone ? `${profileCountryCode} ${cleanedLocal}` : '';

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.put('http://localhost:5000/api/auth/profile', {
        name: profileName,
        phone: fullPhone,
        profilePhoto: profileImage,
        experienceYears: profileExp,
        certifications: profileCerts
      }, config);

      if (res.data.status === 'success') {
        alert('Leader profile updated successfully!');
        fetchOrganizerData();
        refreshUserData();
        setActiveTab('profile');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const regions = [
    'Sandakphu',
    'Darjeeling',
    'Kalimpong',
    'Sikkim',
    'Meghalaya',
    'Assam',
    'Himachal Pradesh',
    'Uttarakhand',
    'Ladakh',
    'Jammu & Kashmir',
    'Arunachal Pradesh',
    'Nagaland',
    'Manipur',
    'Mizoram',
    'Tripura',
    'North Bengal Himalayan Region'
  ];

  // Analytics Metrics
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'paid' && b.attendanceConfirmed)
    .reduce((sum, b) => {
      const price = b.trekPrice || b.trekId?.price || 0;
      return sum + Math.round(b.slotsBooked * price * 0.93);
    }, 0);

  const totalSlotsBooked = bookings.reduce((sum, b) => sum + b.slotsBooked, 0);

  if (loading || authLoading || !user) return <div className="py-20"><ClimbingLoader message="Reviewing leader metrics..." /></div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8"
    >
      {/* Overview Analytics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-adventure-muted uppercase font-bold block">Active Listings</span>
            <span className="text-2xl font-black text-white">{events.length}</span>
            <span className="text-[10px] text-adventure-muted block mt-0.5">Quota: {subPlan === 'basic' ? `${subLimit}/5 events` : 'Unlimited'}</span>
          </div>
          <Compass className="text-adventure-yellow w-8 h-8 opacity-45 animate-spin-slow" />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-adventure-muted uppercase font-bold block">Live Registrations</span>
            <span className="text-2xl font-black text-adventure-yellow">{bookings.filter(b => !b.attendanceConfirmed).length}</span>
          </div>
          <Users className="text-adventure-yellow w-8 h-8 opacity-45" />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-adventure-muted uppercase font-bold block">Overall Registrations</span>
            <span className="text-2xl font-black text-white">{bookings.length}</span>
          </div>
          <Users className="text-adventure-yellow w-8 h-8 opacity-45" />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-adventure-muted uppercase font-bold block">Revenue Earned</span>
            <span className="text-2xl font-black text-adventure-yellow">₹{totalRevenue}</span>
          </div>
          <IndianRupee className="text-adventure-yellow w-8 h-8 opacity-45" />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-adventure-muted uppercase font-bold block">Conduct Level</span>
            <span className="text-2xl font-black text-white">{orgProfile?.totalTreksConducted || 0} summits</span>
          </div>
          <Activity className="text-adventure-yellow w-8 h-8 opacity-45" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-4">
        {[
          { id: 'events', label: 'My Events', count: events.length },
          { id: 'create', label: 'Publish Event', count: 0 },
          { id: 'bookings', label: 'Live Registrations', count: bookings.filter(b => !b.attendanceConfirmed).length },
          { id: 'subscription', label: 'Subscription Plan', count: 0 },
          { id: 'profile', label: 'Leader Profile', count: 0 }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-4 px-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${activeTab === t.id ? 'border-adventure-yellow text-adventure-yellow' : 'border-transparent text-adventure-muted hover:text-white'}`}
          >
            <span>{t.label}</span>
            {t.count > 0 && (
              <span className="ml-1.5 bg-adventure-yellow/15 border border-adventure-yellow/20 text-adventure-yellow text-[10px] px-2 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[40vh]">
        
        {/* Events listing */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.length === 0 ? (
              <div className="col-span-3 text-center py-16 glass-panel rounded-2xl border border-white/5 flex flex-col items-center">
                <Calendar size={36} className="text-adventure-muted mb-2" />
                <p className="text-xs text-adventure-muted uppercase font-bold">No events hosted yet</p>
                <button onClick={() => setActiveTab('create')} className="mt-3 text-xs bg-adventure-yellow text-adventure-black px-4 py-2 font-extrabold rounded-lg uppercase tracking-wider">Publish New</button>
              </div>
            ) : (
              events.map((t) => (
                <div key={t._id} className="rounded-2xl overflow-hidden glass-panel border border-white/5 flex flex-col h-full hover:border-white/10 transition-colors">
                  <Link to={`/trek/${t._id}`} className="relative h-40 bg-adventure-charcoal block group overflow-hidden">
                    <img src={t.images[0]} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 right-3 bg-adventure-black/80 px-2 py-1 rounded text-[10px] font-extrabold uppercase text-adventure-yellow border border-white/5 z-10">
                      {t.difficulty}
                    </div>
                    {t.isCompleted ? (
                      <div className="absolute inset-0 bg-black/65 flex items-center justify-center z-10">
                        <span className="bg-[#4a4a4a] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg border border-white/10">
                          COMPLETED
                        </span>
                      </div>
                    ) : t.availableSlots === 0 ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <span className="bg-adventure-red text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg border border-white/10">
                          SOLD OUT
                        </span>
                      </div>
                    ) : null}
                  </Link>
                  <div className="p-4 flex flex-col flex-grow space-y-2">
                    <Link to={`/trek/${t._id}`} className="hover:text-adventure-yellow transition-colors block">
                      <h3 className="text-sm font-bold uppercase text-white line-clamp-1">{t.title}</h3>
                    </Link>
                    <div className="flex justify-between items-center text-xs text-adventure-muted">
                      <div className="flex items-center space-x-1">
                        <MapPin size={10} className="text-adventure-yellow" />
                        <span>{t.destination}</span>
                      </div>
                      {t.startDate && (
                        <span className="text-[10px] text-adventure-yellow font-semibold text-right whitespace-nowrap">
                          Starts: {new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold pt-3 border-t border-white/5 mt-auto">
                      <div>
                        <span className="text-[10px] text-adventure-muted block uppercase">Slots Available</span>
                        <span className={t.isCompleted ? 'text-adventure-muted' : t.availableSlots === 0 ? 'text-adventure-red font-bold' : 'text-white'}>
                          {t.isCompleted ? 'N/A (Inactive)' : t.availableSlots === 0 ? 'SOLD OUT' : `${t.availableSlots} / ${t.totalSlots}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-adventure-muted block uppercase">Cost</span>
                        <span className="text-adventure-yellow">₹{t.price}</span>
                      </div>
                    </div>
                    
                    {t.isCompleted && (
                      <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                        <span className="text-[9px] text-adventure-yellow uppercase block font-bold">Restart / Reactivate Expedition</span>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            id={`reactivate-date-${t._id}`}
                            className="flex-grow bg-[#121212] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-adventure-yellow"
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const inputEl = document.getElementById(`reactivate-date-${t._id}`);
                              if (inputEl && inputEl.value) {
                                handleReactivateTrek(t._id, inputEl.value);
                              } else {
                                alert('Please select a valid future date.');
                              }
                            }}
                            className="px-3 py-1 bg-adventure-yellow text-adventure-black font-extrabold text-[9px] uppercase rounded-lg hover:bg-white transition-colors"
                          >
                            Reactivate
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-3">
                      {!t.isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleMarkTrekComplete(t._id)}
                          className="flex-grow py-2 bg-adventure-green/10 border border-adventure-green/20 text-adventure-green hover:bg-adventure-green hover:text-white font-bold text-xs uppercase rounded-xl transition-colors flex items-center justify-center space-x-1"
                        >
                          <span>Mark Complete</span>
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteTrek(t._id)}
                        className={`py-2 bg-adventure-red/10 border border-adventure-red/20 text-adventure-red hover:bg-adventure-red hover:text-white font-bold text-xs uppercase rounded-xl transition-colors flex items-center justify-center space-x-1 ${t.isCompleted ? 'w-full' : 'px-3'}`}
                      >
                        <Trash2 size={12} />
                        {t.isCompleted && <span>Delete Listing</span>}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Create Event */}
        {activeTab === 'create' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/5 max-w-xl mx-auto space-y-6">
            <h3 className="font-extrabold text-sm uppercase text-adventure-yellow tracking-widest border-b border-white/5 pb-3">Publish Trekking Event</h3>

            {subPlan === 'none' && (
              <div className="bg-adventure-red/10 border border-adventure-red/20 p-4 rounded-xl text-xs text-adventure-red flex items-center space-x-2">
                <ShieldAlert size={16} />
                <span>No active subscription. Please subscribe to a Basic or Premium plan in the Subscription tab first.</span>
              </div>
            )}

            {subPlan === 'basic' && subLimit >= 5 && (
              <div className="bg-adventure-red/10 border border-adventure-red/20 p-4 rounded-xl text-xs text-adventure-red flex items-center space-x-2">
                <ShieldAlert size={16} />
                <span>Limit reached (5/5 events). Upgrade subscription to launch unlimited expeditions.</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Expedition Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-adventure-yellow"
                  placeholder="e.g. Goechala Pass Alpine Hikes"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Pickup / Meeting Location</label>
                <input
                  required
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-adventure-yellow"
                  placeholder="e.g. NJP Railway Station or Siliguri Junction"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Region</label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-adventure-yellow"
                  >
                    {regions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none"
                  >
                    {['easy', 'moderate', 'difficult', 'challenging'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Duration String</label>
                  <input
                    required
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white"
                    placeholder="e.g. 5 Days / 4 Nights"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Slots Capacity</label>
                  <input
                    required
                    type="number"
                    value={totalSlots}
                    onChange={(e) => setTotalSlots(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Start Date</label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-adventure-yellow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Total Price (INR)</label>
                  <input
                    required
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-adventure-yellow"
                  />
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-center text-[10px] space-y-1">
                  <div className="flex justify-between text-adventure-muted">
                    <span>Slot Booking Fee (7% cut):</span>
                    <span className="text-adventure-yellow font-bold">₹{Math.round(price * 0.07) || 0}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-white/5 pt-1 mt-1">
                    <span>Your Margin (93%):</span>
                    <span className="text-adventure-green font-bold">₹{Math.round(price * 0.93) || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <MultiImageUploader
                  label="Upload Trek Photos (Max 7)"
                  presetUrls={imageUrls}
                  onUploadSuccess={(urls) => setImageUrls(urls)}
                />
              </div>


              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  placeholder="Describe details, routes, safety provisions..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Daily Itinerary</label>
                <textarea
                  value={itinerary}
                  onChange={(e) => setItinerary(e.target.value)}
                  rows="3"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  placeholder="e.g. Day 1: Basecamp arrival. Day 2: Ascent to Camp 1. Day 3: Summit Day..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Inclusions</label>
                  <textarea
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    rows="3"
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    placeholder="e.g. Guides, tents, daily meals, permit fees..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Exclusions</label>
                  <textarea
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    rows="3"
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    placeholder="e.g. Personal trek gear, insurance, travel costs..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">What to Bring / Packing List</label>
                <textarea
                  value={whatToBring}
                  onChange={(e) => setWhatToBring(e.target.value)}
                  rows="2"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  placeholder="e.g. Hiking boots, thermal wear, 50L backpack, water bottle..."
                />
              </div>

              <button
                type="submit"
                disabled={creating || subPlan === 'none' || (subPlan === 'basic' && subLimit >= 5)}
                className="w-full py-4 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow hover:bg-white"
              >
                {creating ? 'Publishing...' : 'Publish Trek Event'}
              </button>
            </form>
          </div>
        )}

        {/* Bookings registrations & attendance */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-16 glass-panel rounded-2xl border border-white/5">
                <Users size={36} className="text-adventure-muted mx-auto mb-2" />
                <p className="text-xs text-adventure-muted uppercase font-bold">No active registrations yet</p>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b._id} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="font-extrabold text-white uppercase text-sm">{b.trekTitle || b.trekId?.title || 'Trek Title'}</h4>
                    <p className="text-xs text-adventure-muted mt-1">
                      Trekker: <span className="text-white font-bold">{b.userId?.name || 'Unknown Hiker'}</span> | Slots Booked: {b.slotsBooked}
                    </p>
                    <p className="text-[10px] text-adventure-grey mt-0.5">
                      Paid Booking Fee: ₹{b.totalPaid} | Status: <span className="text-adventure-yellow font-bold uppercase">{b.paymentStatus}</span>
                    </p>
                    {b.paymentStatus === 'paid' && b.userId?.phone && (
                      <div className="flex items-center space-x-2 mt-2">
                        <a
                          href={`tel:${b.userId.phone}`}
                          className="text-[9px] text-adventure-yellow bg-adventure-yellow/15 border border-adventure-yellow/20 px-2 py-1 rounded-lg uppercase font-bold hover:bg-adventure-yellow hover:text-adventure-black transition-colors"
                        >
                          Call Hiker: {b.userId.phone}
                        </a>
                        <a
                          href={`https://wa.me/${b.userId.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg uppercase font-bold hover:bg-green-500 hover:text-white transition-colors"
                        >
                          WhatsApp Chat
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Booking Status */}
                    {b.bookingStatus === 'confirmed' ? (
                      <span className="flex items-center space-x-1 text-adventure-green font-bold text-[10px] uppercase bg-adventure-green/10 px-3 py-1.5 border border-adventure-green/20 rounded-xl">
                        <CheckIcon />
                        <span>Booking Confirmed</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConfirmBooking(b._id)}
                        className="py-2 px-3 bg-adventure-yellow text-adventure-black font-extrabold text-[10px] uppercase rounded-xl tracking-wider hover:bg-white transition-colors"
                      >
                        Confirm Booking
                      </button>
                    )}

                    {/* Attendance Status */}
                    {b.attendanceConfirmed ? (
                      <span className="flex items-center space-x-1 text-adventure-green font-bold text-[10px] uppercase bg-adventure-green/10 px-3 py-1.5 border border-adventure-green/20 rounded-xl">
                        <CheckIcon />
                        <span>Attended</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConfirmAttendance(b._id)}
                        className="py-2 px-3 bg-adventure-yellow text-adventure-black font-extrabold text-[10px] uppercase rounded-xl tracking-wider hover:bg-white transition-colors"
                      >
                        Confirm Attendance
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Subscription details */}
        {activeTab === 'subscription' && (
          <div className="max-w-xl mx-auto glass-panel p-6 rounded-2xl border border-white/5 space-y-6 text-center">
            <CreditCard size={48} className="text-adventure-yellow mx-auto mb-2" />
            <h3 className="font-extrabold text-lg uppercase text-white">Organizer Subscription Plan</h3>
            <p className="text-xs text-adventure-muted">Manage active listing capacities and upgrade details.</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center text-xs">
              <div className="text-left">
                <span className="text-[9px] text-adventure-muted uppercase block font-bold">Current Tier</span>
                <span className="text-base font-black text-adventure-yellow uppercase">{subPlan === 'none' ? 'No Active Subscription' : subPlan}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-adventure-muted uppercase block font-bold">Active Listings Limit</span>
                <span className="text-sm font-bold text-white">
                  {subPlan === 'none' ? '0 active events allowed' : subPlan === 'basic' ? '5 Active events max' : 'Unlimited Active events'}
                </span>
              </div>
            </div>

            {orgProfile?.subscription?.plan && orgProfile.subscription.plan !== 'none' && orgProfile.subscription.activeUntil && (
              <div className="text-xs text-adventure-muted">
                {new Date(orgProfile.subscription.activeUntil) > new Date() ? (
                  <span>Subscription expires on: <strong className="text-white">{new Date(orgProfile.subscription.activeUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                ) : (
                  <span className="text-adventure-red font-bold">Your subscription expired on {new Date(orgProfile.subscription.activeUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-6">
              
              {/* Basic card */}
              <div className="border border-white/5 p-4 rounded-xl space-y-3 bg-[#121212]">
                <h4 className="font-bold text-white uppercase text-sm">Basic</h4>
                <p className="text-2xl font-black text-adventure-yellow">₹299<span className="text-xs text-adventure-muted font-normal">/3 months</span></p>
                <p className="text-[10px] text-adventure-muted">Publish up to 5 active trekking events. Valid for 3 months.</p>
                <button
                  type="button"
                  onClick={() => handleUpgradeSubscription('basic')}
                  disabled={subPlan === 'basic' || subscribing}
                  className="w-full py-2 bg-white/5 border border-white/10 hover:border-adventure-yellow text-white text-xs font-bold rounded-lg uppercase transition-all"
                >
                  {subPlan === 'basic' ? 'Active Plan' : 'Select Plan'}
                </button>
              </div>

              {/* Premium card */}
              <div className="border border-adventure-yellow/20 p-4 rounded-xl space-y-3 bg-adventure-yellow/5 shadow-yellow-glow">
                <h4 className="font-bold text-white uppercase text-sm">Premium</h4>
                <p className="text-2xl font-black text-adventure-yellow">₹999<span className="text-xs text-adventure-muted font-normal">/year</span></p>
                <p className="text-[10px] text-adventure-muted">Unlimited active events + Featured Listings priority. Valid for 1 year.</p>
                <button
                  type="button"
                  onClick={() => handleUpgradeSubscription('premium')}
                  disabled={subPlan === 'premium' || subscribing}
                  className="w-full py-2 bg-adventure-yellow text-adventure-black font-extrabold text-xs rounded-lg uppercase transition-all shadow-yellow-glow hover:bg-white"
                >
                  {subPlan === 'premium' ? 'Active Plan' : 'Upgrade Now'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: Edit Form */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
              <h3 className="font-extrabold text-sm uppercase text-adventure-yellow tracking-widest border-b border-white/5 pb-3">Edit Leader Profile</h3>
              
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
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
                    <label className="text-[10px] uppercase font-bold text-adventure-muted block">WhatsApp Contact</label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <ImageUploader
                      label="Profile Photo (DP)"
                      presetUrl={profileImage}
                      onUploadSuccess={(url) => setProfileImage(url)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-adventure-muted block">Experience (Years)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={profileExp}
                      onChange={(e) => setProfileExp(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-adventure-yellow"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted block">Certifications (Comma-separated)</label>
                  <textarea
                    value={profileCerts}
                    onChange={(e) => setProfileCerts(e.target.value)}
                    rows="3"
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-adventure-yellow"
                    placeholder="e.g. IMF Certified Trek Leader, Wilderness First Aid Responder, Survival Specialist"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-3.5 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow hover:bg-white"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Details'}
                </button>
              </form>
            </div>

            {/* Right 1 Col: Badges & Achievements */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
              <h3 className="font-extrabold text-sm uppercase text-adventure-yellow tracking-widest border-b border-white/5 pb-3">Leader Achievements</h3>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  {/* Badge 1: Conduct Level */}
                  <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-adventure-yellow to-amber-600 flex items-center justify-center shadow-yellow-glow flex-shrink-0">
                      <Award className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase">
                        {orgProfile?.totalTreksConducted >= 10
                          ? 'Veteran Mountaineer'
                          : orgProfile?.totalTreksConducted >= 5
                          ? 'Summit Specialist'
                          : orgProfile?.totalTreksConducted >= 3
                          ? 'Experienced Guide'
                          : 'Novice Leader'}
                      </h4>
                      <p className="text-[9px] text-adventure-muted">Based on {orgProfile?.totalTreksConducted || 0} summits conducted</p>
                    </div>
                  </div>

                  {/* Badge 2: Star rating status */}
                  {orgProfile?.ratings >= 4.5 && (
                    <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-yellow-glow flex-shrink-0">
                        <Sparkles className="text-white w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs uppercase">Trail Blazer</h4>
                        <p className="text-[9px] text-adventure-muted">Maintaining a high average rating of {orgProfile.ratings.toFixed(1)} ★</p>
                      </div>
                    </div>
                  )}


                  {/* Badge 4: Experience Tier */}
                  {orgProfile?.experienceYears >= 10 && (
                    <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center flex-shrink-0">
                        <MapPin className="text-white w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs uppercase">Himalayan Veteran</h4>
                        <p className="text-[9px] text-adventure-muted">{orgProfile.experienceYears} years of alpine leadership</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

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
              <span className="text-[9px] text-adventure-muted uppercase block font-bold text-left">Subscription Plan</span>
              <span className="text-base font-black text-adventure-yellow uppercase">
                {checkoutPlan} ({checkoutPlan === 'basic' ? '3 Months' : '1 Year'})
              </span>
              <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-white/5 mt-2">
                <span className="text-white">Amount Due</span>
                <span className="text-adventure-yellow text-base font-black">₹{checkoutAmount}</span>
              </div>
            </div>

            <form onSubmit={processUpgradePayment} className="space-y-4 text-left">
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
                {paymentLoading ? 'Authenticating Gateway...' : `Pay ₹${checkoutAmount} Securely`}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Trek Publication Success Celebration Modal */}
      {showSuccessModal && (
        <PublishSuccessModal onClose={() => setShowSuccessModal(false)} />
      )}
    </motion.div>
  );
}

function PublishSuccessModal({ onClose }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative max-w-md w-full bg-adventure-black border border-adventure-yellow/30 rounded-3xl p-8 text-center shadow-premium space-y-6 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,193,7,0.1)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 1 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-24 h-24 rounded-full border border-adventure-yellow/30"
            />
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
              className="text-white"
            >
              <Mountain size={110} className="fill-adventure-charcoal text-white" strokeWidth={1.5} />
            </motion.div>
            
            <motion.div
              initial={{ scale: 0, y: -30, rotate: -30 }}
              animate={{ scale: 1, y: -16, x: 8, rotate: 0 }}
              transition={{ type: "spring", stiffness: 150, delay: 0.5, damping: 12 }}
              className="absolute text-adventure-yellow origin-bottom"
            >
              <Flag size={36} className="fill-adventure-yellow stroke-adventure-black" strokeWidth={2} />
            </motion.div>
          </div>
          
          <div className="space-y-2 relative z-10">
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-2xl font-black text-adventure-yellow uppercase tracking-wider"
            >
              Expedition Published!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-xs text-adventure-muted max-w-xs mx-auto"
            >
              Your alpine trek is live in the TrekNest marketplace. Trekkers can now secure their slots and book guides.
            </motion.p>
          </div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            onClick={onClose}
            className="w-full py-3.5 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow hover:bg-white"
          >
            Return to Basecamp
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-adventure-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
