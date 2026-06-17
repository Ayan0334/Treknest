import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Compass } from 'lucide-react';

export default function Contact() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-xl mx-auto px-4 py-16 space-y-10 text-center"
    >
      <div className="space-y-3">
        <h1 className="text-4xl font-black uppercase text-white tracking-wide">Contact TrekNest</h1>
        <p className="text-xs text-adventure-muted">Have queries regarding bookings, subscriptions, or safety guidelines? Get in touch.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6 text-left">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-adventure-yellow/10 text-adventure-yellow">
            <Mail size={20} />
          </div>
          <div>
            <span className="text-[10px] text-adventure-muted uppercase block font-bold">Email Support</span>
            <span className="text-sm text-white font-semibold">support@treknest.com</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-adventure-yellow/10 text-adventure-yellow">
            <Phone size={20} />
          </div>
          <div>
            <span className="text-[10px] text-adventure-muted uppercase block font-bold">Phone Hotline</span>
            <span className="text-sm text-white font-semibold">+91 353 251 1234</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-adventure-yellow/10 text-adventure-yellow">
            <MapPin size={20} />
          </div>
          <div>
            <span className="text-[10px] text-adventure-muted uppercase block font-bold">Headquarters</span>
            <span className="text-sm text-white font-semibold">Bagdogra, West Bengal, India</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
