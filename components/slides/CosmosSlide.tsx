import React from 'react';
import { motion } from 'motion/react';
import { CosmosBackground } from '../ui/CosmosBackground';
import { Github } from 'lucide-react';

export const CosmosSlide = () => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0F172A] flex flex-col items-center justify-center p-8">
      {/* Spectacular Cosmos Background */}
      <div className="absolute inset-0 z-0">
         {/* Fade in the background slowly */}
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 3 }}
           className="w-full h-full"
        >
            <CosmosBackground />
        </motion.div>
        
        {/* Gradient Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-[#0F172A]/50 z-10" />
      </div>

      <div className="max-w-5xl w-full text-center z-20 relative flex flex-col items-center">
        
        {/* Experimental Badge - Delays entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 14.5 }}
          className="inline-flex items-center gap-3 px-5 py-2 bg-purple-900/30 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium mb-10 backdrop-blur-sm"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
          </span>
          Experimental Neural Branch
        </motion.div>

        {/* Main Title - Letter by Letter Reveal */}
        <div className="relative mb-6 overflow-hidden">
             <motion.h2 
                className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-purple-100 to-slate-400"
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 4, delay: 15, ease: [0.22, 1, 0.36, 1] }}
             >
                COSMOS
             </motion.h2>
             {/* Glow behind text */}
             <motion.div 
                className="absolute inset-0 bg-purple-500/20 blur-[60px] -z-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 5, delay: 16 }}
             />
        </div>

        {/* Subtitle - Slow slide up */}
        <motion.h3
            className="text-3xl md:text-5xl font-light text-purple-400 mb-8 tracking-[0.2em]"
            initial={{ opacity: 0, letterSpacing: "0em", filter: "blur(10px)" }}
            whileInView={{ opacity: 1, letterSpacing: "0.2em", filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 5, delay: 17, ease: "easeOut" }}
        >
            PREDICTIONS
        </motion.h3>
          
        <motion.p 
            className="text-xl text-slate-300/80 mb-16 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 3, delay: 20 }}
        >
            Next-generation predictive models for recruitment automation.
            Exploring the boundaries of what's possible with hiring data.
        </motion.p>

        {/* Button - Final dramatic entrance */}
        <motion.a
            href="https://github.com/WouterArtsRecruitin/cosmos-predictions-"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-4 px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-xl overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 2, delay: 23, type: "spring", stiffness: 30 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Hover Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-[2px] bg-white rounded-full z-0" />
            
            <span className="relative z-10 flex items-center gap-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                <Github className="w-6 h-6 text-slate-900 group-hover:text-purple-600 transition-colors" />
                <span>View Repository</span>
            </span>
            
            {/* Shine Effect */}
            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12 group-hover:animate-shine transition-all" />
        </motion.a>

        {/* Decorative Lines */}
        <motion.div 
            className="absolute left-10 top-1/2 w-[1px] h-32 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent"
            initial={{ height: 0 }}
            whileInView={{ height: 128 }}
            transition={{ duration: 3, delay: 18 }}
        />
        <motion.div 
            className="absolute right-10 top-1/2 w-[1px] h-32 bg-gradient-to-b from-transparent via-pink-500/50 to-transparent"
            initial={{ height: 0 }}
            whileInView={{ height: 128 }}
            transition={{ duration: 3, delay: 18.5 }}
        />
      </div>
    </div>
  );
};
