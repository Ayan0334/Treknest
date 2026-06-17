import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, Phone, MapPin, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0F0F0F] border-t border-white/5 pt-16 pb-8 text-adventure-grey">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        
        {/* Col 1: Brand */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-white">
            <Compass className="w-8 h-8 text-adventure-yellow" />
            <span className="font-extrabold text-xl tracking-wider uppercase">Trek<span className="text-adventure-yellow">Nest</span></span>
          </div>
          <p className="text-xs leading-relaxed text-adventure-muted">
            TrekNest is the premier Himalayan adventure marketplace, linking organizers, certified mountain leaders, local guides, and passionate hikers.
          </p>
        </div>

        {/* Col 2: Destinations */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-l-2 border-adventure-yellow pl-2">Regions</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/search?destination=Sandakphu" className="hover:text-adventure-yellow transition-colors">Sandakphu & Phalut</Link></li>
            <li><Link to="/search?destination=Sikkim" className="hover:text-adventure-yellow transition-colors">Sikkim Ridges</Link></li>
            <li><Link to="/search?destination=Meghalaya" className="hover:text-adventure-yellow transition-colors">Meghalaya root bridges</Link></li>
            <li><Link to="/search?destination=Darjeeling" className="hover:text-adventure-yellow transition-colors">Darjeeling Foothills</Link></li>
             <li><Link to="/search?destination=Neora Valley" className="hover:text-adventure-yellow transition-colors">Neora Valley</Link></li>
             <li><Link to="/search?destination=Buxa Hills" className="hover:text-adventure-yellow transition-colors">Buxa Hills</Link></li>
          
          </ul>
        </div>

        {/* Col 3: Quick Links */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-l-2 border-adventure-yellow pl-2">Platform</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/search" className="hover:text-adventure-yellow transition-colors">Explore Treks</Link></li>
            <li><Link to="/guides" className="hover:text-adventure-yellow transition-colors">Guide Marketplace</Link></li>
            <li><Link to="/about" className="hover:text-adventure-yellow transition-colors">About Team</Link></li>
            <li><Link to="/login" className="hover:text-adventure-yellow transition-colors">Partner Log In</Link></li>
          </ul>
        </div>

        {/* Col 4: Support */}
        <div className="space-y-3 text-xs">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-l-2 border-adventure-yellow pl-2">Contact</h4>
          <div className="flex items-center space-x-2 text-adventure-muted">
            <MapPin size={14} className="text-adventure-yellow" />
            <span>Kolkata, West Bengal, India</span>
          </div>
          <div className="flex items-center space-x-2 text-adventure-muted">
            <Mail size={14} className="text-adventure-yellow" />
            <span>treknest.support@gmail.com</span>
          </div>
          <div className="flex items-center space-x-2 text-adventure-muted">
            <Phone size={14} className="text-adventure-yellow" />
            <span>+91 9144779932</span>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-adventure-muted">
        <p>&copy; {new Date().getFullYear()} TrekNest Inc. Adventure Tourism & Trek Booking. All rights reserved.</p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Link to="/privacy" className="hover:text-adventure-yellow transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-adventure-yellow transition-colors">Terms of Service</Link>
          <span className="flex items-center space-x-1">
            <Shield size={10} className="text-adventure-yellow" />
            <span>Secure SSL Encrypted</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
