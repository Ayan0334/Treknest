import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Calendar, Users, Award, ShieldCheck, Heart, Phone, Mail, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ClimbingLoader, MountainFlagSuccess } from '../components/CustomAnimations';
import ImageUploader from '../components/ImageUploader';


export default function TrekDetails() {
  const { id } = useParams();
  const { user, token, toggleWishlist } = useAuth();

  // States
  const [trek, setTrek] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingSlots, setBookingSlots] = useState(1);
  const [bookingStep, setBookingStep] = useState(1); // 1 = Select, 2 = Payment Pending, 3 = Success
  const [bookingLoading, setBookingLoading] = useState(false);
  const [organizerContacts, setOrganizerContacts] = useState(null);
  
  // Detail Tabs State
  const [activeDetailTab, setActiveDetailTab] = useState('overview');

  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImages, setReviewImages] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [hasAttended, setHasAttended] = useState(false);

  // Wishlist check
  const isWishlisted = user && user.wishlist && user.wishlist.includes(id);

  useEffect(() => {
    fetchTrekDetails();
    if (token) {
      checkAttendance();
    }
  }, [id, token]);

  const checkAttendance = async () => {
    if (!token) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:5000/api/bookings/my-bookings', config);
      if (res.data.status === 'success') {
        const userBookings = res.data.data.bookings;
        const attended = userBookings.some(b => {
          const bTrekId = b.trekId?._id || b.trekId;
          return bTrekId.toString() === id && b.bookingStatus === 'confirmed' && b.attendanceConfirmed;
        });
        setHasAttended(attended);
      }
    } catch (err) {
      console.error('Error checking attendance:', err);
    }
  };

  const fetchTrekDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/treks/${id}`);
      if (res.data.status === 'success') {
        const trekData = res.data.data.trek;
        setTrek(trekData);
        setReviews(res.data.data.reviews);
        const isExpired = trekData.isCompleted || (trekData.startDate && new Date(trekData.startDate) < new Date());
        setBookingSlots(trekData.availableSlots === 0 || isExpired ? 0 : 1);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!user || !token) {
      alert('Please log in to register for this trek.');
      return;
    }
    try {
      setBookingLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Step 1: Create Order
      const orderRes = await axios.post('http://localhost:5000/api/bookings/order', {
        trekId: trek._id,
        slots: bookingSlots
      }, config);

      if (orderRes.data.status === 'success') {
        const { bookingId, orderId, amount, currency, isMock, key } = orderRes.data.data;

        if (isMock) {
          setBookingStep(2);
          // Step 2: Verify Payment (Simulate Razorpay Payment Response)
          setTimeout(async () => {
            try {
              const verifyRes = await axios.post('http://localhost:5000/api/bookings/verify', {
                bookingId,
                orderId,
                paymentId: `pay_${Math.random().toString(36).substr(2, 9)}`,
                status: 'success'
              }, config);

              if (verifyRes.data.status === 'success') {
                setOrganizerContacts(verifyRes.data.data.organizer);
                setBookingStep(3);
              }
            } catch (err) {
              console.error('Verify error:', err);
              setBookingStep(1);
            } finally {
              setBookingLoading(false);
            }
          }, 2000); // 2 seconds simulated payment
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
            setBookingLoading(false);
            return;
          }

          const options = {
            key: key,
            amount: amount,
            currency: currency,
            name: "TrekNest Expedition Booking",
            description: `Locking slots for: ${trek.title}`,
            order_id: orderId,
            handler: async function (response) {
              try {
                setBookingLoading(true);
                setBookingStep(2);
                const verifyRes = await axios.post('http://localhost:5000/api/bookings/verify', {
                  bookingId: bookingId,
                  orderId: orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  status: 'success'
                }, config);

                if (verifyRes.data.status === 'success') {
                  setOrganizerContacts(verifyRes.data.data.organizer);
                  setBookingStep(3);
                }
              } catch (err) {
                alert(err.response?.data?.message || 'Payment verification failed.');
                setBookingStep(1);
              } finally {
                setBookingLoading(false);
              }
            },
            modal: {
              ondismiss: function () {
                setBookingLoading(false);
                setBookingStep(1);
              }
            },
            prefill: {
              name: user.name,
              email: user.email,
              contact: user.phone
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
      console.error('Order creation failed:', err.response?.data?.message || err.message);
      alert(err.response?.data?.message || 'Booking initiation failed.');
      setBookingStep(1);
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setReviewError('');
    setReviewSuccess('');
    try {
      const imageArray = reviewImages ? reviewImages.split(',').map(img => img.trim()).filter(Boolean) : [];
      const res = await axios.post('http://localhost:5000/api/reviews', {
        trekId: trek._id,
        rating,
        comment,
        images: imageArray
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setReviewSuccess('Review posted successfully!');
        setComment('');
        setReviewImages('');
        // Fetch details again to update reviews list
        const updatedRes = await axios.get(`http://localhost:5000/api/treks/${id}`);
        setReviews(updatedRes.data.data.reviews);
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  if (loading || !trek) return <div className="py-20"><ClimbingLoader message="Unfolding trek map..." /></div>;

  const isExpired = trek.isCompleted || (trek.startDate && new Date(trek.startDate) < new Date());
  const isOwnTrek = user && trek && trek.organizerId && (
    (trek.organizerId.userId && (trek.organizerId.userId === user._id || trek.organizerId.userId._id === user._id)) ||
    (trek.organizerId._id === user._id)
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12"
    >
      {/* Hero Header */}
      <div className="relative h-96 w-full rounded-3xl overflow-hidden border border-white/5 shadow-premium">
        <img src={trek.images[0]} alt={trek.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-adventure-black via-adventure-black/50 to-transparent" />
        
        {/* Wishlist toggle floating */}
        <button
          onClick={() => user ? toggleWishlist(trek._id) : alert('Please login')}
          className="absolute top-4 right-4 p-3 bg-adventure-black/60 backdrop-blur-md rounded-full border border-white/10 hover:border-adventure-yellow text-white hover:text-adventure-yellow transition-all"
        >
          <Heart size={20} className={isWishlisted ? 'fill-adventure-yellow text-adventure-yellow' : ''} />
        </button>

        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-adventure-yellow/20 border border-adventure-yellow/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase text-adventure-yellow">
                {trek.difficulty}
              </span>
              <span className="bg-white/10 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-white">
                {trek.duration}
              </span>
              {trek.startDate && (
                <span className="bg-adventure-yellow/15 border border-adventure-yellow/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase text-adventure-yellow">
                  Starts: {new Date(trek.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-wide">{trek.title}</h1>
            <div className="flex flex-col space-y-1 mt-1.5">
              <div className="flex items-center space-x-1 text-adventure-grey text-xs">
                <MapPin size={12} className="text-adventure-yellow" />
                <span>Destination: {trek.destination}</span>
              </div>
              {trek.pickupLocation && (
                <div className="flex items-center space-x-1 text-adventure-yellow text-xs font-bold">
                  <MapPin size={12} className="text-adventure-yellow" />
                  <span>Pickup Meeting Point: {trek.pickupLocation}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Details, Gallery, Organizer, Reviews */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Gallery block */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold uppercase text-white tracking-widest border-l-2 border-adventure-yellow pl-2">Trail Gallery</h3>
            <div className="grid grid-cols-2 gap-4">
              {trek.images.map((img, idx) => (
                <div key={idx} className="h-48 rounded-2xl overflow-hidden border border-white/5 bg-adventure-charcoal">
                  <img src={img} alt="Trek landscape" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Expedition Tabs */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex border-b border-white/10 gap-4 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'itinerary', label: 'Itinerary' },
                { id: 'inclusions', label: 'Inclusions & Exclusions' },
                { id: 'packing', label: 'Packing List' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDetailTab(tab.id)}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${activeDetailTab === tab.id ? 'border-adventure-yellow text-adventure-yellow' : 'border-transparent text-adventure-muted hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-[150px] text-xs leading-relaxed text-adventure-grey font-light whitespace-pre-wrap">
              {activeDetailTab === 'overview' && (
                <div className="space-y-2">
                  <span className="text-[10px] text-adventure-yellow uppercase font-bold tracking-widest block">About the Trail</span>
                  <p className="text-sm font-light leading-relaxed">{trek.description}</p>
                </div>
              )}

              {activeDetailTab === 'itinerary' && (
                <div className="space-y-2">
                  <span className="text-[10px] text-adventure-yellow uppercase font-bold tracking-widest block font-bold">Planned Route Itinerary</span>
                  {trek.itinerary ? (
                    <p className="text-xs leading-relaxed font-light">{trek.itinerary}</p>
                  ) : (
                    <p className="text-xs text-adventure-muted italic">No custom day-by-day itinerary was provided for this event run by the leader.</p>
                  )}
                </div>
              )}

              {activeDetailTab === 'inclusions' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] text-adventure-green uppercase font-black tracking-widest block">What's Included (Covered by Leader)</span>
                    {trek.inclusions ? (
                      <p className="text-xs leading-relaxed font-light">{trek.inclusions}</p>
                    ) : (
                      <p className="text-xs text-adventure-muted italic">Standard local guides, permissions support and high-altitude emergency safety protocols.</p>
                    )}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <span className="text-[10px] text-adventure-red uppercase font-black tracking-widest block">What's Excluded (Payable directly)</span>
                    {trek.exclusions ? (
                      <p className="text-xs leading-relaxed font-light">{trek.exclusions}</p>
                    ) : (
                      <p className="text-xs text-adventure-muted italic">Personal travel/porter cost, premium personal climbing gear and off-site meals.</p>
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'packing' && (
                <div className="space-y-2">
                  <span className="text-[10px] text-adventure-yellow uppercase font-bold tracking-widest block font-bold">Recommended Packing Checklist</span>
                  {trek.whatToBring ? (
                    <p className="text-xs leading-relaxed font-light">{trek.whatToBring}</p>
                  ) : (
                    <p className="text-xs text-adventure-muted italic">Thermal layers, warm trekking boots, water filters, backpack cover, personal medicine.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Organizer details */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h4 className="text-xs uppercase font-extrabold text-adventure-yellow tracking-widest">Trek Leader & Organizer</h4>
            <div className="flex items-center space-x-4">
              <img src={trek.organizerId?.userId?.profilePhoto || trek.organizerId?.profileImage || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400'} alt="Organizer profile" className="w-16 h-16 rounded-full object-cover border-2 border-adventure-yellow/20" />
              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-white uppercase text-sm">{trek.organizerId?.name || 'Himalayan Pioneers'}</h4>
                  {trek.organizerId?.verified && <ShieldCheck size={16} className="text-adventure-yellow" />}
                </div>
                <p className="text-xs text-adventure-muted">{trek.organizerId?.experienceYears || 5} Years Experience</p>
                <div className="flex items-center space-x-1.5 text-xs text-adventure-yellow font-bold mt-1">
                  <Star size={12} className="fill-adventure-yellow" />
                  <span>{trek.organizerId?.ratings || '5.0'} Rating</span>
                </div>
              </div>
            </div>
            {trek.organizerId?.certifications && (
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <span className="text-[10px] text-adventure-muted uppercase block font-bold">Certifications</span>
                <ul className="text-xs space-y-1 text-adventure-grey">
                  {trek.organizerId.certifications.map((c, i) => (
                    <li key={i} className="flex items-center space-x-1.5">
                      <Award size={12} className="text-adventure-yellow" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Past Summit Highlights (Photos from completed runs of this trek title) */}
          {reviews.flatMap(r => r.images || []).length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-bold uppercase text-adventure-yellow tracking-widest border-l-2 border-adventure-yellow pl-2">
                Past Summit Highlights
              </h3>
              <p className="text-xs text-adventure-muted">Photos uploaded by trekkers who summited this expedition previously.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {reviews.flatMap(r => r.images || []).map((img, idx) => (
                  <div key={idx} className="h-28 rounded-xl overflow-hidden border border-white/10 group relative bg-adventure-charcoal">
                    <img 
                      src={img} 
                      alt="Summit moment" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews block */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold uppercase text-white tracking-widest border-l-2 border-adventure-yellow pl-2">Verified Hiker Reviews</h3>

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-xs text-adventure-muted">No reviews yet for this trail. Be the first to conquer and review!</p>
              ) : (
                reviews.map(r => (
                  <div key={r._id} className="p-4 rounded-xl border border-white/5 bg-adventure-card/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <img src={r.userId?.profilePhoto || r.userPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'} alt="Reviewer" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <span className="text-xs font-bold text-white block">{r.userId?.name || r.userName}</span>
                          <span className="text-[9px] text-adventure-green font-extrabold uppercase bg-adventure-green/10 border border-adventure-green/20 px-2 rounded-full inline-block mt-0.5">Verified Hiker</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-0.5 text-adventure-yellow">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} className={i < r.rating ? 'fill-adventure-yellow' : 'text-adventure-charcoal'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-adventure-grey leading-relaxed">{r.comment}</p>
                    {r.images && r.images.length > 0 && (
                      <div className="flex gap-2">
                        {r.images.map((img, i) => (
                          <img key={i} src={img} alt="User upload" className="w-16 h-12 rounded object-cover border border-white/10" />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Write a review form */}
            {hasAttended && (
              <form onSubmit={handleReviewSubmit} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                <h4 className="font-bold text-sm uppercase text-white">Leave a Verified Review</h4>
                <p className="text-[10px] text-adventure-muted">Reviews are only permitted for registered hikers who have completed their attendance confirmation.</p>

                {reviewError && <p className="text-xs text-adventure-red">{reviewError}</p>}
                {reviewSuccess && <p className="text-xs text-adventure-green">{reviewSuccess}</p>}

                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-adventure-grey">Rating:</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="bg-[#121212] border border-white/10 rounded-lg px-2 py-1 text-xs text-adventure-yellow"
                  >
                    {[5, 4, 3, 2, 1].map(num => (
                      <option key={num} value={num}>{num} Stars</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-adventure-grey block">Your Comment</label>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="3"
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                    placeholder="Describe your summit experience..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-adventure-grey block">Upload Experience Photos</label>
                  <ImageUploader
                    label=""
                    onUploadSuccess={(url) => {
                      setReviewImages(prev => prev ? `${prev}, ${url}` : url);
                    }}
                  />
                  <input
                    type="text"
                    value={reviewImages}
                    onChange={(e) => setReviewImages(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-adventure-yellow"
                    placeholder="Uploaded URLs (you can also manually paste additional comma-separated image links)"
                  />
                </div>


                <button
                  type="submit"
                  className="py-2.5 px-6 bg-adventure-yellow text-adventure-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-yellow-glow"
                >
                  Post Review
                </button>
              </form>
            )}

            {user && !hasAttended && (
              <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-1.5">
                <h4 className="font-bold text-xs uppercase text-adventure-yellow">Review Section Locked</h4>
                <p className="text-[11px] text-adventure-muted leading-relaxed">
                  Only trekkers who have a confirmed booking and completed attendance marked by the leader can post reviews and upload summit photos.
                </p>
              </div>
            )}

          </div>

        </div>

        {/* Right 1 Col: Booking Sidebar Card */}
        <div>
          <div className="sticky top-24 glass-panel p-6 rounded-2xl border border-white/5 space-y-6 shadow-premium">
            {bookingStep === 1 && (
              <>
                <div className="border-b border-white/10 pb-4">
                  <span className="text-[10px] uppercase font-bold text-adventure-muted block">Advance Booking Fee</span>
                  <div className="flex items-end space-x-1.5 mt-1">
                    <span className="text-2xl font-black text-adventure-yellow">₹{Math.round(trek.advanceAmount)}</span>
                    <span className="text-xs text-adventure-grey font-light mb-1">/ participant</span>
                  </div>
                  <span className="text-[10px] text-adventure-muted block mt-1">Remaining balance (₹{(Math.round(trek.price) - Math.round(trek.advanceAmount)) * (isExpired || isOwnTrek ? 0 : bookingSlots)}) payable on arrival.</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-adventure-muted block mb-1.5">Select Participants</label>
                    <div className="flex items-center justify-between bg-[#121212] border border-white/10 rounded-xl p-2">
                      <button
                        type="button"
                        disabled={trek.availableSlots === 0 || isExpired || isOwnTrek}
                        onClick={() => setBookingSlots(Math.max(1, bookingSlots - 1))}
                        className="w-8 h-8 rounded-lg bg-white/5 text-white hover:text-adventure-yellow font-bold text-sm disabled:opacity-30 disabled:hover:text-white"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-sm text-white">{isExpired || isOwnTrek ? 0 : bookingSlots}</span>
                      <button
                        type="button"
                        disabled={trek.availableSlots === 0 || isExpired || isOwnTrek}
                        onClick={() => setBookingSlots(Math.min(trek.availableSlots, bookingSlots + 1))}
                        className="w-8 h-8 rounded-lg bg-white/5 text-white hover:text-adventure-yellow font-bold text-sm disabled:opacity-30 disabled:hover:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold pt-2">
                    <span className="text-adventure-grey uppercase">Total Booking Fee:</span>
                    <span className="text-white text-base font-black">₹{isExpired || isOwnTrek ? 0 : Math.round(trek.advanceAmount) * bookingSlots}</span>
                  </div>

                  <button
                    onClick={handleBookingSubmit}
                    disabled={trek.availableSlots === 0 || isExpired || isOwnTrek}
                    className={`w-full py-4 font-black text-xs uppercase tracking-wider rounded-xl transition-all ${(trek.availableSlots === 0 || isExpired || isOwnTrek) ? 'bg-adventure-red/20 text-adventure-red border border-adventure-red/30 cursor-not-allowed' : 'bg-adventure-yellow text-adventure-black shadow-yellow-glow hover:bg-white'}`}
                  >
                    {isOwnTrek ? 'You Are The Leader' : isExpired ? 'Expedition Completed' : trek.availableSlots === 0 ? 'Sold Out / Fully Booked' : 'Pay Booking Fee'}
                  </button>
                </div>
              </>
            )}

            {bookingStep === 2 && (
              <div className="py-8 text-center space-y-4">
                <ClimbingLoader message="Initializing Razorpay UPI Gateway..." />
                <p className="text-[11px] text-adventure-muted px-4">Do not refresh. Validating transaction parameters.</p>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="space-y-6">
                <MountainFlagSuccess title="Booking Confirmed!" />
                
                {/* Unlocked Contacts Cards */}
                {organizerContacts && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-adventure-green/20 bg-adventure-green/5 rounded-2xl p-4 space-y-3"
                  >
                    <span className="text-[10px] text-adventure-green font-extrabold uppercase tracking-widest block mb-1">Organizer Contact Details</span>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                      <Phone size={14} className="text-adventure-green" />
                      <span>{organizerContacts.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                      <Mail size={14} className="text-adventure-green" />
                      <span>{organizerContacts.email}</span>
                    </div>

                    <a
                      href={organizerContacts.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-adventure-green text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all hover:bg-white hover:text-adventure-green"
                    >
                      <CheckCircle2 size={14} />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </motion.div>
                )}

                <button
                  onClick={() => setBookingStep(1)}
                  className="w-full py-2.5 border border-white/10 hover:border-adventure-yellow text-white text-xs uppercase tracking-wider rounded-xl font-bold transition-all text-center"
                >
                  Book Another Slot
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </motion.div>
  );
}
