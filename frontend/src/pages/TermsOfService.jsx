import React from 'react';
import { motion } from 'framer-motion';
import { Scale, BookOpen, ShieldAlert, CloudRain, Sparkles, Compass } from 'lucide-react';

export default function TermsOfService() {
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
          <Scale size={24} className="animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-wide">Summit Code of Conduct</h1>
        <p className="text-xs text-adventure-muted max-w-md mx-auto leading-relaxed">
          The Terms of Service agreement between hikers, organizers, and TrekNest. By accessing our basecamp, you agree to these trail rules.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Summary Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6 h-fit md:sticky md:top-24">
          <div className="border-b border-white/10 pb-4">
            <h4 className="font-extrabold text-xs uppercase text-adventure-yellow tracking-widest">The Trail Pact</h4>
            <p className="text-[10px] text-adventure-muted mt-1">Quick takeaways of our expedition rules.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start space-x-3">
              <BookOpen size={16} className="text-adventure-yellow mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-white block">Basecamp Reservations</span>
                <span className="text-[10px] text-adventure-muted">Advance fees lock your spot. The remaining balance is paid to the leader at pickup.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <ShieldAlert size={16} className="text-adventure-yellow mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-white block">Leader Directives</span>
                <span className="text-[10px] text-adventure-muted">The guide's instructions on safety, routes, and packing list are final.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CloudRain size={16} className="text-adventure-yellow mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-white block">Sudden Storm Protocol</span>
                <span className="text-[10px] text-adventure-muted">Cancellations due to natural emergencies or weather follow organizer-defined terms.</span>
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
                <span>Basecamp Reservations & Payments</span>
              </h3>
              <p className="text-adventure-grey">
                TrekNest facilitates slot registrations and matches. When booking a trek:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-adventure-muted">
                <li><strong className="text-white">Booking Fee:</strong> The advance amount shown on the trek details card is processed securely to lock your slot.</li>
                <li><strong className="text-white">Remaining Balance:</strong> The rest of the price listed is payable directly to the trek organizer upon arrival/pickup.</li>
                <li><strong className="text-white">Pricing Currency:</strong> All prices are in Indian Rupees (₹) unless specified otherwise. No hidden administrative fees.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-6 border-t border-white/5">
              <h3 className="font-black text-sm uppercase text-white flex items-center space-x-2">
                <span className="text-adventure-yellow font-black">02.</span>
                <span>Mountain Leader Directives & Safety</span>
              </h3>
              <p className="text-adventure-grey">
                Safety on the trail is our utmost priority. Trekkers are required to follow these regulations:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-adventure-muted">
                <li><strong className="text-white">Physical Fitness:</strong> You certify that you meet the difficulty prerequisites of the chosen route (e.g. altitude endurance).</li>
                <li><strong className="text-white">Guide Commands:</strong> In case of hazardous conditions, the certified mountain leader's route adjustments or evacuation choices are final.</li>
                <li><strong className="text-white">Gear Checklist:</strong> Hikers must carry the essential items listed in the "Packing List" tab for their own survival safety.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-6 border-t border-white/5">
              <h3 className="font-black text-sm uppercase text-white flex items-center space-x-2">
                <span className="text-adventure-yellow font-black">03.</span>
                <span>Leave No Trace Policy</span>
              </h3>
              <p className="text-adventure-grey">
                To preserve the fragile Himalayan eco-system for future generations of adventurers, you pledge to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-adventure-muted">
                <li>Pack out whatever you pack in. No littering or leaving plastic on trails.</li>
                <li>Respect local wildlife, vegetation, and indigenous cultural shrines.</li>
                <li>Refrain from starting unsanctioned wildfires outside designated basecamp pits.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-6 border-t border-white/5">
              <h3 className="font-black text-sm uppercase text-white flex items-center space-x-2">
                <span className="text-adventure-yellow font-black">04.</span>
                <span>Sudden Storm & Cancellation Protocols</span>
              </h3>
              <p className="text-adventure-grey text-adventure-muted">
                Expeditions are subject to changing mountain weather conditions. In the event of force majeure, landslide warnings, or administrative restrictions, the organizer holds the right to reschedule. Refund parameters of advance booking fees are governed by the organizer's listed refund rules. TrekNest is not directly liable for itinerary delays.
              </p>
            </section>

            <section className="space-y-3 pt-6 border-t border-white/5">
              <h3 className="font-black text-sm uppercase text-white flex items-center space-x-2">
                <span className="text-adventure-yellow font-black">05.</span>
                <span>Marketplace Platform Liability</span>
              </h3>
              <p className="text-adventure-grey text-adventure-muted">
                TrekNest is a digital peer-to-peer marketplace matching hikers with independent guides and organizers. We conduct reasonable background and badge verifications, but we do not employ guides directly. The liability for physical injuries, logistics, or loss of gear rests with the respective guides and hikers.
              </p>
            </section>
          </div>

          {/* Footer Callout */}
          <div className="bg-adventure-yellow/5 border border-adventure-yellow/10 p-6 rounded-2xl text-center space-y-2">
            <span className="text-[10px] text-adventure-yellow uppercase font-bold tracking-widest flex items-center justify-center space-x-1.5">
              <Sparkles size={12} />
              <span>Explore Responsibly</span>
            </span>
            <p className="text-[11px] text-adventure-muted max-w-sm mx-auto">
              These terms make high-altitude hikes fair, safe, and sustainable. Thank you for summiting with TrekNest.
            </p>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
