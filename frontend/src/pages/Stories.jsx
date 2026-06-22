import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Heart, Bookmark, MapPin, Tag, Compass, Sparkles, Filter, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import HikerLoader from '../components/HikerLoader';
import { Link } from 'react-router-dom';

export default function Stories() {
  const { user, token } = useAuth();

  // States
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedType, setFeedType] = useState('latest'); // latest, popular, following
  const [postType, setPostType] = useState(''); // '', experience, report, vlog, announcement
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  // Fetch stories on filter change
  useEffect(() => {
    setPage(1);
    fetchStories(1, false);
  }, [feedType, postType]);

  const fetchStories = async (pageNum, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPosts([]);
      }
      setError('');

      const params = {
        page: pageNum,
        limit: 9,
        feedType
      };

      if (postType) params.postType = postType;
      if (searchQuery) params.search = searchQuery;

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get('http://localhost:5000/api/posts', { params, headers });

      if (res.data.status === 'success') {
        const { posts: newPosts, pagination } = res.data.data;
        
        if (append) {
          setPosts(prev => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }
        setTotalPages(pagination.pages);
        setPage(pagination.page);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch stories.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStories(1, false);
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchStories(nextPage, true);
    }
  };

  const handleLikeToggle = async (postId) => {
    if (!user || !token) {
      alert('Please sign in to like stories.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, { headers });
      if (res.data.status === 'success') {
        const { liked, likesCount } = res.data.data;
        setPosts(prev => prev.map(p => {
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

  const handleSaveToggle = async (postId) => {
    if (!user || !token) {
      alert('Please sign in to save stories.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/save`, {}, { headers });
      if (res.data.status === 'success') {
        const { saved, savesCount } = res.data.data;
        setPosts(prev => prev.map(p => {
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

  const getPostTypeBadgeColor = (type) => {
    switch (type) {
      case 'experience': return 'bg-adventure-yellow/10 text-adventure-yellow border border-adventure-yellow/20';
      case 'report': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'vlog': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'announcement': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default: return 'bg-white/5 text-white/60 border border-white/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center space-x-2 text-adventure-yellow text-xs uppercase tracking-widest font-extrabold mb-1">
            <Sparkles size={12} className="animate-pulse" />
            <span>Community Stories</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-none">
            Trek Stories
          </h1>
          <p className="text-xs sm:text-sm text-adventure-muted mt-2 max-w-xl">
            Discover expedition logs, live trail condition reports, vlogs, and announcements from certified guides and organizers.
          </p>
        </div>

        {/* Global Stories Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-4 md:mt-0 relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search stories, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 hover:border-white/20 focus:border-adventure-yellow text-white rounded-xl py-3 pl-11 pr-4 text-xs font-semibold uppercase tracking-wider outline-none transition-all placeholder:text-adventure-muted"
          />
          <Search size={14} className="absolute left-4 top-3.5 text-adventure-muted" />
        </form>
      </div>

      {/* Feed Filter & Feed Type Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        {/* Feed Type Selection (Latest, Popular, Following) */}
        <div className="flex bg-[#121212] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setFeedType('latest')}
            className={`py-2 px-4 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              feedType === 'latest' ? 'bg-adventure-yellow text-adventure-black' : 'text-adventure-grey hover:text-white'
            }`}
          >
            Latest
          </button>
          <button
            onClick={() => setFeedType('popular')}
            className={`py-2 px-4 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              feedType === 'popular' ? 'bg-adventure-yellow text-adventure-black' : 'text-adventure-grey hover:text-white'
            }`}
          >
            Popular
          </button>
          {user && (
            <button
              onClick={() => setFeedType('following')}
              className={`py-2 px-4 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                feedType === 'following' ? 'bg-adventure-yellow text-adventure-black' : 'text-adventure-grey hover:text-white'
              }`}
            >
              Following
            </button>
          )}
        </div>

        {/* Category Filter Pills (Experiences, Reports, etc.) */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'experience', label: 'Experiences' },
            { value: 'report', label: 'Trek Reports' },
            { value: 'vlog', label: 'Vlogs' },
            { value: 'announcement', label: 'Announcements' }
          ].map(cat => (
            <button
              key={cat.value}
              onClick={() => setPostType(cat.value)}
              className={`py-1.5 px-3 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                postType === cat.value
                  ? 'bg-white text-adventure-black border-white'
                  : 'bg-transparent text-adventure-muted border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <HikerLoader text="Scouting stories trail..." />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-adventure-red">
          <AlertCircle size={32} className="mb-2" />
          <p className="text-xs uppercase font-extrabold">{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel border border-white/5 rounded-3xl">
          <Compass size={40} className="text-adventure-muted mb-3 animate-spin-slow" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Stories Found</h3>
          <p className="text-[10px] text-adventure-muted mt-1 uppercase tracking-wide">
            Be the first to create stories or adjust your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Stories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <motion.div
                key={post._id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden glass-panel border border-white/5 shadow-premium flex flex-col h-[420px] relative group"
              >
                {/* Cover Image & Category Badges */}
                <div className="relative h-44 w-full bg-adventure-charcoal overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 to-transparent" />
                  
                  {/* Category Type Badge */}
                  <div className={`absolute top-4 left-4 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${getPostTypeBadgeColor(post.postType)}`}>
                    {formatPostType(post.postType)}
                  </div>

                  {/* Location Tag */}
                  {post.location && (
                    <div className="absolute bottom-3 left-4 flex items-center space-x-1 text-[10px] font-bold text-white uppercase tracking-wider">
                      <MapPin size={10} className="text-adventure-yellow" />
                      <span>{post.location}</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-grow">
                  {/* Related Trek Tag */}
                  {post.relatedTrek && (
                    <div className="flex items-center space-x-1 mb-2 text-[9px] font-extrabold uppercase text-adventure-yellow">
                      <Tag size={8} />
                      <span>Trek: {post.relatedTrek.title}</span>
                    </div>
                  )}

                  {/* Title & Description */}
                  <h3 className="text-base font-extrabold uppercase text-white mb-2 line-clamp-2 tracking-wide group-hover:text-adventure-yellow transition-colors">
                    <Link to={`/stories/${post.slug}`}>{post.title}</Link>
                  </h3>
                  
                  <p className="text-[10px] text-adventure-muted leading-relaxed line-clamp-3 mb-4 font-medium">
                    {post.description}
                  </p>

                  {/* Card Footer: Author Profile & Social Actions */}
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    {/* Author Details */}
                    {post.author && (
                      <Link to={`/leaders/${post.author._id}`} className="flex items-center space-x-2.5">
                        <img
                          src={post.author.profilePhoto}
                          alt={post.author.name}
                          className="w-8 h-8 rounded-full border border-white/10 object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold uppercase text-white hover:text-adventure-yellow transition-colors leading-none">
                            {post.author.name}
                          </span>
                          <span className="text-[8px] font-bold text-adventure-yellow uppercase tracking-widest mt-0.5">
                            {post.author.role}
                          </span>
                        </div>
                      </Link>
                    )}

                    {/* Likes & Saves Counters */}
                    <div className="flex items-center space-x-4">
                      {/* Views */}
                      <div className="flex items-center space-x-1 text-[10px] font-bold text-adventure-muted" title="Views">
                        <Eye size={12} />
                        <span>{post.viewsCount || 0}</span>
                      </div>

                      {/* Likes */}
                      <button
                        onClick={() => handleLikeToggle(post._id)}
                        className={`flex items-center space-x-1 text-[10px] font-bold transition-all hover:scale-105 ${
                          post.isLiked ? 'text-adventure-yellow' : 'text-adventure-muted hover:text-white'
                        }`}
                        title="Like"
                      >
                        <Heart size={12} fill={post.isLiked ? '#FFC107' : 'none'} />
                        <span>{post.likesCount || 0}</span>
                      </button>

                      {/* Saves */}
                      <button
                        onClick={() => handleSaveToggle(post._id)}
                        className={`flex items-center space-x-1 text-[10px] font-bold transition-all hover:scale-105 ${
                          post.isSaved ? 'text-adventure-yellow' : 'text-adventure-muted hover:text-white'
                        }`}
                        title="Save Post"
                      >
                        <Bookmark size={12} fill={post.isSaved ? '#FFC107' : 'none'} />
                        <span>{post.savesCount || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Load More Button */}
          {page < totalPages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="py-3 px-8 bg-white/5 hover:bg-adventure-yellow border border-white/10 hover:border-adventure-yellow text-white hover:text-adventure-black font-extrabold text-xs rounded-xl tracking-wider uppercase transition-all flex items-center space-x-2"
              >
                {loadingMore ? (
                  <>
                    <Compass className="w-4 h-4 animate-spin" />
                    <span>Loading Stories...</span>
                  </>
                ) : (
                  <span>Load More Stories</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
