import React, { useRef, useState } from 'react';
import { Share2, Copy, Download, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { soundSynthesizer } from '../services/soundSynthesizer';

export default function RoastCard({ score, generalRoast, personality, seed }) {
  const cardRef = useRef(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyText = () => {
    soundSynthesizer.playKeyClick();
    const shareText = `My resume just got scorched by ${personality.name} on AI Resume Roaster!\nSurvival Score: ${score}%\nVerdict: "${generalRoast}"\nGet roasted at: http://localhost:5173`;
    navigator.clipboard.writeText(shareText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleDownloadImage = () => {
    if (!cardRef.current || isDownloading) return;
    soundSynthesizer.playBassDrop();
    setIsDownloading(true);

    // Minor timeout to ensure CSS finishes updates before rendering canvas
    setTimeout(() => {
      html2canvas(cardRef.current, {
        backgroundColor: '#07070a',
        scale: 2, // improve resolution
        logging: false,
        useCORS: true
      }).then((canvas) => {
        const link = document.createElement('a');
        link.download = `resume_roast_score_${score}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setIsDownloading(false);
        soundSynthesizer.playUnlock(); // chime feedback
      }).catch((err) => {
        console.error("Canvas capture error:", err);
        setIsDownloading(false);
      });
    }, 100);
  };

  const getBorderColor = (id) => {
    if (id === 'staff_engineer') return '#ff0055';
    if (id === 'exhausted_recruiter') return '#0099ff';
    if (id === 'startup_cto') return '#ff6600';
    if (id === 'faang_gatekeeper') return '#ffd700';
    if (id === 'devops_veteran') return '#39ff14';
    if (id === 'rust_elitist') return '#a239ca';
    if (id === 'oss_maintainer') return '#14b8a6';
    return '#a8a29e';
  };

  const getBadgeColor = (val) => {
    if (val < 20) return "#ef4444";
    if (val < 40) return "#f97316";
    if (val < 60) return "#eab308";
    if (val < 80) return "#3b82f6";
    return "#10b981";
  };

  const borderColor = getBorderColor(personality.id);
  const colorHex = getBadgeColor(score);
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      
      {/* Visual download wrapper */}
      <div 
        ref={cardRef}
        id="roast-card-download"
        className="glass-panel"
        style={{
          padding: '30px',
          background: '#0a0a0f',
          border: `2px solid ${borderColor}`,
          borderRadius: '12px',
          boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${colorHex}22`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        {/* Subtle grid accent inside download */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          pointerEvents: 'none'
        }} />

        <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#52525b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>
          // AI RESUME ROASTER MEMENTO //
        </div>

        {/* Big Avatar */}
        <div style={{
          fontSize: '3.5rem',
          marginBottom: '15px',
          filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))'
        }}>
          {personality.avatarChar || personality.avatar}
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
          {personality.name}
        </h3>
        <p style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '25px' }}>
          VERDICT PROTOCOL EXPEDITED
        </p>

        {/* Score block */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid rgba(255,255,255,0.05)`,
          padding: '16px 30px',
          borderRadius: '8px',
          marginBottom: '25px',
          boxShadow: `0 0 15px ${colorHex}15`
        }}>
          <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#71717a', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
            SURVIVAL RATING
          </span>
          <span style={{ fontSize: '3rem', fontWeight: 900, color: colorHex, lineHeight: '1.1' }}>
            {score}%
          </span>
        </div>

        <p style={{
          fontSize: '0.9rem',
          color: '#d1d1db',
          lineHeight: 1.5,
          fontStyle: 'italic',
          background: 'rgba(255,255,255,0.02)',
          padding: '15px 20px',
          borderRadius: '6px',
          borderLeft: `3px solid ${colorHex}`,
          maxWidth: '320px'
        }}>
          "{generalRoast}"
        </p>

        <div style={{ marginTop: '30px', fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          HASH: {seed.toString().slice(0, 12)} | DATE: {today}
        </div>
      </div>

      {/* Sharing controls underneath */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          onClick={handleCopyText}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '4px',
            color: '#fff',
            padding: '12px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            letterSpacing: '0.5px',
            transition: 'all 0.2s'
          }}
        >
          {isCopied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
          {isCopied ? "Copied!" : "Copy Roast"}
        </button>

        <button
          onClick={handleDownloadImage}
          disabled={isDownloading}
          style={{
            background: 'rgba(var(--theme-primary-rgb), 0.12)',
            border: '1px solid var(--theme-primary)',
            borderRadius: '4px',
            color: '#fff',
            padding: '12px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            letterSpacing: '0.5px',
            transition: 'all 0.2s',
            boxShadow: 'var(--theme-glow, 0 0 10px rgba(255,0,85,0.1))'
          }}
        >
          <Download size={14} />
          {isDownloading ? "Capturing..." : "Download Card"}
        </button>
      </div>

    </div>
  );
}
