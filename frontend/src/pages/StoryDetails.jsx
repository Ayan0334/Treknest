import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bookmark, Eye, Calendar, MapPin, Tag, UserPlus, UserCheck, Compass, ArrowLeft, Play, Youtube, AlertTriangle, CloudRain, Shield, Droplets, Thermometer, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import HikerLoader from '../components/HikerLoader';

export default function StoryDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // States
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchStoryDetails();
  }, [slug]);

  const fetchStoryDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/posts/slug/${slug}`, { headers });
      
      if (res.data.status === 'success') {
        const postData = res.data.data.post;
        setPost(postData);
        if (postData.coverImage) {
          setActiveImage(postData.coverImage);
        } else if (postData.images && postData.images.length > 0) {
          setActiveImage(postData.images[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load story details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!user || !token) {
      alert('Please sign in to like this story.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`http://localhost:5000/api/posts/${post._id}/like`, {}, { headers });
      if (res.data.status === 'success') {
        const { liked, likesCount } = res.data.data;
        setPost(prev => ({
          ...prev,
          isLiked: liked,
          likesCount
        }));
      }
    } catch (err) {
      console.error('Error toggling like:', err.message);
    }
  };

  const handleSaveToggle = async () => {
    if (!user || !token) {
      alert('Please sign in to save this story.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`http://localhost:5000/api/posts/${post._id}/save`, {}, { headers });
      if (res.data.status === 'success') {
        const { saved, savesCount } = res.data.data;
        setPost(prev => ({
          ...prev,
          isSaved: saved,
          savesCount
        }));
      }
    } catch (err) {
      console.error('Error toggling save:', err.message);
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
      const res = await axios.post(
        `http://localhost:5000/api/posts/user/${post.author._id}/follow`,
        { postId: post._id }, // Attribution context
        { headers }
      );
      if (res.data.status === 'success') {
        const { followed } = res.data.data;
        setPost(prev => ({
          ...prev,
          isFollowingAuthor: followed,
          author: {
            ...prev.author,
            followersCount: followed 
              ? (prev.author.followersCount || 0) + 1 
              : Math.max(0, (prev.author.followersCount || 0) - 1)
          }
        }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err.message);
    } finally {
      setFollowLoading(false);
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
        <HikerLoader text="Scouting the story logs..." />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="text-adventure-red mx-auto w-12 h-12 mb-4" />
        <h2 className="text-2xl font-black uppercase text-white tracking-wider">Story Not Found</h2>
        <p className="text-sm text-adventure-muted mt-2 uppercase tracking-wide">
          {error || "The story you are looking for doesn't exist or is not published yet."}
        </p>
        <Link
          to="/stories"
          className="mt-6 inline-flex items-center space-x-2 py-3 px-6 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-yellow-glow"
        >
          <ArrowLeft size={14} />
          <span>Back to Stories</span>
        </Link>
      </div>
    );
  }



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/stories"
          className="inline-flex items-center space-x-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-adventure-muted hover:text-adventure-yellow transition-colors"
        >
          <ArrowLeft size={12} />
          <span>Back to Stories</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-adventure-yellow/10 text-adventure-yellow border border-adventure-yellow/20`}>
                {formatPostType(post.postType)}
              </span>
              {post.location && (
                <div className="flex items-center space-x-1 text-[10px] font-bold text-adventure-muted uppercase tracking-wider">
                  <MapPin size={10} className="text-adventure-yellow" />
                  <span>{post.location}</span>
                </div>
              )}
              {post.publishDate && (
                <div className="flex items-center space-x-1 text-[10px] font-bold text-adventure-muted uppercase tracking-wider">
                  <Calendar size={10} className="text-adventure-yellow" />
                  <span>
                    {new Date(post.publishDate).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight leading-tight">
              {post.title}
            </h1>

            {/* Quick Metrics & Actions */}
            <div className="flex items-center justify-between border-y border-white/5 py-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-[10px] font-bold text-adventure-muted">
                  <Eye size={12} />
                  <span>{post.viewsCount || 0} views</span>
                </div>
              </div>

              {/* Likes & Saves Interactive Panel */}
              <div className="flex items-center space-x-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLikeToggle}
                  className={`flex items-center space-x-1.5 py-1.5 px-3.5 rounded-full text-[10px] font-extrabold uppercase border tracking-wider transition-all ${
                    post.isLiked
                      ? 'bg-adventure-yellow/10 border-adventure-yellow text-adventure-yellow shadow-yellow-glow'
                      : 'bg-[#121212] border-white/10 text-adventure-muted hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Heart size={12} fill={post.isLiked ? '#FFC107' : 'none'} className={post.isLiked ? 'animate-heart-pulse' : ''} />
                  <span>{post.isLiked ? 'Liked' : 'Like'} ({post.likesCount || 0})</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSaveToggle}
                  className={`flex items-center space-x-1.5 py-1.5 px-3.5 rounded-full text-[10px] font-extrabold uppercase border tracking-wider transition-all ${
                    post.isSaved
                      ? 'bg-adventure-yellow/10 border-adventure-yellow text-adventure-yellow'
                      : 'bg-[#121212] border-white/10 text-adventure-muted hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Bookmark size={12} fill={post.isSaved ? '#FFC107' : 'none'} />
                  <span>{post.isSaved ? 'Saved' : 'Save'}</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Media Player / Main Image */}
          <div className="rounded-2xl overflow-hidden glass-panel border border-white/5 bg-adventure-charcoal aspect-video relative">
            <img src={activeImage} alt={post.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/70 to-transparent pointer-events-none" />
          </div>

          {/* Additional Images Thumbnail Gallery */}
          {post.images && post.images.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveImage(post.coverImage)}
                className={`w-20 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                  activeImage === post.coverImage ? 'border-adventure-yellow' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={post.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
              </button>
              {post.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImage === img ? 'border-adventure-yellow' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Video Player */}
          {post.video && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-adventure-yellow flex items-center space-x-1">
                <Play size={12} fill="#FFC107" />
                <span>Uploaded Expedition Video</span>
              </span>
              <div className="rounded-2xl overflow-hidden border border-white/5 bg-black aspect-video">
                <video src={post.video} controls className="w-full h-full object-contain" />
              </div>
            </div>
          )}



          {/* Report Details Card */}
          {post.postType === 'report' && post.reportDetails && (
            <div className="glass-panel border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs uppercase font-black tracking-widest text-adventure-yellow border-b border-white/5 pb-2">
                Live Trail Report & Conditions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {post.reportDetails.difficulty && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-adventure-muted uppercase font-bold block">Difficulty</span>
                    <span className="font-extrabold uppercase text-white flex items-center space-x-1">
                      <Shield size={12} className="text-adventure-yellow" />
                      <span>{post.reportDetails.difficulty}</span>
                    </span>
                  </div>
                )}
                {post.reportDetails.weather && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-adventure-muted uppercase font-bold block">Weather</span>
                    <span className="font-extrabold text-white flex items-center space-x-1">
                      <CloudRain size={12} className="text-adventure-yellow" />
                      <span>{post.reportDetails.weather}</span>
                    </span>
                  </div>
                )}
                {post.reportDetails.waterAvailability && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-adventure-muted uppercase font-bold block">Water Sources</span>
                    <span className="font-extrabold text-white flex items-center space-x-1">
                      <Droplets size={12} className="text-adventure-yellow" />
                      <span>{post.reportDetails.waterAvailability}</span>
                    </span>
                  </div>
                )}
                {post.reportDetails.permitStatus && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-adventure-muted uppercase font-bold block">Permits Required</span>
                    <span className="font-extrabold uppercase text-white">
                      {post.reportDetails.permitStatus}
                    </span>
                  </div>
                )}
                {post.reportDetails.routeCondition && (
                  <div className="space-y-1 col-span-2 md:col-span-2">
                    <span className="text-[10px] text-adventure-muted uppercase font-bold block">Route Status</span>
                    <span className="font-semibold text-white">
                      {post.reportDetails.routeCondition}
                    </span>
                  </div>
                )}
              </div>
              {post.reportDetails.notes && (
                <div className="bg-[#121212]/50 p-4 rounded-xl border border-white/5 text-xs text-adventure-muted leading-relaxed">
                  <span className="text-[10px] uppercase font-bold text-white block mb-1">Guide Logs / Warnings:</span>
                  {post.reportDetails.notes}
                </div>
              )}
            </div>
          )}

          {/* Description / Story Content */}
          <div className="glass-panel border border-white/5 rounded-2xl p-6 text-xs sm:text-sm text-adventure-muted leading-relaxed space-y-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-adventure-yellow block">
              The Story
            </span>
            <div className="whitespace-pre-line text-white">
              {post.description}
            </div>
            {post.trekTag && (
              <div className="flex items-center space-x-1.5 pt-4 border-t border-white/5">
                <Tag size={12} className="text-adventure-yellow" />
                <span className="text-[10px] font-extrabold uppercase text-adventure-yellow">
                  Tag: {post.trekTag}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (Leader Profile & Related Trek CTA) */}
        <div className="space-y-6">
          {/* Leader profile block */}
          {post.author && (
            <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
              <Link to={`/leaders/${post.author._id}`} className="group relative">
                <img
                  src={post.author.profilePhoto}
                  alt={post.author.name}
                  className="w-24 h-24 rounded-full border-2 border-white/10 group-hover:border-adventure-yellow transition-all object-cover shadow-premium"
                />
                <span className="absolute bottom-1 right-1 bg-adventure-yellow text-adventure-black p-1 rounded-full text-[8px] font-black uppercase border border-adventure-black">
                  GUIDE
                </span>
              </Link>

              <div className="space-y-1">
                <Link to={`/leaders/${post.author._id}`}>
                  <h3 className="font-extrabold text-sm uppercase text-white hover:text-adventure-yellow transition-colors leading-none">
                    {post.author.name}
                  </h3>
                </Link>
                <span className="text-[9px] font-bold text-adventure-yellow uppercase tracking-widest block">
                  {post.author.role}
                </span>
              </div>

              {post.author.bio && (
                <p className="text-[10px] text-adventure-muted leading-relaxed font-medium">
                  "{post.author.bio}"
                </p>
              )}

              {/* Follow Button */}
              {user?._id !== post.author._id && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                    post.isFollowingAuthor
                      ? 'bg-[#121212] border border-white/10 text-adventure-muted hover:border-adventure-red hover:text-adventure-red'
                      : 'bg-adventure-yellow text-adventure-black hover:bg-white shadow-yellow-glow'
                  }`}
                >
                  {post.isFollowingAuthor ? (
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

              {/* Leader Metrics details */}
              <div className="w-full grid grid-cols-2 gap-2 pt-4 border-t border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-adventure-muted uppercase font-bold block">Followers</span>
                  <span className="font-black text-white">{post.author.followersCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-adventure-muted uppercase font-bold block">Experience</span>
                  <span className="font-black text-white">{post.author.experienceYears || 0} Yrs</span>
                </div>
              </div>
            </div>
          )}

          {/* Related Trek Block */}
          {post.relatedTrek && (
            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden flex flex-col h-fit">
              <div className="relative h-32 bg-adventure-charcoal">
                <img
                  src={post.relatedTrek.images && post.relatedTrek.images[0]}
                  alt={post.relatedTrek.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#111111]/40" />
                <div className="absolute top-3 left-3 bg-adventure-black/80 px-2 py-1 rounded text-[8px] font-extrabold uppercase text-adventure-yellow border border-white/5">
                  Related Expedition
                </div>
              </div>

              <div className="p-5 flex flex-col space-y-4">
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-white line-clamp-1">
                    {post.relatedTrek.title}
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-adventure-muted uppercase font-bold mt-1.5">
                    <span>{post.relatedTrek.duration}</span>
                    <span className="text-adventure-yellow">₹{post.relatedTrek.price}</span>
                  </div>
                </div>

                <Link
                  to={`/trek/${post.relatedTrek._id}?postId=${post._id}`}
                  className="py-2.5 w-full bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-yellow-glow text-center flex items-center justify-center space-x-1.5"
                >
                  <span>Book Expedition</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
