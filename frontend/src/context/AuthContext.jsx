import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Setup global axios authorizations
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      fetchUserData(token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUserData = async (activeToken) => {
    const tokenToUse = activeToken || token;
    if (!tokenToUse) return;
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });
      if (res.data.status === 'success') {
        setUser(res.data.data.user);
        setProfile(res.data.data.profile);
      }
    } catch (err) {
      console.error('Failed to fetch user data', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      if (res.data.status === 'success') {
        setToken(res.data.token);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  };

  const loginWithOtp = async (email, otp) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login-otp', { email, otp });
      if (res.data.status === 'success') {
        if (res.data.token) {
          setToken(res.data.token);
        }
        return {
          success: true,
          isNewUser: !!res.data.isNewUser,
          message: res.data.message
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'OTP verification failed.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', userData);
      if (res.data.status === 'success') {
        setToken(res.data.token);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (userData) => {
    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setUser(res.data.data.user);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Profile update failed.'
      };
    }
  };

  const toggleWishlist = async (trekId) => {
    if (!user || !token) return { success: false, message: 'Please login to add to wishlist' };
    try {
      const res = await axios.post('http://localhost:5000/api/auth/wishlist/toggle', { trekId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setUser(prev => ({
          ...prev,
          wishlist: res.data.data.wishlist
        }));
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      return { success: false, message: 'Failed to toggle wishlist.' };
    }
  };

  const value = {
    user,
    profile,
    token,
    loading,
    login,
    loginWithOtp,
    register,
    logout,
    updateProfile,
    toggleWishlist,
    refreshUserData: fetchUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
