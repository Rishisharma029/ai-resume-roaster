import React, { useState, useRef } from 'react';
import { Upload, FileText, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundSynthesizer } from '../services/soundSynthesizer';

const PRESETS = [
  {
    key: "tutorial",
    title: "Tutorial Survivor",
    text: `React Frontend Engineer - Passionate Learner

Skills: HTML, CSS, JavaScript, React, Next.js, Redux, TailwindCSS, Bootstrap, Node.js, Express, MongoDB

Projects:
- Todo List App: Built a state-of-the-art Todo application in React with local storage.
- Calculator App: Designed and coded a calculator in HTML, CSS, and JS.
- Weather App: Integrated OpenWeather API to display current temperature.

Experience:
- Tutorial completion specialist.
- Followed 14 YouTube build-along courses. Created identical repos.`
  },
  {
    key: "ai_engineer",
    title: "Fake AI Engineer",
    text: `AI/ML Research Consultant

Skills: Artificial Intelligence, Deep Learning, Large Language Models (LLM), ChatGPT Prompting, Python, LangChain, Machine Learning

Projects:
- AI Chatbot: Created a UI that takes user inputs and calls the OpenAI ChatGPT API.
- Prompt Template Engine: Designed optimized prompt instructions for better translation responses.

Experience:
- Artificial Intelligence Architect.
- Integrated standard chat wrapper libraries for local small businesses.
- Claims Machine Learning expertise without knowing linear regression formulas.`
  },
  {
    key: "influencer",
    title: "LinkedIn Influencer",
    text: `Visionary Thought Leader & Tech Evangelist

Skills: Strategic Leadership, Corporate Synergy, Thought Leadership, Cross-functional Collaboration, Agile Execution, Paradigm Shifting

Experience:
- Tech Evangelist: Coordinated high-impact brainstorming sessions to leverage cutting-edge resources.
- Growth Ninja: Streamlined communications between stakeholders to maximize scalable deliverables.
- Managed zero developers but posted daily about team leadership.`
  },
  {
    key: "startup_bro",
    title: "Startup Bro",
    text: `Growth Hacker & Zero-to-One Founder

Skills: MVP Shipping, Cap Table Management, VC Pitching, Growth Hacking, Hyper-Growth, Disruption

Projects:
- Failed Web3 Startup: Scaled product pitch to 4 VCs. Shipped demo in 2 days.

Experience:
- Move Fast and Break Things Lead: Disrupted local coffee shops with custom QR code generator.
- Hustle Champion: Drank 12 cups of coffee per day while waiting for seed round funding.`
  },
  {
    key: "skilled",
    title: "Skilled Developer",
    text: `Senior Systems Engineer
GitHub: https://github.com/realdev-elite
Portfolio: https://realdev-portfolio.vercel.app

Skills: Golang, Rust, Kubernetes, Docker, AWS, Terraform, PostgreSQL, Redis, gRPC, CI/CD, Git

Projects:
- Custom Cache Engine: Wrote a distributed, thread-safe memory store in Go handling 120,000 requests/sec.
- Infrastructure Automation: Provisioned multi-region AWS environments using Terraform and managed via Kubernetes.

Experience:
- Platform Engineer: Optimized core database query latencies, reducing API response times by 42% (saving $12K/month in hosting costs).`
  }
];

export default function Uploader({ onAnalyze }) {
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef(null);

  const handlePresetSelect = (presetText) => {
    soundSynthesizer.playKeyClick();
    setText(presetText);
    setShowPresets(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    soundSynthesizer.playKeyClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      setText(event.target.result || '');
    };
    reader.readAsText(file);
  };

  const triggerFileBrowser = () => {
    soundSynthesizer.playKeyClick();
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (text.trim().length < 20) return;
    onAnalyze(text);
  };

  return (
    <div style={{ width: '100%' }}>
      
      {/* Top Header Row with LOAD SAMPLE RESUME */}
      <div className="submit-header-row">
        <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#52525b', textTransform: 'uppercase', letterSpacing: '1px' }}>
          STEP 02 / SUBMIT YOURSELF
        </span>

        {/* Preset Selector Dropdown */}
        <div className="presets-dropdown-container">
          <button 
            className="load-preset-btn"
            onClick={() => {
              soundSynthesizer.playHover();
              setShowPresets(!showPresets);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            LOAD SAMPLE RESUME <ChevronDown size={12} />
          </button>
          
          <AnimatePresence>
            {showPresets && (
              <motion.ul 
                className="presets-list"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                {PRESETS.map((p) => (
                  <li 
                    key={p.key} 
                    className="preset-dropdown-item"
                    onClick={() => handlePresetSelect(p.text)}
                  >
                    {p.title}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Two-Column Box */}
      <div className="submit-container">
        
        {/* Left Column: Drag and Drop */}
        <div 
          className={`dropzone-box ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileBrowser}
        >
          <Upload className="dropzone-icon" />
          <h3 className="dropzone-title">drop resume here</h3>
          <p className="dropzone-subtitle">PDF · DOCX · TXT · max 8MB</p>
          <span className="dropzone-footer">or click to browse</span>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".txt,.doc,.docx,.pdf"
            style={{ display: 'none' }} 
          />
        </div>

        {/* Right Column: Textarea Paste */}
        <div className="text-input-box">
          <div className="text-input-header">
            <span>RESUME.TXT — OR PASTE BELOW</span>
            <span>{text.length} chars</span>
          </div>

          <textarea
            className="textarea-field"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              // Play mechanical click occasionally
              if (e.target.value.length % 6 === 0) {
                soundSynthesizer.playKeyClick();
              }
            }}
            placeholder={`Paste your resume here...\n\nThe AI will judge every line. Every typo. Every buzzword. Every gap.\n\nMinimum 20 characters.`}
          />
        </div>

      </div>

      {/* Bottom Footer Row */}
      <div className="submit-footer-row">
        <span className="damage-warning">
          BY HITTING ROAST, YOU ACCEPT EMOTIONAL DAMAGE
        </span>

        <button 
          className="ignite-btn"
          disabled={text.trim().length < 20}
          onClick={handleSubmit}
        >
          → IGNITE THE ROAST
        </button>
      </div>

    </div>
  );
}
