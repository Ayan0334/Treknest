import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Users, Star, Award, ShieldAlert, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ClimbingLoader } from '../components/CustomAnimations';

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'admin') {
        navigate('/');
      }
    }
  }, [user, authLoading, navigate]);

  const [activeTab, setActiveTab] = useState('organizers');
  const [stats, setStats] = useState(null);
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [pendingGuides, setPendingGuides] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchAdminData();
    }
  }, [token]);

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch stats
      const statsRes = await axios.get('http://localhost:5000/api/admin/analytics', config);
      if (statsRes.data.status === 'success') {
        setStats(statsRes.data.data.stats);
      }

      // Fetch pending organizers
      const orgsRes = await axios.get('http://localhost:5000/api/admin/organizers/pending', config);
      if (orgsRes.data.status === 'success') {
        setPendingOrgs(orgsRes.data.data.organizers);
      }

      // Fetch pending guides
      const guidesRes = await axios.get('http://localhost:5000/api/admin/guides/pending', config);
      if (guidesRes.data.status === 'success') {
        setPendingGuides(guidesRes.data.data.guides);
      }

      // Fetch reviews
      const reviewsRes = await axios.get('http://localhost:5000/api/admin/reviews', config);
      if (reviewsRes.data.status === 'success') {
        setReviews(reviewsRes.data.data.reviews);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrganizer = async (id) => {
    if (!token) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/admin/organizers/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        alert('Organizer profile approved and verified successfully!');
        fetchAdminData();
      }
    } catch (err) {
      alert('Approval failed.');
    }
  };

  const handleApproveGuide = async (id, statusType) => {
    if (!token) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/admin/guides/${id}/approve`, {
        status: statusType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        alert(`Guide status updated to ${statusType.toUpperCase()}`);
        fetchAdminData();
      }
    } catch (err) {
      alert('Approval action failed.');
    }
  };

  const handleRemoveReview = async (id) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to remove this review?')) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        alert('Review moderated and deleted successfully!');
        fetchAdminData();
      }
    } catch (err) {
      alert('Failed to delete review.');
    }
  };

  if (loading || authLoading || !user || user.role !== 'admin' || !stats) return <div className="py-20"><ClimbingLoader message="Loading admin database..." /></div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8"
    >
      {/* Global Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] text-adventure-muted block uppercase font-bold">Total Accounts</span>
          <span className="text-xl font-black text-white">{stats.totalUsers}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] text-adventure-muted block uppercase font-bold">Trek Guides</span>
          <span className="text-xl font-black text-white">{stats.totalGuides}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] text-adventure-muted block uppercase font-bold">Expeditions</span>
          <span className="text-xl font-black text-white">{stats.totalTreks}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] text-adventure-muted block uppercase font-bold">Total Bookings</span>
          <span className="text-xl font-black text-white">{stats.totalBookings}</span>
        </div>
        <div className="glass-panel col-span-2 lg:col-span-1 p-4 rounded-xl border border-white/5 text-center bg-adventure-yellow/5">
          <span className="text-[10px] text-adventure-yellow block uppercase font-bold">Revenue</span>
          <span className="text-xl font-black text-adventure-yellow">₹{stats.totalRevenue}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-4">
        {[
          { id: 'organizers', label: 'Verify Leaders', count: pendingOrgs.length },
          { id: 'guides', label: 'Approve Guides', count: pendingGuides.length },
          { id: 'reviews', label: 'Moderate Reviews', count: reviews.length }
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
        
        {/* Verify Organizers */}
        {activeTab === 'organizers' && (
          <div className="space-y-4">
            {pendingOrgs.length === 0 ? (
              <div className="text-center py-16 glass-panel rounded-2xl border border-white/5">
                <p className="text-xs text-adventure-muted uppercase font-bold">All organizer profiles verified</p>
              </div>
            ) : (
              pendingOrgs.map(o => (
                <div key={o._id} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-white text-sm uppercase">{o.name}</h3>
                    <p className="text-xs text-adventure-muted mt-1">Exp: {o.experienceYears} years | WhatsApp: {o.whatsappNumber}</p>
                    {o.certifications && o.certifications.length > 0 && (
                      <p className="text-[10px] text-adventure-grey mt-0.5">Certifications: {o.certifications.join(', ')}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleApproveOrganizer(o._id)}
                    className="py-2 px-4 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase rounded-xl hover:bg-white transition-colors"
                  >
                    Verify & Approve
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Approve Guides */}
        {activeTab === 'guides' && (
          <div className="space-y-4">
            {pendingGuides.length === 0 ? (
              <div className="text-center py-16 glass-panel rounded-2xl border border-white/5">
                <p className="text-xs text-adventure-muted uppercase font-bold">No pending guide applications</p>
              </div>
            ) : (
              pendingGuides.map(g => (
                <div key={g._id} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-white text-sm uppercase">{g.name}</h3>
                    <p className="text-xs text-adventure-muted mt-1">Region: {g.location} | WhatsApp: {g.whatsappNumber} | Charge: ₹{g.charge}</p>
                    {g.services && g.services.length > 0 && (
                      <p className="text-[10px] text-adventure-grey mt-0.5">Services: {g.services.join(', ')}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveGuide(g._id, 'approved')}
                      className="py-2 px-4 bg-adventure-green text-white font-extrabold text-xs uppercase rounded-xl hover:bg-white hover:text-adventure-green transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveGuide(g._id, 'rejected')}
                      className="py-2 px-4 bg-adventure-red text-white font-extrabold text-xs uppercase rounded-xl hover:bg-white hover:text-adventure-red transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Moderate Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-16 glass-panel rounded-2xl border border-white/5">
                <p className="text-xs text-adventure-muted uppercase font-bold">No reviews found on platform</p>
              </div>
            ) : (
              reviews.map(r => (
                <div key={r._id} className="glass-panel p-5 rounded-2xl border border-white/5 flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{r.userName}</span>
                      <span className="text-[9px] text-adventure-yellow bg-adventure-yellow/10 px-2 py-0.5 rounded font-extrabold uppercase">{r.rating} Stars</span>
                    </div>
                    <p className="text-xs text-adventure-grey">{r.comment}</p>
                    <span className="text-[9px] text-adventure-muted block">Trek ID: {r.trekId}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveReview(r._id)}
                    className="p-2.5 bg-adventure-red/10 border border-adventure-red/20 text-adventure-red rounded-xl hover:bg-adventure-red hover:text-white transition-colors"
                    title="Remove fake review"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </motion.div>
  );
}
