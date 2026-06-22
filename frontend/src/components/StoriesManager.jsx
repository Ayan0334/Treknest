import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, BarChart2, Eye, Heart, Bookmark, EyeOff, Share2, Compass, AlertCircle, Upload, Check, Loader2, ArrowLeft, Users, ShoppingBag, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function StoriesManager({ token, user }) {
  // Navigation View
  const [view, setView] = useState('list'); // list, create, edit, analytics
  const [posts, setPosts] = useState([]);
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [error, setError] = useState('');

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [trekTag, setTrekTag] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [postType, setPostType] = useState('experience'); // experience, report, vlog, announcement
  const [status, setStatus] = useState('published'); // draft, published, archived
  const [videoUrl, setVideoUrl] = useState('');
  const [relatedTrek, setRelatedTrek] = useState('');

  // Media upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Trail Report Specific fields
  const [weather, setWeather] = useState('');
  const [difficulty, setDifficulty] = useState('moderate');
  const [routeCondition, setRouteCondition] = useState('');
  const [permitStatus, setPermitStatus] = useState('none');
  const [waterAvailability, setWaterAvailability] = useState('');
  const [reportNotes, setReportNotes] = useState('');

  useEffect(() => {
    fetchMyPosts();
    fetchRelatedTreks();
  }, []);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('http://localhost:5000/api/posts/my-posts', { headers });
      if (res.data.status === 'success') {
        setPosts(res.data.data.posts);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve stories.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedTreks = async () => {
    try {
      const treksRes = await axios.get('http://localhost:5000/api/treks?includeCompleted=true');
      
      let myBookedTrekIds = [];
      if (token) {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
          const bookingsRes = await axios.get('http://localhost:5000/api/bookings/my-bookings', config);
          if (bookingsRes.data.status === 'success') {
            myBookedTrekIds = bookingsRes.data.data.bookings.map(b => b.trekId?._id || b.trekId);
          }
        } catch (bErr) {
          console.error('Error fetching my bookings:', bErr.message);
        }
      }

      if (treksRes.data.status === 'success') {
        const allTreks = treksRes.data.data.treks;
        const filtered = allTreks.filter(t => {
          const isHost = t.organizerId?.userId?._id?.toString() === user?._id?.toString() || 
                         t.organizerId?.userId?.toString() === user?._id?.toString();
                         
          const isCompleted = user?.completedTreks && (
            user.completedTreks.includes(t._id) ||
            user.completedTreks.some(id => (id._id || id).toString() === t._id.toString())
          );
          
          const isBooked = myBookedTrekIds.some(id => id && id.toString() === t._id.toString());
          
          return isHost || isCompleted || isBooked;
        });
        setTreks(filtered);
      }
    } catch (err) {
      console.error('Failed to load treks:', err.message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setTrekTag('');
    setCoverImage('');
    setPostType('experience');
    setStatus('published');
    setVideoUrl('');
    setRelatedTrek('');
    setWeather('');
    setDifficulty('moderate');
    setRouteCondition('');
    setPermitStatus('none');
    setWaterAvailability('');
    setReportNotes('');
    setError('');
  };

  const handleCreateClick = () => {
    resetForm();
    setView('create');
  };

  const handleEditClick = (post) => {
    setSelectedPost(post);
    setTitle(post.title || '');
    setDescription(post.description || '');
    setLocation(post.location || '');
    setTrekTag(post.trekTag || '');
    setCoverImage(post.coverImage || '');
    setPostType(post.postType || 'experience');
    setStatus(post.status || 'draft');
    setVideoUrl(post.video || '');
    setRelatedTrek(post.relatedTrek?._id || post.relatedTrek || '');

    if (post.reportDetails) {
      setWeather(post.reportDetails.weather || '');
      setDifficulty(post.reportDetails.difficulty || 'moderate');
      setRouteCondition(post.reportDetails.routeCondition || '');
      setPermitStatus(post.reportDetails.permitStatus || 'none');
      setWaterAvailability(post.reportDetails.waterAvailability || '');
      setReportNotes(post.reportDetails.notes || '');
    } else {
      setWeather('');
      setDifficulty('moderate');
      setRouteCondition('');
      setPermitStatus('none');
      setWaterAvailability('');
      setReportNotes('');
    }
    setView('edit');
  };

  const handleAnalyticsClick = (post) => {
    setSelectedPost(post);
    setView('analytics');
  };

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'cover') {
      setUploadingCover(true);
    } else {
      setUploadingVideo(true);
    }

    try {
      const formData = new FormData();
      formData.append('image', file); // Backend expects key name 'image'

      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.status === 'success') {
        if (type === 'cover') {
          setCoverImage(res.data.url);
        } else {
          setVideoUrl(res.data.url);
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Upload failed. Ensure file size is below 25MB.');
    } finally {
      setUploadingCover(false);
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !coverImage) {
      setError('Please provide title, description, and cover image.');
      return;
    }

    const payload = {
      title,
      description,
      location,
      trekTag,
      coverImage,
      postType,
      status,
      video: videoUrl,
      relatedTrek: relatedTrek || null
    };

    if (postType === 'report') {
      payload.reportDetails = {
        weather,
        difficulty,
        routeCondition,
        permitStatus,
        waterAvailability,
        notes: reportNotes
      };
    }

    try {
      setError('');
      const headers = { Authorization: `Bearer ${token}` };
      
      let res;
      if (view === 'create') {
        res = await axios.post('http://localhost:5000/api/posts', payload, { headers });
      } else {
        res = await axios.put(`http://localhost:5000/api/posts/${selectedPost._id}`, payload, { headers });
      }

      if (res.data.status === 'success') {
        alert(view === 'create' ? 'Story published successfully!' : 'Story updated successfully!');
        resetForm();
        setView('list');
        fetchMyPosts();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Transaction failed.');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this story? This action is irreversible.')) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.delete(`http://localhost:5000/api/posts/${postId}`, { headers });
      if (res.data.status === 'success') {
        alert('Story deleted.');
        fetchMyPosts();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete story.');
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

  return (
    <div className="space-y-6">
      {/* 1. LIST VIEW */}
      {view === 'list' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <div>
              <h3 className="font-extrabold text-sm uppercase text-adventure-yellow tracking-widest">
                My Trek Stories
              </h3>
              <p className="text-[10px] text-adventure-muted mt-1 uppercase font-semibold">
                Manage your expedition reports, vlogs, and announcements
              </p>
            </div>
            <button
              onClick={handleCreateClick}
              className="py-2 px-4 bg-adventure-yellow hover:bg-white text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow flex items-center space-x-1.5"
            >
              <Plus size={14} />
              <span>Create Story</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-adventure-yellow animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border border-white/5 flex flex-col items-center">
              <Compass size={36} className="text-adventure-muted mb-2 animate-bounce" />
              <p className="text-xs text-adventure-muted uppercase font-bold">No stories created yet</p>
              <button
                onClick={handleCreateClick}
                className="mt-3 text-xs bg-adventure-yellow text-adventure-black px-4 py-2 font-extrabold rounded-lg uppercase tracking-wider"
              >
                Publish Your First
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="rounded-2xl overflow-hidden glass-panel border border-white/5 flex flex-col h-[380px]"
                >
                  {/* Card Image Cover */}
                  <div className="relative h-36 bg-adventure-charcoal">
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-adventure-black/80 text-adventure-yellow border border-white/5">
                      {formatPostType(post.postType)}
                    </div>
                    <div className={`absolute top-3 right-3 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                      post.status === 'published'
                        ? 'bg-adventure-green/20 border-adventure-green text-adventure-green'
                        : post.status === 'archived'
                        ? 'bg-adventure-red/20 border-adventure-red text-adventure-red'
                        : 'bg-white/10 border-white/20 text-adventure-muted'
                    }`}>
                      {post.status}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex flex-col flex-grow space-y-2">
                    <h4 className="font-extrabold text-white text-xs uppercase line-clamp-1">
                      {post.title}
                    </h4>
                    <p className="text-[10px] text-adventure-muted line-clamp-3 leading-relaxed">
                      {post.description}
                    </p>

                    {/* Mini Analytics Row */}
                    <div className="flex items-center gap-3 text-[10px] font-bold text-adventure-muted pt-2 border-t border-white/5 mt-auto">
                      <span className="flex items-center space-x-1"><Eye size={10} /> <span>{post.viewsCount || 0}</span></span>
                      <span className="flex items-center space-x-1"><Heart size={10} /> <span>{post.likesCount || 0}</span></span>
                      <span className="flex items-center space-x-1"><Bookmark size={10} /> <span>{post.savesCount || 0}</span></span>
                      {post.bookingsCount > 0 && (
                        <span className="text-adventure-yellow ml-auto font-black uppercase text-[8px] tracking-wider">
                          {post.bookingsCount} Bookings Attributed
                        </span>
                      )}
                    </div>

                    {/* Actions Panel */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleEditClick(post)}
                        className="py-1.5 px-2 bg-white/5 hover:bg-white/10 text-white font-bold text-[9px] uppercase rounded-lg border border-white/10 transition-all flex items-center justify-center space-x-1"
                      >
                        <Edit3 size={10} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleAnalyticsClick(post)}
                        className="py-1.5 px-2 bg-adventure-yellow/10 hover:bg-adventure-yellow/20 text-adventure-yellow font-bold text-[9px] uppercase rounded-lg border border-adventure-yellow/20 transition-all flex items-center justify-center space-x-1"
                      >
                        <BarChart2 size={10} />
                        <span>Metrics</span>
                      </button>

                      <button
                        onClick={() => handleDelete(post._id)}
                        className="py-1.5 px-2 bg-adventure-red/10 hover:bg-adventure-red/20 text-adventure-red font-bold text-[9px] uppercase rounded-lg border border-adventure-red/20 transition-all flex items-center justify-center space-x-1"
                      >
                        <Trash2 size={10} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. CREATE/EDIT VIEW */}
      {(view === 'create' || view === 'edit') && (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6 max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-extrabold text-sm uppercase text-adventure-yellow tracking-widest">
              {view === 'create' ? 'Publish Story' : 'Modify Story'}
            </h3>
            <button
              onClick={() => setView('list')}
              className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-adventure-muted hover:text-white"
            >
              <ArrowLeft size={12} />
              <span>Back</span>
            </button>
          </div>

          {error && (
            <div className="bg-adventure-red/10 border border-adventure-red/20 p-3 rounded-xl flex items-center space-x-2 text-adventure-red text-xs">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Story Title</label>
                <input
                  required
                  type="text"
                  placeholder="Summits & Sunrise details..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-adventure-yellow"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Post Type</label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-adventure-yellow"
                >
                  <option value="experience">Exp Report / Post</option>
                  <option value="report">Trail Condition Report</option>
                  <option value="vlog">Video Log / Vlog</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Darjeeling, Sikkim"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-adventure-yellow"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Tags (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. winter, snow, adventure"
                  value={trekTag}
                  onChange={(e) => setTrekTag(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-adventure-yellow"
                />
              </div>
            </div>

            {/* Trail Report Specific Fields */}
            {postType === 'report' && (
              <div className="bg-[#121212]/50 border border-white/5 rounded-2xl p-4 space-y-4">
                <h4 className="text-[10px] uppercase font-black tracking-widest text-adventure-yellow border-b border-white/5 pb-1.5">
                  Trail Conditions Setup
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-adventure-muted block">Weather</label>
                    <input
                      type="text"
                      placeholder="e.g. Clear, Rainy"
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-adventure-muted block">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                    >
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="difficult">Difficult</option>
                      <option value="challenging">Challenging</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-adventure-muted block">Permit Status</label>
                    <select
                      value={permitStatus}
                      onChange={(e) => setPermitStatus(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                    >
                      <option value="none">No Permits Required</option>
                      <option value="required">Permits Required</option>
                      <option value="on-arrival">Available on Arrival</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-adventure-muted block">Route Conditions</label>
                    <input
                      type="text"
                      placeholder="e.g. Landslides near Singalila, Snow accumulation"
                      value={routeCondition}
                      onChange={(e) => setRouteCondition(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-adventure-muted block">Water Sources</label>
                    <input
                      type="text"
                      placeholder="e.g. Refills available at all tea houses"
                      value={waterAvailability}
                      onChange={(e) => setWaterAvailability(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-adventure-muted block">Safety Warnings / Notes</label>
                  <textarea
                    rows="2"
                    placeholder="Provide detailed instructions about water filtration, spikes, permits..."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow resize-none"
                  />
                </div>
              </div>
            )}

            {/* Description content */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-adventure-muted block">Story Content</label>
              <textarea
                required
                rows="6"
                placeholder="Write your adventure story, summary, conditions logs here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-adventure-yellow resize-none leading-relaxed"
              />
            </div>

            {/* Media Uploads */}
            <div className="grid grid-cols-2 gap-4">
              {/* Cover Image Upload */}
              <div className="space-y-1 bg-[#121212]/30 border border-white/5 p-4 rounded-xl">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-2">Cover Photo</label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                    {coverImage ? (
                      <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="text-adventure-muted w-5 h-5" />
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-adventure-yellow animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer py-2 px-3 bg-white/5 border border-white/10 hover:border-adventure-yellow/30 text-[10px] font-bold uppercase rounded-lg text-white transition-all">
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'cover')} />
                  </label>
                </div>
              </div>

              {/* Video File Upload */}
              <div className="space-y-1 bg-[#121212]/30 border border-white/5 p-4 rounded-xl">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-2">Expedition Video (Optional)</label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                    {videoUrl ? (
                      <div className="text-adventure-green text-xs font-black uppercase">MP4</div>
                    ) : (
                      <Upload className="text-adventure-muted w-5 h-5" />
                    )}
                    {uploadingVideo && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-adventure-yellow animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer py-2 px-3 bg-white/5 border border-white/10 hover:border-adventure-yellow/30 text-[10px] font-bold uppercase rounded-lg text-white transition-all">
                    <span>Upload Video</span>
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'video')} />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {/* Related Trek Link (Attributions) */}
              <label className="text-[10px] uppercase font-bold text-adventure-muted block">Related Trek Expedition</label>
              <select
                value={relatedTrek}
                onChange={(e) => setRelatedTrek(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-adventure-yellow"
              >
                <option value="">No Linked Trek</option>
                {treks.map(t => (
                  <option key={t._id} value={t._id}>{t.title} (₹{t.price})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Story Status */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-adventure-muted block">Story Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-adventure-yellow"
                >
                  <option value="draft">Draft (Visible only to you)</option>
                  <option value="published">Published (Visible in feed, dispatches alerts)</option>
                  <option value="archived">Archived (Stored privately)</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploadingCover || uploadingVideo}
              className="w-full py-3.5 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-yellow-glow hover:bg-white"
            >
              {view === 'create' ? 'Publish Story' : 'Save Story Changes'}
            </button>
          </form>
        </div>
      )}

      {/* 3. ANALYTICS VIEW */}
      {view === 'analytics' && selectedPost && (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-extrabold text-sm uppercase text-adventure-yellow tracking-widest">
              Story Engagement Metrics
            </h3>
            <button
              onClick={() => setView('list')}
              className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-adventure-muted hover:text-white"
            >
              <ArrowLeft size={12} />
              <span>Back</span>
            </button>
          </div>

          <div className="text-center space-y-1">
            <h4 className="font-black text-white text-base uppercase">{selectedPost.title}</h4>
            <span className="text-[9px] text-adventure-yellow uppercase font-bold tracking-widest">
              Published on: {selectedPost.publishDate ? new Date(selectedPost.publishDate).toLocaleDateString() : 'Draft / Unpublished'}
            </span>
          </div>

          {/* Analytics Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-[#121212]/50 border border-white/5 p-4 rounded-xl text-center space-y-1">
              <Eye className="w-5 h-5 mx-auto text-adventure-yellow opacity-70" />
              <span className="text-[9px] text-adventure-muted uppercase font-bold block">Total Views</span>
              <span className="text-2xl font-black text-white">{selectedPost.viewsCount || 0}</span>
            </div>

            <div className="bg-[#121212]/50 border border-white/5 p-4 rounded-xl text-center space-y-1">
              <Eye className="w-5 h-5 mx-auto text-adventure-yellow opacity-70 animate-pulse" />
              <span className="text-[9px] text-adventure-muted uppercase font-bold block">Unique Views</span>
              <span className="text-2xl font-black text-white">{(selectedPost.uniqueViews || []).length || 0}</span>
            </div>

            <div className="bg-[#121212]/50 border border-white/5 p-4 rounded-xl text-center space-y-1">
              <Heart className="w-5 h-5 mx-auto text-adventure-yellow opacity-70" />
              <span className="text-[9px] text-adventure-muted uppercase font-bold block">Likes Received</span>
              <span className="text-2xl font-black text-white">{selectedPost.likesCount || 0}</span>
            </div>

            <div className="bg-[#121212]/50 border border-white/5 p-4 rounded-xl text-center space-y-1">
              <Bookmark className="w-5 h-5 mx-auto text-adventure-yellow opacity-70" />
              <span className="text-[9px] text-adventure-muted uppercase font-bold block">Saves Count</span>
              <span className="text-2xl font-black text-white">{selectedPost.savesCount || 0}</span>
            </div>

            <div className="bg-[#121212]/50 border border-white/5 p-4 rounded-xl text-center space-y-1">
              <Users className="w-5 h-5 mx-auto text-adventure-yellow opacity-70" />
              <span className="text-[9px] text-adventure-muted uppercase font-bold block">Followers Gained</span>
              <span className="text-2xl font-black text-white">{selectedPost.followersGained || 0}</span>
            </div>

            <div className="bg-[#121212]/50 border border-white/5 p-4 rounded-xl text-center space-y-1">
              <ShoppingBag className="w-5 h-5 mx-auto text-adventure-yellow opacity-70 animate-bounce" />
              <span className="text-[9px] text-adventure-muted uppercase font-bold block">Bookings Attributed</span>
              <span className="text-2xl font-black text-adventure-yellow">{selectedPost.bookingsCount || 0}</span>
            </div>
          </div>

          <div className="bg-[#121212]/30 p-4 rounded-xl border border-white/5 space-y-2">
            <span className="text-[9px] text-adventure-yellow uppercase font-bold tracking-widest block">Attribution Summary</span>
            <p className="text-[10px] text-adventure-muted leading-relaxed font-medium">
              Whenever a reader clicks the related trek expedition booking link inside your story and confirms their payment, the system attributes that booking to this specific post and increments your bookings count.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
