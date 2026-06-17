import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Users, Award, Map } from 'lucide-react';

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-4 py-16 space-y-12 text-center sm:text-left"
    >
      <div className="space-y-4 text-center">
        <h1 className="text-4xl sm:text-6xl font-black uppercase text-white tracking-wide">About TrekNest</h1>
        <p className="text-xs sm:text-sm text-adventure-yellow uppercase tracking-widest font-bold">Uniting Hiker Communities, Local Guides and Operators</p>
      </div>

      <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-premium">
        <img src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800" alt="Himalayas" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-adventure-black/40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        <div className="space-y-3 p-6 glass-panel rounded-2xl">
          <Map className="text-adventure-yellow w-8 h-8" />
          <h3 className="font-bold text-white uppercase text-base">Our Mission</h3>
          <p className="text-xs text-adventure-grey leading-relaxed">
            To make Himalayan trekking transparent, safe, and community-driven. By giving local guides a direct marketplace, we build local livelihoods while boosting trekker safety.
          </p>
        </div>

        <div className="space-y-3 p-6 glass-panel rounded-2xl">
          <ShieldAlert className="text-adventure-yellow w-8 h-8" />
          <h3 className="font-bold text-white uppercase text-base">Himalayan Safety First</h3>
          <p className="text-xs text-adventure-grey leading-relaxed">
            All registered organizers provide certified wilderness first responder survival logs. Emergency options are cataloged for every sub-region under guide listings.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
