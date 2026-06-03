import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundSynthesizer } from '../services/soundSynthesizer';

export default function ScanningView({ personality, onComplete }) {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [attentionTime, setAttentionTime] = useState(6.00);
  const [gazePos, setGazePos] = useState({ x: 50, y: 30 });
  const [fixations, setFixations] = useState([]);
  const [warnings, setWarnings] = useState([]);
  
  const logIndexRef = useRef(0);
  const scanSweepRef = useRef(null);

  // Setup loop for scanning sound
  useEffect(() => {
    // Play initial bass impact
    soundSynthesizer.playBassDrop();

    // Start playing repeating scan sweeps
    soundSynthesizer.playScanSweep();
    const soundInterval = setInterval(() => {
      soundSynthesizer.playScanSweep();
    }, 1500);

    return () => {
      clearInterval(soundInterval);
    };
  }, []);

  // Update progress, timers, and write logs
  useEffect(() => {
    // 1. Logs addition
    const logsPool = personality.scanLogs;
    const addLog = () => {
      if (logIndexRef.current < logsPool.length) {
        setLogs(prev => [...prev, logsPool[logIndexRef.current]]);
        logIndexRef.current += 1;
        soundSynthesizer.playKeyClick();
        
        // Randomly trigger a glitch sound during logs loading
        if (Math.random() > 0.6) {
          setTimeout(() => {
            soundSynthesizer.playGlitch();
          }, 200);
        }
      }
    };

    // Add first log immediately
    addLog();

    const logInterval = setInterval(addLog, 900);

    // 2. Progress and Attention countdown (6 seconds total)
    const startTime = Date.now();
    const duration = 6000; // 6 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      const timeLeft = Math.max(6.00 - (elapsed / 1000), 0);
      setAttentionTime(timeLeft);

      if (elapsed >= duration) {
        clearInterval(timer);
        clearInterval(logInterval);
        soundSynthesizer.playBassDrop();
        setTimeout(onComplete, 500);
      }
    }, 50);

    return () => {
      clearInterval(timer);
      clearInterval(logInterval);
    };
  }, [personality, onComplete]);

  // Recruiter Eye Gaze jump movements
  useEffect(() => {
    const gazePositions = [
      { x: 30, y: 25, label: "Name checked", duration: 800 },
      { x: 75, y: 15, label: "Title evaluated: 'Junior' detected", duration: 900 },
      { x: 45, y: 55, label: "Buzzword cluster hit: 'Innovative'", duration: 1100 },
      { x: 20, y: 80, label: "Todo list project: Recruiter sighed", duration: 800 },
      { x: 85, y: 90, label: "Checking deployed links: None found!", duration: 1000 },
      { x: 50, y: 65, label: "Attention Span Lost. Refused to read.", duration: 1400 }
    ];

    let currentGazeIndex = 0;
    
    const moveGaze = () => {
      if (currentGazeIndex < gazePositions.length) {
        const point = gazePositions[currentGazeIndex];
        setGazePos({ x: point.x, y: point.y });
        
        // Register fixation point for heatmap
        setFixations(prev => [...prev, { x: point.x, y: point.y, id: Date.now() }]);
        
        // If it has a warning callout, trigger it
        if (point.label) {
          setWarnings(prev => [...prev, { x: point.x, y: point.y, text: point.label, id: Date.now() }]);
        }
        
        soundSynthesizer.playHover();
        currentGazeIndex++;
        
        setTimeout(moveGaze, point.duration);
      }
    };

    const firstMove = setTimeout(moveGaze, 400);

    return () => {
      clearTimeout(firstMove);
    };
  }, []);

  return (
    <div className={`scanning-container ${personality.themeClass}`}>
      <div className="scanning-laser-line" />

      <h2 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '2rem', fontWeight: 900 }} className="glow-text">
        Analyzing Target Assets...
      </h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#71717a', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        RECRUITER ATTENTION SPAN RESERVED: <span style={{ color: 'var(--theme-primary)', fontWeight: 'bold' }}>{attentionTime.toFixed(2)}s</span>
      </p>

      <div className="scanning-grid-layout">
        
        {/* 1. Terminal Log Output Panel */}
        <div className="scanning-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--theme-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              // Terminal logs
            </span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#52525b' }}>
              {Math.round(progress)}% COMPILED
            </span>
          </div>

          <div className="scanning-logs">
            {logs.map((log, index) => (
              <div key={index} className="scan-log-line">
                <span className="scan-log-prompt">&gt;</span>
                <span className="scan-log-text">{log}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '20px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--theme-primary)', boxShadow: 'var(--theme-glow)', transition: 'width 0.1s' }} />
          </div>
        </div>

        {/* 2. Recruiter Eye Tracking Simulator Panel */}
        <div className="scanning-panel" style={{ alignItems: 'center' }}>
          <span style={{ alignSelf: 'flex-start', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--theme-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '15px' }}>
            // Recruiter Saccadic Path Sim (6s Scan)
          </span>

          <div className="eye-tracker-visual" style={{ width: '100%', height: '320px', position: 'relative' }}>
            {/* Simulated Resume Document Lines */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', opacity: 0.2 }}>
              <div style={{ width: '35%', height: '12px', background: '#fff', borderRadius: '2px', marginBottom: '15px' }} />
              <div style={{ width: '100%', height: '6px', background: '#fff', borderRadius: '1px' }} />
              <div style={{ width: '90%', height: '6px', background: '#fff', borderRadius: '1px' }} />
              <div style={{ width: '95%', height: '6px', background: '#fff', borderRadius: '1px', marginBottom: '20px' }} />
              
              <div style={{ width: '25%', height: '8px', background: '#fff', borderRadius: '2px', marginBottom: '8px' }} />
              <div style={{ width: '100%', height: '6px', background: '#fff', borderRadius: '1px' }} />
              <div style={{ width: '92%', height: '6px', background: '#fff', borderRadius: '1px' }} />
              
              <div style={{ width: '30%', height: '8px', background: '#fff', borderRadius: '2px', marginTop: '15px', marginBottom: '8px' }} />
              <div style={{ width: '85%', height: '6px', background: '#fff', borderRadius: '1px' }} />
              <div style={{ width: '97%', height: '6px', background: '#fff', borderRadius: '1px' }} />
            </div>

            {/* Heatmap fixations overlays */}
            {fixations.map(f => (
              <div 
                key={f.id} 
                className="heatmap-point"
                style={{ left: `${f.x}%`, top: `${f.y}%` }}
              />
            ))}

            {/* Warnings callout popping up */}
            <AnimatePresence>
              {warnings.map((w, idx) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, scale: 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="ignored-callout"
                  style={{
                    left: `${w.x}%`,
                    top: `${w.y - 12}%`,
                    border: '1px solid var(--theme-primary)',
                    background: 'rgba(var(--theme-primary-rgb), 0.15)',
                    color: 'var(--theme-text)'
                  }}
                >
                  {w.text}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Gaze tracking pointer */}
            <div 
              className="eye-tracker-gaze"
              style={{ left: `${gazePos.x}%`, top: `${gazePos.y}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
