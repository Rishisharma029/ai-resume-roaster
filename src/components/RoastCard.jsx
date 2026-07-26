import React, { useRef, useState } from 'react';
import { Share2, Copy, Download, Check, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { soundSynthesizer } from '../services/soundSynthesizer';

const XIcon = ({ size = 15, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = ({ size = 15, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.4 1.4 0 1 0 1.4 1.4 1.4 1.4 0 0 0-1.4-1.4z"/>
  </svg>
);

export default function RoastCard({
  score,
  generalRoast,
  verdictTitle,
  verdictFinalBlow,
  personality,
  seed,
  candidateName = "Candidate",
  archetype = { badge: "📦 TUTORIAL MERCHANT", desc: "Tutorial survivor", color: "#f59e0b" },
  sweatIndex = 50,
  linkedinDelusion = "HIGH",
  tutorialDependency = 40,
  productionExposure = 30
}) {
  const cardRef = useRef(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const displayTitle = verdictTitle || generalRoast || "RESUME SCORCHED";
  const displayBody = generalRoast || verdictFinalBlow || "No survival evidence found.";
  const displayFinal = verdictFinalBlow || "Return after touching production.";

  const shareText = `🔥 My resume just got scorched by ${personality?.name || 'AI Roaster'} on AI Resume Roaster!\n\n🎯 Survival Rating: ${score}%\n👑 Rank: ${archetype?.badge || 'CANDIDATE'}\n⚡ Verdict: "${displayTitle}"\n\nGet your resume roasted live: ${window.location.origin}${window.location.pathname} #DevHumor #AIResumeRoaster #CodeRoast`;

  const handleCopyText = () => {
    soundSynthesizer.playKeyClick();
    navigator.clipboard.writeText(shareText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleShareTwitter = () => {
    soundSynthesizer.playKeyClick();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    soundSynthesizer.playKeyClick();
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadImage = () => {
    if (!cardRef.current || isDownloading) return;
    soundSynthesizer.playBassDrop();
    setIsDownloading(true);

    setTimeout(() => {
      html2canvas(cardRef.current, {
        backgroundColor: '#07070a',
        scale: 2,
        logging: false,
        useCORS: true
      }).then((canvas) => {
        const link = document.createElement('a');
        const safeName = (candidateName || 'candidate').toLowerCase().replace(/[^a-z0-9]/g, '_');
        link.download = `resume_roast_${safeName}_${score}pct.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setIsDownloading(false);
        soundSynthesizer.playUnlock();
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

  const borderColor = getBorderColor(personality?.id);
  const colorHex = getBadgeColor(score);
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '460px', margin: '0 auto' }}>
      
      {/* Visual download wrapper */}
      <div 
        ref={cardRef}
        id="roast-card-download"
        className="glass-panel"
        style={{
          padding: '28px 24px',
          background: 'linear-gradient(180deg, #0d0d14 0%, #060609 100%)',
          border: `2px solid ${borderColor}`,
          borderRadius: '16px',
          boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 30px ${colorHex}25`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        {/* Subtle background tech grid */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none'
        }} />

        {/* Top Header Badge */}
        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '20px',
          background: 'rgba(255,0,85,0.1)',
          border: '1px solid rgba(255,0,85,0.3)',
          fontSize: '0.6rem', 
          fontFamily: 'var(--font-mono)', 
          color: '#ff0055', 
          textTransform: 'uppercase', 
          letterSpacing: '1.5px', 
          marginBottom: '16px' 
        }}>
          <Sparkles size={12} /> OFFICIAL RESUME ROAST CERTIFICATE
        </div>

        {/* Personality Avatar & Name */}
        <div style={{
          fontSize: '3.2rem',
          marginBottom: '10px',
          filter: `drop-shadow(0 0 15px ${borderColor}55)`
        }}>
          {personality?.avatarChar || personality?.avatar || "🔥"}
        </div>

        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '2px', letterSpacing: '-0.5px' }}>
          {personality?.name || "AI Resume Evaluator"}
        </h3>
        
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          color: archetype?.color || '#eab308',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${archetype?.color || 'rgba(255,255,255,0.1)'}`,
          padding: '4px 12px',
          borderRadius: '6px',
          margin: '8px 0 20px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {archetype?.badge || "📦 CANDIDATE ARCHETYPE"}
        </div>

        {/* Score block */}
        <div style={{
          background: 'rgba(0,0,0,0.5)',
          border: `1px solid ${colorHex}44`,
          padding: '16px 36px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: `0 0 20px ${colorHex}20`,
          width: '100%',
          maxWidth: '280px'
        }}>
          <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#a1a1aa', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
            SURVIVAL RATING
          </span>
          <span style={{ fontSize: '3.2rem', fontWeight: 900, color: colorHex, lineHeight: '1.05' }}>
            {score}%
          </span>
        </div>

        {/* Verdict Headline & Roast Quote */}
        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid rgba(255,255,255,0.06)`,
          borderLeft: `4px solid ${colorHex}`,
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '18px',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: colorHex, textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
            💥 {displayTitle}
          </div>
          <p style={{
            fontSize: '0.82rem',
            color: '#e4e4e7',
            lineHeight: 1.45,
            margin: 0,
            fontStyle: 'italic'
          }}>
            "{displayBody}"
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          width: '100%',
          marginBottom: '20px',
          background: 'rgba(0,0,0,0.3)',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.04)'
        }}>
          <div>
            <div style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>SWEAT INDEX</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>{sweatIndex}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>DELUSION</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: linkedinDelusion === 'CRITICAL' ? '#ff0055' : '#0099ff', fontFamily: 'var(--font-mono)' }}>{linkedinDelusion}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>PROD EXPOSURE</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#39ff14', fontFamily: 'var(--font-mono)' }}>{productionExposure}%</div>
          </div>
        </div>

        {/* Footer Hash & Branding */}
        <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          APPLICANT: {candidateName.toUpperCase()} | HASH: {seed?.toString().slice(0, 10) || "SEED_RNG"} | {today}
        </div>
      </div>

      {/* Social Share & Download Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Twitter / X Share Button */}
          <button
            onClick={handleShareTwitter}
            style={{
              background: '#000',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              padding: '12px 14px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
            }}
          >
            <XIcon size={15} style={{ color: '#1da1f2' }} /> Share on X
          </button>

          {/* LinkedIn Share Button */}
          <button
            onClick={handleShareLinkedIn}
            style={{
              background: '#0077b5',
              border: '1px solid #005582',
              borderRadius: '8px',
              color: '#fff',
              padding: '12px 14px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,119,181,0.3)'
            }}
          >
            <LinkedInIcon size={15} /> Post LinkedIn
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Download PNG Image */}
          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            style={{
              background: 'rgba(var(--theme-primary-rgb), 0.15)',
              border: '1px solid var(--theme-primary)',
              borderRadius: '8px',
              color: '#fff',
              padding: '12px 14px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
              boxShadow: 'var(--theme-glow, 0 0 12px rgba(255,0,85,0.2))'
            }}
          >
            <Download size={15} />
            {isDownloading ? "Generating..." : "Download Card"}
          </button>

          {/* Copy Text Caption */}
          <button
            onClick={handleCopyText}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              color: '#fff',
              padding: '12px 14px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
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
            {isCopied ? <Check size={15} style={{ color: '#10b981' }} /> : <Copy size={15} />}
            {isCopied ? "Caption Copied!" : "Copy Caption"}
          </button>
        </div>
      </div>

    </div>
  );
}

