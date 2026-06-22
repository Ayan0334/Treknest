import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Menu, X, Bell, User, LogOut, Heart, Map, Calendar, Settings } from 'lucide-react';
import axios from 'axios';

export default function Navbar() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [snowActive, setSnowActive] = useState(() => localStorage.getItem('snowMode') === 'true');

  const handleLogoClick = (e) => {
    e.preventDefault();
    const newCount = logoClickCount + 1;
    if (newCount >= 5) {
      const newSnow = !snowActive;
      setSnowActive(newSnow);
      localStorage.setItem('snowMode', String(newSnow));
      window.dispatchEvent(new CustomEvent('toggleSnowMode', { detail: { active: newSnow } }));
      setLogoClickCount(0);
    } else {
      setLogoClickCount(newCount);
      // Reset after 3 seconds of inactivity
      const timer = setTimeout(() => setLogoClickCount(0), 3000);
      navigate('/');
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setNotifications(res.data.data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  const handleMarkRead = async (id) => {
    if (!token) return;
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const dashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'organizer') return '/organizer';
    if (user.role === 'guide') return '/guide';
    return '/dashboard'; // trekker
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-adventure-black/80 backdrop-blur-md border-b border-white/5 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          onClick={handleLogoClick}
          className="flex items-center space-x-2 text-white hover:text-adventure-yellow transition-colors cursor-pointer select-none"
        >
          <Compass className="w-8 h-8 text-adventure-yellow animate-spin-slow" />
          <span className="font-extrabold text-xl tracking-wider uppercase">Trek<span className="text-adventure-yellow">Nest</span></span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/search" className="text-sm font-semibold tracking-wider hover:text-adventure-yellow transition-colors uppercase">Explore Treks</Link>
          <Link to="/stories" className="text-sm font-semibold tracking-wider hover:text-adventure-yellow transition-colors uppercase">Stories</Link>
          <Link to="/guides" className="text-sm font-semibold tracking-wider hover:text-adventure-yellow transition-colors uppercase">Find Guides</Link>
          <Link to="/about" className="text-sm font-semibold tracking-wider hover:text-adventure-yellow transition-colors uppercase">About Us</Link>

          {user ? (
            <div className="flex items-center space-x-4">
              
              {/* Notification icon */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="p-2 text-adventure-grey hover:text-adventure-yellow transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-adventure-yellow rounded-full ring-2 ring-adventure-black animate-pulse" />
                  )}
                </button>

                {/* Notifications dropdown */}
                <AnimatePresence>
                  {showNotifDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-3 w-80 rounded-2xl glass-panel shadow-premium p-4 z-50 overflow-hidden"
                    >
                      <h4 className="font-bold border-b border-white/10 pb-2 mb-2 flex justify-between items-center text-sm text-adventure-yellow">
                        <span>Notifications</span>
                        <span className="text-xs font-normal text-white">{unreadCount} unread</span>
                      </h4>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-adventure-muted text-center py-4">No notifications yet.</p>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n._id} 
                              onClick={() => !n.readStatus && handleMarkRead(n._id)}
                              className={`p-2 rounded-lg text-left transition-colors cursor-pointer ${n.readStatus ? 'bg-white/5 opacity-60' : 'bg-adventure-yellow/10 border-l-2 border-adventure-yellow'}`}
                            >
                              <p className="text-xs font-bold text-white">{n.title}</p>
                              <p className="text-[10px] text-adventure-grey mt-0.5">{n.body}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dashboard Action */}
              <Link
                to={dashboardPath()}
                className="flex items-center space-x-1.5 py-2 px-4 bg-white/5 border border-white/10 hover:border-adventure-yellow/30 hover:bg-adventure-yellow hover:text-adventure-black font-semibold text-xs rounded-xl tracking-wider uppercase transition-all"
              >
                <User size={14} />
                <span>Dashboard</span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-adventure-muted hover:text-adventure-red transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="py-2 px-4 bg-transparent border border-white/10 text-white font-bold text-xs rounded-xl hover:border-adventure-yellow transition-all uppercase tracking-wider"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="py-2 px-4 bg-adventure-yellow text-adventure-black font-extrabold text-xs rounded-xl hover:bg-white transition-all uppercase tracking-wider shadow-yellow-glow"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-2">
          {user && (
            <Link to="/notifications" className="p-2 text-adventure-grey relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-adventure-yellow rounded-full" />
              )}
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-adventure-grey hover:text-white transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-adventure-black px-4 pt-2 pb-6 space-y-3"
          >
            <Link 
              to="/search" 
              onClick={() => setIsOpen(false)}
              className="block py-2 text-sm font-semibold tracking-widest text-adventure-grey hover:text-adventure-yellow uppercase"
            >
              Explore Treks
            </Link>
            <Link 
              to="/stories" 
              onClick={() => setIsOpen(false)}
              className="block py-2 text-sm font-semibold tracking-widest text-adventure-grey hover:text-adventure-yellow uppercase"
            >
              Stories
            </Link>
            <Link 
              to="/guides" 
              onClick={() => setIsOpen(false)}
              className="block py-2 text-sm font-semibold tracking-widest text-adventure-grey hover:text-adventure-yellow uppercase"
            >
              Find Guides
            </Link>
            <Link 
              to="/about" 
              onClick={() => setIsOpen(false)}
              className="block py-2 text-sm font-semibold tracking-widest text-adventure-grey hover:text-adventure-yellow uppercase"
            >
              About Us
            </Link>

            {user ? (
              <div className="pt-4 border-t border-white/10 space-y-3">
                <Link
                  to={dashboardPath()}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2 py-3 px-4 bg-white/5 rounded-xl text-sm font-bold text-adventure-yellow"
                >
                  <User size={16} />
                  <span>My Dashboard ({user.role})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 py-3 px-4 bg-adventure-red/10 text-adventure-red rounded-xl text-sm font-bold"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-white/10 flex flex-col space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 bg-white/5 text-center font-bold text-sm rounded-xl hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 bg-adventure-yellow text-adventure-black font-extrabold text-center text-sm rounded-xl shadow-yellow-glow"
                >
                  Register
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
