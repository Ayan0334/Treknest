import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mountain, Compass, MapPin, Star, ArrowRight, ShieldCheck, HelpCircle, Activity } from 'lucide-react';
import axios from 'axios';
import { ClimbingLoader } from '../components/CustomAnimations';

export default function Home() {
  const navigate = useNavigate();
  const [featuredTreks, setFeaturedTreks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedTreks();
  }, []);

  const fetchFeaturedTreks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/treks');
      if (res.data.status === 'success') {
        // Show top 3 treks
        setFeaturedTreks(res.data.data.treks.slice(0, 3));
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const regions = [
    { name: 'Sandakphu', count: '10+ Trails', img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400' },
    { name: 'Sikkim', count: '15+ Trails', img: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400' },
    { name: 'Meghalaya', count: '8+ Trails', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400' },
    { name: 'Darjeeling', count: '12+ Trails', img: 'data:image/jpeg;base64,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' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full pb-20"
    >
      {/* Immersive Hero Section */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Parallax Mountain background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "linear-gradient(to bottom, rgba(17,17,17,0.3) 0%, rgba(17,17,17,1) 95%), url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600')",
            backgroundAttachment: 'fixed'
          }}
        />

        {/* Content Overlay */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center mt-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="inline-flex items-center space-x-2 bg-adventure-yellow/15 border border-adventure-yellow/30 px-4 py-2 rounded-full mb-6"
          >
            <Compass className="w-4 h-4 text-adventure-yellow animate-spin-slow" />
            <span className="text-xs uppercase tracking-widest text-adventure-yellow font-extrabold">Next-Gen Mountain Expeditions</span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-7xl font-black uppercase tracking-tight text-white mb-6 leading-tight"
          >
            Conquer the <span className="text-gradient-yellow">Himalayan</span> Peaks
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-sm sm:text-lg text-adventure-grey max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            Book verified treks, coordinate with certified wilderness experts, unlock local Himalayan guides, and collect achievement badges.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <Link
              to="/search"
              className="w-full sm:w-auto px-8 py-4 bg-adventure-yellow text-adventure-black font-extrabold rounded-xl hover:bg-white transition-all uppercase tracking-wider shadow-yellow-glow text-center"
            >
              Explore Adventures
            </Link>
            <Link
              to="/guides"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:border-adventure-yellow/30 font-semibold rounded-xl text-white transition-all uppercase tracking-wider text-center"
            >
              Unlock Local Guides
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Region Grid Slider */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">Popular Regions</h2>
            <p className="text-xs text-adventure-muted mt-1">Select a Himalayan hub to filter destinations</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {regions.map((r, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -8 }}
              onClick={() => navigate(`/search?destination=${r.name}`)}
              className="relative h-60 rounded-2xl overflow-hidden cursor-pointer group shadow-premium border border-white/5"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${r.img})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-adventure-black via-adventure-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-[10px] uppercase font-bold text-adventure-yellow bg-adventure-yellow/10 border border-adventure-yellow/20 px-2.5 py-1 rounded-full mb-1 inline-block">{r.count}</span>
                <h3 className="text-lg font-bold uppercase text-white">{r.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Trek Expeditions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-2xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">Featured Expeditions</h2>
            <p className="text-xs text-adventure-muted mt-1">High quality routes conducted by certified organizers</p>
          </div>
          <Link to="/search" className="text-xs font-bold text-adventure-yellow hover:text-white transition-colors flex items-center space-x-1 uppercase tracking-widest">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <ClimbingLoader />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTreks.map((t) => (
              <motion.div
                key={t._id}
                whileHover={{ y: -6 }}
                className="rounded-2xl overflow-hidden glass-panel border border-white/5 shadow-premium flex flex-col h-full"
              >
                <div className="relative h-48 w-full bg-adventure-charcoal">
                  <img src={t.images[0]} alt={t.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-adventure-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase text-adventure-yellow border border-adventure-yellow/20">
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
                  <div className="flex justify-between items-center text-xs mb-2 text-adventure-muted">
                    <div className="flex flex-col space-y-0.5">
                      <div className="flex items-center space-x-1">
                        <MapPin size={12} className="text-adventure-yellow" />
                        <span>{t.destination}</span>
                      </div>
                      {t.pickupLocation && (
                        <span className="text-[10px] text-adventure-yellow/80 font-bold block">
                          Pickup: {t.pickupLocation}
                        </span>
                      )}
                    </div>
                    {t.startDate && (
                      <span className="text-[10px] text-adventure-yellow font-bold whitespace-nowrap">
                        Starts: {new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-white mb-2 uppercase line-clamp-1">{t.title}</h3>
                  <p className="text-xs text-adventure-muted mb-4 line-clamp-2 leading-relaxed">{t.description}</p>

                  <div className="flex items-center justify-between text-xs font-bold border-t border-white/5 pt-4 mt-auto">
                    <div>
                      <span className="text-[10px] text-adventure-muted block uppercase">Duration</span>
                      <span className="text-white">{t.duration}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-adventure-muted block uppercase">Price</span>
                      <span className="text-adventure-yellow text-sm font-black">₹{t.price}</span>
                    </div>
                  </div>

                  <Link
                    to={`/trek/${t._id}`}
                    className={`w-full text-center py-2.5 font-semibold text-xs rounded-xl tracking-wider uppercase transition-all mt-4 border ${t.availableSlots === 0 ? 'bg-white/5 border-white/10 text-adventure-muted hover:border-adventure-red hover:text-white' : 'bg-white/5 border-white/10 hover:border-adventure-yellow/30 hover:bg-adventure-yellow hover:text-adventure-black text-white'}`}
                  >
                    {t.availableSlots === 0 ? 'View Details (Sold Out)' : 'View Details'}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Feature Badging and Guide highlights */}
      <section className="bg-adventure-card/40 border-y border-white/5 py-20 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-3 p-6 glass-panel rounded-2xl">
            <div className="mx-auto w-12 h-12 rounded-full bg-adventure-yellow/10 flex items-center justify-center text-adventure-yellow mb-2 shadow-yellow-glow">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-sm font-bold uppercase text-white tracking-widest">Verified Organizers</h3>
            <p className="text-xs text-adventure-muted leading-relaxed">All hosts pass background validation, license checks, and mountain medical safety certifications.</p>
          </div>
          <div className="space-y-3 p-6 glass-panel rounded-2xl">
            <div className="mx-auto w-12 h-12 rounded-full bg-adventure-yellow/10 flex items-center justify-center text-adventure-yellow mb-2 shadow-yellow-glow">
              <Activity size={24} />
            </div>
            <h3 className="text-sm font-bold uppercase text-white tracking-widest">Guide Micro-Market</h3>
            <p className="text-xs text-adventure-muted leading-relaxed">Pay a small nominal unlock fee to directly hire micro-guides for permits, porter service, and local Homestays.</p>
          </div>
          <div className="space-y-3 p-6 glass-panel rounded-2xl">
            <div className="mx-auto w-12 h-12 rounded-full bg-adventure-yellow/10 flex items-center justify-center text-adventure-yellow mb-2 shadow-yellow-glow">
              <HelpCircle size={24} />
            </div>
            <h3 className="text-sm font-bold uppercase text-white tracking-widest">Badge Achievements</h3>
            <p className="text-xs text-adventure-muted leading-relaxed">Collect virtual explorer awards upon guide validation of your trek attendance. Flaunt them on your profile.</p>
          </div>
        </div>
      </section>

    </motion.div>
  );
}
