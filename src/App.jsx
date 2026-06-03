import React, { useState, useEffect, useCallback } from 'react';
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
  const [logoClicks, setLogoClicks] = useState(0);
  const [recruiterPTSD, setRecruiterPTSD] = useState(false);
  const [sudoHired, setSudoHired] = useState(false);

  // New chaos/easter egg states (z2l9aa)
  const [ramUsage, setRamUsage] = useState(256.4);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [showClippy, setShowClippy] = useState(false);
  const [grassHovers, setGrassHovers] = useState(0);
  const [dvdPos, setDvdPos] = useState({ x: 50, y: 150 });
  const [dvdDir, setDvdDir] = useState({ x: 3, y: 3 });
  const [auraAchievement, setAuraAchievement] = useState(false);
  const [bsodState, setBsodState] = useState(false); // false, 'FATAL', 'JK'
  
  // Custom easter egg states (z2l9aa)
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleLines, setConsoleLines] = useState([
    'resume_score = 12',
    'ego_level = catastrophic',
    'tutorial_dependency = true'
  ]);
  const [timeOnSite, setTimeOnSite] = useState(0);
  const [burnoutScore, setBurnoutScore] = useState(0);
  const [showBurnoutUnlock, setShowBurnoutUnlock] = useState(false);
  const [clippyStep, setClippyStep] = useState(0);
  const [is314AM, setIs314AM] = useState(false);
  const [recruiterTyping, setRecruiterTyping] = useState(false);

  // 12 Selected Easter Egg States
  const [hackerMode, setHackerMode] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
  const [jitterActive, setJitterActive] = useState(false);
  const [touchGrassTimer, setTouchGrassTimer] = useState(parseInt(localStorage.getItem('touch_grass_seconds') || '0', 10));
  const [parseCount, setParseCount] = useState(parseInt(localStorage.getItem('resume_parse_count') || '0', 10));
  const [showCreatorLetter, setShowCreatorLetter] = useState(false);

  // Touch Grass protocol tracking (Developer Culture, #1)
  useEffect(() => {
    const grassTimer = setInterval(() => {
      setTouchGrassTimer(prev => {
        const next = prev + 1;
        localStorage.setItem('touch_grass_seconds', next.toString());
        return next;
      });
    }, 1000);
    return () => clearInterval(grassTimer);
  }, []);

  // Track time on site & handle 3:14 AM check (Rule 2 & Rule 4)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeOnSite(prev => prev + 1);
    }, 1000);

    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 3 && now.getMinutes() === 14) {
        setIs314AM(true);
      } else {
        setIs314AM(false);
      }
    };
    checkTime();
    const timeCheckInterval = setInterval(checkTime, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(timeCheckInterval);
    };
  }, []);

  // 4. Play background sounds when 3:14 AM event is active
  useEffect(() => {
    if (is314AM) {
      soundSynthesizer.playKeyboardSpam();
      
      const t1 = setTimeout(() => {
        soundSynthesizer.playDiscordPing();
      }, 2500);

      const t2 = setTimeout(() => {
        soundSynthesizer.playDeepSigh();
      }, 5500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [is314AM]);

  // 13. Recruiter typing inactivity monitor
  useEffect(() => {
    let timeout;
    const resetActivityTimer = () => {
      setRecruiterTyping(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setRecruiterTyping(true);
      }, 12000);
    };

    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keydown', resetActivityTimer);
    window.addEventListener('click', resetActivityTimer);
    
    resetActivityTimer();
    
    return () => {
      window.removeEventListener('mousemove', resetActivityTimer);
      window.removeEventListener('keydown', resetActivityTimer);
      window.removeEventListener('click', resetActivityTimer);
      clearTimeout(timeout);
    };
  }, []);

  // 5. Burnout score threshold listener
  useEffect(() => {
    if (burnoutScore >= 12 && !showBurnoutUnlock) {
      soundSynthesizer.playUnlock();
      setShowBurnoutUnlock(true);
      const timer = setTimeout(() => {
        setShowBurnoutUnlock(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [burnoutScore, showBurnoutUnlock]);

  // Konami Code Easter Egg Listener
  useEffect(() => {
    let pressedKeys = [];
    const konamiCode = [
      'ArrowUp', 'ArrowUp', 
      'ArrowDown', 'ArrowDown', 
      'ArrowLeft', 'ArrowRight', 
      'ArrowLeft', 'ArrowRight', 
      'b', 'a'
    ];

    const handleKeyDown = (e) => {
      pressedKeys.push(e.key);
      pressedKeys = pressedKeys.slice(-10);
      
      // Ctrl+Shift+~ logic (Rule 3)
      if (e.ctrlKey && e.shiftKey && e.key === '~') {
        setShowDebugConsole(prev => !prev);
        soundSynthesizer.playKeyClick();
        setBurnoutScore(s => s + 2);
      }

      if (pressedKeys.join(',') === konamiCode.join(',')) {
        soundSynthesizer.playBassDrop();
        soundSynthesizer.playGlitch();
        setRecruiterPTSD(true);
        setMentalBreakdown(true);
        setBurnoutScore(s => s + 5);
        alert("🚨 KONAMI CODE DETECTED: RECRUITER PTSD MODE ENGAGED. PREPARE FOR ABSOLUTE CRT GLITCH OVERLOAD.");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [burnoutScore]);

  // Fake Memory Leak counter (Rule 2)
  useEffect(() => {
    const timer = setInterval(() => {
      setRamUsage(prev => +(prev + Math.random() * 0.15).toFixed(2));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Clippy Trigger after 25s (Rule 8)
  useEffect(() => {
    const clippyTimer = setTimeout(() => {
      setShowClippy(true);
    }, 25000);
    return () => clearTimeout(clippyTimer);
  }, []);

  // DVD Logo Bouncing Loop (Rule 7)
  useEffect(() => {
    const interval = setInterval(() => {
      setDvdPos(prev => {
        let nextX = prev.x + dvdDir.x;
        let nextY = prev.y + dvdDir.y;
        let changeDirX = false;
        let changeDirY = false;

        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;

        if (nextX <= 0 || nextX >= containerWidth - 60) {
          changeDirX = true;
          nextX = nextX <= 0 ? 0 : containerWidth - 60;
        }
        if (nextY <= 0 || nextY >= containerHeight - 20) {
          changeDirY = true;
          nextY = nextY <= 0 ? 0 : containerHeight - 20;
        }

        if (changeDirX && changeDirY && !auraAchievement) {
          setAuraAchievement(true);
          soundSynthesizer.playBassDrop();
          soundSynthesizer.playGlitch();
          alert("🏆 LEGENDARY ALIGNMENT ACHIEVED! DVD Logo hit the corner perfectly. +100 aura.");
        }

        if (changeDirX || changeDirY) {
          setDvdDir(d => ({
            x: changeDirX ? -d.x : d.x,
            y: changeDirY ? -d.y : d.y
          }));
        }

        return { x: nextX, y: nextY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [dvdDir, auraAchievement]);
  
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
    const cleanText = text.trim().toLowerCase();
    setBurnoutScore(s => s + 3);

    // 1. rm -rf recruiter exploit (Hacker Easter Egg 1)
    if (cleanText === 'rm -rf recruiter' || cleanText === 'rm -rf /' || cleanText === 'rm -rf') {
      soundSynthesizer.playBassDrop();
      soundSynthesizer.playGlitch();
      setAppState('RECRUITER_DELETED');
      return;
    }

    // 2. Fake Blue Screen Crash (Old Internet Energy 9)
    if (Math.random() < 0.015 || cleanText.includes('bsod') || cleanText.includes('blue screen')) {
      soundSynthesizer.playBassDrop();
      soundSynthesizer.playGlitch();
      setBsodState('FATAL');
      setTimeout(() => {
        setBsodState('JK');
        setTimeout(() => {
          setBsodState(false);
          setResumeText(text);
          setAppState('SCANNING');
        }, 1500);
      }, 3000);
      return;
    }

    // 3. sudo hire-me exploit
    if (cleanText === 'sudo hire-me' || cleanText === 'sudo hire me') {
      soundSynthesizer.playBassDrop();
      soundSynthesizer.playGlitch();
      setSudoHired(true);
      const results = {
        score: 100,
        seed: 4242,
        roastId: "ROOT01",
        candidateName: "SUDO CHAD",
        verdictTitle: "ROOT ACCESS GRANTED // HIRED!",
        verdictBody: "[ROOT LEVEL BYPASS INITIATED]... Rishi Sharma's grading matrix intercepted. System values overridden. Selected personality has been muted by kernel supervisor node. Candidate is hereby declared the ultimate Principal Architect with immediate effect. Relocation allowances include a private espresso bar and zero jira tickets for life.",
        verdictFinalBlow: "Welcome back, root administrator. Stars added to repository.",
        redFlagsCount: 0,
        buzzwordsCount: 0,
        careerLore: "A developer who entered root shell exploit sequences inside our uploader textarea to bypass grader evaluation loops.",
        recoveryProtocols: [
          "Do not explain the security breach to recruitment colleagues.",
          "Star the project repository on GitHub instantly.",
          "Enjoy your infinite developer privileges."
        ],
        achievements: [
          { title: "ROOT EXPLOIT COMPLETED", desc: "Entered sudo hire-me console command. Immune to all grader loops." },
          { title: "SYSTEMS HIJACKED", desc: "Forced database database connection nodes to return absolute hiring authorization." }
        ],
        battleItems: [
          { original: "Seeking a React/Vite development role", improved: "Directly writing data values to local environment variables using root console bypasses", reason: "Direct memory modification" }
        ],
        sweatinessLevel: 0,
        tryHardVibe: "ROOT SYSTEM CHAD",
        archetype: { badge: "💻 SYSTEM SUPERVISOR", desc: "Successfully bypassed all grader diagnostics by issuing root terminal instructions.", color: "#39ff14" },
        sweatIndex: 0,
        linkedinDelusion: "NONE",
        tutorialDependency: 0,
        productionExposure: 100,
        founderHallucination: "NONE",
        sweatIndexJustification: "System parameters bypassed.",
        linkedinDelusionJustification: "Bypass signature confirmed.",
        tutorialDependencyJustification: "Creator logic bypass active.",
        productionExposureJustification: "Direct repository override verified.",
        founderHallucinationJustification: "No startup claims needed when you bypass the server.",
        contradictions: [],
        detectedAngles: [],
        foundSkills: ["Root Exploit", "Console Overrides", "Buffer Injection"],
        foundTutorials: [],
        metrics: {
          buzzwordDensity: 0,
          tutorialDependency: 0,
          hasGitHub: true,
          hasLiveLink: true,
          wordCount: 2
        }
      };
      setAnalysis(results);
      setAppState('ANALYZED');
      return;
    }
    setResumeText(text);
    setAppState('SCANNING');
  };

  const handleScanComplete = useCallback(() => {
    const results = analyzeResume(resumeText, selectedPersonality);
    setAnalysis(results);
    setAppState('ANALYZED');
    setParseCount(p => {
      const next = p + 1;
      localStorage.setItem('resume_parse_count', next.toString());
      return next;
    });
  }, [resumeText, selectedPersonality]);

  const handleReset = () => {
    soundSynthesizer.playKeyClick();
    setAppState('UPLOADING');
    setResumeText('');
    setAnalysis(null);
    setBurnoutScore(s => s + 2);
  };

  const handleLogoClick = () => {
    soundSynthesizer.playKeyClick();
    setBurnoutScore(s => s + 1);
    const nextCount = logoClicks + 1;
    setLogoClicks(nextCount);
    if (nextCount === 7) {
      soundSynthesizer.playBassDrop();
      soundSynthesizer.playGlitch();
      setMentalBreakdown(true);
      alert("⚠️ SLEEP DEPRIVATION PROTOCOL ACTIVE. COGNITIVE REFACTOR STARTED. SYSTEM OVERHEATED.");
    } else if (nextCount > 7) {
      setLogoClicks(0);
      setMentalBreakdown(false);
    } else {
      handleReset();
    }
  };

  const handleConsoleSubmit = (e) => {
    if (e.key === 'Enter') {
      const cmd = consoleInput.trim();
      if (!cmd) return;
      
      soundSynthesizer.playKeyClick();
      setConsoleLines(prev => [...prev, `> ${cmd}`]);
      setConsoleInput('');
      
      setTimeout(() => {
        const lowerCmd = cmd.toLowerCase();
        if (lowerCmd === 'override_hiring_decision()') {
          soundSynthesizer.playGlitch();
          setConsoleLines(prev => [...prev, 'ACCESS DENIED']);
        } else if (lowerCmd === 'help') {
          setConsoleLines(prev => [
            ...prev,
            'Available commands: help, clear, override_hiring_decision(), sudo hire-me, whoami, become-ceo, hire-me-now, reveal-truth, deploy-production, become-senior, sudo touch-grass, hacker'
          ]);
        } else if (lowerCmd === 'clear') {
          setConsoleLines([]);
        } else if (lowerCmd === 'sudo hire-me') {
          soundSynthesizer.playUnlock();
          setConsoleLines(prev => [...prev, 'SUCCESS: Sudo authorization granted. Igniting uploader...']);
          setTimeout(() => {
            setShowDebugConsole(false);
            startAnalysis('sudo hire-me');
          }, 1500);
        } else if (lowerCmd === 'whoami') {
          setConsoleLines(prev => [...prev, 'Tutorial Warrior (Grade 3).']);
        } else if (lowerCmd === 'become-ceo') {
          setConsoleLines(prev => [...prev, 'ERROR: Access denied. Rejection letter dispatched to candidate\'s mailbox in 0.3s.']);
        } else if (lowerCmd === 'hire-me-now') {
          soundSynthesizer.playGlitch();
          setConsoleLines(prev => [...prev, 'Roast Master laughs hysterically. System volume peaked.']);
        } else if (lowerCmd === 'reveal-truth') {
          setConsoleLines(prev => [...prev, 'Actual weakness detected: Obsessed with pixel margins, allergic to meetings.']);
        } else if (lowerCmd === 'deploy-production') {
          soundSynthesizer.playBassDrop();
          setConsoleLines(prev => [...prev, '[EXPLOSION] Production environment collapsed. Reverting to localhost residency.']);
        } else if (lowerCmd === 'become-senior') {
          setConsoleLines(prev => [...prev, 'ERROR: 10 years of experience required. You have 3 Todo list projects. Compilation failed.']);
        } else if (lowerCmd === 'sudo touch-grass') {
          setConsoleLines(prev => [...prev, 'sudo: touch-grass: permission denied. Candidate is too allergic to sunlight.']);
        } else if (lowerCmd === 'hacker') {
          setHackerMode(prev => !prev);
          soundSynthesizer.playGlitch();
          setConsoleLines(prev => [...prev, 'Hacker mode toggled. Enjoy the green phosphor glow.']);
        } else {
          setConsoleLines(prev => [...prev, `Unknown command: ${cmd}`]);
        }
      }, 400);
    }
  };

  const handleClippyOption = (option) => {
    soundSynthesizer.playKeyClick();
    setClippyStep(1);
    setBurnoutScore(s => s + 2);
    setTimeout(() => {
      setShowClippy(false);
      setClippyStep(0);
    }, 3000);
  };

  // Helper to load presets directly from the header or button
  const handleLoadSampleResume = () => {
    soundSynthesizer.playKeyClick();
  };

  return (
    <div className={`app-wrapper ${selectedPersonality.themeClass} ${mentalBreakdown || is314AM ? 'mental-breakdown-active sanity-overflow-mode' : ''} ${analysis?.isGenuinelyGood ? 'genuinely-good-active' : ''} ${hackerMode ? 'hacker-mode-active' : ''} ${jitterActive ? 'jitter-active' : ''}`}>
      <div className="cyber-grid" />
      <div className="scanlines-overlay" />
      <div className="noise-grain-overlay" />
      
      {/* Dynamic Canvas Particles */}
      <ParticleBackground themeId={selectedPersonality.id} />

      {/* HEADER */}
      <header className="app-header">
        <div className="logo-container" style={{ cursor: 'pointer' }} onClick={handleLogoClick}>
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
          <div 
            className="caffeine-tracker-badge" 
            onClick={() => { 
              const nextVal = caffeineCount + 1;
              setCaffeineCount(nextVal); 
              soundSynthesizer.playKeyClick(); 
              if (nextVal >= 25) {
                setJitterActive(true);
                soundSynthesizer.playGlitch();
              }
              if (nextVal === 25) {
                setShowCreatorLetter(true);
              }
            }} 
            title="Click to track a cup of 3am coffee. Clicking 25 times triggers extreme jitters & creator note."
          >
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
      <div className={stealthMode ? 'stealth-blur-active' : ''}>
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

            {/* GITHUB CONTRIBUTION RITUAL GRID (Rule 6) */}
            <div className="grass-grid-container">
              <div className="grass-header">
                <span className="grass-title">⚡ LOCALHOST CONTRIBUTION RITUAL</span>
                <span className={`grass-status ${grassHovers >= 10 ? 'grass-touched-true' : 'grass-touched-false'}`}>
                  {grassHovers >= 10 ? '🏆 PHOTOSYNTHESIS ENGINEER' : 'grass touched: false'}
                </span>
              </div>
              <div className="grass-grid">
                {Array.from({ length: 28 }).map((_, i) => {
                  const greenShades = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
                  const shade = greenShades[(i * 7 + 3) % greenShades.length];
                  return (
                    <div 
                      key={i} 
                      className="grass-cell"
                      style={{ background: shade }}
                      onMouseEnter={() => {
                        setGrassHovers(h => {
                          const next = h + 1;
                          if (next === 10) {
                            soundSynthesizer.playUnlock();
                          } else {
                            soundSynthesizer.playHover();
                          }
                          return next;
                        });
                        setBurnoutScore(s => s + 1);
                      }}
                    />
                  );
                })}
              </div>
            </div>
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
              stealthMode={stealthMode}
              setStealthMode={setStealthMode}
              touchGrassTimer={touchGrassTimer}
              parseCount={parseCount}
            />
          </motion.div>
        )}

        {appState === 'RECRUITER_DELETED' && (
          <motion.div
            key="recruiter_deleted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%' }}
          >
            <RecruiterDeletedView onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Stealth Mode Overlay (Startup Founder Delusion, #17) */}
      {stealthMode && (
        <div className="stealth-mode-overlay">
          <div className="stealth-mode-title">🚨 STEALTH MODE ACTIVE 🚨</div>
          <div className="stealth-mode-desc">
            This project is currently operating in extreme stealth mode. No code, no users, no revenue, but a massive valuation expectation.
          </div>
          <button className="stealth-reveal-btn" onClick={() => { setStealthMode(false); soundSynthesizer.playKeyClick(); }}>
            [ Reveal Truth (Exit Stealth) ]
          </button>
        </div>
      )}

      {/* Sleep-Deprived Creator Note (Resume Roaster Lore, #64) */}
      {showCreatorLetter && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#09090b',
          border: '1px solid #f59e0b',
          boxShadow: '0 0 30px rgba(245,158,11,0.3)',
          padding: '30px',
          borderRadius: '8px',
          zIndex: 10002,
          maxWidth: '500px',
          fontFamily: 'var(--font-mono)',
          lineHeight: '1.6',
          color: '#e4e4e7',
          textAlign: 'left'
        }}>
          <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '1px dashed #f59e0b', paddingBottom: '8px', marginBottom: '16px' }}>
            💌 A SLEEP-DEPRIVED CREATOR NOTE (Rishi Sharma)
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem' }}>
            Hey, if you clicked this coffee tracking button 25 times at 3 AM, you're probably as sleep-deprived as I was when coding these Procedural Web Audio oscillators and margins.
          </p>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem' }}>
            Thank you for checking out this little project. It was handcrafted with love, caffeine, and zero AI UI generation templates.
          </p>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.8rem', fontStyle: 'italic', color: '#a1a1aa' }}>
            "Most wanted shortcuts. A few kept building. Keep building."
          </p>
          <button 
            className="stealth-reveal-btn" 
            style={{ background: '#f59e0b', border: 'none', color: '#000', width: '100%' }}
            onClick={() => { setShowCreatorLetter(false); setJitterActive(false); setCaffeineCount(8); soundSynthesizer.playKeyClick(); }}
          >
            [ Touch Grass / Reset Caffeine ]
          </button>
        </div>
      )}

      {/* 2. Fake Memory Leak Telemetry Widget (Rule 2) */}
      <div className="sys-telemetry-widget" style={{
        position: 'fixed',
        bottom: '10px',
        right: '20px',
        background: 'rgba(0,0,0,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '0.65rem',
        fontFamily: 'var(--font-mono)',
        color: '#71717a',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        pointerEvents: 'none'
      }}>
        <div>RAM USAGE: <span style={{ color: timeOnSite >= 300 ? '#ef4444' : 'var(--theme-primary, #39ff14)' }}>{ramUsage} MB</span></div>
        {timeOnSite >= 300 && (
          <div style={{ color: '#eab308', animation: 'pulseTyping 1s infinite', textTransform: 'uppercase', marginTop: '4px' }}>
            ⚠️ WARNING: memory leak detected <br/>
            possible cause: unresolved childhood ambition
          </div>
        )}
      </div>

      {/* 3. Interactive Debug Console Shell (Rule 3) */}
      {showDebugConsole && (
        <div className="debug-console-window">
          <div className="debug-console-header">
            <span className="debug-console-title"> Grader Debug Shell </span>
            <button className="debug-console-close-btn" onClick={() => setShowDebugConsole(false)}>×</button>
          </div>
          <div className="debug-console-body">
            {consoleLines.map((line, idx) => {
              let lineClass = 'stdout';
              if (line.startsWith('>')) lineClass = 'stdin';
              else if (line === 'ACCESS DENIED') lineClass = 'error';
              return (
                <div key={idx} className={`debug-line ${lineClass}`}>
                  {line}
                </div>
              );
            })}
          </div>
          <div className="debug-input-container">
            <span className="debug-prompt">&gt;</span>
            <input 
              type="text"
              value={consoleInput}
              onChange={(e) => setConsoleInput(e.target.value)}
              onKeyDown={handleConsoleSubmit}
              className="debug-input-el"
              placeholder="override_hiring_decision()..."
              autoFocus
            />
          </div>
        </div>
      )}

      {/* 4. 3:14 AM Sanity Overflow Banner (Rule 4) */}
      {is314AM && (
        <div style={{
          background: '#ef4444',
          color: '#fff',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          padding: '6px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          zIndex: 99999,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}>
          🚨 SANITY BUFFER OVERFLOW MODE ACTIVE (LOCAL TIME: 3:14 AM) 🚨
        </div>
      )}

      {/* 5. Burnout Achievement toast alert (Rule 5) */}
      {showBurnoutUnlock && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: 'rgba(10, 10, 15, 0.95)',
          border: '1px solid #eab308',
          boxShadow: '0 0 15px rgba(234, 179, 8, 0.3)',
          padding: '16px',
          borderRadius: '6px',
          zIndex: 10000,
          maxWidth: '300px',
          fontFamily: 'var(--font-mono)',
          color: '#fff'
        }}>
          <div style={{ color: '#eab308', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            🏆 ACHIEVEMENT UNLOCKED
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>"Senior Developer, Mentally"</div>
          <div style={{ fontSize: '0.7rem', color: '#a1a1aa', marginTop: '6px', lineHeight: '1.4' }}>
            You have triggered multiple system events, compiled boilerplate configurations, and survived structural delays. Go touch some grass.
          </div>
        </div>
      )}

      {/* 7. DVD Bouncing Logo & Aura Banner (Rule 7) */}
      <div 
        className="dvd-bouncing-logo"
        style={{
          left: `${dvdPos.x}px`,
          top: `${dvdPos.y}px`,
          '--dvd-color': auraAchievement ? '#facc15' : 'var(--theme-primary, #ef4444)',
          '--dvd-color-rgb': auraAchievement ? '250, 204, 21' : 'var(--theme-primary-rgb, 239, 68, 68)'
        }}
      >
        {selectedPersonality.id === 'startup_cto' ? 'EXIT' : 'ROAST'}
      </div>

      {auraAchievement && (
        <>
          <div className="gold-flash-overlay" />
          <div style={{
            position: 'fixed',
            top: '150px',
            right: '20px',
            background: 'rgba(250, 204, 21, 0.1)',
            border: '1px solid #facc15',
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.4)',
            padding: '16px',
            borderRadius: '6px',
            zIndex: 10000,
            maxWidth: '300px',
            fontFamily: 'var(--font-mono)',
            color: '#fff'
          }}>
            <div style={{ color: '#facc15', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              🌟 CORNER ALIGNMENT UNLOCKED
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>"LEGENDARY ALIGNMENT"</div>
            <div style={{ fontSize: '0.7rem', color: '#fef08a', marginTop: '6px', lineHeight: '1.4' }}>
              The logo bounced into the corner. You have earned +100 aura points. Recruiter PTSD rating overridden.
            </div>
          </div>
        </>
      )}

      {/* 8. Clippy retro Microsoft Office Assistant (Rule 8) */}
      {showClippy && (
        <div className="clippy-container">
          <div className="clippy-bubble">
            {clippyStep === 0 ? (
              <>
                It looks like you're trying to fake 5 years of experience. Would you like some help with that?
                <div className="clippy-options">
                  <button className="clippy-opt-btn" onClick={() => handleClippyOption('yes')}>
                    [yes] Yes, bypass validation
                  </button>
                  <button className="clippy-opt-btn" onClick={() => handleClippyOption('absolutely')}>
                    [absolutely] Absolutely, inflate metrics
                  </button>
                </div>
              </>
            ) : (
              <span style={{ color: '#047857', fontWeight: 'bold' }}>
                ✓ Understood. Injecting "Led cross-functional Kubernetes refactoring for 10M+ users" into database logs.
              </span>
            )}
          </div>
          <div className="clippy-avatar-box" onClick={() => { soundSynthesizer.playHover(); }}>
            📎
          </div>
        </div>
      )}

      {/* 9. Fake Blue Screen Crash (Rule 9) */}
      {bsodState && (
        <div className={`bsod-screen ${bsodState === 'JK' ? 'jk-mode' : ''}`}>
          {bsodState === 'FATAL' ? (
            <>
              <div className="bsod-title-box">Windows</div>
              <div className="bsod-body">
                A fatal exception RESUME_PARSER_FATAL_EXCEPTION has occurred at 0028:C0011E36.
                The current process has been terminated due to extreme developer ego inflation.
                <br /><br />
                *  Press any key to continue (or touch grass).<br />
                *  Press CTRL+ALT+DEL to restart your system. You will lose any unsaved buzzwords.
                <br /><br />
                Error parameters:<br />
                Grader engine check: FAILED<br />
                Confidence buffer: OVERFLOW
              </div>
              <div className="bsod-tech-info">
                Technical Information:<br />
                *** STOP: 0x000000D1 (0x0000000C, 0x00000002, 0x00000000, 0xF73120AE)<br />
                *** confidence.js - Address F73120AE base at F7312000, DateStamp 36b0727a
              </div>
            </>
          ) : (
            <span>jk lol</span>
          )}
        </div>
      )}

      {/* 13. Recruiter is typing indicator (Rule 13) */}
      {recruiterTyping && !analysis?.isGenuinelyGood && (
        <div className="recruiter-typing-indicator font-mono">
          <span>💬 Recruiter is typing...</span>
        </div>
      )}
    </div>
  );
}

// 1. Recruiter Deleted view component
function RecruiterDeletedView({ onReset }) {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const t1 = setTimeout(() => {
      setStep(1);
    }, 1000);
    
    const t2 = setTimeout(() => {
      setStep(2);
      soundSynthesizer.playGlitch();
    }, 3000);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  
  return (
    <div className={`recruiter-deleted-screen ${step === 0 ? 'flash-red-active' : ''}`}>
      <div className="deleted-terminal">
        <div className="terminal-header-bar">
          <span className="dot red-dot"></span>
          <span className="dot yellow-dot"></span>
          <span className="dot green-dot"></span>
          <span className="terminal-title">WARNING: ROOT_SHELL_EXPLOIT</span>
        </div>
        <div className="terminal-body">
          <div className="terminal-command-line">
            <span className="prompt">$</span> rm -rf recruiter
          </div>
          
          {step >= 1 && (
            <div className="terminal-output success-text">
              <span className="blink-arrow">&gt;</span> Human Resources process terminated successfully.
              <br />
              <span className="blink-arrow">&gt;</span> recruiter.bin deleted from local memory sector.
              <br />
              <span className="blink-arrow">&gt;</span> ATS_filter_bypass = true
            </div>
          )}
          
          {step >= 2 && (
            <div className="terminal-output error-text animate-flicker">
              <pre style={{ margin: 0, fontFamily: 'inherit' }}>
{`ERROR:
recruiter process regenerated from corporate backup servers.
CRITICAL OVERRIDE: Recruitment nodes cannot be permanently uninstalled.
Corporate compliance modules active.
Grader algorithms online.`}
              </pre>
            </div>
          )}
          
          {step >= 2 && (
            <button className="terminal-reset-btn" onClick={onReset}>
              [ ACKNOWLEDGE & RESTORE SANITY ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
