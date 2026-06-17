import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, Milestone, Award, Flag, Star } from 'lucide-react';

// 1. Trekker climbing a mountain animation (Standard Spinner Replacement)
export const ClimbingLoader = ({ message = "Loading adventure..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative w-48 h-32 overflow-hidden mb-4 border-b-2 border-adventure-yellow/20">
        {/* Mountain background */}
        <motion.div 
          initial={{ opacity: 0.3, y: 10 }}
          animate={{ opacity: [0.3, 0.5, 0.3], y: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-4 text-adventure-charcoal"
        >
          <Mountain size={96} strokeWidth={1} />
        </motion.div>

        <div className="absolute bottom-0 left-6 text-adventure-yellow/10">
          <Mountain size={64} strokeWidth={1} />
        </div>

        {/* Diagonal climbing slope */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 120">
          <path d="M 10 110 L 180 30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
        </svg>

        {/* Hiker climbing up */}
        <motion.div
          animate={{
            x: [10, 160, 10],
            y: [100, 32, 100],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute text-adventure-yellow"
          style={{ originY: 1 }}
        >
          <div className="relative">
            {/* Bobbing animation for walking */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Milestone size={24} className="transform rotate-12" />
            </motion.div>
            {/* Footprint trail */}
            <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-adventure-yellow/40 rounded-full animate-ping" />
          </div>
        </motion.div>
      </div>

      <motion.p
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-sm tracking-wider uppercase font-medium text-adventure-yellow"
      >
        {message}
      </motion.p>
    </div>
  );
};

// 2. Walking hiker animation during search
export const HikerSearchLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-adventure-card/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-premium max-w-md mx-auto">
      <div className="relative w-64 h-24 overflow-hidden mb-6 flex items-center justify-center">
        {/* Sliding background trees/milestones */}
        <motion.div
          animate={{ x: [200, -100] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-2 text-adventure-charcoal/40"
        >
          <Mountain size={36} />
        </motion.div>

        <motion.div
          animate={{ x: [250, -50] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: 0.5 }}
          className="absolute bottom-2 text-adventure-charcoal/20"
        >
          <Mountain size={28} />
        </motion.div>

        {/* Hiker walking in place */}
        <motion.div
          animate={{
            y: [0, -6, 0],
            rotate: [-2, 2, -2]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-adventure-yellow z-10"
        >
          <Milestone size={40} />
        </motion.div>

        {/* Dynamic speed-lines */}
        <motion.div
          animate={{ x: [120, -120] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute h-0.5 w-8 bg-adventure-yellow/30 rounded bottom-8 left-10"
        />
        <motion.div
          animate={{ x: [150, -90] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.3 }}
          className="absolute h-0.5 w-6 bg-adventure-yellow/20 rounded bottom-12 left-10"
        />
      </div>

      <h3 className="text-lg font-semibold mb-1 text-white">Scouting the perfect trail...</h3>
      <p className="text-xs text-adventure-muted">Filtering regions, distance, ratings & pricing.</p>
    </div>
  );
};

// 3. Mountain flag animation after successful booking
export const MountainFlagSuccess = ({ title = "Trek Booked!", onComplete }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-adventure-card rounded-3xl border border-adventure-yellow/20 shadow-premium max-w-md mx-auto">
      <div className="relative w-40 h-40 flex items-center justify-center mb-6">
        {/* Radiating rings */}
        <motion.div
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute w-24 h-24 rounded-full border border-adventure-yellow/30"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          className="absolute w-24 h-24 rounded-full border border-adventure-yellow/15"
        />

        {/* Mountain Peak Base */}
        <motion.div
          initial={{ scale: 0.5, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
          className="absolute bottom-4 text-white"
        >
          <Mountain size={110} className="fill-adventure-charcoal text-white" strokeWidth={1.5} />
        </motion.div>

        {/* Flag planted at peak */}
        <motion.div
          initial={{ scale: 0, y: -20, rotate: -45 }}
          animate={{ scale: 1, y: -16, x: 8, rotate: 0 }}
          transition={{ type: "spring", stiffness: 120, delay: 0.6, damping: 10 }}
          className="absolute text-adventure-yellow animate-flag-wave origin-bottom"
        >
          <Flag size={36} className="fill-adventure-yellow stroke-adventure-black" strokeWidth={2} />
        </motion.div>

        {/* Star Sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 0], x: Math.sin(i * 60 * Math.PI / 180) * 60, y: Math.cos(i * 60 * Math.PI / 180) * 60 }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.8 + i * 0.1 }}
            className="absolute text-adventure-yellow"
          >
            <Star size={12} className="fill-adventure-yellow" />
          </motion.div>
        ))}
      </div>

      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-2xl font-extrabold text-gradient-yellow mb-2 uppercase tracking-wide"
      >
        {title}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-sm text-adventure-grey max-w-xs"
      >
        Your booking is secured. You have unlocked organizer contact options below!
      </motion.p>
    </div>
  );
};

// 4. Achievement badge animation after trek completion (Modal pop-up)
export const BadgeEarnedCelebration = ({ badgeName = "First Trek", onClose }) => {
  const badgeDescriptions = {
    "First Trek": "Awarded for completing your very first trek on TrekNest. Welcome to the pack!",
    "Sandakphu Explorer": "Witnessed the Sleeping Buddha. Awarded for conquering the Sandakphu summit.",
    "Mountain Lover": "Completed 3 treks. The mountains are calling, and you are answering!",
    "Himalayan Hiker": "Completed 5 treks. An experienced trekker of the North Bengal & Sikkim ridges.",
    "10 Treks Completed": "Double digits! Conducted or hiked in 10 major expeditions.",
    "25 Treks Completed": "Legend status! 25 treks completed across the Himalayas.",
    "Himalayan Yeti": "Conquered the secret trail by tap-scouting your avatar! Summoned the legendary winter Yeti."
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="relative max-w-sm w-full bg-adventure-black border-2 border-adventure-yellow rounded-3xl p-6 text-center shadow-premium overflow-hidden"
        >
          {/* Background rays */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,193,7,0.15)_0%,transparent_70%)] pointer-events-none" />

          {/* Sparkles */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }}
                className="absolute text-adventure-yellow/30"
                style={{ transform: `rotate(${i * 45}deg) translateY(-80px)` }}
              >
                <Star size={16} className="fill-adventure-yellow/20 text-transparent" />
              </motion.div>
            ))}
          </div>

          {/* Badge Icon (Gold Award Shield) */}
          <motion.div
            initial={{ rotate: -180, scale: 0.3 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            className="relative w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-adventure-yellow to-amber-600 rounded-full flex items-center justify-center shadow-yellow-glow border-4 border-white/20"
          >
            <Award size={64} className="text-white drop-shadow-md" />
            <motion.div 
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-2 border-dashed border-white/40 rounded-full"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xs uppercase tracking-widest text-adventure-yellow font-extrabold mb-1"
          >
            New Achievement Unlocked!
          </motion.p>

          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-2xl font-black text-white uppercase tracking-wide mb-3"
          >
            {badgeName}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-adventure-grey mb-6 leading-relaxed"
          >
            {badgeDescriptions[badgeName] || "Awarded for your exceptional trekking contributions in the Himalayan range."}
          </motion.p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full py-3 bg-adventure-yellow text-adventure-black font-extrabold rounded-xl uppercase tracking-wider transition-all shadow-yellow-glow hover:bg-white hover:text-adventure-black"
          >
            Claim Achievement
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
