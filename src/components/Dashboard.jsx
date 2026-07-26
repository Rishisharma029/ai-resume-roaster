import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Award, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { soundSynthesizer } from '../services/soundSynthesizer';
import RoastCard from './RoastCard';

export default function Dashboard({ analysis, resumeText, personality, onReset, stealthMode, setStealthMode, touchGrassTimer, parseCount }) {
  const {
    score,
    roastId,
    candidateName,
    verdictTitle,
    verdictBody,
    verdictFinalBlow,
    redFlagsCount,
    buzzwordsCount,
    careerLore,
    recoveryProtocols,
    achievements,
    battleItems,
    sweatinessLevel,
    tryHardVibe,
    archetype,
    sweatIndex,
    linkedinDelusion,
    tutorialDependency,
    productionExposure,
    founderHallucination,
    sweatIndexJustification,
    linkedinDelusionJustification,
    tutorialDependencyJustification,
    productionExposureJustification,
    founderHallucinationJustification,
    metrics
  } = analysis;

  // RPG Boss fight state variables (Recruiter Horror, #10)
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [battleLog, setBattleLog] = useState(["An aggressive ATS Grader has appeared! Defeat it to summon an interview."]);
  const [battleStatus, setBattleStatus] = useState("FIGHTING"); // FIGHTING, WON, LOST

  // Seed round clicker states (Startup Founder Delusion, #16)
  const [seedValuation, setSeedValuation] = useState(10); // millions
  const [seedHeadline, setSeedHeadline] = useState("Localhost project wrapper raises seed round.");
  const [seedStep, setSeedStep] = useState(0);

  // Draggable XP popups (Internet Culture, #48)
  const [xpDialogs, setXpDialogs] = useState([]);

  const handleBattleAction = (action) => {
    if (battleStatus !== 'FIGHTING') return;

    soundSynthesizer.playKeyClick();
    let pDamage = 0;
    let logMsg = "";
    
    if (action === 'metrics') {
      pDamage = 25;
      logMsg = "You attacked with Quantitative Metrics! Slashing ATS filters by 25HP.";
    } else if (action === 'bullet') {
      pDamage = 12;
      logMsg = "You formatted bullet points with action verbs! Slashing ATS filters by 12HP.";
    } else if (action === 'localhost') {
      pDamage = 4;
      logMsg = "You dropped a localhost deployment link! ATS evaded. Slashing 4HP.";
    }

    const nextBossHp = Math.max(0, bossHp - pDamage);
    setBossHp(nextBossHp);

    if (nextBossHp <= 0) {
      setBattleStatus("WON");
      setBattleLog(prev => [logMsg, "🏆 ATS Boss Defeated! Grader filters bypassed. Interview invitation summoned.", ...prev]);
      soundSynthesizer.playUnlock();
      return;
    }

    const bossAttacks = [
      { name: "REJECTED (Missing experience)", damage: 15 },
      { name: "AUTO-FILTER (Buzzword Overdose)", damage: 20 },
      { name: "GHOSTED (No explanation)", damage: 10 }
    ];
    const attack = bossAttacks[Math.floor(Math.random() * bossAttacks.length)];
    const nextPlayerHp = Math.max(0, playerHp - attack.damage);
    setPlayerHp(nextPlayerHp);

    if (nextPlayerHp <= 0) {
      setBattleStatus("LOST");
      setBattleLog(prev => [logMsg, `💀 ATS Boss countered with ${attack.name}! Ego destroyed. "We'll get back to you."`, ...prev]);
      soundSynthesizer.playBassDrop();
      return;
    }

    setBattleLog(prev => [logMsg, `💥 ATS countered with ${attack.name} (dealing ${attack.damage} damage to Candidate Ego).`, ...prev]);
  };

  const handleSeedSim = () => {
    soundSynthesizer.playKeyClick();
    const nextVal = Math.round(seedValuation * 2.2 + 5);
    setSeedValuation(nextVal);
    
    const headlines = [
      `Venture Capital firms inject funding. Valuation: $${nextVal}M.`,
      `CEO claims AI Resume Roaster is 'Uber for resumes'. Valuation: $${nextVal}M.`,
      `Pre-seed pivot into a wrapper around Claude Sonnet. Valuation: $${nextVal}M.`,
      `Stealth landing page launches with 10k waitlist bots. Valuation: $${nextVal}M.`,
      `Stealth company achieves unicorn status with ₹0 ARR. Valuation: $${nextVal}M.`,
      `Valuation peaks at $${nextVal}M. Founder updates LinkedIn bio.`,
      `Bankruptcy declared. Runway collapsed. Valuation: $0.`
    ];

    const nextStep = seedStep + 1;
    setSeedStep(nextStep);

    if (nextStep >= headlines.length) {
      setSeedValuation(0);
      setSeedHeadline("Bankruptcy declared. Dilution exceeds physical constraints. Runway: 0 days.");
      setSeedStep(0);
      soundSynthesizer.playBassDrop();
    } else {
      setSeedHeadline(headlines[nextStep]);
      soundSynthesizer.playGlitch();
    }
  };

  const spawnXpDialog = () => {
    soundSynthesizer.playKeyClick();
    soundSynthesizer.playGlitch();
    
    const errors = [
      "Ego density out of boundaries.",
      "LinkedIn delusion levels: CRITICAL.",
      "Warning: Localhost environment myth confirmed.",
      "Tutorial dependency exception.",
      "Cannot compile confidence.js.",
      "Attention span lost. Redirecting to coffee maker."
    ];

    const newDialog = {
      id: Date.now(),
      title: "Parser Grader Diagnostic",
      text: errors[Math.floor(Math.random() * errors.length)],
      x: 100 + Math.random() * 200,
      y: 150 + Math.random() * 200
    };

    setXpDialogs(prev => [...prev, newDialog]);
  };

  const closeXpDialog = (id) => {
    soundSynthesizer.playKeyClick();
    setXpDialogs(prev => prev.filter(d => d.id !== id));
  };

  const isPerfectScore = score === 100;

  const handleReset = () => {
    soundSynthesizer.playKeyClick();
    onReset();
  };

  const [roastCopied, setRoastCopied] = useState(false);
  const handleCopyRoast = () => {
    soundSynthesizer.playKeyClick();
    const text = `${verdictTitle}\n\n${verdictBody}\n\n"${verdictFinalBlow}"\n\n— ${personality.name} | AI Resume Roaster`;
    navigator.clipboard.writeText(text).then(() => {
      setRoastCopied(true);
      setTimeout(() => setRoastCopied(false), 2500);
    });
  };

  const isLinkedInProphet = archetype?.badge?.includes('LINKEDIN') || linkedinDelusion === 'CRITICAL' || linkedinDelusion === 'HIGH';

  // 14. LinkedIn Final Boss podcast music player
  React.useEffect(() => {
    let podcastMusic = null;
    if (isLinkedInProphet && !analysis.isGenuinelyGood) {
      podcastMusic = soundSynthesizer.playPodcastMusic();
    }
    return () => {
      if (podcastMusic) {
        podcastMusic.stop();
      }
    };
  }, [isLinkedInProphet, analysis.isGenuinelyGood]);

  const getPrimaryColor = () => {
    const id = personality.id;
    if (id === 'staff_engineer') return '#ff0055';
    if (id === 'exhausted_recruiter') return '#0099ff';
    if (id === 'startup_cto') return '#ff6600';
    if (id === 'faang_gatekeeper') return '#ffd700';
    if (id === 'devops_veteran') return '#39ff14';
    if (id === 'rust_elitist') return '#a239ca';
    if (id === 'oss_maintainer') return '#14b8a6';
    return '#a8a29e'; // systems_architect
  };

  const getPrimaryColorRGB = () => {
    const id = personality.id;
    if (id === 'staff_engineer') return '255,0,85';
    if (id === 'exhausted_recruiter') return '0,153,255';
    if (id === 'startup_cto') return '255,102,0';
    if (id === 'faang_gatekeeper') return '255,215,0';
    if (id === 'devops_veteran') return '57,255,20';
    if (id === 'rust_elitist') return '162,57,202';
    if (id === 'oss_maintainer') return '20,184,166';
    return '168,162,158';
  };

  const primaryColor = getPrimaryColor();

  const motivationalQuotes = [
    "“Don't watch the clock; do what it does. Keep going and post about it.”",
    "“Synergy is not a buzzword; it is a lifestyle of networking.”",
    "“Your 3 AM code is someone else's 9 AM inspiration.”",
    "“Failure is just a pivot before the exit.”",
    "“Hustle until your competitors ask if you are hiring.”",
    "“The best API wrapper is the one that raises at a $10M valuation.”"
  ];

  // 16. Hidden Humanity Check view override
  if (analysis.isGenuinelyGood) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        color: '#888',
        fontFamily: 'monospace',
        textAlign: 'center',
        padding: '40px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '24px',
          textAlign: 'left'
        }}>
          <p style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '1px' }}>...</p>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'normal', color: '#ccc', letterSpacing: '1px' }}>wait.</h1>
          <p style={{ margin: 0, fontSize: '1.2rem', color: '#aaa', letterSpacing: '0.5px' }}>this one is actually good.</p>
          <p style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 'bold', textShadow: '0 0 8px rgba(255,255,255,0.2)', letterSpacing: '1.5px' }}>respect earned.</p>
          
          <button 
            onClick={handleReset}
            style={{
              marginTop: '40px',
              background: 'transparent',
              border: '1px solid #444',
              color: '#666',
              padding: '10px 20px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.target.style.color = '#ccc'; e.target.style.borderColor = '#ccc'; }}
            onMouseLeave={(e) => { e.target.style.color = '#666'; e.target.style.borderColor = '#444'; }}
          >
            [ Go Back ]
          </button>
        </div>
      </div>
    );
  }

  const quoteIdx = roastId ? roastId.charCodeAt(0) % motivationalQuotes.length : 0;

  return (
    <div 
      className={isLinkedInProphet ? 'linkedin-final-boss-active' : ''}
      style={{ 
        zIndex: 10, 
        position: 'relative', 
        width: '100%', 
        maxWidth: '1050px', 
        margin: '0 auto', 
        padding: '20px 20px 100px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '40px',
        borderRadius: isLinkedInProphet ? '12px' : '0',
        transition: 'all 0.5s ease'
      }}
    >
      
      {/* Reset button at very top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {isLinkedInProphet && (
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ⚡ CORPORATE SIGMA ASCENDED MODE ACTIVE
            </span>
          )}
        </div>
        <motion.button
          onClick={handleReset}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '4px',
            color: '#fff',
            padding: '8px 16px',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            letterSpacing: '0.5px'
          }}
        >
          <RefreshCw size={12} /> Submit Another Resume
        </motion.button>
      </div>

      {isLinkedInProphet && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '8px',
          padding: '15px 20px',
          color: '#38bdf8',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          textAlign: 'center',
          boxShadow: '0 0 15px rgba(56, 189, 248, 0.1)'
        }}>
          <div style={{ fontSize: '0.6rem', color: 'rgba(56, 189, 248, 0.6)', marginBottom: '5px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            🏆 CORPORATE SIGMA ASCENDED // MANDATORY MOTIVATION
          </div>
          {motivationalQuotes[quoteIdx]}
        </div>
      )}

      {/* SECTION 1: OFFICIAL VERDICT CARD (Screenshot 1) */}
      <div 
        className="glass-panel asymmetric-offset-1" 
        style={{ 
          padding: '40px', 
          border: `2px solid ${primaryColor}`,
          boxShadow: `0 0 25px rgba(${getPrimaryColorRGB()}, 0.2), var(--theme-glow)`
        }}
      >
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              AI RESUME ROASTER · OFFICIAL VERDICT
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: primaryColor, textTransform: 'uppercase', letterSpacing: '-0.5px', marginTop: '4px' }}>
              {personality.name}
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block' }}>
              SURVIVAL
            </span>
            <span style={{ fontSize: '3rem', fontWeight: 900, color: primaryColor, lineHeight: 1 }}>
              {score}%
            </span>
          </div>
        </div>

        {/* Big Quote */}
        <h3 style={{ 
          fontSize: '1.6rem', 
          fontWeight: 900, 
          color: '#fff', 
          lineHeight: 1.3, 
          marginBottom: '24px', 
          textTransform: 'uppercase',
          borderLeft: `4px solid ${primaryColor}`,
          paddingLeft: '20px'
        }}>
          "{verdictTitle}"
        </h3>

        {/* Body — Structured Roast Sections */}
        <div style={{ marginBottom: '35px' }}>
          {verdictBody && verdictBody.includes('## Official Verdict') ? (
            (() => {
              const monoSections = ['Incident Report', 'Fun Metrics', 'Survival Probability'];
              return verdictBody.split('\n\n---\n\n').map((section, idx) => {
                const trimmed = section.trim();
                const firstLine = trimmed.split('\n')[0];
                const isHeader = firstLine.startsWith('## ');
                const sectionTitle = isHeader ? firstLine.replace('## ', '') : null;
                const sectionContent = isHeader
                  ? trimmed.split('\n').slice(1).join('\n').trim()
                  : trimmed;
                const useMono = monoSections.some(m => sectionTitle && sectionTitle.includes(m));
                return (
                  <div key={idx} style={{ marginBottom: '32px' }}>
                    {sectionTitle && (
                      <div style={{
                        fontSize: '0.58rem',
                        fontFamily: 'var(--font-mono, monospace)',
                        color: primaryColor,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '2.5px',
                        marginBottom: '10px',
                        paddingBottom: '7px',
                        borderBottom: `1px solid ${primaryColor}33`
                      }}>
                        ▸ {sectionTitle}
                      </div>
                    )}
                    <div style={{
                      fontSize: useMono ? '0.80rem' : '0.93rem',
                      lineHeight: useMono ? 1.7 : 1.85,
                      color: '#d4d4e0',
                      letterSpacing: '0.1px',
                      fontFamily: useMono
                        ? 'var(--font-mono, "Fira Code", monospace)'
                        : 'Georgia, "Times New Roman", serif',
                      fontWeight: 400,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {sectionContent}
                    </div>
                  </div>
                );
              });
            })()
          ) : (
            <p style={{
              fontSize: '1.05rem',
              lineHeight: 1.9,
              color: '#d4d4e0',
              letterSpacing: '0.2px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 400
            }}>
              {verdictBody}
            </p>
          )}
        </div>

        {isPerfectScore && (
          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: 'rgba(250, 204, 21, 0.03)',
            border: '1px solid #facc15',
            boxShadow: '0 0 15px rgba(250, 204, 21, 0.1)',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            color: '#fef08a',
            fontSize: '0.75rem',
            lineHeight: '1.8'
          }}>
            <div style={{ color: '#facc15', fontWeight: 'bold', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>
              🌟 ULTIMATE SECRET ENDING (#66) 🌟
            </div>
            <p style={{ margin: '0 0 8px 0' }}>The parser has seen thousands of resumes.</p>
            <p style={{ margin: '0 0 8px 0' }}>Most wanted shortcuts.</p>
            <p style={{ margin: '0 0 8px 0' }}>A few kept building.</p>
            <p style={{ margin: '0', fontWeight: 'bold' }}>Keep building.</p>
          </div>
        )}

        {/* Heuristic Stats boxes */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '35px' }}>
          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '16px 24px', flex: '1 1 140px', background: 'rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
              BUZZWORDS
            </span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{buzzwordsCount}</span>
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '16px 24px', flex: '1 1 140px', background: 'rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
              RED FLAGS
            </span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: primaryColor }}>{redFlagsCount}</span>
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '16px 24px', flex: '2 1 200px', background: 'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
              SWEATINESS LEVEL
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{sweatinessLevel}%</span>
              <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#a1a1aa', textTransform: 'uppercase' }}>
                [{tryHardVibe}]
              </span>
            </div>
          </div>
        </div>

        {/* Final blow — punchy italic closing sentence */}
        <div style={{ borderTop: `2px solid ${primaryColor}`, paddingTop: '24px', marginTop: '8px' }}>
          <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: primaryColor, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', display: 'block', marginBottom: '12px', opacity: 0.9 }}>
            ▸ FINAL WORD
          </span>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', lineHeight: 1.6, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', borderLeft: `3px solid ${primaryColor}`, paddingLeft: '16px' }}>
            "{verdictFinalBlow}"
          </p>
        </div>

        {/* Card Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '30px', paddingTop: '15px', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#52525b', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <span>RESUME-ROASTER.APP</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>ROAST ID - <span style={{ color: primaryColor }}>{roastId}</span></span>
            <motion.button
              onClick={handleCopyRoast}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: roastCopied ? `rgba(${getPrimaryColorRGB()}, 0.15)` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${roastCopied ? primaryColor : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '3px', color: roastCopied ? primaryColor : '#71717a',
                padding: '4px 10px', fontSize: '0.58rem', fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '5px', letterSpacing: '0.5px', transition: 'all 0.2s'
              }}
            >
              {roastCopied ? <Check size={10} /> : <Copy size={10} />}
              {roastCopied ? 'Copied!' : 'Copy Roast'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* NEW SECTION: SWEAT DIAGNOSTICS & ARCHETYPE CLASSIFICATION */}
      <div 
        className="glass-panel sweat-diagnostics-panel asymmetric-offset-2" 
      >
        {/* Left Side: Archetype Classification */}
        <div className="archetype-classification-box">
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', display: 'block' }}>
            RESUME CLASSIFICATION
          </span>
          <div 
            style={{ 
              fontSize: '1.4rem', 
              fontWeight: 900, 
              color: archetype.color || '#fff', 
              textTransform: 'uppercase', 
              letterSpacing: '-0.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${archetype.color || 'rgba(255,255,255,0.1)'}`,
              borderRadius: '4px',
              padding: '10px 16px',
              width: 'fit-content',
              marginBottom: '16px',
              boxShadow: `0 0 15px rgba(255, 255, 255, 0.03)`
            }}
          >
            {archetype.badge}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#a1a1aa', lineHeight: 1.5, margin: 0 }}>
            {archetype.desc}
          </p>
        </div>

        {/* Right Side: Dynamic Sweat Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '4px', display: 'block' }}>
            DYNAMIC SWEAT DIAGNOSTICS
          </span>
          
          {/* Sweat Index */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>Sweat Index</span>
              <span style={{ color: '#f59e0b' }}>{sweatIndex}%</span>
            </div>
            <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${sweatIndex}%`, background: '#f59e0b', borderRadius: '3px' }} />
            </div>
            <span style={{ fontStyle: 'italic', color: '#8e8e9f', fontSize: '0.62rem', marginTop: '1px', lineHeight: '1.3' }}>
              {sweatIndexJustification}
            </span>
          </div>

          {/* LinkedIn Delusion Rating */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#a1a1aa', textTransform: 'uppercase' }}>LinkedIn Delusion Rating</span>
              <span 
                style={{ 
                  fontWeight: 'bold', 
                  color: linkedinDelusion === 'CRITICAL' ? '#ff0055' : linkedinDelusion === 'HIGH' ? '#ff6600' : '#0099ff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  border: `1px solid ${linkedinDelusion === 'CRITICAL' ? '#ff0055' : '#0099ff'}`,
                  borderRadius: '3px',
                  padding: '2px 6px',
                  background: 'rgba(255,255,255,0.02)'
                }}
              >
                {linkedinDelusion}
              </span>
            </div>
            <span style={{ fontStyle: 'italic', color: '#8e8e9f', fontSize: '0.62rem', marginTop: '1px', lineHeight: '1.3' }}>
              {linkedinDelusionJustification}
            </span>
          </div>

          {/* Tutorial Dependency */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>Tutorial Dependency</span>
              <span style={{ color: '#ff0055' }}>{tutorialDependency}%</span>
            </div>
            <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${tutorialDependency}%`, background: '#ff0055', borderRadius: '3px' }} />
            </div>
            <span style={{ fontStyle: 'italic', color: '#8e8e9f', fontSize: '0.62rem', marginTop: '1px', lineHeight: '1.3' }}>
              {tutorialDependencyJustification}
            </span>
          </div>

          {/* Production Exposure */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>Production Exposure</span>
              <span style={{ color: '#39ff14' }}>{productionExposure}%</span>
            </div>
            <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${productionExposure}%`, background: '#39ff14', borderRadius: '3px' }} />
            </div>
            <span style={{ fontStyle: 'italic', color: '#8e8e9f', fontSize: '0.62rem', marginTop: '1px', lineHeight: '1.3' }}>
              {productionExposureJustification}
            </span>
          </div>

          {/* Founder Hallucination Severity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#a1a1aa', textTransform: 'uppercase' }}>Founder Hallucination Severity</span>
              <span style={{ fontWeight: 'bold', color: '#ff6600', fontFamily: 'var(--font-mono)' }}>{founderHallucination}</span>
            </div>
            <span style={{ fontStyle: 'italic', color: '#8e8e9f', fontSize: '0.62rem', marginTop: '1px', lineHeight: '1.3' }}>
              {founderHallucinationJustification}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: TIMELINE LORE & ACHIEVEMENTS GRID (Screenshot 3) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '30px' }}>
        
        {/* Career Lore */}
        <div className="glass-panel asymmetric-offset-1" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: primaryColor, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={12} /> YOUR CAREER LORE
            </span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#52525b', textTransform: 'uppercase', letterSpacing: '1px' }}>
              // FICTIONAL - MOSTLY
            </span>
          </div>

          <p style={{ 
            fontSize: '1rem', 
            fontWeight: 500, 
            color: '#e4e4e7', 
            lineHeight: 1.7, 
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            marginTop: 'auto',
            marginBottom: 'auto'
          }}>
            {careerLore}
          </p>
        </div>

        {/* Achievements */}
        <div className="glass-panel asymmetric-offset-2" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: primaryColor, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={12} /> ACHIEVEMENTS UNLOCKED
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {achievements.map((ach, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid rgba(255,255,255,0.04)', 
                  borderRadius: '4px', 
                  padding: '14px 16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}
              >
                <div style={{ color: primaryColor, flexShrink: 0 }}>
                  <Trophy size={14} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', textTransform: 'capitalize', marginBottom: '2px' }}>
                    {ach.title}
                  </h4>
                  <p style={{ fontSize: '0.7rem', color: '#71717a', lineHeight: 1.3 }}>
                    {ach.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 3: BATTLE MODE (Screenshot 4) */}
      <div className="glass-panel asymmetric-offset-3" style={{ padding: '30px' }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: primaryColor, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={12} /> BATTLE MODE REWRITES
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {battleItems.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
              
              {/* Left: Original bullet */}
              <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.12)', borderRadius: '6px', padding: '18px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '-10px', left: '15px', background: '#ef4444', color: '#fff', fontSize: '0.55rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '3px' }}>
                  ORIGINAL TRASH
                </span>
                <p style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.5, marginTop: '4px' }}>
                  "{item.original}"
                </p>
              </div>

              {/* Arrow */}
              <div style={{ color: '#52525b', fontSize: '1.2rem', fontWeight: 'bold' }}>→</div>

              {/* Right: Improved bullet */}
              <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '6px', padding: '18px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '-10px', left: '15px', background: '#10b981', color: '#fff', fontSize: '0.55rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '3px' }}>
                  AI CHAD VERSION
                </span>
                <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, lineHeight: 1.5, marginTop: '4px', marginBottom: '8px' }}>
                  "{item.improved}"
                </p>
                <div style={{ fontSize: '0.7rem', color: '#71717a', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                  <span style={{ color: '#9d4edd', fontWeight: 'bold' }}>Why it's better:</span> {item.reason}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: RECOVERY PROTOCOLS (Screenshot 2) */}
      <div className="glass-panel asymmetric-offset-1" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: primaryColor, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={12} /> RECOVERY PROTOCOL
          </span>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#52525b', textTransform: 'uppercase', letterSpacing: '1px' }}>
            // ACTUALLY USEFUL
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {recoveryProtocols.map((rec, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: 'rgba(255,255,255,0.01)', 
                border: '1px solid rgba(255,255,255,0.04)', 
                borderRadius: '4px', 
                padding: '24px'
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: primaryColor, marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
                0{idx + 1}
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 400, color: '#c4c4cf', lineHeight: 1.7, fontFamily: 'Georgia, serif' }}>
                {rec}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 12 SELECTED EASTER EGGS PANEL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', margin: '40px 0' }} className="asymmetric-card-spacing">
        
        {/* Left: ATS Final Boss Minigame (Recruiter Horror, #10) */}
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🎮 MINI-GAME // ATS FINAL BOSS FIGHT
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                <span style={{ color: '#ef4444' }}>👹 ATS GRADER HP</span>
                <span>{bossHp}/100</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${bossHp}%`, height: '100%', background: '#ef4444', boxShadow: '0 0 8px #ef4444', transition: 'width 0.2s' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                <span style={{ color: '#38bdf8' }}>💻 CANDIDATE EGO HP</span>
                <span>{playerHp}/100</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${playerHp}%`, height: '100%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8', transition: 'width 0.2s' }} />
              </div>
            </div>

            {battleStatus === 'FIGHTING' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                <button 
                  onClick={() => handleBattleAction('metrics')}
                  style={{ background: 'transparent', border: '1px solid #10b981', color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', padding: '6px', cursor: 'pointer', borderRadius: '3px' }}
                >
                  🚀 Attack (Metrics)
                </button>
                <button 
                  onClick={() => handleBattleAction('bullet')}
                  style={{ background: 'transparent', border: '1px solid #eab308', color: '#eab308', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', padding: '6px', cursor: 'pointer', borderRadius: '3px' }}
                >
                  📝 Attack (Verbs)
                </button>
                <button 
                  onClick={() => handleBattleAction('localhost')}
                  style={{ background: 'transparent', border: '1px solid #a1a1aa', color: '#a1a1aa', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', padding: '6px', cursor: 'pointer', borderRadius: '3px', gridColumn: 'span 2' }}
                >
                  🌐 Attack (Localhost Link)
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', margin: '10px 0' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: battleStatus === 'WON' ? '#10b981' : '#ef4444' }}>
                  {battleStatus === 'WON' ? '🏆 BATTLE WON!' : '💀 EGO ANNIHILATED'}
                </span>
                <button 
                  onClick={() => { setBossHp(100); setPlayerHp(100); setBattleStatus("FIGHTING"); setBattleLog(["Grader re-summoned. Prepare to compile."]); }}
                  style={{ display: 'block', margin: '8px auto 0 auto', background: 'transparent', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', padding: '4px 10px', cursor: 'pointer', borderRadius: '3px' }}
                >
                  [ Revive & Restart Fight ]
                </button>
              </div>
            )}

            <div style={{ background: '#050508', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '4px', padding: '10px', height: '80px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {battleLog.map((log, idx) => (
                <div key={idx} style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: idx === 0 ? '#fff' : '#52525b', lineHeight: '1.3', textAlign: 'left' }}>
                  &gt; {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Startup Founder / Delusion clicker & triggers */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--theme-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              💸 STARTUP SEED SIMULATOR & OVERRIDES
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>VALUATION CALCULATOR (#20)</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#eab308' }}>Users: 0 → Valuation: $8.4B</div>
              </div>
              <button 
                onClick={handleSeedSim}
                style={{ background: '#eab308', border: 'none', color: '#000', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 'bold', padding: '6px 12px', borderRadius: '3px', cursor: 'pointer' }}
              >
                [ Raise Valuation ]
              </button>
            </div>
            
            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#a1a1aa', background: '#050508', padding: '8px', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '3px', minHeight: '36px', lineHeight: '1.4', textAlign: 'left' }}>
              💬 {seedHeadline}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
              <button 
                onClick={() => { setStealthMode(true); soundSynthesizer.playKeyClick(); }}
                style={{ background: 'transparent', border: '1px solid #ff6600', color: '#ff6600', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', padding: '8px', cursor: 'pointer', borderRadius: '3px' }}
                title="Blur everything out with a stealth founder lock overlay"
              >
                🕵️ Stealth Mode (#17)
              </button>

              <button 
                onClick={spawnXpDialog}
                style={{ background: 'transparent', border: '1px solid #0054e3', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', padding: '8px', cursor: 'pointer', borderRadius: '3px' }}
                title="Trigger cascaded classic Windows error dialog popups"
              >
                💥 Optimize Score (XP Error)
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Persistent Session / Telemetry Status (Touch Grass, #1) */}
      <div className="glass-panel" style={{ padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px' }}>
            🌾 touch grass protocol telemetry status
          </span>
          <p style={{ fontSize: '0.75rem', color: '#e4e4e7', fontFamily: 'var(--font-mono)', margin: 0 }}>
            Total user session duration: <span style={{ color: 'var(--theme-primary)', fontWeight: 'bold' }}>{touchGrassTimer}s</span>. Vegetation checked: <span style={{ color: touchGrassTimer >= 60 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{touchGrassTimer >= 60 ? 'LOCATED (Badge Unlocked)' : 'None found'}</span>.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px' }}>
            lifetime parsing index
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
            {parseCount} RESUMES DEVASTATED
          </span>
        </div>
      </div>

      {/* EXPOSING THE PARSER ENGINE - RAW DEBUG UTILITY (z2l9aa) */}
      <div className="raw-debug-panel asymmetric-offset-3">
        <div className="raw-debug-header">
          <span>⚙️ [EXPOSE_ENGINE_V5.0] // RAW PARSER OUTPUT LOGS</span>
          <span style={{ color: 'var(--theme-primary)' }}>ONLINE / DETERMINISTIC</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="raw-debug-log-line">
            <span className="raw-debug-log-prompt">seed:</span> {analysis.seed || "N/A"} (cyrb53)
          </div>
          <div className="raw-debug-log-line">
            <span className="raw-debug-log-prompt">archetype_detected:</span> {analysis.archetype?.badge || "N/A"}
          </div>
          <div className="raw-debug-log-line">
            <span className="raw-debug-log-prompt">contradiction_checks:</span> {
              analysis.contradictions && analysis.contradictions.length > 0 
                ? analysis.contradictions.map(c => `[CONFLICT: ${c.type}] "${c.phrase}"`).join(', ') 
                : "zero logical overrides triggered"
            }
          </div>
          <div className="raw-debug-log-line">
            <span className="raw-debug-log-prompt">detected_angles:</span> {
              analysis.detectedAngles && analysis.detectedAngles.length > 0 
                ? analysis.detectedAngles.join(', ') 
                : "none"
            }
          </div>
          <div className="raw-debug-log-line">
            <span className="raw-debug-log-prompt">skills_parsed:</span> {
              analysis.foundSkills && analysis.foundSkills.length > 0 
                ? analysis.foundSkills.join(', ') 
                : "none"
            }
          </div>
          <div className="raw-debug-log-line">
            <span className="raw-debug-log-prompt">tutorials_flagged:</span> {
              analysis.foundTutorials && analysis.foundTutorials.length > 0 
                ? analysis.foundTutorials.join(', ') 
                : "none"
            }
          </div>
          <div className="raw-debug-log-line">
            <span className="raw-debug-log-prompt">cringe_penalties:</span> +{analysis.redFlagsCount * 6} points to deludometer
          </div>
          <div className="raw-debug-log-line">
            <span className="raw-debug-log-prompt">burnout_log:</span> confidence.js loaded successfully. memory leak detected in sanity_buffer.
          </div>
        </div>
      </div>

      {/* SECTION 5: SHARE SURVIVOR CARD (Screenshot 4, bottom) */}
      <div style={{ alignSelf: 'center', width: '100%', maxWidth: '420px', marginTop: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            GENERATE SURVIVOR MEMENTO CARD
          </span>
        </div>
        <RoastCard 
          score={score} 
          generalRoast={verdictBody ? verdictBody.slice(0, 180) + '...' : verdictTitle.replace(/"/g, '')} 
          verdictTitle={verdictTitle}
          verdictFinalBlow={verdictFinalBlow}
          personality={personality} 
          seed={analysis.seed}
          candidateName={candidateName}
          archetype={archetype}
          sweatIndex={sweatIndex}
          linkedinDelusion={linkedinDelusion}
          tutorialDependency={tutorialDependency}
          productionExposure={productionExposure}
        />
      </div>

      {/* Draggable XP Error Dialogs (Internet Culture, #48) */}
      {xpDialogs.map((d, index) => (
        <div 
          key={d.id} 
          className="xp-dialog-window"
          style={{ 
            left: `${d.x + index * 15}px`, 
            top: `${d.y + index * 15}px`,
            zIndex: 10001 + index 
          }}
        >
          <div className="xp-dialog-header">
            <span className="xp-dialog-title">{d.title}</span>
            <button className="xp-dialog-close-btn" onClick={() => closeXpDialog(d.id)}>×</button>
          </div>
          <div className="xp-dialog-body">
            <div className="xp-dialog-icon">⚠️</div>
            <div className="xp-dialog-content">
              {d.text}
            </div>
          </div>
          <div className="xp-dialog-footer">
            <button className="xp-dialog-ok-btn" onClick={() => closeXpDialog(d.id)}>OK</button>
          </div>
        </div>
      ))}

      {/* Ghosted Badge Card (Recruiter Horror, #11) */}
      <div style={{
        margin: '30px auto 0 auto',
        padding: '12px',
        maxWidth: '300px',
        border: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(255,255,255,0.01)',
        borderRadius: '4px',
        fontSize: '0.65rem',
        fontFamily: 'var(--font-mono)',
        color: '#71717a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <span>👻 STATUS:</span>
        <span style={{ color: '#ef4444', fontWeight: 'bold', animation: 'pulseTyping 1.8s infinite' }}>
          "We'll get back to you."
        </span>
      </div>

    </div>
  );
}
