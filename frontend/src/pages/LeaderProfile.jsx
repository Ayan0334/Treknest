import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserCheck, Eye, Heart, Bookmark, Calendar, MapPin, Tag, Compass, Star, Award, Users, Activity, FileText } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import HikerLoader from '../components/HikerLoader';

export default function LeaderProfile() {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // States
  const [leader, setLeader] = useState(null);
  const [activeTreks, setActiveTreks] = useState([]);
  const [stories, setStories] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stories'); // stories, treks
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchLeaderProfile();
  }, [userId]);

  const fetchLeaderProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/posts/leader/${userId}`, { headers });
      
      if (res.data.status === 'success') {
        const { leader: leaderData, activeTreks: treksData, stories: storiesData, isFollowing: followingData } = res.data.data;
        setLeader(leaderData);
        setActiveTreks(treksData);
        setStories(storiesData);
        setIsFollowing(followingData);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load leader profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !token) {
      alert('Please sign in to follow this leader.');
      return;
    }

    try {
      setFollowLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`http://localhost:5000/api/posts/user/${userId}/follow`, {}, { headers });
      
      if (res.data.status === 'success') {
        const { followed } = res.data.data;
        setIsFollowing(followed);
        setLeader(prev => ({
          ...prev,
          followersCount: followed 
            ? (prev.followersCount || 0) + 1 
            : Math.max(0, (prev.followersCount || 0) - 1)
        }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLikeToggle = async (postId, e) => {
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
      console.error('Error toggling like:', err.message);
    }
  };

  const handleSaveToggle = async (postId, e) => {
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
      console.error('Error toggling save:', err.message);
    }
  };

  const formatPostType = (type) => {
    switch (type) {
      case 'experience': return 'Exp Report';
      case 'report': return 'Trail Condition';
      case 'vlog': return 'Vlog';
      case 'announcement': return 'Announcement';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <HikerLoader text="Summoning leader logs..." />
      </div>
    );
  }

  if (error || !leader) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Award className="text-adventure-red mx-auto w-12 h-12 mb-4" />
        <h2 className="text-2xl font-black uppercase text-white tracking-wider">Leader Profile Not Found</h2>
        <p className="text-sm text-adventure-muted mt-2 uppercase tracking-wide">
          {error || 'This leader profile is not available or does not exist.'}
        </p>
        <Link
          to="/stories"
          className="mt-6 inline-flex items-center space-x-2 py-3 px-6 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-yellow-glow"
        >
          <span>Explore Stories</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Profile Overview Card */}
      <div className="glass-panel border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-adventure-yellow/5 rounded-full blur-3xl -z-10" />

        {/* Leader Photo */}
        <div className="relative flex-shrink-0">
          <img
            src={leader.profilePhoto}
            alt={leader.name}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white/10 object-cover shadow-premium"
          />
          <span className="absolute bottom-1 right-1 bg-adventure-yellow text-adventure-black px-2.5 py-1 rounded-full text-[9px] font-black uppercase border-2 border-adventure-black">
            {leader.role === 'guide' ? 'GUIDE' : 'ORGANIZER'}
          </span>
        </div>

        {/* Profile Info */}
        <div className="flex-grow space-y-4 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight leading-none mb-1">
                {leader.name}
              </h1>
              <span className="text-[10px] font-bold text-adventure-yellow uppercase tracking-widest block">
                {leader.role === 'guide' ? 'Certified Mountain Guide' : 'Expedition Organizer'}
              </span>
            </div>

            {/* Follow Action */}
            {user?._id !== leader._id && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`py-2.5 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                  isFollowing
                    ? 'bg-[#121212] border border-white/10 text-adventure-muted hover:border-adventure-red hover:text-adventure-red'
                    : 'bg-adventure-yellow text-adventure-black hover:bg-white shadow-yellow-glow'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={14} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Follow Leader</span>
                  </>
                )}
              </motion.button>
            )}
          </div>

          {leader.bio && (
            <p className="text-xs sm:text-sm text-adventure-muted leading-relaxed max-w-2xl font-medium">
              "{leader.bio}"
            </p>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5">
            <div className="glass-panel/40 p-3 rounded-xl border border-white/5 flex items-center space-x-3">
              <Star className="text-adventure-yellow w-5 h-5 flex-shrink-0" />
              <div>
                <span className="text-[9px] text-adventure-muted uppercase font-bold block">Rating</span>
                <span className="text-sm font-black text-white">{leader.rating || 'N/A'}</span>
              </div>
            </div>

            <div className="glass-panel/40 p-3 rounded-xl border border-white/5 flex items-center space-x-3">
              <Award className="text-adventure-yellow w-5 h-5 flex-shrink-0" />
              <div>
                <span className="text-[9px] text-adventure-muted uppercase font-bold block">Experience</span>
                <span className="text-sm font-black text-white">{leader.experienceYears || 0} Yrs</span>
              </div>
            </div>

            <div className="glass-panel/40 p-3 rounded-xl border border-white/5 flex items-center space-x-3">
              <Users className="text-adventure-yellow w-5 h-5 flex-shrink-0" />
              <div>
                <span className="text-[9px] text-adventure-muted uppercase font-bold block">Followers</span>
                <span className="text-sm font-black text-white">{leader.followersCount || 0}</span>
              </div>
            </div>

            <div className="glass-panel/40 p-3 rounded-xl border border-white/5 flex items-center space-x-3">
              <Activity className="text-adventure-yellow w-5 h-5 flex-shrink-0" />
              <div>
                <span className="text-[9px] text-adventure-muted uppercase font-bold block">Summit Runs</span>
                <span className="text-sm font-black text-white">{leader.totalTreksConducted || 0} Conducted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/10 gap-6">
        <button
          onClick={() => setActiveTab('stories')}
          className={`pb-4 px-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'stories' ? 'border-adventure-yellow text-adventure-yellow' : 'border-transparent text-adventure-muted hover:text-white'
          }`}
        >
          <span className="flex items-center space-x-1.5">
            <FileText size={12} />
            <span>Stories ({stories.length})</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('treks')}
          className={`pb-4 px-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'treks' ? 'border-adventure-yellow text-adventure-yellow' : 'border-transparent text-adventure-muted hover:text-white'
          }`}
        >
          <span className="flex items-center space-x-1.5">
            <Compass size={12} />
            <span>Active Expeditions ({activeTreks.length})</span>
          </span>
        </button>
      </div>

      {/* Tab Panes */}
      <div className="min-h-[30vh]">
        {activeTab === 'stories' && (
          <div>
            {stories.length === 0 ? (
              <div className="text-center py-16 glass-panel rounded-2xl border border-white/5 flex flex-col items-center">
                <FileText size={36} className="text-adventure-muted mb-2 animate-pulse" />
                <p className="text-xs text-adventure-muted uppercase font-bold">No stories published yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map(post => (
                  <motion.div
                    key={post._id}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl overflow-hidden glass-panel border border-white/5 shadow-premium flex flex-col h-[400px] relative group"
                  >
                    {/* Cover image */}
                    <div className="relative h-44 w-full bg-adventure-charcoal overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 to-transparent" />
                      
                      <div className={`absolute top-4 left-4 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-adventure-yellow/15 text-adventure-yellow border border-adventure-yellow/25`}>
                        {formatPostType(post.postType)}
                      </div>

                      {post.location && (
                        <div className="absolute bottom-3 left-4 flex items-center space-x-1 text-[10px] font-bold text-white uppercase tracking-wider">
                          <MapPin size={10} className="text-adventure-yellow" />
                          <span>{post.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
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

                      {/* Card Footer */}
                      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-adventure-muted">
                        <div className="text-[9px] font-bold uppercase tracking-wider">
                          {post.publishDate && new Date(post.publishDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1 text-[10px] font-bold" title="Views">
                            <Eye size={12} />
                            <span>{post.viewsCount || 0}</span>
                          </div>

                          <button
                            onClick={(e) => handleLikeToggle(post._id, e)}
                            className={`flex items-center space-x-1 text-[10px] font-bold transition-all hover:scale-105 ${
                              post.isLiked ? 'text-adventure-yellow' : 'hover:text-white'
                            }`}
                          >
                            <Heart size={12} fill={post.isLiked ? '#FFC107' : 'none'} />
                            <span>{post.likesCount || 0}</span>
                          </button>

                          <button
                            onClick={(e) => handleSaveToggle(post._id, e)}
                            className={`flex items-center space-x-1 text-[10px] font-bold transition-all hover:scale-105 ${
                              post.isSaved ? 'text-adventure-yellow' : 'hover:text-white'
                            }`}
                          >
                            <Bookmark size={12} fill={post.isSaved ? '#FFC107' : 'none'} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'treks' && (
          <div>
            {activeTreks.length === 0 ? (
              <div className="text-center py-16 glass-panel rounded-2xl border border-white/5 flex flex-col items-center">
                <Compass size={36} className="text-adventure-muted mb-2 animate-spin-slow" />
                <p className="text-xs text-adventure-muted uppercase font-bold">No active expeditions currently scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeTreks.map(t => (
                  <div key={t._id} className="rounded-2xl overflow-hidden glass-panel border border-white/5 flex flex-col h-full hover:border-white/10 transition-colors">
                    <Link to={`/trek/${t._id}`} className="relative h-40 bg-adventure-charcoal block group overflow-hidden">
                      <img src={t.images && t.images[0]} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-3 right-3 bg-adventure-black/80 px-2 py-1 rounded text-[10px] font-extrabold uppercase text-adventure-yellow border border-white/5 z-10">
                        {t.difficulty}
                      </div>
                      {t.availableSlots === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <span className="bg-adventure-red text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg border border-white/10">
                            SOLD OUT
                          </span>
                        </div>
                      )}
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
                          <span className={t.availableSlots === 0 ? 'text-adventure-red font-bold' : 'text-white'}>
                            {t.availableSlots === 0 ? 'SOLD OUT' : `${t.availableSlots} / ${t.totalSlots}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-adventure-muted block uppercase">Cost</span>
                          <span className="text-adventure-yellow">₹{t.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
