import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Compass, Heart, Bell, Calendar, MapPin, CheckCircle, Navigation, MessageSquare, Phone, User as UserIcon, Users, ShieldCheck, Mail, Bookmark, Eye, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ClimbingLoader, BadgeEarnedCelebration } from '../components/CustomAnimations';
import ImageUploader from '../components/ImageUploader';


export default function UserDashboard() {
  const { user, token, loading: authLoading, updateProfile, toggleWishlist, refreshUserData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // States
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // Profile editing states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileCountryCode, setProfileCountryCode] = useState('+91');
  const [profileLocalPhone, setProfileLocalPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [savingProfile, setSavingProfile] = useState(false);

  
  // Easter egg states
  const [photoClickCount, setPhotoClickCount] = useState(0);
  const [showEasterEggModal, setShowEasterEggModal] = useState(false);
  const [claimingEgg, setClaimingEgg] = useState(false);

  const handlePhotoClick = () => {
    if (user.badges?.includes('Himalayan Yeti')) return;
    const newCount = photoClickCount + 1;
    if (newCount >= 5) {
      setShowEasterEggModal(true);
      setPhotoClickCount(0);
    } else {
      setPhotoClickCount(newCount);
    }
  };

  const handleClaimEasterEgg = async () => {
    try {
      setClaimingEgg(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post('http://localhost:5000/api/auth/claim-easter-egg', {}, config);
      if (res.data.status === 'success') {
        await refreshUserData(token);
        setShowEasterEggModal(false);
        setSelectedBadge('Himalayan Yeti');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim achievement.');
    } finally {
      setClaimingEgg(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();

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

    const res = await updateProfile({
      name: profileName,
      phone: fullPhone,
      profilePhoto
    });
    setSavingProfile(false);
    if (res.success) {
      alert('Profile details updated successfully!');
      setActiveTab('bookings');
    } else {
      alert(res.message || 'Profile update failed.');
    }
  };


  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch user bookings
      const bookingsRes = await axios.get('http://localhost:5000/api/bookings/my-bookings', config);
      if (bookingsRes.data.status === 'success') {
        setBookings(bookingsRes.data.data.bookings);
      }

      // Fetch wishlist
      const wishlistRes = await axios.get('http://localhost:5000/api/auth/wishlist', config);
      if (wishlistRes.data.status === 'success') {
        setWishlist(wishlistRes.data.data.wishlist);
      }

      // Fetch notifications
      const notifRes = await axios.get('http://localhost:5000/api/notifications', config);
      if (notifRes.data.status === 'success') {
        setNotifications(notifRes.data.data.notifications);
      }

      // Fetch saved posts
      const savedRes = await axios.get('http://localhost:5000/api/posts/saved', config);
      if (savedRes.data.status === 'success') {
        setSavedPosts(savedRes.data.data.savedPosts);
      }

      // Fetch following list
      const followingRes = await axios.get('http://localhost:5000/api/posts/following', config);
      if (followingRes.data.status === 'success') {
        setFollowingList(followingRes.data.data.following);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    if (!token) return;
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh local list
      setNotifications(notifications.map(n => n._id === id ? { ...n, readStatus: true } : n));
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleRemoveWishlist = async (trekId) => {
    await toggleWishlist(trekId);
    // Reload wishlist
    if (!token) return;
    const wishlistRes = await axios.get('http://localhost:5000/api/auth/wishlist', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setWishlist(wishlistRes.data.data.wishlist);
  };

  const handleRemoveSaved = async (postId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/save`, {}, config);
      if (res.data.status === 'success') {
        setSavedPosts(prev => prev.filter(p => p._id !== postId));
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  if (loading || authLoading || !user) return <div className="py-20"><ClimbingLoader message="Preparing your passport..." /></div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8"
    >
      {/* Badge Pop-up animation */}
      {selectedBadge && (
        <BadgeEarnedCelebration badgeName={selectedBadge} onClose={() => setSelectedBadge(null)} />
      )}

      {/* Easter Egg Secret Modal */}
      <AnimatePresence>
        {showEasterEggModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel max-w-sm w-full p-8 rounded-3xl border border-adventure-yellow/30 shadow-yellow-glow text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-adventure-yellow/10 flex items-center justify-center text-adventure-yellow shadow-yellow-glow animate-bounce">
                <Compass size={36} className="animate-spin-slow" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase text-white tracking-wide">Secret Trail Found! 🏔️✨</h3>
                <p className="text-xs text-adventure-yellow font-extrabold uppercase tracking-widest">Himalayan Yeti Achievement</p>
                <p className="text-xs text-adventure-muted leading-relaxed">
                  You successfully navigated the hidden trails by tap-scouting your avatar! You have summoned the legendary **Himalayan Yeti**.
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-[11px] text-adventure-grey">
                Claiming this secret unlocks the **Golden Avatar Frame** effect around your profile photo.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClaimEasterEgg}
                  disabled={claimingEgg}
                  className="flex-grow py-3 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow hover:bg-white"
                >
                  {claimingEgg ? 'Claiming Legend...' : 'Claim Achievement'}
                </button>
                <button
                  onClick={() => setShowEasterEggModal(false)}
                  className="px-4 py-3 border border-white/10 text-white rounded-xl hover:border-adventure-red transition-all text-xs font-bold uppercase"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center space-x-0 md:space-x-4 text-center md:text-left">
          {user.badges?.includes('Himalayan Yeti') ? (
            <div 
              onClick={handlePhotoClick}
              className="avatar-gold-frame-container w-20 h-20 mb-3 md:mb-0 cursor-pointer hover:scale-105 transition-transform duration-300 flex items-center justify-center"
            >
              <img src={user.profilePhoto} alt={user.name} className="w-[calc(100%-8px)] h-[calc(100%-8px)] rounded-full object-cover z-10" />
            </div>
          ) : (
            <img 
              onClick={handlePhotoClick}
              src={user.profilePhoto} 
              alt={user.name} 
              className="w-20 h-20 rounded-full object-cover border-2 border-adventure-yellow/30 shadow-premium mb-3 md:mb-0 cursor-pointer hover:scale-105 transition-transform duration-300" 
            />
          )}
          <div>
            <div className="flex items-center justify-center md:justify-start space-x-1.5">
              <h2 className="text-2xl font-black uppercase tracking-wide text-white">{user.name}</h2>
              {user.verified && (
                <ShieldCheck size={20} className="text-adventure-yellow fill-adventure-yellow/15" title="Verified Hiker" />
              )}
            </div>
            <p className="text-xs text-adventure-yellow font-extrabold uppercase tracking-widest mt-0.5">{user.role}</p>
            <p className="text-xs text-adventure-muted mt-1">{user.email} | {user.phone || 'No phone'}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl text-center">
            <span className="text-xs text-adventure-muted block uppercase font-bold">Summits</span>
            <span className="text-2xl font-black text-white">{user.completedTreks?.length || 0}</span>
          </div>
          <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl text-center">
            <span className="text-xs text-adventure-muted block uppercase font-bold">Badges</span>
            <span className="text-2xl font-black text-adventure-yellow">{user.badges?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-4">
        {[
          { id: 'bookings', label: 'My Bookings', count: bookings.length },
          { id: 'wishlist', label: 'Wishlist', count: wishlist.length },
          { id: 'saved-stories', label: 'Saved Stories', count: savedPosts.length },
          { id: 'following', label: 'Following', count: followingList.length },
          { id: 'badges', label: 'Achievements', count: user.badges?.length || 0 },
          { id: 'notifications', label: 'Notifications', count: notifications.filter(n => !n.readStatus).length },
          { id: 'profile', label: 'Edit Profile', count: 0 }
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

      {/* Tab Contents */}
      <div className="min-h-[40vh]">
        
        {/* Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-16 glass-panel rounded-2xl border border-white/5 flex flex-col items-center">
                <Compass size={36} className="text-adventure-muted mb-2 animate-bounce" />
                <p className="text-xs text-adventure-muted uppercase font-bold">No registered trips yet</p>
                <Link to="/search" className="mt-3 text-xs text-adventure-yellow font-bold uppercase hover:underline">Explore Trails</Link>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b._id} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded bg-adventure-yellow/15 text-adventure-yellow border border-adventure-yellow/20 inline-block mb-2">
                      {b.bookingStatus}
                    </span>
                    <h3 className="text-base font-black uppercase text-white">{b.trekTitle || b.trekId?.title || 'Trek Expedition'}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-adventure-grey mt-1">
                      <div className="flex items-center space-x-1">
                        <MapPin size={12} className="text-adventure-yellow" />
                        <span>{b.trekId?.destination || 'Destination'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users size={12} className="text-adventure-yellow" />
                        <span>Booked slots: {b.slotsBooked}</span>
                      </div>
                      {b.trekId?.startDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar size={12} className="text-adventure-yellow" />
                          <span>Starts: {new Date(b.trekId.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Organizer Unlocked contact details */}
                  <div className="w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0 flex flex-col sm:flex-row gap-3">
                    {b.bookingStatus === 'confirmed' && (
                      <div className="bg-adventure-green/5 border border-adventure-green/25 rounded-xl p-3 flex flex-col space-y-1.5 w-full sm:w-48">
                        <span className="text-[9px] text-adventure-green font-extrabold uppercase tracking-wide">Organizer Unlocked</span>
                        <span className="text-xs font-bold text-white truncate" title={b.organizerId?.name || 'Trek Host'}>
                          {b.organizerId?.name || 'Trek Host'}
                        </span>
                        <span className="text-[11px] font-semibold text-white flex items-center space-x-1.5">
                          <Phone size={10} className="text-adventure-green" />
                          <span>{b.organizerId?.whatsappNumber || '+91 99999 99999'}</span>
                        </span>
                        {b.organizerId?.userId?.email && (
                          <span className="text-[10px] text-adventure-grey flex items-center space-x-1.5 truncate" title={b.organizerId.userId.email}>
                            <Mail size={10} className="text-adventure-green" />
                            <span className="truncate">{b.organizerId.userId.email}</span>
                          </span>
                        )}
                        <a
                          href={`https://wa.me/${(b.organizerId?.whatsappNumber || '919999999999').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-adventure-green text-white font-extrabold text-[10px] uppercase rounded-lg hover:bg-white hover:text-adventure-green transition-all mt-1.5"
                        >
                          <MessageSquare size={10} />
                          <span>WhatsApp Host</span>
                        </a>
                      </div>
                    )}

                    <Link
                      to={`/trek/${b.trekId?._id}`}
                      className="py-3 px-4 bg-white/5 border border-white/10 hover:border-adventure-yellow/30 font-bold text-xs rounded-xl uppercase tracking-wider text-center flex items-center justify-center"
                    >
                      View Trail
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Saved Stories */}
        {activeTab === 'saved-stories' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {savedPosts.length === 0 ? (
              <div className="col-span-3 text-center py-16 glass-panel rounded-2xl border border-white/5">
                <Bookmark size={36} className="text-adventure-muted mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-adventure-muted uppercase font-bold">No saved stories yet</p>
                <Link to="/stories" className="mt-3 inline-block text-xs text-adventure-yellow font-bold uppercase hover:underline">Explore Stories</Link>
              </div>
            ) : (
              savedPosts.map((post) => (
                <div key={post._id} className="rounded-2xl overflow-hidden glass-panel border border-white/5 flex flex-col h-[350px]">
                  <div className="relative h-36 bg-adventure-charcoal">
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <span className="text-[8px] font-black uppercase text-adventure-yellow block mb-1">{post.postType}</span>
                    <h4 className="font-extrabold text-white uppercase text-xs mb-1 line-clamp-2">
                      <Link to={`/stories/${post.slug}`} className="hover:text-adventure-yellow transition-colors">
                        {post.title}
                      </Link>
                    </h4>
                    {post.author && (
                      <p className="text-[10px] text-adventure-muted mb-4 uppercase font-bold">By {post.author.name}</p>
                    )}
                    <div className="flex gap-2 mt-auto">
                      <Link
                        to={`/stories/${post.slug}`}
                        className="flex-grow text-center py-2 bg-adventure-yellow text-adventure-black font-bold text-[10px] rounded-lg uppercase tracking-wider"
                      >
                        Read
                      </Link>
                      <button
                        onClick={(e) => handleRemoveSaved(post._id, e)}
                        className="px-3 py-2 border border-adventure-red/25 bg-adventure-red/5 text-adventure-red rounded-lg hover:bg-adventure-red hover:text-white transition-colors text-[10px] font-bold uppercase"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Following List */}
        {activeTab === 'following' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {followingList.length === 0 ? (
              <div className="col-span-3 text-center py-16 glass-panel rounded-2xl border border-white/5">
                <Users size={36} className="text-adventure-muted mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-adventure-muted uppercase font-bold">You are not following any leaders yet</p>
                <Link to="/search" className="mt-3 inline-block text-xs text-adventure-yellow font-bold uppercase hover:underline">Find Leaders</Link>
              </div>
            ) : (
              followingList.map((leader) => (
                <div key={leader._id} className="rounded-2xl glass-panel border border-white/5 p-5 flex flex-col justify-between h-[180px]">
                  <div className="flex gap-4">
                    <img 
                      src={leader.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'} 
                      alt={leader.name} 
                      className="w-14 h-14 rounded-full border border-white/10 object-cover" 
                    />
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-extrabold uppercase text-white tracking-wide">
                        {leader.name}
                      </h3>
                      <span className="text-[10px] text-adventure-yellow font-bold uppercase tracking-wider block">
                        {leader.role === 'guide' ? 'Certified Mountain Guide' : 'Expedition Organizer'}
                      </span>
                      {leader.bio && (
                        <p className="text-[10px] text-adventure-muted line-clamp-2 leading-relaxed mt-1">
                          {leader.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between">
                    <Link
                      to={`/leaders/${leader._id}`}
                      className="py-1.5 px-4 bg-adventure-yellow text-adventure-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:bg-white transition-all shadow-yellow-glow text-center w-full"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Wishlist */}
        {activeTab === 'wishlist' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wishlist.length === 0 ? (
              <div className="col-span-3 text-center py-16 glass-panel rounded-2xl border border-white/5">
                <Heart size={36} className="text-adventure-muted mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-adventure-muted uppercase font-bold">Your wishlist is empty</p>
              </div>
            ) : (
              wishlist.map((t) => (
                <div key={t._id} className="rounded-2xl overflow-hidden glass-panel border border-white/5 flex flex-col h-full">
                  <div className="relative h-40 bg-adventure-charcoal">
                    <img src={t.images[0]} alt={t.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h4 className="font-bold text-white uppercase text-sm mb-1">{t.title}</h4>
                    <p className="text-xs text-adventure-muted mb-4">{t.destination}</p>
                    <div className="flex gap-2 mt-auto">
                      <Link
                        to={`/trek/${t._id}`}
                        className="flex-grow text-center py-2 bg-adventure-yellow text-adventure-black font-bold text-[10px] rounded-lg uppercase tracking-wider"
                      >
                        Book
                      </Link>
                      <button
                        onClick={() => handleRemoveWishlist(t._id)}
                        className="p-2 border border-adventure-red/25 bg-adventure-red/5 text-adventure-red rounded-lg hover:bg-adventure-red hover:text-white transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Achievements / Badges */}
        {activeTab === 'badges' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(user.badges || []).length === 0 ? (
                <div className="col-span-4 text-center py-16 glass-panel rounded-2xl border border-white/5">
                  <Award size={36} className="text-adventure-muted mx-auto mb-2" />
                  <p className="text-xs text-adventure-muted uppercase font-bold">No badges unlocked yet</p>
                  <p className="text-[10px] text-adventure-muted mt-1">Conquer trails to verify attendance and earn rewards.</p>
                </div>
              ) : (
                user.badges.map((badge, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedBadge(badge)}
                    className="glass-panel p-5 rounded-2xl border border-adventure-yellow/20 flex flex-col items-center text-center cursor-pointer shadow-yellow-glow"
                  >
                    <Award size={48} className="text-adventure-yellow mb-2 drop-shadow-md" />
                    <span className="font-extrabold text-xs uppercase text-white tracking-wide">{badge}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-16 glass-panel rounded-2xl border border-white/5">
                <Bell size={36} className="text-adventure-muted mx-auto mb-2" />
                <p className="text-xs text-adventure-muted uppercase font-bold">No alerts</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n._id}
                  onClick={() => !n.readStatus && handleMarkRead(n._id)}
                  className={`p-4 rounded-xl border flex justify-between items-start transition-all cursor-pointer ${n.readStatus ? 'border-white/5 bg-white/5 opacity-60' : 'border-adventure-yellow/20 bg-adventure-yellow/5'}`}
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">{n.title}</h4>
                    <p className="text-xs text-adventure-grey leading-relaxed">{n.body}</p>
                    <span className="text-[9px] text-adventure-muted block mt-1">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  {!n.readStatus && (
                    <button className="text-[9px] uppercase font-bold text-adventure-yellow bg-adventure-yellow/15 border border-adventure-yellow/20 px-2 py-0.5 rounded-full">
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Profile Edit Tab */}
        {activeTab === 'profile' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/5 max-w-xl mx-auto space-y-6">
            <h3 className="font-extrabold text-sm uppercase text-adventure-yellow tracking-widest border-b border-white/5 pb-3">Edit Profile Details</h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Full Name</label>
                <input
                  required
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-adventure-yellow"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Phone Number</label>
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

              <div className="space-y-1.5">
                <ImageUploader
                  label="Profile Picture"
                  presetUrl={profilePhoto}
                  onUploadSuccess={(url) => setProfilePhoto(url)}
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
        )}


      </div>
    </motion.div>
  );
}
