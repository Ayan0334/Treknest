import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SnowEffect from './components/SnowEffect';

// Pages
import Home from './pages/Home';
import SearchTreks from './pages/SearchTreks';
import TrekDetails from './pages/TrekDetails';
import SearchGuides from './pages/SearchGuides';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import GuideDashboard from './pages/GuideDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Stories from './pages/Stories';
import StoryDetails from './pages/StoryDetails';
import LeaderProfile from './pages/LeaderProfile';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export default function App() {
  const [snowActive, setSnowActive] = useState(() => localStorage.getItem('snowMode') === 'true');

  useEffect(() => {
    const handleToggleSnow = (e) => {
      setSnowActive(e.detail.active);
    };
    window.addEventListener('toggleSnowMode', handleToggleSnow);
    return () => window.removeEventListener('toggleSnowMode', handleToggleSnow);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-adventure-black">
            {snowActive && <SnowEffect />}
            <Navbar />
            <main className="flex-grow">
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchTreks />} />
                <Route path="/trek/:id" element={<TrekDetails />} />
                <Route path="/guides" element={<SearchGuides />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/stories/:slug" element={<StoryDetails />} />
                <Route path="/leaders/:id" element={<LeaderProfile />} />
                
                {/* Auth Pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Dashboard Pages */}
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/organizer" element={<OrganizerDashboard />} />
                <Route path="/guide" element={<GuideDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
