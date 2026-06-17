import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, MapPin, Sparkles, Compass } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12"
    >
      {/* Header Banner */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-adventure-yellow/10 flex items-center justify-center text-adventure-yellow shadow-yellow-glow">
          <Shield size={24} className="animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-wide">Privacy Protocol</h1>
        <p className="text-xs text-adventure-muted max-w-md mx-auto leading-relaxed">
          How we guard your personal trail data at TrekNest. We protect your credentials like we protect our high-altitude base camps.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Summary Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6 h-fit md:sticky md:top-24">
          <div className="border-b border-white/10 pb-4">
            <h4 className="font-extrabold text-xs uppercase text-adventure-yellow tracking-widest">Basecamp Rules</h4>
            <p className="text-[10px] text-adventure-muted mt-1">Quick takeaways of our privacy code.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start space-x-3">
              <Eye size={16} className="text-adventure-yellow mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-white block">Absolute Visibility</span>
                <span className="text-[10px] text-adventure-muted">You own your contact data. It is only shared once you explicitly unlock a transaction.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Lock size={16} className="text-adventure-yellow mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-white block">Secure Vault</span>
                <span className="text-[10px] text-adventure-muted">Passwords are double-salted and encrypted. No local plain-text leaks.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Compass size={16} className="text-adventure-yellow mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-white block">No Tracking Footprints</span>
                <span className="text-[10px] text-adventure-muted">We do not sell coordinates or profiles to advertisers. Your trails are yours alone.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Sections */}
        <div className="md:col-span-2 space-y-8">
          
          <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6 leading-relaxed text-xs">
            <section className="space-y-3">
              <h3 className="font-black text-sm uppercase text-white flex items-center space-x-2">
                <span className="text-adventure-yellow font-black">01.</span>
                <span>Data Scouting (Information We Collect)</span>
              </h3>
              <p className="text-adventure-grey">
                When you sign up at TrekNest, we scout some vital coordinates to make the trail smooth:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-adventure-muted">
                <li><strong className="text-white">Profile Coordinates:</strong> Name, email address, password hashes, phone contact details, and optional profile images.</li>
                <li><strong className="text-white">Guide Credentials:</strong> Experience stats, regions of support, list of permits offered, and pricing.</li>
                <li><strong className="text-white">Transaction Logs:</strong> Booking details, slots requested, payment metadata, and guide unlock logs.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-6 border-t border-white/5">
              <h3 className="font-black text-sm uppercase text-white flex items-center space-x-2">
                <span className="text-adventure-yellow font-black">02.</span>
                <span>Hiker and Guide Matching</span>
              </h3>
              <p className="text-adventure-grey">
                We believe in community-led exploration. Your contacts get shared under very specific circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-adventure-muted">
                <li><strong className="text-white">Trek Bookings:</strong> When a hiker books an event, the trek leader gains access to the hiker's phone number to coordinate arrival and pickup spots.</li>
                <li><strong className="text-white">Guide Marketplace:</strong> A hiker pays a nominal fee (e.g. ₹49) to unlock a guide's WhatsApp number. Both the guide and hiker details are shared inside the portal.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-6 border-t border-white/5">
              <h3 className="font-black text-sm uppercase text-white flex items-center space-x-2">
                <span className="text-adventure-yellow font-black">03.</span>
                <span>Basecamp Security Protocols</span>
              </h3>
              <p className="text-adventure-grey">
                All communications and payments (e.g. Razorpay checkout API runs) use Secure Sockets Layer (SSL) encryption. Your database session details are protected via JsonWebTokens (JWT) with strict token decay times.
              </p>
            </section>

            <section className="space-y-3 pt-6 border-t border-white/5">
              <h3 className="font-black text-sm uppercase text-white flex items-center space-x-2">
                <span className="text-adventure-yellow font-black">04.</span>
                <span>Leave No Trace Policy</span>
              </h3>
              <p className="text-adventure-grey text-adventure-muted">
                Just like hiking, we believe in leaving no digital trace where possible. You can request account termination at any time by reaching out to support. We will scrub your login credentials, active listings, and booking history within 48 hours.
              </p>
            </section>
          </div>

          {/* Footer Callout */}
          <div className="bg-adventure-yellow/5 border border-adventure-yellow/10 p-6 rounded-2xl text-center space-y-2">
            <span className="text-[10px] text-adventure-yellow uppercase font-bold tracking-widest flex items-center justify-center space-x-1.5">
              <Sparkles size={12} />
              <span>Safety Certified</span>
            </span>
            <p className="text-[11px] text-adventure-muted max-w-sm mx-auto">
              Our privacy code is audited regularly to align with local regulatory frameworks and modern digital safety standards.
            </p>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
