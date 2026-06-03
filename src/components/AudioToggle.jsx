import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { soundSynthesizer } from '../services/soundSynthesizer';

export default function AudioToggle() {
  const [muted, setMuted] = useState(soundSynthesizer.getMuted());

  const handleToggle = () => {
    const nextState = !muted;
    setMuted(nextState);
    soundSynthesizer.setMuted(nextState);
    // Play feedback if unmuting
    if (!nextState) {
      setTimeout(() => {
        soundSynthesizer.playKeyClick();
      }, 50);
    }
  };

  return (
    <motion.button
      onClick={handleToggle}
      className="audio-toggle-btn"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={muted ? "Unmute Sound Effects" : "Mute Sound Effects"}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'rgba(15, 15, 25, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--theme-border, rgba(255, 255, 255, 0.15))',
        boxShadow: 'var(--theme-glow, 0 0 10px rgba(255, 255, 255, 0.05))',
        borderRadius: '50%',
        width: '45px',
        height: '45px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--theme-primary, #ff0055)',
        outline: 'none',
        transition: 'border 0.3s, color 0.3s'
      }}
    >
      {muted ? (
        <VolumeX size={20} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
          <Volume2 size={20} style={{ marginRight: '2px' }} />
          {/* Animated sound bars */}
          {[1, 2, 3].map((bar) => (
            <motion.div
              key={bar}
              style={{
                width: '2px',
                background: 'var(--theme-primary, #ff0055)',
                borderRadius: '1px'
              }}
              animate={{
                height: [bar * 3 + 'px', '14px', bar * 2 + 'px']
              }}
              transition={{
                duration: 0.6 + bar * 0.15,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
      )}
    </motion.button>
  );
}
