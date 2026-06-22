import React from 'react';
import { motion } from 'framer-motion';
import { Mountain } from 'lucide-react';

export default function HikerLoader({ text = 'Loading Trek Stories...' }) {
  // Simple walking / bobbing animation for the hiker figure
  const hikerVariants = {
    animate: {
      y: [0, -6, 0],
      rotate: [0, 4, -4, 0],
      transition: {
        repeat: Infinity,
        duration: 0.6,
        ease: 'easeInOut'
      }
    }
  };

  // Mountain scale / pulse animation in the background
  const backgroundVariants = {
    animate: {
      scale: [1, 1.03, 1],
      opacity: [0.3, 0.5, 0.3],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut'
      }
    }
  };

  // Small dots representing trail steps appearing sequentially
  const stepVariants = (delay) => ({
    animate: {
      opacity: [0.1, 1, 0.1],
      scale: [0.8, 1.2, 0.8],
      transition: {
        repeat: Infinity,
        duration: 1.2,
        delay: delay,
        ease: 'easeInOut'
      }
    }
  });

  return (
    <div className="flex flex-col items-center justify-center py-16 w-full text-center">
      <div className="relative w-32 h-24 mb-4 flex items-end justify-center overflow-hidden">
        {/* Background mountains */}
        <motion.div
          variants={backgroundVariants}
          animate="animate"
          className="absolute inset-0 flex items-center justify-center text-white/5 z-0"
        >
          <Mountain size={96} strokeWidth={1} />
        </motion.div>

        {/* Trail Line */}
        <div className="absolute bottom-4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

        {/* Step footprints on the trail */}
        <div className="absolute bottom-3 left-4 right-4 flex justify-between px-2 z-10">
          <motion.div variants={stepVariants(0)} animate="animate" className="w-1.5 h-1.5 rounded-full bg-adventure-yellow" />
          <motion.div variants={stepVariants(0.3)} animate="animate" className="w-1.5 h-1.5 rounded-full bg-adventure-yellow" />
          <motion.div variants={stepVariants(0.6)} animate="animate" className="w-1.5 h-1.5 rounded-full bg-adventure-yellow" />
          <motion.div variants={stepVariants(0.9)} animate="animate" className="w-1.5 h-1.5 rounded-full bg-adventure-yellow" />
        </div>

        {/* The walking hiker figure (Stylized silhouette using shapes) */}
        <motion.div
          variants={hikerVariants}
          animate="animate"
          className="relative z-20 flex flex-col items-center justify-center mb-2"
        >
          {/* Hiker Head */}
          <div className="w-3 h-3 rounded-full bg-adventure-yellow shadow-yellow-glow mb-0.5" />
          {/* Hiker Backpack */}
          <div className="absolute -left-2 top-3 w-3.5 h-5 bg-adventure-charcoal border border-white/20 rounded-md" />
          {/* Hiker Body */}
          <div className="w-3.5 h-6 bg-white rounded-t-md rounded-b-sm flex items-center justify-center">
            {/* Trekking pole */}
            <div className="absolute -right-2 top-1 w-0.5 h-7 bg-adventure-yellow transform rotate-12" />
          </div>
          {/* Hiker Legs */}
          <div className="flex space-x-1.5 -mt-0.5">
            <div className="w-1 h-3 bg-adventure-yellow rounded-full transform -rotate-12 origin-top" />
            <div className="w-1 h-3 bg-adventure-yellow rounded-full transform rotate-12 origin-top" />
          </div>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-adventure-yellow"
      >
        {text}
      </motion.p>
    </div>
  );
}
