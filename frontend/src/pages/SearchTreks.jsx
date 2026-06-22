import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Compass, Filter, Sparkles, Navigation, Heart, Bookmark, Eye, Award, Users, Tag, Calendar, Shield } from 'lucide-react';
import axios from 'axios';
import { HikerSearchLoader } from '../components/CustomAnimations';
import { useAuth } from '../context/AuthContext';

export default function SearchTreks() {
  const { search } = useLocation();
  const { user, token } = useAuth();
  const queryParams = new URLSearchParams(search);

  // Search Context / Tabs
  const [activeTab, setActiveTab] = useState('adventures'); // adventures, stories, leaders
  const [searchQuery, setSearchQuery] = useState(queryParams.get('destination') || '');

  // Adventures States
  const [treks, setTreks] = useState([]);
  const [trekLoading, setTrekLoading] = useState(true);
  const [destination, setDestination] = useState(queryParams.get('destination') || '');
  const [difficulty, setDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [coords, setCoords] = useState(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [searchDate, setSearchDate] = useState('');

  // Stories States
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [postType, setPostType] = useState(''); // experience, report, vlog, announcement

  // Leaders States
  const [guides, setGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [guideLocation, setGuideLocation] = useState('');
  const [guideService, setGuideService] = useState('');

  // Sync URL query params to state
  useEffect(() => {
    const params = new URLSearchParams(search);
    const dest = params.get('destination') || '';
    setDestination(dest);
    if (dest) setSearchQuery(dest);
  }, [search]);

  // Fetch Adventures (Treks)
  useEffect(() => {
    fetchTreks();
  }, [destination, difficulty, sortBy, coords, searchDate]);

  // Fetch Stories
  useEffect(() => {
    if (activeTab === 'stories') {
      fetchStories();
    }
  }, [activeTab, searchQuery, postType]);

  // Fetch Leaders (Guides)
  useEffect(() => {
    if (activeTab === 'leaders') {
      fetchGuides();
    }
  }, [activeTab, searchQuery, guideLocation, guideService]);

  const fetchTreks = async () => {
    try {
      setTrekLoading(true);
      const params = { sortBy };
      if (destination) params.destination = destination;
      if (difficulty) params.difficulty = difficulty;
      if (searchDate) params.date = searchDate;
      if (coords) {
        params.lat = coords.lat;
        params.lng = coords.lng;
      }

      const res = await axios.get('http://localhost:5000/api/treks', { params });
      if (res.data.status === 'success') {
        setTreks(res.data.data.treks);
      }
    } catch (err) {
      console.error('Error fetching treks:', err.message);
    } finally {
      setTimeout(() => setTrekLoading(false), 800);
    }
  };

  const fetchStories = async () => {
    try {
      setStoriesLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (postType) params.postType = postType;

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('http://localhost:5000/api/posts', { params, headers });
      if (res.data.status === 'success') {
        setStories(res.data.data.posts);
      }
    } catch (err) {
      console.error('Error fetching stories:', err.message);
    } finally {
      setTimeout(() => setStoriesLoading(false), 800);
    }
  };

  const fetchGuides = async () => {
    try {
      setGuidesLoading(true);
      const params = {};
      if (guideLocation) params.location = guideLocation;
      if (guideService) params.service = guideService;

      const res = await axios.get('http://localhost:5000/api/guides', { params });
      if (res.data.status === 'success') {
        setGuides(res.data.data.guides);
      }
    } catch (err) {
      console.error('Error fetching guides:', err.message);
    } finally {
      setTimeout(() => setGuidesLoading(false), 800);
    }
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setSortBy('distance');
        setGeoLocating(false);
      },
      (error) => {
        console.error(error);
        alert('Could not retrieve your location. Falling back to default coordinates.');
        setCoords({ lat: 27.0622, lng: 88.0016 });
        setSortBy('distance');
        setGeoLocating(false);
      }
    );
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (activeTab === 'adventures') {
      setDestination(searchQuery);
    } else if (activeTab === 'stories') {
      fetchStories();
    } else if (activeTab === 'leaders') {
      fetchGuides();
    }
  };

  // Client side query filters for Adventures and Leaders to make search feel instant & unified
  const filteredTreks = treks.filter(t =>
    !searchQuery ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = guides.filter(g =>
    !searchQuery ||
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStoryLikeToggle = async (postId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !token) {
      alert('Please sign in to like stories.');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, { headers });
      if (res.data.status === 'success') {
        const { liked, likesCount } = res.data.data;
        setStories(prev => prev.map(p => {
          if (p._id === postId) {
            return { ...p, isLiked: liked, likesCount };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleStorySaveToggle = async (postId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !token) {
      alert('Please sign in to save stories.');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/save`, {}, { headers });
      if (res.data.status === 'success') {
        const { saved, savesCount } = res.data.data;
        setStories(prev => prev.map(p => {
          if (p._id === postId) {
            return { ...p, isSaved: saved, savesCount };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const destinationsList = [
    'Sandakphu', 'Darjeeling', 'Kalimpong', 'Sikkim', 'Meghalaya', 'Assam',
    'Himachal Pradesh', 'Uttarakhand', 'Ladakh', 'Jammu & Kashmir',
    'Arunachal Pradesh', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura',
    'North Bengal Himalayan Region'
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
      {/* Title & Global Search Box */}
      <div className="mb-10 text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-wide leading-none">
          Global Search
        </h1>
        <p className="text-xs text-adventure-muted">
          Find expeditions, community stories, and mountain guides in one dashboard.
        </p>

        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            placeholder={
              activeTab === 'adventures'
                ? "Search summits, regions, keywords..."
                : activeTab === 'stories'
                ? "Search expedition logs, vlogs, tags..."
                : "Search guide names, locations, services..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 hover:border-white/20 focus:border-adventure-yellow text-white rounded-xl py-3.5 pl-12 pr-4 text-xs font-semibold uppercase tracking-wider outline-none transition-all placeholder:text-adventure-muted shadow-premium"
          />
          <Search size={16} className="absolute left-4 top-4 text-adventure-muted" />
        </form>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-6 mb-8 justify-center">
        {[
          { id: 'adventures', label: 'Adventures', icon: Compass },
          { id: 'stories', label: 'Trek Stories', icon: Sparkles },
          { id: 'leaders', label: 'Mountain Leaders', icon: Award }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'border-adventure-yellow text-adventure-yellow'
                  : 'border-transparent text-adventure-muted hover:text-white'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Filter and Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Dynamic Filter forms based on Active Tab */}
        <div className="glass-panel p-6 rounded-2xl h-fit border border-white/5 space-y-6">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-4">
            <Filter size={18} className="text-adventure-yellow" />
            <h3 className="font-bold text-sm uppercase text-white tracking-wider">Filters</h3>
          </div>

          {activeTab === 'adventures' && (
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1.5">Destination</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                >
                  <option value="">All Regions</option>
                  {destinationsList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1.5">Difficulty</label>
                <div className="grid grid-cols-2 gap-2">
                  {['easy', 'moderate', 'difficult', 'challenging'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(difficulty === d ? '' : d)}
                      className={`py-2 px-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all text-center ${
                        difficulty === d
                          ? 'border-adventure-yellow bg-adventure-yellow/15 text-adventure-yellow'
                          : 'border-white/5 bg-[#121212] text-adventure-grey hover:border-white/20'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1.5">Date of Trek</label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1.5">Geolocation sorting</label>
                <button
                  type="button"
                  onClick={handleRequestLocation}
                  disabled={geoLocating}
                  className={`w-full flex items-center justify-center space-x-2 py-3 border rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                    coords ? 'border-adventure-green bg-adventure-green/10 text-adventure-green' : 'border-white/10 bg-[#121212] text-white hover:border-adventure-yellow/30'
                  }`}
                >
                  <Navigation size={14} className={geoLocating ? 'animate-ping' : ''} />
                  <span>{coords ? 'Sorted by Proximity' : 'Sort by Distance'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'stories' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1.5">Category</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: '', label: 'All Categories' },
                    { value: 'experience', label: 'Experiences' },
                    { value: 'report', label: 'Trek Reports' },
                    { value: 'vlog', label: 'Vlogs' },
                    { value: 'announcement', label: 'Announcements' }
                  ].map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setPostType(cat.value)}
                      className={`py-2 px-3 rounded-xl border text-left text-[10px] font-bold uppercase tracking-wider transition-all ${
                        postType === cat.value
                          ? 'border-adventure-yellow bg-adventure-yellow/10 text-adventure-yellow'
                          : 'border-white/5 bg-[#121212] text-adventure-grey hover:border-white/20'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaders' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1.5">Leader Location</label>
                <select
                  value={guideLocation}
                  onChange={(e) => setGuideLocation(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                >
                  <option value="">All Locations</option>
                  {destinationsList.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1.5">Required Service</label>
                <select
                  value={guideService}
                  onChange={(e) => setGuideService(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                >
                  <option value="">All Services</option>
                  {servicesList.map(srv => (
                    <option key={srv} value={srv}>{srv}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Tab Specific Results Pane */}
        <div className="lg:col-span-3 space-y-6">
          {/* Adventures Tab Pane */}
          {activeTab === 'adventures' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-adventure-card/40 border border-white/5 rounded-2xl p-4 gap-4">
                <p className="text-xs text-adventure-grey font-medium">Showing {filteredTreks.length} treks matching your journey</p>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <label className="text-[10px] uppercase font-bold text-adventure-muted whitespace-nowrap">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#121212] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-adventure-yellow w-full sm:w-auto"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="rating">Rating</option>
                    <option value="price">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    {coords && <option value="distance">Distance</option>}
                  </select>
                </div>
              </div>

              {trekLoading ? (
                <HikerSearchLoader />
              ) : filteredTreks.length === 0 ? (
                <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center">
                  <Compass size={48} className="text-adventure-muted mb-4 animate-bounce" />
                  <h3 className="text-lg font-bold text-white uppercase mb-1">No Trails Discovered</h3>
                  <p className="text-xs text-adventure-muted max-w-sm leading-relaxed">We couldn't find any hikes matching your query. Try resetting or selecting a different destination.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTreks.map((t) => (
                    <div 
                      key={t._id}
                      className="rounded-2xl overflow-hidden glass-panel border border-white/5 shadow-premium flex flex-col h-full hover:border-white/10 transition-colors"
                    >
                      <div className="relative h-44 bg-adventure-charcoal">
                        <img src={t.images[0]} alt={t.title} className="w-full h-full object-cover" />
                        
                        {t.distance !== null && (
                          <div className="absolute top-3 left-3 bg-adventure-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase text-white border border-white/10 flex items-center space-x-1">
                            <Navigation size={8} className="text-adventure-yellow" />
                            <span>{t.distance} km away</span>
                          </div>
                        )}

                        <div className="absolute top-3 right-3 bg-adventure-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase text-adventure-yellow border border-adventure-yellow/20">
                          {t.difficulty}
                        </div>

                        {t.availableSlots === 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="bg-adventure-red text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg border border-white/10">
                              SOLD OUT
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex flex-col space-y-0.5">
                            <div className="flex items-center space-x-1 text-adventure-muted text-xs">
                              <MapPin size={12} className="text-adventure-yellow" />
                              <span>{t.destination}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-adventure-yellow text-xs font-bold">
                            <Star size={12} className="fill-adventure-yellow" />
                            <span>{t.rating || '5.0'}</span>
                            <span className="text-adventure-muted font-normal text-[10px]">({t.reviewsCount || 0})</span>
                          </div>
                        </div>

                        {t.startDate && (
                          <div className="text-[10px] text-adventure-yellow font-bold mb-2">
                            Starts: {new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}

                        <h3 className="text-base font-extrabold text-white mb-2 uppercase line-clamp-1">{t.title}</h3>
                        <p className="text-xs text-adventure-muted mb-4 line-clamp-2 leading-relaxed">{t.description}</p>

                        <div className="flex items-center justify-between text-xs font-bold border-t border-white/5 pt-4 mt-auto">
                          <div>
                            <span className="text-[10px] text-adventure-muted block uppercase">Available Slots</span>
                            <span className={t.availableSlots === 0 ? 'text-adventure-red font-bold' : 'text-adventure-green'}>
                              {t.availableSlots === 0 ? 'Sold Out' : `${t.availableSlots} / ${t.totalSlots}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-adventure-muted block uppercase">Price</span>
                            <span className="text-adventure-yellow text-sm font-black">₹{t.price}</span>
                          </div>
                        </div>

                        <Link
                          to={`/trek/${t._id}`}
                          className={`w-full text-center py-2.5 font-extrabold text-xs rounded-xl tracking-wider uppercase transition-all mt-4 border ${
                            t.availableSlots === 0
                              ? 'bg-white/5 border-white/10 text-adventure-muted hover:border-adventure-red hover:text-white'
                              : 'bg-adventure-yellow text-adventure-black hover:bg-white hover:text-adventure-black shadow-yellow-glow'
                          }`}
                        >
                          {t.availableSlots === 0 ? 'View Details (Sold Out)' : 'Book Expedition'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stories Tab Pane */}
          {activeTab === 'stories' && (
            <div className="space-y-6">
              <div className="bg-adventure-card/40 border border-white/5 rounded-2xl p-4">
                <p className="text-xs text-adventure-grey font-medium">Showing {stories.length} stories matching your query</p>
              </div>

              {storiesLoading ? (
                <HikerSearchLoader />
              ) : stories.length === 0 ? (
                <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center">
                  <Compass size={48} className="text-adventure-muted mb-4 animate-bounce" />
                  <h3 className="text-lg font-bold text-white uppercase mb-1">No Stories Discovered</h3>
                  <p className="text-xs text-adventure-muted max-w-sm leading-relaxed">No trekking guides or organizers have posted stories matching your search query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stories.map(post => (
                    <div 
                      key={post._id}
                      className="rounded-2xl overflow-hidden glass-panel border border-white/5 shadow-premium flex flex-col h-[400px] hover:border-white/10 transition-colors group"
                    >
                      <div className="relative h-44 bg-adventure-charcoal overflow-hidden">
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 to-transparent" />
                        
                        <div className="absolute top-4 left-4 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-adventure-yellow/15 text-adventure-yellow border border-adventure-yellow/25">
                          {post.postType}
                        </div>

                        {post.location && (
                          <div className="absolute bottom-3 left-4 flex items-center space-x-1 text-[10px] font-bold text-white uppercase tracking-wider">
                            <MapPin size={10} className="text-adventure-yellow" />
                            <span>{post.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-grow">
                        {post.relatedTrek && (
                          <div className="flex items-center space-x-1 mb-2 text-[9px] font-extrabold uppercase text-adventure-yellow">
                            <Tag size={8} />
                            <span>Trek: {post.relatedTrek.title}</span>
                          </div>
                        )}

                        <h3 className="text-base font-extrabold uppercase text-white mb-2 line-clamp-2 tracking-wide group-hover:text-adventure-yellow transition-colors">
                          <Link to={`/stories/${post.slug}`}>{post.title}</Link>
                        </h3>
                        
                        <p className="text-[10px] text-adventure-muted leading-relaxed line-clamp-3 mb-4 font-medium">
                          {post.description}
                        </p>

                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                          {post.author && (
                            <Link to={`/leaders/${post.author._id}`} className="flex items-center space-x-2.5">
                              <img src={post.author.profilePhoto} alt={post.author.name} className="w-7 h-7 rounded-full border border-white/10 object-cover" />
                              <span className="text-[9px] font-extrabold uppercase text-white hover:text-adventure-yellow leading-none">
                                {post.author.name}
                              </span>
                            </Link>
                          )}

                          <div className="flex items-center space-x-3 text-adventure-muted">
                            <div className="flex items-center space-x-1 text-[10px] font-bold">
                              <Eye size={12} />
                              <span>{post.viewsCount || 0}</span>
                            </div>

                            <button
                              onClick={(e) => handleStoryLikeToggle(post._id, e)}
                              className={`flex items-center space-x-1 text-[10px] font-bold ${post.isLiked ? 'text-adventure-yellow' : 'hover:text-white'}`}
                            >
                              <Heart size={11} fill={post.isLiked ? '#FFC107' : 'none'} />
                              <span>{post.likesCount || 0}</span>
                            </button>

                            <button
                              onClick={(e) => handleStorySaveToggle(post._id, e)}
                              className={`flex items-center space-x-1 text-[10px] font-bold ${post.isSaved ? 'text-adventure-yellow' : 'hover:text-white'}`}
                            >
                              <Bookmark size={11} fill={post.isSaved ? '#FFC107' : 'none'} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leaders Tab Pane */}
          {activeTab === 'leaders' && (
            <div className="space-y-6">
              <div className="bg-adventure-card/40 border border-white/5 rounded-2xl p-4">
                <p className="text-xs text-adventure-grey font-medium">Showing {filteredGuides.length} mountain leaders matching your query</p>
              </div>

              {guidesLoading ? (
                <HikerSearchLoader />
              ) : filteredGuides.length === 0 ? (
                <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center">
                  <Award size={48} className="text-adventure-muted mb-4 animate-bounce" />
                  <h3 className="text-lg font-bold text-white uppercase mb-1">No Leaders Found</h3>
                  <p className="text-xs text-adventure-muted max-w-sm leading-relaxed">No local guides meet your current filter criteria or matches the keyword search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredGuides.map(g => (
                    <div 
                      key={g._id}
                      className="rounded-2xl glass-panel border border-white/5 p-5 flex flex-col justify-between h-[210px] hover:border-white/10 transition-colors"
                    >
                      <div className="flex gap-4">
                        <img 
                          src={g.profilePhoto} 
                          alt={g.name} 
                          className="w-16 h-16 rounded-full border border-white/10 object-cover" 
                        />
                        <div className="space-y-1">
                          <h3 className="text-sm font-extrabold uppercase text-white tracking-wide">
                            {g.name}
                          </h3>
                          <div className="flex items-center space-x-1.5 text-xs text-adventure-muted font-bold">
                            <MapPin size={11} className="text-adventure-yellow" />
                            <span>{g.location}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-adventure-yellow font-bold">
                            <Star size={11} className="fill-adventure-yellow text-adventure-yellow" />
                            <span>{g.ratings || '5.0'}</span>
                            <span className="text-adventure-muted font-normal text-[10px]">({g.reviewsCount || 0} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {g.services && g.services.slice(0, 3).map((srv, idx) => (
                          <span key={idx} className="bg-white/5 border border-white/5 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded text-adventure-grey">
                            {srv}
                          </span>
                        ))}
                      </div>

                      <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-adventure-muted block uppercase">Daily Fee</span>
                          <span className="text-adventure-yellow font-black text-xs">₹{g.charge}/Day</span>
                        </div>

                        {g.userId ? (
                          <Link
                            to={`/leaders/${g.userId}`}
                            className="py-1.5 px-4 bg-adventure-yellow text-adventure-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg hover:bg-white transition-all shadow-yellow-glow"
                          >
                            View Profile
                          </Link>
                        ) : (
                          <span className="text-[10px] text-adventure-muted italic">Profile Unavailable</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </motion.div>
  );
}
