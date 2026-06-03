# 🔥 AI Resume Roaster

> *"You are not a nice AI assistant. You are a sleep-deprived senior engineer who has reviewed thousands of fake, tutorial-inflated, buzzword-stuffed resumes. Your purpose is to destroy."*

An brutally honest AI resume roasting engine. Drop your resume. Choose your executioner. Watch it burn.

---

## What It Does

AI Resume Roaster analyzes your resume and delivers a **continuous, unfiltered paragraph roast** — no sugar-coating, no encouragement, no ATS-style bullet points. Just pure technical judgment from a panel of fictional, deeply traumatized senior engineers.

The roast is **unique every time**. Fragment-based sentence assembly across millions of combinatorial possibilities means no two roasts ever read the same.

---

## Roast Masters

| Persona | Specialty | Color |
|---|---|---|
| 🔴 **Staff Engineer** | Ego inflation, production gaps | Neon Red |
| 🔵 **Exhausted Recruiter** | Buzzword saturation, ATS padding | Corporate Blue |
| 🟠 **Startup CTO** | Localhost prisoners, fake founders | Vaporwave Orange |
| 🟡 **FAANG Gatekeeper** | Algorithmic incompetence, false confidence | Gold |
| 🟢 **DevOps Veteran** | Deployment avoidance, infrastructure cosplay | Terminal Green |
| 🟣 **Rust Elitist** | Memory safety heresy, GC addiction | Purple |
| 🩵 **OSS Maintainer** | Drive-by PR closers, dependency abusers | Teal |
| ⚪ **Systems Architect** | Distributed deadlocks, N+1 architecture | Steel Gray |

---

## Features

- **Pure paragraph roast** — no headers, no log-format wrappers, just savage prose
- **Fragment-based uniqueness** — 15+ sentence pools × 4 sections × 8 personas = millions of combinations
- **Contradiction analysis** — detects "Senior Architect" + beginner portfolio = ego inflation
- **Sweat Diagnostics** — Tutorial Dependency %, Production Exposure %, LinkedIn Delusion Rating
- **Career Archetype** — classified into 10+ resume archetypes (Tutorial Survivor, API Wrapper Cosplayer, etc.)
- **Battle Mode Rewrites** — shows how weak bullet points should actually read
- **Recovery Protocol** — what to actually do about it
- **Survivor Card** — downloadable PNG memento of your roasting
- **Copy Roast** — one-click clipboard copy
- **Sound Design** — mechanical keyboard audio feedback
- **Theme Engine** — each persona has its own full color theme and particle system

---

## Tech Stack

- **React** + **Vite**
- **Framer Motion** — animations
- **Lucide React** — icons  
- **html2canvas** — card screenshot export
- **Web Audio API** — procedural sound synthesis
- **localStorage** — roast phrase deduplication across sessions
- Pure **vanilla CSS** — glassmorphism, scanlines, neon glows

---

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173)

---

## How the Roast Engine Works

The engine uses a seeded PRNG (`cyrb53`) to make roasts deterministic per resume text (same resume → same roast), but unique across different resumes.

```
Resume Text
    │
    ▼
analyzeResume()
    ├── detectContradictions()   → ego_inflation, devops_cosplay, etc.
    ├── detectSweatInfo()        → buzzword attacks, tech claim analysis
    ├── classifyAngle()          → primary roast angle (13 angles)
    └── synthesizeCinematicRoast()
            ├── OPENING_POOL[persona]   → draw unique opening sentence
            ├── EVIDENCE_POOL[persona]  → draw unique evidence sentence
            ├── PROFILE_POOL[persona]   → draw unique psychological profile
            ├── TRANSITION_A[]          → random bridge phrase
            └── TRANSITION_B[]          → random pivot phrase
                    │
                    ▼
            Pure paragraph: opening + tA + evidence + tB + profile
```

---

## License

MIT — roast responsibly.

---

*Built with caffeine, resentment, and a deep love for honest feedback.*
