import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Compass, Filter, Sparkles, Navigation } from 'lucide-react';
import axios from 'axios';
import { HikerSearchLoader } from '../components/CustomAnimations';
import { Link } from 'react-router-dom';

export default function SearchTreks() {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  // States
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState(queryParams.get('destination') || '');
  const [difficulty, setDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [coords, setCoords] = useState(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [searchDate, setSearchDate] = useState('');

  // Sync URL query params to state
  useEffect(() => {
    const params = new URLSearchParams(search);
    setDestination(params.get('destination') || '');
  }, [search]);

  useEffect(() => {
    fetchTreks();
  }, [destination, difficulty, sortBy, coords, searchDate]);

  const fetchTreks = async () => {
    try {
      setLoading(true);
      
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
      // Simulate slightly longer loading for hiker animation experience
      setTimeout(() => {
        setLoading(false);
      }, 1000);
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
        setCoords({ lat: 27.0622, lng: 88.0016 }); // Fallback to Darjeeling area
        setSortBy('distance');
        setGeoLocating(false);
      }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTreks();
  };

  const destinationsList = [
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-wide">Find Your Trail</h1>
        <p className="text-xs text-adventure-muted mt-1">Discover raw landscapes, local culture and high-altitude climbs</p>
      </div>

      {/* Filters Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Filter Form */}
        <div className="glass-panel p-6 rounded-2xl h-fit border border-white/5 space-y-6">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-4 mb-4">
            <Filter size={18} className="text-adventure-yellow" />
            <h3 className="font-bold text-sm uppercase text-white tracking-wider">Search Filters</h3>
          </div>

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
                    className={`py-2 px-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all text-center ${difficulty === d ? 'border-adventure-yellow bg-adventure-yellow/15 text-adventure-yellow' : 'border-white/5 bg-[#121212] text-adventure-grey hover:border-white/20'}`}
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

            <button
              type="submit"
              className="w-full py-3 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow hover:bg-white hover:text-adventure-black"
            >
              Apply Filter
            </button>
          </form>

          <div className="border-t border-white/10 pt-4">
            <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1.5">Geolocation sorting</label>
            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={geoLocating}
              className={`w-full flex items-center justify-center space-x-2 py-3 border rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${coords ? 'border-adventure-green bg-adventure-green/10 text-adventure-green' : 'border-white/10 bg-[#121212] text-white hover:border-adventure-yellow/30'}`}
            >
              <Navigation size={14} className={geoLocating ? 'animate-ping' : ''} />
              <span>{coords ? 'Sorted by Proximity' : 'Sort by Distance'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: List and Sorters */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-adventure-card/40 border border-white/5 rounded-2xl p-4 gap-4">
            <p className="text-xs text-adventure-grey font-medium">Showing {treks.length} treks matching your journey</p>
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

          {loading ? (
            <div className="py-12">
              <HikerSearchLoader />
            </div>
          ) : treks.length === 0 ? (
            <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center">
              <Compass size={48} className="text-adventure-muted mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-white uppercase mb-1">No Trails Discovered</h3>
              <p className="text-xs text-adventure-muted max-w-sm leading-relaxed">We couldn't find any hikes matching your current query. Try resetting or selecting a different destination.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {treks.map((t) => (
                <div 
                  key={t._id}
                  className="rounded-2xl overflow-hidden glass-panel border border-white/5 shadow-premium flex flex-col h-full hover:border-white/10 transition-colors"
                >
                  <div className="relative h-44 bg-adventure-charcoal">
                    <img src={t.images[0]} alt={t.title} className="w-full h-full object-cover" />
                    
                    {/* Geolocation Tag */}
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
                        {t.pickupLocation && (
                          <span className="text-[10px] text-adventure-yellow/80 font-bold block">
                            Pickup: {t.pickupLocation}
                          </span>
                        )}
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
                      className={`w-full text-center py-2.5 font-extrabold text-xs rounded-xl tracking-wider uppercase transition-all mt-4 border ${t.availableSlots === 0 ? 'bg-white/5 border-white/10 text-adventure-muted hover:border-adventure-red hover:text-white' : 'bg-adventure-yellow text-adventure-black hover:bg-white hover:text-adventure-black shadow-yellow-glow'}`}
                    >
                      {t.availableSlots === 0 ? 'View Details (Sold Out)' : 'Book Expedition'}
                    </Link>
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
