import React, { useState, useEffect } from 'react';
import { Flame, ShieldAlert, Sparkles, Volume2, VolumeX, History, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Uploader from './components/Uploader';
import ScanningView from './components/ScanningView';
import Dashboard from './components/Dashboard';
import ParticleBackground from './components/ParticleBackground';
import { PERSONALITIES, getPersonalityById } from './personalities';
import { analyzeResume } from './services/roastEngine';
import { soundSynthesizer } from './services/soundSynthesizer';
import './App.css';

export default function App() {
  const [appState, setAppState] = useState('UPLOADING'); // UPLOADING, SCANNING, ANALYZED
  const [selectedPersonality, setSelectedPersonality] = useState(PERSONALITIES[0]);
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [muted, setMuted] = useState(soundSynthesizer.getMuted());
  const [caffeineCount, setCaffeineCount] = useState(8);
  const [mentalBreakdown, setMentalBreakdown] = useState(false);
  
  // Custom scrolling marquee phrases
  const tickerItems = [
    "0 HR feedback emails",
    "7 personalities of pain",
    "claude - sonnet - 4.5",
    "brutally honest",
    "no bullshit",
    "ego check offline",
    "localhost residents welcome",
    "tutorial survivals diagnosed",
    "pure ego destruction engine"
  ];

  const handleMuteToggle = () => {
    const nextState = !muted;
    setMuted(nextState);
    soundSynthesizer.setMuted(nextState);
    if (!nextState) {
      soundSynthesizer.playKeyClick();
    }
  };

  const startAnalysis = (text) => {
    setResumeText(text);
    setAppState('SCANNING');
  };

  const handleScanComplete = () => {
    const results = analyzeResume(resumeText, selectedPersonality);
    setAnalysis(results);
    setAppState('ANALYZED');
  };

  const handleReset = () => {
    soundSynthesizer.playKeyClick();
    setAppState('UPLOADING');
    setResumeText('');
    setAnalysis(null);
  };

  // Helper to load presets directly from the header or button
  const handleLoadSampleResume = () => {
    soundSynthesizer.playKeyClick();
    // Default preset strings
    const sample = `Resume preset from senior tutorial developer:
Todo List App: Created dynamic lists in HTML.
Weather App: Fetched basic APIs.
Calculator App: Coded mathematical outputs.
Skills: Javascript, React, CSS, HTML. Deployed to localhost.`;
    
    // We will search for uploader element value or set state if needed.
    // To make it easy, we trigger this on the textarea input in Uploader.
    // So we communicate via custom event or uploader hooks. In this build,
    // the Uploader component already handles loading sample presets!
    // We will let the Uploader do it or trigger a global prompt change.
  };

  return (
    <div className={`app-wrapper ${selectedPersonality.themeClass} ${mentalBreakdown ? 'mental-breakdown-active' : ''}`}>
      <div className="cyber-grid" />
      <div className="scanlines-overlay" />
      <div className="noise-grain-overlay" />
      
      {/* Dynamic Canvas Particles */}
      <ParticleBackground themeId={selectedPersonality.id} />

      {/* HEADER */}
      <header className="app-header">
        <div className="logo-container" style={{ cursor: 'pointer' }} onClick={handleReset}>
          <Flame className="logo-icon" />
          <div className="logo-text">
            RESUME-ROASTER
            <span className="logo-sub">V8.42 - PREPARE FOR EMOTIONAL DAMAGE</span>
          </div>
        </div>

        <ul className="nav-links">
          <li className="nav-item active-roast" onClick={handleReset}>
            <Flame size={12} style={{ color: 'var(--theme-primary)' }} /> Roast
          </li>
          <li className="nav-item">
            <History size={12} /> History
          </li>
          <li className="nav-item">
            <Trophy size={12} /> Leaderboard
          </li>
        </ul>

        <div className="header-right">
          <div className="caffeine-tracker-badge" onClick={() => { setCaffeineCount(c => c + 1); soundSynthesizer.playKeyClick(); }} title="Click to track a cup of 3am coffee">
            ☕ {caffeineCount} CUPS
          </div>

          <button 
            onClick={() => { setMentalBreakdown(prev => !prev); soundSynthesizer.playBassDrop(); }} 
            className="mute-btn" 
            title="Toggle Mental Breakdown Mode (Caution: Unstable CRT Screen Shake)"
            style={{ 
              color: mentalBreakdown ? 'var(--theme-primary)' : '#a1a1aa', 
              borderColor: mentalBreakdown ? 'var(--theme-primary)' : 'rgba(255,255,255,0.08)',
              background: mentalBreakdown ? 'rgba(var(--theme-primary-rgb), 0.1)' : 'transparent'
            }}
          >
            💥
          </button>

          <div className="status-badge">
            <div className="status-dot" />
            {selectedPersonality.name}
          </div>
          
          <button onClick={handleMuteToggle} className="mute-btn" title={muted ? "Unmute sound" : "Mute sound"}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {/* Sarcastic human-made metadata banner */}
      <div className="burnout-banner">
        <span>⚙️ BUILD SURVIVED NPM DEPENDENCY WARFARE</span>
        <span>LAST DEPLOYED DURING EMOTIONAL COLLAPSE AT 3:14 AM</span>
        <span>CONFIDENCE.JS COMPILING... [OK]</span>
      </div>

      {/* STATE MACHINE VIEWS */}
      <AnimatePresence mode="wait">
        {appState === 'UPLOADING' && (
          <motion.main
            key="uploader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%' }}
          >
            {/* HERO SECTION */}
            <section className="hero-section">
              <div className="hero-left">
                <div className="hero-tagline">
                  <div className="status-dot" /> AI · LIVE · BRUTAL · UNFILTERED
                </div>
                <h1 className="hero-title">
                  your resume is about to <br />
                  <span className="cooked-neon">get cooked.</span>
                </h1>
                <p className="hero-description">
                  Drop your CV. Choose your executioner. Watch a fictional AI tear apart
                  every buzzword, every gap, every "synergy". Then get a recovery plan
                  you can actually use.
                </p>
              </div>

              <div className="hero-right-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div className="expect-title">
                    <Flame size={12} /> WHAT TO EXPECT
                  </div>
                  <ul className="expect-list">
                    <li className="expect-item">verdict + skill bluffs</li>
                    <li className="expect-item">survival score</li>
                    <li className="expect-item">career lore</li>
                    <li className="expect-item">achievements unlocked</li>
                    <li className="expect-item">recovery protocol</li>
                    <li className="expect-item">shareable roast card</li>
                  </ul>
                </div>
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '15px' }}>
                  <div className="expect-title" style={{ color: '#71717a', fontSize: '0.6rem' }}>
                    📂 VERSION EVOLUTION
                  </div>
                  <ul className="expect-list" style={{ gap: '6px', fontSize: '0.7rem', color: '#52525b', fontFamily: 'var(--font-mono)', listStyle: 'none' }}>
                    <li>v1.0 — random insults</li>
                    <li>v2.0 — evidence analysis engine</li>
                    <li>v3.0 — psychological diagnostics</li>
                    <li>v4.0 — human recovery protocols</li>
                    <li>v5.0 — recruiter ptsd mode [CURRENT]</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* MARQUEE RUNNING TICKER */}
            <div className="ticker-container">
              <div className="ticker-track">
                {tickerItems.concat(tickerItems).map((item, idx) => (
                  <span key={idx} className="ticker-item">
                    <span className="ticker-dot">✦</span> {item}
                  </span>
                ))}
              </div>
            </div>

            {/* STEP 1: CHOOSE YOUR EXECUTIONER */}
            <div className="step-header">
              <div className="step-number">STEP 01 / CHOOSE YOUR EXECUTIONER</div>
              <h2 className="step-title">Select your <span className="step-title-glow">roast master</span></h2>
            </div>

            <div className="personalities-grid">
              {PERSONALITIES.map((p) => {
                const isSelected = p.id === selectedPersonality.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      soundSynthesizer.playHover();
                      setSelectedPersonality(p);
                    }}
                    className={`persona-card ${isSelected ? 'selected' : ''}`}
                    style={{
                      '--theme-primary': isSelected ? 'var(--theme-primary)' : '#52525b',
                      '--theme-primary-rgb': isSelected ? 'var(--theme-primary-rgb)' : '82,82,91',
                    }}
                  >
                    <div className="persona-avatar-box" style={{
                      background: isSelected ? 'rgba(var(--theme-primary-rgb), 0.25)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'var(--theme-primary)' : 'rgba(255,255,255,0.05)'}`,
                    }}>
                      {p.avatarChar || p.avatar}
                    </div>

                    {isSelected && <span className="persona-selected-badge">• Selected</span>}

                    <h3 className="persona-name">{p.name}</h3>
                    <p className="persona-desc">{p.role}</p>
                    
                    <div className="persona-meta">
                      {p.id === 'staff_engineer' && 'AGGRESSIVE JAGGED NEON · CRT SCANLINES · GLITCH'}
                      {p.id === 'faang_gatekeeper' && 'TERMINAL GREEN · BRUTALIST · MONOSPACE'}
                      {p.id === 'devops_veteran' && 'ALERTS OF DOOM · PRODUCTION TELEMETRY · PROMETHEUS CRITICAL'}
                      {p.id === 'oss_maintainer' && 'GIT BLAME CRITIQUE · DRIVE-BY PR BLOCKS · ISSUES CLOSED'}
                      {p.id === 'exhausted_recruiter' && 'CORPORATE BLUE · CV SCANNER · SUBTLE GLITCHES'}
                      {p.id === 'rust_elitist' && 'TYPE SAFETY PURITY · COMPILE TIME SHIELD · GC ANATHEMA'}
                      {p.id === 'startup_cto' && 'VAPORWAVE · HYPE GRADIENTS · COLLAPSED RUNWAY'}
                      {p.id === 'systems_architect' && 'STERILE GRAY · WINDOWS 95 ERROR DIALOGS · DISTRIBUTED DEADLOCKS'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* STEP 2: FEED THE BEAST */}
            <div className="step-header">
              <div className="step-number">STEP 02 / SUBMIT YOURSELF</div>
              <h2 className="step-title">feed the <span className="step-title-glow">beast</span></h2>
            </div>

            <section className="submit-section">
              <Uploader 
                selectedPersonality={selectedPersonality}
                setSelectedPersonality={setSelectedPersonality}
                onAnalyze={startAnalysis}
              />
            </section>
          </motion.main>
        )}

        {appState === 'SCANNING' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%' }}
          >
            <ScanningView 
              personality={selectedPersonality} 
              onComplete={handleScanComplete}
            />
          </motion.div>
        )}

        {appState === 'ANALYZED' && (
          <motion.div
            key="analyzed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%' }}
          >
            <Dashboard 
              analysis={analysis}
              resumeText={resumeText}
              personality={selectedPersonality}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
