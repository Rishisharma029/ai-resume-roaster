import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Award, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { soundSynthesizer } from '../services/soundSynthesizer';
import RoastCard from './RoastCard';

export default function Dashboard({ analysis, resumeText, personality, onReset }) {
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

  return (
    <div style={{ zIndex: 10, position: 'relative', width: '100%', maxWidth: '1050px', margin: '0 auto', padding: '20px 20px 100px 20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Reset button at very top */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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

      {/* SECTION 1: OFFICIAL VERDICT CARD (Screenshot 1) */}
      <div 
        className="glass-panel" 
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

        {/* Body Paragraph — flowing prose, no format wrappers */}
        <p style={{ 
          fontSize: '1.05rem', 
          lineHeight: 1.9, 
          color: '#d4d4e0', 
          marginBottom: '35px',
          letterSpacing: '0.2px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 400
        }}>
          {verdictBody}
        </p>

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
        className="glass-panel sweat-diagnostics-panel" 
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
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
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
        <div className="glass-panel" style={{ padding: '30px' }}>
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
      <div className="glass-panel" style={{ padding: '30px' }}>
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
      <div className="glass-panel" style={{ padding: '30px' }}>
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

      {/* SECTION 5: SHARE SURVIVOR CARD (Screenshot 4, bottom) */}
      <div style={{ alignSelf: 'center', width: '100%', maxWidth: '420px', marginTop: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            GENERATE SURVIVOR MEMENTO CARD
          </span>
        </div>
        <RoastCard score={score} generalRoast={verdictTitle.replace(/"/g, '')} personality={personality} seed={analysis.seed} />
      </div>

    </div>
  );
}
