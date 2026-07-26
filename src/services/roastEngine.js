// ============================================================
//  AI RESUME ROASTER — DYNAMIC ROAST ENGINE v3.0
//  Fragment-based sentence assembly ensures every roast is
//  statistically unique. Pools are large enough that even
//  the same persona roasting the same resume twice produces
//  a different paragraph.
// ============================================================

import { formatsData } from './formats/index.js';

// ─── Deterministic seeded PRNG (MurmurHash-inspired) ────────
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function createRandom(seed) {
  let s = seed;
  return function () {
    let t = s += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Static detection lists ──────────────────────────────────
const BUZZWORDS = [
  'synergy','cross-functional','stakeholder','paradigm','cutting-edge',
  'disruptive','leverage','innovative','self-starter','rockstar','ninja',
  'passionate','results-driven','proven track record','optimization enthusiast',
  'thought leader','world-class','game-changer','outside the box','streamline'
];

const TUTORIAL_PROJECTS = [
  'todo list','todoapp','calculator','weather app','weatherapp',
  'chat app','chatapp','clone','tic-tac-toe','tictactoe','notes app',
  'blog website','personal website','movie database'
];

const KNOWN_SKILLS = [
  'react','node.js','python','machine learning','deep learning',
  'kubernetes','docker','aws','rust','golang','java','sql','typescript',
  'blockchain','ethereum','solidity'
];

const METRICS_REGEX = /\b(\d+%\s*|\d+\s*ms|\d+\s*x|\$\d+|\d+\s*users|\d+\s*GB)/gi;
const LINK_REGEX   = /(https?:\/\/[^\s]+|github\.com|linkedin\.com|vercel\.app|netlify\.app)/gi;

const CRINGE_PATTERNS = [
  {
    regex: /passionate\s+(learner|developer|coder|engineer|builder|professional)/gi,
    roast: "Wrote 'passionate learner' with the confidence of someone who just discovered Flexbox yesterday. Translation: You watch YouTube tutorials at 1.5x speed and expect a salary for copy-pasting code.",
    phrase: "passionate learner/developer", type: "LinkedIn Cliché"
  },
  {
    regex: /(highly\s+motivated|self-motivated|hardworking|hard-working|results-driven|results\s+driven)\s+(individual|developer|engineer|professional)/gi,
    roast: "Wrote 'results-driven individual' with the confidence of someone who just discovered Flexbox yesterday. The only result driven here was the webpack build error count.",
    phrase: "highly motivated/results-driven individual", type: "LinkedIn Cliché"
  },
  {
    regex: /team\s+player/gi,
    roast: "Claims to be a 'team player'—meaning you approved PRs with LGTM without actually reading the code changes.",
    phrase: "team player", type: "Corporate Cliché"
  },
  {
    regex: /(visionary|innovator|future\s+ceo|co-founder|founder)/gi,
    roast: "Declared yourself a 'visionary' or 'founder' because you and a buddy spent a weekend writing a Figma mockup that never saw a single user.",
    phrase: "visionary/founder", type: "Startup Fantasy Syndrome"
  },
  {
    regex: /(seeking|looking\s+for)\s+(a\s+challenging|an\s+opportunity\s+to\s+grow)/gi,
    roast: "Looking for 'an opportunity to grow'—meaning you want senior developers to hold your hand through basic git merge conflicts.",
    phrase: "seeking a challenging role/opportunity to grow", type: "LinkedIn Cliché"
  },
  {
    regex: /quick\s+learner/gi,
    roast: "Listed 'quick learner' because your actual project section is too thin to stand on its own.",
    phrase: "quick learner", type: "LinkedIn Cliché"
  },
  {
    regex: /(proven\s+track\s+record|world-class|disruptive|game-changer|thought\s+leader)/gi,
    roast: "Claimed a 'proven track record' or being a 'game-changer'. This entire summary sounds like LinkedIn autocomplete gained consciousness.",
    phrase: "proven track record/game-changer", type: "Corporate Jargon"
  },
  {
    regex: /synerg(y|ize)|cross-functional|stakeholder|paradigm|leverage|streamline/gi,
    roast: "Loaded the resume with corporate buzzwords like 'synergy' and 'cross-functional'. I can hear recruiters entering fight-or-flight mode from the sheer fluff density.",
    phrase: "corporate jargon", type: "Corporate Jargon"
  },
  {
    regex: /(expert\s+in|master\s+of|extensively\s+worked\s+on)/gi,
    roast: "Used 'expert in' or 'master of' for technologies you've only used in tutorial sandbox projects.",
    phrase: "inflated expertise claims", type: "Unwarranted Confidence"
  }
];

// ─── Name extractor ──────────────────────────────────────────
function extractName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return 'Future CEO';
  const titleBlacklist = /skills|experience|projects|education|contact|github|linkedin|phone|email|portfolio|resume|cv|curriculum/i;
  const titleKeywords  = /engineer|developer|architect|consultant|lead|specialist|visionary|manager|intern|student|analyst|evangelist/i;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (/@|http|github\.com|linkedin\.com|\+?\d[\d\-\s()]{7,}/i.test(line)) continue;
    if (titleBlacklist.test(line) || titleKeywords.test(line) || line.includes(':') || line.includes('|') || line.startsWith('-')) continue;
    const words = line.split(/\s+/).filter(w => /^[a-zA-Z]+$/.test(w));
    if (words.length >= 1 && words.length <= 4) {
      return words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }
  return 'Future CEO';
}

// ─── Experience extractor ────────────────────────────────────
function extractExperienceAction(text, rand) {
  const actions = [];
  const lines = text.split('\n');
  const keywords = ['assisted','responsible','helped','worked','managed','developed','created','built','led'];
  lines.forEach(l => {
    const lower = l.toLowerCase();
    keywords.forEach(kw => {
      if (lower.includes(kw)) {
        const cleaned = l.replace(/[^\w\s\-\']/g, '').trim();
        if (cleaned.length > 15 && cleaned.length < 80) actions.push(cleaned);
      }
    });
  });
  if (actions.length > 0) return actions[Math.floor(rand() * actions.length)];
  const defaultActions = [
    "assisted senior platform systems in daily updates",
    "responsible for coding interface assets",
    "worked with teams to debug backend errors",
    "helped configure server directories"
  ];
  return defaultActions[Math.floor(rand() * defaultActions.length)];
}

// ─── Sweatiness & Tech-bluff analysis ───────────────────────
function analyzeSweatinessAndTech(resumeText) {
  const text = resumeText.toLowerCase();
  const detectedCringe = [];
  let scorePenalty = 0;
  CRINGE_PATTERNS.forEach(item => {
    item.regex.lastIndex = 0;
    if (item.regex.test(text)) { detectedCringe.push(item); scorePenalty += 6; }
  });
  const techAttacks = [];
  if (text.includes('docker') && !(/ci\/cd|pipeline|actions|jenkins|gitlab|circleci|workflow|deploy/i.test(text))) {
    techAttacks.push({ phrase: "Docker listed. No deployment pipeline found.", type: "docker_mismatch" }); scorePenalty += 5;
  }
  if (text.includes('kubernetes') && !(/prometheus|grafana|scale|downtime|helm|incident|production/i.test(text))) {
    techAttacks.push({ phrase: "Kubernetes detected. Production trauma absent.", type: "kubernetes_mismatch" }); scorePenalty += 8;
  }
  if ((text.includes('devops') || text.includes('ci/cd')) && !(/actions|gitlab|jenkins|travis|github actions/i.test(text))) {
    techAttacks.push({ phrase: "Claims DevOps. GitHub Actions nowhere in sight.", type: "devops_mismatch" }); scorePenalty += 6;
  }
  if ((text.includes('machine learning') || text.includes(' ml ') || text.includes('ai ') || text.includes('deep learning')) && !(/dataset|pandas|numpy|epoch|weights|training|pytorch|tensorflow/i.test(text))) {
    techAttacks.push({ phrase: "Machine learning skills detected. Dataset handling not detected.", type: "ml_mismatch" }); scorePenalty += 8;
  }
  if ((text.includes('rust') || text.includes('golang') || text.includes('go ')) && !(/concurrency|goroutine|channel|unsafe|pointer|mutex|async|threading/i.test(text))) {
    techAttacks.push({ phrase: "Rust/Go systems claims. System programming scars absent.", type: "rust_go_mismatch" }); scorePenalty += 5;
  }
  if ((text.includes('sql') || text.includes('postgres') || text.includes('database')) && !(/index|optimization|sharding|explain|query|performance/i.test(text))) {
    techAttacks.push({ phrase: "Claims database expertise. Query optimization scars absent.", type: "sql_mismatch" }); scorePenalty += 5;
  }
  if ((text.includes('aws') || text.includes('cloud') || text.includes('gcp') || text.includes('azure')) && !(/billing|budget|iam|terraform|s3|security/i.test(text))) {
    techAttacks.push({ phrase: "AWS/Cloud listed. Billing alert configuration and production budget trauma absent.", type: "cloud_mismatch" }); scorePenalty += 5;
  }
  const baseSweatiness = Math.min(20 + detectedCringe.length * 15 + techAttacks.length * 12, 100);
  let tryHardVibe = "CHILL DEVELOPER VIBES";
  if (baseSweatiness >= 80) tryHardVibe = "LINKEDIN AUTOCOMPLETE GAINED CONSCIOUSNESS";
  else if (baseSweatiness >= 65) tryHardVibe = "SWEATING HARDER THAN A JUNIOR FORCE-PUSHING TO MAIN";
  else if (baseSweatiness >= 45) tryHardVibe = "HACKATHON MVP WITH ZERO DEPLOYMENTS";
  else if (baseSweatiness >= 30) tryHardVibe = "OVER-RENDERED DECORATIVE COG";
  return { detectedCringe, techAttacks, sweatinessLevel: baseSweatiness, tryHardVibe, scorePenalty };
}

// ─── Archetype classifier ────────────────────────────────────
function classifyArchetype(text, stats) {
  const lower = text.toLowerCase();
  const scores = { web3: 0, ai_wrapper: 0, startup: 0, k8s_cosplay: 0, clone: 0, tutorial: 0, linkedin: 0, maxxer: 0 };
  if (/blockchain|crypto|web3|solidity|ethereum|smart contract|nft/i.test(lower)) scores.web3 += 15;
  if (/ai|ml|machine learning|deep learning|neural|openai|chatgpt|llm|langchain|prompt/i.test(lower)) scores.ai_wrapper += 15;
  if (/founder|ceo|co-founder|pitch deck|runway|equity|funding|hustle/i.test(lower)) scores.startup += 15;
  if (/kubernetes|k8s|docker|devops|ci\/cd|pipeline/i.test(lower)) { scores.k8s_cosplay += 12; if (stats.productionExposure < 40) scores.k8s_cosplay += 8; }
  if (/clone|netflix|spotify|whatsapp|instagram|amazon/i.test(lower)) scores.clone += 15;
  if (stats.tutorialCount > 0) scores.tutorial += stats.tutorialCount * 8;
  if (stats.buzzwordCount > 4 || /synergy|cross-functional|stakeholder|paradigm/i.test(lower)) scores.linkedin += 12;
  const skillsList = lower.split(/skills|languages|technologies/i)[1] || "";
  if ((skillsList.match(/,/g) || []).length > 10) scores.maxxer += 15;
  let maxArchetype = 'Resume Maxxer', maxScore = -1;
  for (const [key, value] of Object.entries(scores)) {
    if (value > maxScore) {
      maxScore = value;
      if (key === 'web3') maxArchetype = 'Web3 Disciple';
      else if (key === 'ai_wrapper') maxArchetype = 'AI Wrapper Merchant';
      else if (key === 'startup') maxArchetype = 'Startup Hallucinator';
      else if (key === 'k8s_cosplay') maxArchetype = 'Kubernetes Cosplayer';
      else if (key === 'clone') maxArchetype = 'Clone App Collector';
      else if (key === 'tutorial') maxArchetype = 'Tutorial Warrior';
      else if (key === 'linkedin') maxArchetype = 'LinkedIn Prophet';
      else maxArchetype = 'Resume Maxxer';
    }
  }
  const configs = {
    'Tutorial Warrior': { badge: "🎓 TUTORIAL WARRIOR", desc: "Has completed 47 tutorial code-alongs on 1.5x speed. Localhost is crowded with calculators and clones. Production is a scary place you actively avoid.", color: "#ff0055" },
    'LinkedIn Prophet': { badge: "🧙‍♂️ LINKEDIN PROPHET", desc: "Evangelizes cross-functional synergy and paradigm shifting. Writes resume bullets in pure autocomplete corporate jargon. Recruiters enter fight-or-flight mode instantly.", color: "#0099ff" },
    'Web3 Disciple': { badge: "🪙 WEB3 DISCIPLE", desc: "Lists Ethereum and smart contracts but has zero gas fees on their balance sheet. Believes standard databases are a centralized conspiracy.", color: "#ff6600" },
    'Kubernetes Cosplayer': { badge: "📦 KUBERNETES COSPLAYER", desc: "Claims DevOps and container orchestration. Docker containers exist only to host basic static sites. Production trauma is completely absent.", color: "#39ff14" },
    'Resume Maxxer': { badge: "📊 RESUME MAXXER", desc: "Lists 42 distinct programming languages to appease the ATS checker bots. Knows the syntax for printing 'Hello World' in 15 of them.", color: "#ffd700" },
    'Startup Hallucinator': { badge: "🦄 STARTUP HALLUCINATOR", desc: "Calls themselves a CEO/Co-Founder because they spent a weekend editing a Figma file. Burn runway and VC pitch decks are their favorite campfire stories.", color: "#a239ca" },
    'Clone App Collector': { badge: "📑 CLONE APP COLLECTOR", desc: "Github profile is a museum of cloned tech giants (Netflix clone, Amazon clone). Originality coefficient is statistically indistinguishable from zero.", color: "#14b8a6" },
    'AI Wrapper Merchant': { badge: "🤖 AI WRAPPER MERCHANT", desc: "Declares machine learning expertise but calls standard OpenAI endpoints. Importing langchain does not make you a neural scientist.", color: "#10b981" }
  };
  return configs[maxArchetype];
}

// ─── Anti-repeat phrase drawer (uses localStorage across runs) ─
function drawUnique(pool, rand, storageKey) {
  if (!pool || pool.length === 0) return '';
  const key = 'roaster_used_' + (storageKey || 'generic');
  let history = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try { history = JSON.parse(window.localStorage.getItem(key) || '[]'); } catch(e) {}
  }
  let available = pool.filter(p => !history.includes(p));
  if (available.length === 0) {
    available = pool;
    if (typeof window !== 'undefined' && window.localStorage) {
      try { window.localStorage.removeItem(key); } catch(e) {}
    }
    history = [];
  }
  const selected = available[Math.floor(rand() * available.length)];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      history.push(selected);
      if (history.length > 60) history.shift();
      window.localStorage.setItem(key, JSON.stringify(history));
    } catch(e) {}
  }
  return selected;
}

// ─── Contradiction analysis ───────────────────────────────────
function analyzeContradictions(text, stats, sweatInfo, hasLiveLink, tutorialCount, foundTutorials) {
  const contradictions = [];
  const hasSeniorTitle = /\b(senior|lead|principal|cto|architect|staff|manager|head|VP)\b/i.test(text);
  const hasBeginnerProjects = tutorialCount > 0 || foundTutorials.length > 0 || text.includes('todo') || text.includes('calculator') || text.includes('weather');
  if (hasSeniorTitle && hasBeginnerProjects) {
    contradictions.push({ type: "ego_inflation_detected", phrase: "Claims seniority/architect status but projects section is populated by tutorial-level beginner clones.", roast: "Declared senior architect responsibilities but the primary codebase proof remains a weather app or a calculator. Ego inflation metric is critical." });
  }
  const claimsDevOps = /\b(devops|sre|ci\/cd|pipeline|infrastructure|cloud engineer)\b/i.test(text);
  const hasNoPipelines = sweatInfo.techAttacks.some(a => a.type === 'devops_mismatch' || a.type === 'docker_mismatch' || a.type === 'kubernetes_mismatch');
  if (claimsDevOps && hasNoPipelines) {
    contradictions.push({ type: "devops_cosplay", phrase: "Claims DevOps or infrastructure expertise but lacks automated pipelines or cluster configuration telemetry.", roast: "Preaches cloud infrastructure but automated deployments are nowhere to be seen. Drag-and-drop to Vercel is not automated deployment." });
  }
  const claimsAI = /\b(machine learning|ai engineer|data scientist|ml practitioner|deep learning)\b/i.test(text);
  const hasNoDataSci = sweatInfo.techAttacks.some(a => a.type === 'ml_mismatch');
  if (claimsAI && hasNoDataSci) {
    contradictions.push({ type: "api_wrapper_cosplay", phrase: "Claims Machine Learning/AI expertise but is actually just calling ChatGPT API wrapper endpoints.", roast: "Importing OpenAI SDK and calling chat.completions.create does not make you a neural scientist. Zero matrix calculus or training logs found." });
  }
  const claimsFullStack = /\b(full\s*stack|backend)\b/i.test(text);
  const backendSkills = ['sql','postgres','database','node.js','express','django','fastapi','spring','mongodb','redis','graphql','rest api'];
  const hasBackend = backendSkills.some(s => text.includes(s));
  if (claimsFullStack && !hasBackend) {
    contradictions.push({ type: "backend_anemia", phrase: "Claims Full Stack / Backend capabilities but has zero database or runtime environment knowledge.", roast: "Listed full-stack capabilities, yet the skillset section is functionally backend-anemic. Your experience is just CSS alignment and state styling." });
  }
  const skillsSection = text.split(/skills|languages|technologies/i)[1] || "";
  if ((skillsSection.match(/,/g) || []).length > 12 && !hasLiveLink) {
    contradictions.push({ type: "theory_crafting", phrase: "Lists dozens of enterprise skills but has zero deployed proof online.", roast: "Listed a server rack of advanced tools, but has zero live URLs to verify. Code resides exclusively in the safety of localhost." });
  }
  return contradictions;
}

// ─── Infraction detector ─────────────────────────────────────
function detectInfractions(text, wordCount, buzzwordCount, tutorialCount, metricsCount, hasLiveLink, hasGitHub, foundSkills, foundTutorials, sweatInfo) {
  const angles = [];
  if ((text.includes('blockchain') || text.includes('crypto') || text.includes('web3')) && !(text.includes('solidity') || text.includes('smart contract') || text.includes('dapp') || text.includes('ether'))) angles.push('blockchain_bluff');
  if ((text.includes('machine learning') || text.includes(' ml ') || text.includes(' AI ') || text.includes('deep learning')) && !(text.includes('pytorch') || text.includes('tensorflow') || text.includes('scikit') || text.includes('neural'))) angles.push('ai_bluff');
  if (tutorialCount >= 2 || foundTutorials.length >= 2) angles.push('clone_overload');
  if ((text.match(/certificate|certification|certified|course/g) || []).length >= 3) angles.push('certification_hoarder');
  if (text.includes('founder') || text.includes('ceo') || text.includes('co-founder')) angles.push('startup_delusion');
  if (buzzwordCount >= 5 || sweatInfo.sweatinessLevel >= 60) angles.push('buzzword_salad');
  if (foundSkills.length >= 5) angles.push('domain_confusion');
  if (!hasLiveLink) angles.push('localhost_prisoner');
  if (metricsCount === 0) angles.push('quant_vacuum');
  if (text.includes('responsible for') || text.includes('assisted') || text.includes('worked with team')) angles.push('corporate_drone');
  if (sweatInfo.techAttacks.some(a => a.type === 'kubernetes_mismatch')) angles.push('kubernetes_mismatch');
  if (sweatInfo.techAttacks.some(a => a.type === 'docker_mismatch')) angles.push('docker_mismatch');
  if (angles.length === 0) angles.push('generic_mediocre');
  return angles;
}

const OPENING_POOL = {
  "staff_engineer": [
    "I’ve seen more architectural integrity in a Jenga tower played by toddlers during an earthquake.",
    "If this resume were a pull request, I wouldn't just reject it—I'd revoke your GitHub access entirely.",
    "Reading this gave me a physical migraine and a profound desire to quit the tech industry.",
    "This isn't an engineering career; it's a beautifully formatted confession of technical incompetence.",
    "I'd rather manually bisect a million-line commit history in Perl than spend another minute reading this.",
    "You have successfully achieved 100% test coverage on my patience.",
    "There is more technical debt in this single page than in the entire banking sector's COBOL legacy.",
    "I opened this expecting a senior engineer and found a walking Stack Overflow duplicate marked 'Closed as Not Constructive'.",
    "This document is a zero-day vulnerability targeting my will to live.",
    "Your career trajectory has the structural soundness of a house of cards in a wind tunnel.",
    "If I deployed this resume to production, the incident response team would legally emancipate me.",
    "This reads less like a professional history and more like a git merge conflict that gained sentience.",
    "I've seen legacy PHP monoliths with more structure, cohesion, and self-respect than whatever this is.",
    "You managed to compress ten years of impostor syndrome into a single PDF.",
    "This is what happens when you prompt an AI to 'write a resume for someone who peaked in middle school'."
  ],
  "faang_gatekeeper": [
    "We strictly hire the top 1%. You are a statistical outlier, but in the completely wrong direction.",
    "Your 'impact' section reads like a participation trophy for successfully connecting to the company VPN.",
    "We are building planetary-scale distributed systems. You are struggling to center a div.",
    "This resume wouldn't survive the first pass of our automated regex filter, let alone a human.",
    "I’ve seen interns drop the production database with more grace and elegance than this formatting.",
    "I would ask you a system design question, but I'm legitimately terrified you'd suggest using Microsoft Access.",
    "Our entry-level apprentices have abandoned side projects with more technical complexity than your entire career.",
    "This is the kind of resume we print out, frame, and hang in the breakroom as a cautionary tale.",
    "You claim 'leadership', but this screams 'needs a babysitter to resolve a rebase conflict'.",
    "I've rejected candidates for breathing too loudly on the phone screen. You don't stand a chance.",
    "If your code is as disorganized as this narrative, you belong at a Series A startup that's about to fail.",
    "Your 'system design' knowledge clearly comes exclusively from watching YouTube over lunch on 2x speed.",
    "You optimized for buzzwords instead of O(1) impact, and it's painfully obvious to anyone with a pulse.",
    "This resume is a false positive in the applicant tracking system and a stain on my morning.",
    "I am algorithmically repulsed by the sheer mediocrity of your professional existence."
  ],
  "devops_veteran": [
    "This resume has more single points of failure than a raw EC2 instance running in us-east-1.",
    "Your idea of 'high availability' appears to be leaving your laptop open and hoping the Wi-Fi doesn't drop.",
    "I'd trust a junior developer with root access before I'd trust your definition of 'Infrastructure as Code'.",
    "If this resume were a Kubernetes cluster, half the pods would be permanently stuck in CrashLoopBackOff.",
    "This document triggered a Sev-1 alert in my brain and I'm currently paging incident response.",
    "You deploy to production the same way a toddler throws spaghetti at a wall: blindly and with zero rollback plan.",
    "Your career has had more unexpected downtime than AWS in 2017.",
    "I can literally smell the manual SSH deployments radiating off this PDF.",
    "This is the resume equivalent of running `chmod 777 -R /` on a production database server.",
    "Your career trajectory has higher latency than a cross-region database query over a dial-up connection.",
    "I've resolved catastrophic data loss incidents that were less stressful than parsing your job history.",
    "You claim 'cloud native', but this reads like 'I clicked the big green button in the AWS console once'.",
    "The only thing 'continuous' about your integration is the unbroken stream of absolute red flags.",
    "This resume needs to be containerized, shipped directly to /dev/null, and purged from the registry.",
    "I wouldn't trust you to manage the DNS records for my grandmother's knitting blog."
  ],
  "oss_maintainer": [
    "Your GitHub contribution graph looks like a barcode for a deeply discounted, discontinued product.",
    "You claim 'Open Source Enthusiast' but your only merged PR is fixing a typo in a Code of Conduct.",
    "This resume is the human equivalent of a pull request that just changes whitespace and breaks the build.",
    "I can tell you open 'Good First Issues' and then immediately beg the maintainer to write the code for you.",
    "If you submitted this resume to my repo, I would lock the issue, ban you, and report you to GitHub.",
    "Your 'active projects' have been completely untouched since the Obama administration.",
    "I've seen automated Dependabot scripts generate more meaningful commit messages than you.",
    "You starred 500 repositories to look active, but your own repos don't even have a LICENSE file.",
    "Your understanding of version control seems to be `git commit -m 'stuff'` followed by `git push --force`.",
    "I would rather review a 10,000 line PR with no tests, written in Brainfuck, than read this again.",
    "Your 'portfolio' is just 15 forks of popular projects where your only contribution was changing the background color.",
    "This document has more unresolved conflicts than an actively developed master branch with no CI.",
    "You list Git as a skill, but I know in my soul you use the GitHub Desktop UI for literally everything.",
    "Your open source 'collaboration' consists of opening issues complaining about missing features you won't build.",
    "This is an undocumented, unmaintained, deprecated API of a resume."
  ],
  "exhausted_recruiter": [
    "I have screened 400 resumes today, and this specific one makes me want to reconsider my life choices.",
    "Your formatting gave my Applicant Tracking System a panic attack so severe it requires a hard reboot.",
    "You sent this as a .docx file. We are a technology company. Do the basic math on why that's embarrassing.",
    "I asked for a software engineer, you gave me a 3-page autobiography of someone who peaked in a bootcamp.",
    "This resume has so many buzzwords I thought it was generated by a malfunctioning Markov chain from 2014.",
    "You list 'Detail Oriented' but spelled 'JavaScript' three different ways, none of which were correct.",
    "I am begging you on my hands and knees: please just tell me what you actually built, not what your 'team' did.",
    "Your 'summary' section is longer than the actual experience section. Stop writing prose, start writing metrics.",
    "This is the resume equivalent of a candidate who joins a Zoom interview from a noisy wind tunnel.",
    "I don't know what a 'Synergistic Code Ninja' is, but I know for a fact we are absolutely not hiring one.",
    "You applied for a Senior Backend Role with a portfolio entirely consisting of slightly broken CSS animations.",
    "This resume took 4 pages to say 'I know how to Google things when the senior dev isn't looking'.",
    "My KPI is to find talent. My grim reality is reading whatever this document is supposed to be.",
    "I showed this to the hiring manager and they just sighed deeply, closed their laptop, and went home for the day.",
    "You used a progress bar graphic for your skills. This isn't a role-playing game, this is a professional rejection."
  ],
  "rust_elitist": [
    "This resume exhibits serious memory leaks in basic logic and a complete lack of lifetime management.",
    "I assume from this document that you still use garbage-collected languages like an absolute peasant.",
    "If your career was compiled, the borrow checker would reject it immediately for undefined behavior.",
    "You claim performance matters, yet your resume is bloated, inefficient, and painfully slow to parse.",
    "This reads like it was written in JavaScript: totally untyped, unpredictable, and prone to catastrophic runtime errors.",
    "I can tell you've never had to manually manage memory or, frankly, your own career expectations.",
    "Your 'experience' is just a series of unsafe blocks waiting to segfault in production.",
    "I wouldn't trust this resume in a multi-threaded environment; it clearly lacks thread safety.",
    "This document lacks zero-cost abstractions; everything here is going to cost me valuable time and sanity.",
    "You list 'C++' but I know you just used `std::vector` once in college and cried about segmentation faults.",
    "Your tech stack is a bloated, unsafe monolith. Mine is memory-safe and blazingly fast.",
    "This resume is throwing a panic at runtime because it attempted to unwrap a None value of talent.",
    "I'd rewrite this resume in Rust, but there's absolutely no logic here worth salvaging.",
    "You clearly don't understand ownership, especially when it comes to owning your own terrible architectural decisions.",
    "This is undefined behavior masquerading as professional experience."
  ],
  "startup_cto": [
    "This resume screams 'I will spend 3 weeks debating architecture while the company's runway burns to zero'.",
    "I need someone to ship features, not write a thesis on microservices for a platform with 10 total users.",
    "You look like the kind of dev who demands a 4K monitor and a standing desk before pushing a single commit.",
    "We're trying to find product-market fit, and you're desperately trying to find a perfectly scoped Jira ticket.",
    "This reads like someone who has never felt the sheer adrenaline of deploying straight to prod on a Friday night.",
    "Your idea of 'hustle' is complaining on Slack that the free office snacks aren't ethically sourced.",
    "I asked for a 10x engineer. This is a 0.1x engineer with a 100x ego and zero actual throughput.",
    "You claim 'full stack' but I bet you get completely blocked for days if the CSS doesn't compile perfectly.",
    "We need pirates who can build a ship while sailing it. This resume belongs to a compliance officer.",
    "I can't afford to hire you, and honestly, looking at this output, neither can anyone else.",
    "Your 'Agile experience' just means you like having daily meetings to avoid doing any actual coding.",
    "This resume tells me you will demand we rewrite the entire app in a new, unproven framework on week two.",
    "You want equity? I wouldn't give you equity in a child's lemonade stand.",
    "This is the resume of someone who thinks 'growth hacking' means buying fake Twitter followers.",
    "I need a builder. You look like a professional spectator who critiques the people doing the actual work."
  ],
  "systems_architect": [
    "This resume is a monolithic disaster with zero separation of concerns and massive technical debt.",
    "Your career path is tightly coupled to obsolete frameworks and highly dependent on deprecated technologies.",
    "I see absolutely no evidence of scalability in your experience, your ambition, or your intellect.",
    "This document represents a fundamental, cascading failure in basic system design and human logic.",
    "Your experience section has terrible cohesion, inexplicably high coupling, and zero fault tolerance.",
    "I've designed distributed systems with fewer failure modes than trying to understand your job history.",
    "This resume lacks a clear API for me to extract any actual, measurable value from your background.",
    "You claim to build 'microservices' but this reads exactly like a distributed monolith held together by duct tape.",
    "There are too many single points of failure in your technical background for me to feel safe reading this.",
    "Your architectural diagrams are probably just random boxes with arrows pointing vaguely to 'The Cloud'.",
    "This is what happens when you design a career entirely without a threat model or a disaster recovery plan.",
    "I can identify three distinct cascading failures just by reading your education and skills sections.",
    "Your claims of 'high throughput' directly contradict the painfully high latency of reading this document.",
    "This resume requires a complete, ground-up refactor before I can even begin to conduct a code review.",
    "You have clearly optimized for buzzword density at the complete expense of structural integrity."
  ]
};

const EVIDENCE_POOL = {
  "staff_engineer": [
    "Listing 'HTML/CSS' next to 'Kubernetes' is like putting 'Breathing' and 'Walking' on a medical degree.",
    "You claim you 'spearheaded' a project, but the repo history shows you only updated the README.md and fixed a typo.",
    "Your bullet points are just the verbs 'developed,' 'maintained,' and 'collaborated' on repeat, signifying absolutely nothing.",
    "You list 'React' as an expert skill, but your entire portfolio is built with jQuery and despair.",
    "There's a 3-year gap in your experience that you tried to cleverly hide with a vague 'Freelance Consultant' section.",
    "You claim 'Agile/Scrum' as a hard skill. That's a meeting schedule, not a technical competency, you absolute fraud.",
    "Your 'award-winning' flagship project has exactly two active users: you and your localhost server.",
    "You list 'Microservices' but your only GitHub project is a massive, tangled single Express.js file.",
    "The 'Senior' in your title clearly refers to your tenure at the company, not your actual technical capability.",
    "You included a visual pie chart of your skills. 60% JavaScript, 40% absolute delusion.",
    "Your bullet points list daily duties, not accomplishments. You survived the job, you didn't excel at it.",
    "You claim you increased performance by 300%, but didn't state the baseline. 300% of 1 user is 3 users.",
    "You list 15 programming languages, which mathematically proves you only wrote 'Hello World' 15 times.",
    "Your resume says 'Data Science' but a quick glance at your projects screams 'I just write Excel Macros'.",
    "You claim to have 'led a team of 5', but I guarantee three were interns and two were offshore contractors who ignored you."
  ],
  "faang_gatekeeper": [
    "You list 'Problem Solving' as a skill. That is the baseline expectation of being a conscious human being.",
    "Your educational pedigree is impressive, which makes this incredibly lackluster experience even more deeply disappointing.",
    "You claim impact at scale, yet your largest project processed fewer requests in a year than my smart fridge does in a day.",
    "Listing 'Microsoft Office' on a software engineering resume is an immediate, non-negotiable disqualifier.",
    "Your bullet points are completely devoid of quantifiable metrics. 'Improved things significantly' is not a metric.",
    "You list 'Machine Learning' but the evidence shows you only used a pre-trained API wrapper from OpenAI.",
    "You describe a basic CRUD application with three tables as an 'Enterprise-Grade B2B Platform'.",
    "Your resume formatting is so wildly inconsistent it fails basic visual linting on the first glance.",
    "You claim 'System Architecture' experience, but you just used Firebase for a weekend hackathon project.",
    "You list 'Web3 / Blockchain' experience from exactly 2021. We all know exactly what that implies.",
    "Your 'Open Source Contributions' are entirely documentation fixes for typos in popular libraries.",
    "You claim to be a 'Full Stack Developer', but you clearly just use Bootstrap and pray the backend doesn't crash.",
    "You list 'Git' as a skill, which is like a master carpenter listing 'Hammer' as a core competency.",
    "Your project descriptions read like desperate marketing copy, not actual technical documentation.",
    "You claim to have 'optimized database queries' but probably just added a single index after the site crashed."
  ],
  "devops_veteran": [
    "You claim 'CI/CD expertise' but your GitHub actions are just a graveyard of failing YAML files.",
    "You list 'AWS' but your only provable experience is hosting a static HTML site on an S3 bucket.",
    "Your idea of 'Infrastructure as Code' is a fragile, 500-line bash script that randomly installs Node.js.",
    "You claim 'Docker' as a skill, but you just copy-paste massive, unoptimized Dockerfiles from Medium articles.",
    "You list 'Zero Downtime Deployments' but you clearly just deploy at 3 AM on a Sunday and hope no one notices.",
    "Your 'monitoring and observability' experience is just checking if the website loads on your iPhone.",
    "You claim to manage 'high-availability clusters' but your portfolio is hosted on the Heroku free tier.",
    "You list 'Security' as a skill, but you almost certainly push hardcoded API keys directly to public repos.",
    "Your 'Disaster Recovery Plan' is clearly just a manual backup of a backup sitting on the same physical server.",
    "You claim 'Site Reliability' but your personal website has an SSL certificate that expired three months ago.",
    "You list 'Linux Administration', which I translate to mean you finally learned how to exit Vim without rebooting.",
    "Your 'Cloud Native' experience is just running a WordPress monolith on a $5 DigitalOcean droplet.",
    "You claim to have 'reduced latency', but you probably just slapped Cloudflare in front of your slow server.",
    "You list 'Terraform' but I guarantee your tfstate files are definitely committed in plaintext to your git repo.",
    "Your 'automation' experience is just a chaotic collection of fragile cron jobs that fail silently."
  ],
  "oss_maintainer": [
    "Your GitHub profile has 500 contributions, all mysteriously located in a private repo named 'test'.",
    "You list 'Open Source Contributor' but your only PR was immediately rejected for failing the basic linter.",
    "Your pinned repositories are all forks of popular projects that you haven't modified a single line of.",
    "You claim to 'maintain' a library that hasn't seen a commit, issue response, or update since 2019.",
    "Your commit messages are a tragic, unbroken sequence of 'fix', 'fix again', and 'pls work for the love of god'.",
    "You list 'Community Leadership' but you just vaguely moderate a dead Discord server for a defunct crypto project.",
    "Your READMEs are meticulously designed and significantly longer than the actual source code of your projects.",
    "You claim to have created a 'framework', but it's literally just a thin wrapper around three NPM packages.",
    "Your 'popular' repo has 50 stars, and suspiciously, every single account was created on the exact same day.",
    "You list 'Code Review' as a skill, but you probably just hit 'Approve' without reading a single line of the diff.",
    "Your open source 'collaboration' consists solely of opening issues complaining about missing features.",
    "You claim to follow 'Best Practices' but your main repository doesn't even have a `.gitignore` file.",
    "Your projects are a massive, unmaintained graveyard of abandoned half-ideas and weekend tutorials.",
    "You list 'Semantic Versioning' but all your releases are tagged `v1.0.0-final-real-v2-fixed`.",
    "Your 'contributions' to the ecosystem are just adding more useless boilerplate noise to the NPM registry."
  ],
  "exhausted_recruiter": [
    "You used a functional resume format specifically to hide the fact that you haven't worked in two years.",
    "Your contact email address is literally 'darklord_69@hotmail.com'. Need I say anything more?",
    "You listed your high school GPA. You are a 35-year-old adult applying for a senior engineering position.",
    "Your 'objective' statement says you want a 'challenging role'—getting through this document was challenging enough.",
    "You claim 'excellent communication skills' in a resume absolutely riddled with glaring grammatical errors.",
    "You list 'Hard Worker' as a skill. What was the alternative you considered? 'Actively Lazy'?",
    "Your resume is 4 pages long, and 3 of them are a detailed list of every generic course you took in college.",
    "You claim 'Team Player' but your job history shows you abruptly change companies every 6 months.",
    "You list 'Typing (80 WPM)' like we are hiring for a secretarial pool in the mid-1990s.",
    "Your font choices look like a literal ransom note compiled from 5 completely different Microsoft Word templates.",
    "You claim to be a 'Visionary Leader' but you are applying for a Junior React Developer role.",
    "You included a photo of yourself. This is a technology company, not a local real estate agency.",
    "Your 'References Available Upon Request' line is a complete waste of ink. We know how the process works.",
    "You list 'Hobbies: Reading, Traveling, Tech'. Congratulations, you are a completely generic human being.",
    "You claim 'Exceptional Attention to Detail' but you addressed the cover letter to our direct competitor."
  ],
  "rust_elitist": [
    "You list 'Python' as your primary language. I'm deeply sorry for your complete lack of static guarantees.",
    "Your projects all use JavaScript. I can literally hear the unhandled runtime errors screaming from here.",
    "You claim to care deeply about 'Performance' but you write all your backends in single-threaded Node.js.",
    "You list 'C++' but you probably still use raw pointers and manual `new`/`delete` like an absolute savage.",
    "Your 'Data Structures' knowledge is just aggressively using dynamically sized arrays for literally everything.",
    "You claim 'Concurrency' experience but you clearly just sprinkle `async/await` everywhere and pray for the best.",
    "Your 'Algorithms' experience is just calling `.sort()` and hoping the standard library bails you out.",
    "You list 'Java'. I can smell the Enterprise boilerplate and the incoming NullPointerExceptions.",
    "Your resume mentions 'Garbage Collection'. Real developers collect their own garbage.",
    "You claim 'Memory Management' skills but you've never written a custom allocator in your entire life.",
    "Your tech stack is fundamentally unsound at the compiler level and morally bankrupt.",
    "You list 'Type Script'. The literal space in the name tells me everything I need to know about your expertise.",
    "Your projects completely lack type safety, memory safety, and probably basic thread safety.",
    "You claim 'Low Level' programming but you just mean you wrote a basic C program once in a sophomore class.",
    "Your resume is dynamically typed and evaluated entirely at runtime. And unfortunately, it just panicked."
  ],
  "startup_cto": [
    "You list 'Corporate Strategy' but I literally just need someone who can center a div by 5 PM today.",
    "Your experience at IBM is cute, but here we don't have 6 weeks for a procurement cycle just to spin up a server.",
    "You claim 'Architectural Planning' but we just need you to unbreak the API that went down 10 minutes ago.",
    "Your bullet points describe a highly structured, heavily managed environment. You will cry here on day one.",
    "You list 'Jira Administration'. We use sticky notes, Slack messages, and sheer panic. Adapt or leave.",
    "You claim 'Process Optimization' but we don't even have a basic process yet. We are building the plane in the air.",
    "Your 'Enterprise Solutions' experience translates directly to 'moves entirely too slowly' for our runway.",
    "You list 'Budget Management'. Our engineering budget is currently zero. Manage that.",
    "Your resume screams 'I desperately need a manager'. We are all managers. You will be completely alone.",
    "You claim 'Scalability'. We have 14 total users. We need to successfully scale to 15 before we worry about that.",
    "Your projects took 12 months to ship. We pivot our entire business model every 12 days.",
    "You list 'Compliance'. We consider compliance a 'post-Series-A' problem. Right now we need survival.",
    "Your 'Cross-functional Collaboration' just means you CC'd entirely too many people on useless emails.",
    "You claim to be a 'Perfectionist'. Perfection is the mortal enemy of shipping. We ship broken things daily.",
    "Your resume is far too polished. I prefer engineers who are slightly broken, highly caffeinated, and fast."
  ],
  "systems_architect": [
    "You list 'MongoDB' for an application that so clearly required deeply relational data, it's actually painful.",
    "Your project architecture is literally just a heavy frontend talking directly to an unsecured database.",
    "You claim 'Microservices' but you just split a monolith into 5 repos that all tightly share a single database.",
    "Your 'Event-Driven' architecture is just a chaotic, untraceable mess of unmonitored WebHooks.",
    "You list 'Redis' but you clearly just use it as a glorified `window.localStorage` for the backend.",
    "Your 'API Design' is just dumping the entire database row into a massive JSON response and letting the client sort it out.",
    "You claim 'Caching Strategies' but you just set everything to TTL 5 minutes and called it a day.",
    "Your 'Database Optimization' was just lazily using `SELECT *` instead of querying specific columns.",
    "You list 'Message Queues' but you probably just use a database table with a 'status' column that you poll every second.",
    "Your architecture entirely lacks decoupling, idempotency, and frankly, basic engineering sanity.",
    "You claim 'State Management' but your app state is probably held entirely in the URL parameters.",
    "Your 'REST API' is not RESTful at all; it's just HTTP RPC with terrible, inconsistent naming conventions.",
    "You list 'GraphQL' but I guarantee you suffer from massive N+1 query problems that bring the server to its knees.",
    "Your 'System Design' is just whatever the top-rated Medium tutorial explicitly told you to do.",
    "You claim 'Fault Tolerance' but your entire application violently crashes if a third-party API returns a simple 404."
  ]
};

const PROFILE_POOL = {
  "staff_engineer": [
    "You are the developer who confidently copy-pastes from Stack Overflow without reading the comments explaining why it's a terrible idea.",
    "You are the literal reason we have to write patronizing unit tests for the most basic, fundamental functionality.",
    "You operate under the tragic delusion that more lines of code mathematically equates to more productivity.",
    "You are the physical embodiment of the phrase 'it works on my machine'.",
    "You are a 'Senior' developer only in chronological age and sheer persistence.",
    "You are the colleague who leaves 'TODO: fix this later' in the codebase and inevitably never returns.",
    "You are the human equivalent of a flaky integration test that everyone ignores.",
    "You are a master of appearing incredibly busy in Jira while delivering negative net value to the product.",
    "You are the developer who debates syntax endlessly in PRs but completely misses glaring, system-destroying logical flaws.",
    "You are the primary reason technical debt is considered a permanent, inescapable state of nature.",
    "You are fundamentally allergic to reading documentation before asking questions in public Slack channels.",
    "You are a 'Full Stack' developer who is impressively incompetent at both ends of the stack.",
    "You are the person who re-invents the wheel, but mathematically manages to make it a square.",
    "You are the developer who thinks 'clever' unreadable code is vastly superior to 'boring' maintainable code.",
    "You are a walking, breathing compilation error."
  ],
  "faang_gatekeeper": [
    "You possess the raw, unrefined technical capability of a bootcamp student on week two.",
    "You are fundamentally and structurally unequipped to operate at planetary scale.",
    "You drastically lack the analytical rigor required to pass a 15-minute introductory phone screen.",
    "You are a mere tourist in the engineering profession.",
    "You represent a profound, tragic misallocation of human capital.",
    "You are a statistical artifact of a historically loose hiring market that has since corrected.",
    "You demonstrate a deeply concerning lack of baseline intellectual curiosity.",
    "You are perfectly optimized for passing automated ATS filters, but absolutely useless at solving hard problems.",
    "You are the absolute baseline against which we measure actual, competent engineering talent.",
    "You operate perfectly at the intersection of supreme overconfidence and profound technical ignorance.",
    "You are entirely dependent on high-level abstractions that you clearly do not understand.",
    "You lack the technical depth required to be considered a peer in this specific industry.",
    "You are a completely commoditized developer with absolutely no distinguishing technical features.",
    "You are the literal reason we are forced to conduct brutal whiteboard interviews.",
    "You are fundamentally, inescapably mediocre."
  ],
  "devops_veteran": [
    "You are the exact person who pushes undocumented changes to production on Friday at 4:59 PM.",
    "You are a continuous integration nightmare brought to life.",
    "You are the specific reason we have to aggressively lock down IAM permissions across the entire organization.",
    "You treat carefully provisioned infrastructure like a disposable, chaotic sandbox.",
    "You are the developer who confidently hardcodes IP addresses into the frontend application.",
    "You are fundamentally unaware of the operational consequences of your terrible code.",
    "You are a walking, breathing, unpatched security vulnerability.",
    "You treat application logs as a suggestions box rather than a critical diagnostic tool.",
    "You are the exact reason 'ops' fundamentally hates 'dev'.",
    "You are a massive entropy generator in any production environment you touch.",
    "You are the developer who thinks 'scaling' simply means buying a vastly more expensive server.",
    "You are completely allergic to automation and reproducibility.",
    "You treat application state like a global variable randomly floating in the cloud.",
    "You are the human equivalent of an untraceable memory leak.",
    "You are a massive operational liability poorly disguised as an asset."
  ],
  "oss_maintainer": [
    "You are a parasitic leech on the open-source ecosystem.",
    "You are the developer who opens demanding issues instead of submitting helpful pull requests.",
    "You are fundamentally incapable of reading the contributing guidelines before demanding help.",
    "You treat open-source maintainers as your unpaid, on-call personal support team.",
    "You are a serial star-clicker with absolutely zero actual, meaningful commits to your name.",
    "You are the person who aggressively demands complex features on a project you get entirely for free.",
    "You are the physical embodiment of the 'entitled open-source user' anti-pattern.",
    "You severely lack the discipline to maintain code over any meaningful long-term period.",
    "You are a hit-and-run contributor who leaves a mess and never responds to the PR review.",
    "You are the developer who forks a project, adds absolutely nothing, and immediately abandons it.",
    "You are fundamentally and philosophically opposed to writing documentation for your own code.",
    "You are exclusively a consumer, never a creator.",
    "You treat GitHub as a social networking site rather than a serious version control system.",
    "You are the specific reason maintainers burn out, archive their repos, and leave the industry.",
    "You are a glaring syntax error in the social fabric of the open-source community."
  ],
  "exhausted_recruiter": [
    "You are the candidate who blindly applies to every single open role regardless of qualifications.",
    "You are a formatting disaster that makes my eyes physically ache.",
    "You are the primary reason I drink heavily on weeknights.",
    "You are a sophisticated buzzword generator poorly disguised as a human being.",
    "You are fundamentally lacking in basic professional self-awareness.",
    "You are the candidate who ghosts us immediately after the final interview stage.",
    "You are a master of extreme professional exaggeration.",
    "You are the exact reason the modern hiring process is completely broken.",
    "You clearly treat your career like a series of random, unfortunate accidents.",
    "You are entirely, painfully unremarkable.",
    "You are a copy-pasted professional with no original thoughts.",
    "You are the candidate who asks 'what does this company do' 20 minutes into the interview.",
    "You are a resume padder of the absolute highest order.",
    "You are fundamentally unhirable in your current professional state.",
    "You are a complete and total waste of a premium LinkedIn InMail credit."
  ],
  "rust_elitist": [
    "You are a developer who fully embraces runtime panics and chaotic execution.",
    "You are fundamentally, architecturally, and morally unsafe.",
    "You are the reason modern software is bloated, slow, and terrible.",
    "You treat static types as a polite suggestion rather than an ironclad contract.",
    "You are an unapologetic purveyor of undefined behavior.",
    "You are a catastrophic memory leak in human form.",
    "You completely lack the discipline required for serious systems programming.",
    "You are a garbage-collected developer operating in a manually allocated world.",
    "You are entirely and hopelessly reliant on runtime checks to save you from yourself.",
    "You are the exact reason we desperately needed the borrow checker.",
    "You are fundamentally casual about correctness and stability.",
    "You are a symptom of a lax, undisciplined engineering culture.",
    "You treat extreme performance as an afterthought rather than a core requirement.",
    "You are a null pointer exception just waiting to happen in production.",
    "You are architecturally unsound and philosophically flawed."
  ],
  "startup_cto": [
    "You are a corporate drone who literally cannot function without a highly detailed Jira ticket.",
    "You are fundamentally unsuited for any high-velocity, high-stress environment.",
    "You are a chronic over-engineer in a world that desperately requires shipping code.",
    "You treat equity like a free lottery ticket rather than a binding commitment to suffer with us.",
    "You are the developer who complains about 'lack of process' but absolutely needs it to survive.",
    "You are a passive passenger, not an active driver.",
    "You completely lack the entrepreneurial grit required to survive here for more than a month.",
    "You are a fundamentally slow executor who will drag down the entire team's velocity.",
    "You treat your job as a rigid 9-to-5 chore rather than a critical mission.",
    "You are deeply allergic to ambiguity and require someone to hold your hand.",
    "You are the exact reason early-stage startups run out of runway and die.",
    "You are an academic operating in what is essentially a street fight.",
    "You lack the raw hustle required to actually move the needle on our KPIs.",
    "You are fundamentally and fatally risk-averse.",
    "You are a luxury we absolutely cannot afford."
  ],
  "systems_architect": [
    "You are a master of messy tactical fixes and a complete failure at strategic, long-term design.",
    "You are fundamentally incapable of seeing the big picture or understanding system-wide implications.",
    "You treat software architecture as a list of buzzwords rather than a serious engineering discipline.",
    "You are a silo builder who actively degrades cross-functional communication.",
    "You are the developer who tightly couples absolutely everything they touch, ensuring future pain.",
    "You completely lack an understanding of bounded contexts and system boundaries.",
    "You are a prolific creator of highly unmaintainable distributed monoliths.",
    "You treat data models as an annoying afterthought rather than the foundation of the system.",
    "You are fundamentally reactive rather than proactive in your design choices.",
    "You are the exact reason entire systems require incredibly expensive, multi-year complete rewrites.",
    "You are a localized optimizer who actively degrades the performance of the global system.",
    "You completely lack an understanding of architectural trade-offs.",
    "You are an unapologetic purveyor of the worst architectural anti-patterns.",
    "You treat system design like a chaotic game of Jenga.",
    "You are structurally deficient and incapable of scale."
  ]
};

const VERDICT_POOL = {
  "staff_engineer": [
    "I recommend an immediate career pivot. Perhaps to management, where this level of vagueness is actively rewarded.",
    "This resume is declined. I highly suggest deleting your entire repository and starting your life over.",
    "You are not a 10x developer. You are a 0.1x developer generating 100x the technical debt.",
    "I would enthusiastically approve a pull request deleting this entire resume from existence.",
    "This is not a career trajectory; it is a tragic stack trace of increasingly bad decisions.",
    "You have successfully and permanently convinced me to never hire you.",
    "I recommend you spend less time tweaking CSS formatting and more time learning how computers actually work.",
    "This document should be aggressively deprecated immediately.",
    "You are permanently blocked from merging into our organization. Do not attempt to bypass this.",
    "This resume is a critical production failure. Rollback immediately.",
    "I award you zero points, and may God have mercy on whatever codebase you touch next.",
    "This is quite literally the worst thing I've read since the official PHP 5 documentation."
  ],
  "faang_gatekeeper": [
    "Hard pass. Don't even bother applying to our lowest-tier subsidiary companies.",
    "You are fundamentally uncalibrated for elite engineering roles. Lower your sights significantly.",
    "I am rejecting this candidate and seriously questioning the recruiter who forwarded it.",
    "This resume belongs in the trash, right alongside your brutal algorithm efficiency.",
    "You are the absolute weak link in the global talent pool.",
    "This is a definitive, unarguable No Hire.",
    "I strongly suggest you seek employment at a company that doesn't care about engineering excellence.",
    "Your application has been algorithmically discarded and purged from the database.",
    "You do not meet the bar. In fact, you cannot even conceptually see the bar from where you are.",
    "This resume is a masterclass in how to guarantee you remain permanently unemployed.",
    "Please urgently unsubscribe from our applicant tracking system and never return.",
    "You are structurally and culturally incompatible with our hiring standards."
  ],
  "devops_veteran": [
    "I am blacklisting this resume at the firewall level.",
    "This candidate should be isolated in a secure subnet and never given production access under any circumstances.",
    "I strongly recommend a hard, physical reboot of your entire career.",
    "This resume has been routed directly to /dev/null where it belongs.",
    "You are an active operational hazard to any team you join.",
    "This document fails all health checks and liveness probes.",
    "I am triggering an automated rollback of your entire application.",
    "This is a catastrophic, unrecoverable failure of career orchestration.",
    "You are aggressively denied access to this organization.",
    "Your career uptime is completely unacceptable.",
    "This resume is a literal Denial of Service attack on my valuable time.",
    "I suggest you terminate this instance and spin up a completely new career."
  ],
  "oss_maintainer": [
    "Issue closed: Won't Fix. Career abandoned.",
    "I am marking this resume as 'invalid', locking the conversation, and blocking the author.",
    "Your application has been summarily rejected for violating basic community standards.",
    "This candidate is permanently banned from contributing to any serious project.",
    "I strongly suggest you learn to actually code before you pretend to be a developer.",
    "This resume is a spam pull request designed to waste my time.",
    "You are a toxic, heavily deprecated dependency.",
    "I am archiving this candidate permanently.",
    "Your career is an unmaintained fork of a dead project.",
    "This is a zero-star repository of a resume.",
    "You are a completely deprecated developer.",
    "I recommend you read the manual before ever applying anywhere else again."
  ],
  "exhausted_recruiter": [
    "I am physically pained by having read this. Rejected immediately.",
    "This resume is going directly into the industrial shredder.",
    "I cannot in good conscience forward this to a hiring manager without risking my own job.",
    "You are the specific reason I am burning out and considering a career in farming.",
    "This is a categorical, undeniable rejection.",
    "I am begging you to rewrite this before you embarrass yourself in front of someone who matters.",
    "This candidate is entirely unplaceable in any market.",
    "Your resume is a literal red flag factory operating at maximum capacity.",
    "I suggest hiring a professional resume writer and seeking a massive reality check.",
    "This application is DOA.",
    "You have wasted my time, and for that, you are forcefully rejected.",
    "This is the worst resume in my inbox today, and that is a remarkably high bar to clear."
  ],
  "rust_elitist": [
    "This resume catastrophically fails to compile. Rejected.",
    "You are mathematically proven to be a terrible hire.",
    "I am safely and confidently discarding this application.",
    "This candidate immediately panics at runtime.",
    "You are a walking memory leak. Terminated.",
    "This resume violently violates the borrow checker of my patience.",
    "I demand zero-cost abstractions, and you are entirely, painfully costly.",
    "This application is completely `unsafe` and must be isolated immediately.",
    "You are structurally, fundamentally flawed.",
    "This is a catastrophic type mismatch. Rejected.",
    "Your career logic is provably unsound.",
    "I strongly suggest you rewrite your entire career in a safer language."
  ],
  "startup_cto": [
    "We desperately need builders, and you are a massive liability. Pass.",
    "You would burn through our entire seed round runway in a month. Rejected.",
    "This candidate severely lacks the hustle required to survive here for a week.",
    "I am passing on this profile. Not nearly enough grit.",
    "You are a corporate drone; we are pirates. Goodbye forever.",
    "This resume is entirely too slow for our velocity.",
    "You are a walking anti-pattern for startup success.",
    "I suggest you go work at a highly regulated bank where you can hide.",
    "This is a hard pass. You simply don't have the stomach for this.",
    "You are a culture fit nightmare.",
    "We are looking for unicorns, and you are a very tired donkey.",
    "This application completely lacks product-market fit."
  ],
  "systems_architect": [
    "This candidate is a systemic risk to the organization. Rejected.",
    "Your career architecture is fundamentally broken and impossible to refactor.",
    "I am rejecting this immediately due to incredibly high coupling and low cohesion.",
    "This resume is a massive single point of failure.",
    "You are an architectural anti-pattern brought to life.",
    "This application scales incredibly poorly.",
    "I strongly suggest a complete, ground-up redesign of your professional trajectory.",
    "You are a structural bottleneck.",
    "This candidate actively degrades global performance.",
    "Your resume is a poorly designed state machine stuck in an error state.",
    "You completely lack the abstraction layers required for this role.",
    "This is a cascading failure of an application."
  ]
};

const RECOVERY_FRAGMENTS = {
  "localhost_prisoner": [
    "Deploy a project to a real server, configure a custom domain, and secure it with HTTPS so the world can actually see it.",
    "Stop dragging and dropping files. Set up a CI/CD pipeline to automatically deploy your code when you push to main.",
    "Monitor real-world traffic using analytics and basic logging, because right now you have zero users.",
    "Successfully handle a production database migration without losing data or panicking.",
    "Scale an application to handle concurrent requests beyond just mashing refresh in your own browser."
  ],
  "clone_overload": [
    "Stop building mindless Netflix clones. Solve a unique, highly specific problem that affects your actual daily life.",
    "Add a complex, non-standard feature to your clone that forces you to think outside of the tutorial's safety net.",
    "Build a customized tool for a local small business and get them to actually use it in production.",
    "Contribute a meaningful feature to an existing open-source project instead of constantly starting from scratch.",
    "Focus heavily on backend architecture and complex state management, not just mindlessly replicating the UI."
  ],
  "ai_bluff": [
    "Build a machine learning model entirely from scratch without using a high-level API wrapper like OpenAI.",
    "Be prepared to explain the deep mathematical foundations of the algorithms you claim to magically understand.",
    "Deploy a model to production and actually monitor its data drift and accuracy decay over time.",
    "Clean and preprocess a raw, chaotic dataset yourself instead of downloading perfectly clean CSVs from Kaggle.",
    "Optimize an inference pipeline for low latency rather than just running a Jupyter notebook locally."
  ],
  "blockchain_bluff": [
    "Write a complex smart contract that handles actual financial logic and get it professionally audited.",
    "Be able to explicitly explain the consensus mechanisms underlying the specific chains you claim to develop on.",
    "Build a decentralized application that actually fundamentally requires decentralization to function.",
    "Contribute to core protocol development rather than just writing superficial, useless dApps.",
    "Deeply understand the cryptographic primitives and hash functions that actually secure the network."
  ],
  "certification_hoarder": [
    "Stop collecting useless digital badges and build a massively complex project using the technologies you are 'certified' in.",
    "Demonstrate real architectural thinking rather than just proving you memorized the AWS services menu.",
    "Solve a tangible business problem in code instead of passing a multiple-choice exam.",
    "Write a highly technical blog post explaining a difficult concept entirely in your own words.",
    "Mentor a junior developer through a practical implementation to prove you actually know it."
  ],
  "startup_delusion": [
    "Ship a product that generates actual, real-world revenue, even if it's literally just $10.",
    "Talk to brutal, unbiased users and iterate based on their harsh feedback, not your own assumptions.",
    "Focus intensely on sustainable growth metrics rather than utterly meaningless vanity metrics.",
    "Build a resilient backend that doesn't immediately crash when more than 5 people log in simultaneously.",
    "Learn how to intelligently manage technical debt while maintaining high feature shipping velocity."
  ],
  "buzzword_salad": [
    "Aggressively remove every technology from your resume that you cannot confidently debug in a hostile interview.",
    "Focus on mastering one language and framework deeply rather than skimming ten of them shallowly.",
    "Be able to eloquently explain the trade-offs of the technologies you use, rather than just blindly listing them.",
    "Build a project that integrates multiple components elegantly, rather than haphazardly duct-taping them together.",
    "Demonstrate a profound understanding of the underlying principles, not just the basic syntax."
  ],
  "domain_confusion": [
    "Pick a specific specialty (Backend, Frontend, DevOps) and commit fully to mastering it instead of generalizing.",
    "Understand the strict boundaries and API interfaces between different technical domains.",
    "Build a massive project that requires incredibly deep knowledge of a specific, narrow vertical.",
    "Stop claiming to be a 'Full Stack Expert' if you only know React and Firebase.",
    "Learn the deep foundational concepts of the domain you are desperately trying to enter."
  ],
  "quant_vacuum": [
    "Quantify your impact: aggressively use numbers, percentages, and hard metrics to describe your actual work.",
    "Measure the exact performance improvements of your code using actual profiling and benchmarking tools.",
    "Explicitly calculate the cost savings or revenue generation of the features you built.",
    "Define strict success criteria before starting a project and ruthlessly measure against them.",
    "Use hard data and benchmarks to confidently justify your architectural decisions."
  ],
  "corporate_drone": [
    "Take initiative on a high-impact project completely outside of your safely assigned Jira tickets.",
    "Propose and successfully implement a massive architectural improvement to an existing legacy system.",
    "Learn a new technology that isn't currently used in your company's highly restrictive stack.",
    "Write a tool that completely automates a painful manual process for your team.",
    "Speak up aggressively in technical discussions and passionately defend your design choices."
  ],
  "kubernetes_mismatch": [
    "Deploy a complex multi-tier application on Kubernetes entirely from scratch, without using managed services.",
    "Write custom Helm charts and complex operators for your deployments.",
    "Implement strict network policies and rigorous pod security standards.",
    "Configure Prometheus and Grafana from scratch to monitor cluster health and set up paging alerts.",
    "Simulate catastrophic node failures and ensure your application remains completely highly available."
  ],
  "docker_mismatch": [
    "Write multi-stage Dockerfiles that aggressively minimize image size and attack surface.",
    "Implement a complex Docker Compose setup for a realistic microservices architecture.",
    "Understand the deep differences between container runtimes and the underlying Linux kernel features.",
    "Secure your containers by running as non-root and aggressively dropping unnecessary capabilities.",
    "Automate the rigorous scanning of your images for CVE vulnerabilities in a CI pipeline."
  ],
  "generic_mediocre": [
    "Find an incredibly hard technical problem and solve it. Stop doing the easy stuff.",
    "Read the raw source code of the libraries you blindly use every single day.",
    "Write a detailed technical article thoroughly explaining a complex topic.",
    "Contribute a meaningful PR to a major open-source project.",
    "Build something from scratch that forces you to learn low-level system mechanics."
  ]
};

const PERSONA_RECOVERY_DEFAULTS = {
  "staff_engineer": [
    "Embrace technical code reviews publicly—brutal feedback on your code is the absolute fastest accelerator for engineering growth.",
    "Finish and deploy your current project before starting a new one. Breaking the abandoned-repo habit is absolutely critical.",
    "Write comprehensive test suites for your code—discipline in testing is exactly what separates junior code from senior engineering.",
    "Contribute to or debug an existing complex codebase written by someone else. Navigating foreign code builds real skill.",
    "Request honest, uncensored code reviews from senior engineers. Polite feedback feels good; brutal feedback grows skill."
  ],
  "faang_gatekeeper": [
    "Build an application that handles real traffic and massive edge cases. The lessons learned in production easily beat 100 LeetCode problems.",
    "Focus aggressively on building deep core technical mastery rather than skimming surface-level interview preparation topics.",
    "Study computer science fundamentals directly from primary sources and docs, not just high-level summary video overviews.",
    "Deploy a project used by actual strangers. Hostile external user feedback is the ultimate reality check for code quality.",
    "Contribute meaningful PRs to highly established open-source codebases to experience real production code standards."
  ],
  "devops_veteran": [
    "Deploy a live application, configure automated monitoring, and extensively practice handling simulated downtime incidents.",
    "Set up end-to-end monitoring and paging for your apps—knowing exactly when and why software breaks is job #1 in Ops.",
    "Read real-world post-mortem reports from major tech outages to deeply understand how complex systems fail in production.",
    "Build a complete CI/CD release pipeline entirely from scratch without relying on pre-built GUI platform magic.",
    "Gain exposure to real operational alerts and chaotic logs. Understanding runtime behavior under extreme stress is irreplaceable."
  ],
  "oss_maintainer": [
    "Submit a pull request to a popular open-source repository with over 500 stars. Navigating strict code review is invaluable.",
    "Write documentation for your project assuming the user knows absolutely zero internal context. Clear docs reflect clear code.",
    "Review other developers' pull requests regularly. Reading and critiquing code sharpens your own architectural choices.",
    "Publish a reusable package to npm/PyPI, comprehensively document it, and handle issues submitted by hostile external developers.",
    "Adopt rigorous test-driven development: write failing tests before writing fix code. This discipline builds robust codebases."
  ],
  "exhausted_recruiter": [
    "Rewrite every work experience bullet point to focus exclusively on concrete engineering outcomes rather than passive attendance.",
    "Aggressively trim your skills section down to the core tools you can confidently defend in an intensive technical interview.",
    "Remove every generic self-praise adjective from your resume summary—let your project metrics speak for your capability.",
    "Ask former colleagues for honest feedback on your top technical strengths, and accurately reflect those specific traits in your resume.",
    "Keep your resume strictly to 1 page of extremely high-density, metric-backed technical achievements."
  ],
  "rust_elitist": [
    "Learn the exact mechanics of memory allocation, pointers, and garbage collection operating directly below your favorite framework.",
    "Profile your application's CPU and memory usage using real diagnostic tools before ever making claims about performance.",
    "Write a non-trivial project in a lower-level language (C, Rust, Go) to gain a deep appreciation for memory safety.",
    "Examine the raw source code of your favorite open-source libraries to truly understand how they execute under the hood.",
    "Implement a basic data structure or protocol parser entirely from scratch to understand how abstractions actually work."
  ],
  "startup_cto": [
    "Focus 100% of your energy on shipping a functional Minimum Viable Product to real users within the next exactly 30 days.",
    "Watch an unbiased user furiously attempt to navigate your app without giving them instructions, then fix every UX friction point.",
    "Define your core product value in one simple sentence, build absolutely only that feature, and deploy it to production.",
    "Commit to incredibly strict shipping deadlines. The discipline of delivering software matters vastly more than perfecting mockups.",
    "Shift your focus aggressively from pitching and documentation to delivering functional, deployed code that solves a real problem."
  ],
  "systems_architect": [
    "Take absolute personal responsibility for operating and maintaining the software systems you design in a live production environment.",
    "Design explicitly for failure: map out the top 5 ways your system will break under extreme stress, and implement resilient failovers.",
    "Interview actual end-users and operational engineers before finalizing system designs to ensure real constraints are met.",
    "Study massive incident post-mortems to understand exactly how architectural choices directly contribute to production outages.",
    "Calculate the infrastructure cost and hard throughput limits of your design before ever presenting it to team leads."
  ]
};

//  PARAGRAPH ROAST ASSEMBLER
//  Stitches opening → evidence → profile → verdict into one
//  continuous savage paragraph. No headers, no labels, no logs.
//  Transition phrases are randomly drawn to avoid repetition.
// ═══════════════════════════════════════════════════════════════

const TRANSITION_A = [
  "And it gets worse.",
  "That's just the surface.",
  "But dig one layer deeper and it collapses entirely.",
  "Here's the part that actually hurts.",
  "Now for the evidence.",
  "Let me be specific.",
  "The résumé itself confirms this.",
  "I did not have to look hard.",
  "The projects section does the rest of the damage.",
  "Follow me into the details.",
  "And then there is the work history.",
  "Allow me to enumerate.",
  "That observation is not the worst of it.",
  "Now look at what the résumé actually says.",
  "Beneath the formatting, here is what is real."
];

const TRANSITION_B = [
  "Which brings me to who you actually are.",
  "Psychologically, the pattern is clear.",
  "The behavior beneath the résumé is the real story.",
  "This is not just a document problem — it is a self-awareness problem.",
  "The résumé is a symptom. The disease is deeper.",
  "Step back and look at the developer this document describes.",
  "What this profile reveals is consistent with a specific type.",
  "The behavioral signature here is unmistakable.",
  "Taken together, this paints a portrait.",
  "What concerns me more than the résumé is the person who wrote it.",
  "The career pattern this describes is worth examining.",
  "Here is what I observe about the professional behind this document.",
  "None of this is accidental. It reflects something deeper.",
  "The résumé is a mirror. What it reflects is this.",
  "And underneath all of it, this is what I see."
];


// ═══════════════════════════════════════════════════════════════════════════
//  EVIDENCE-BASED ROAST ENGINE
//  Inspects every line of the resume — every skill, every project, every
//  claim — and produces comedy that is explainable by actual evidence.
//  NEVER invents technologies. NEVER hallucates projects.
// ═══════════════════════════════════════════════════════════════════════════

function extractResumeFeatures(resumeText) {
  const text = resumeText.toLowerCase();

  // Tutorial / clone app detection
  const tutorialAppMap = {
    'todo': 'Todo List App', 'to-do': 'Todo List App', 'todolist': 'Todo List App',
    'weather app': 'Weather App', 'weather api': 'Weather App', 'openweather': 'Weather App',
    'calculator': 'Calculator App', 'expense tracker': 'Expense Tracker',
    'chat app': 'Chat App', 'chatbot': 'AI Chatbot', 'messaging app': 'Chat App',
    'netflix clone': 'Netflix Clone', 'amazon clone': 'Amazon Clone',
    'uber clone': 'Uber Clone', 'twitter clone': 'Twitter Clone',
    'instagram clone': 'Instagram Clone',
    'blog': 'Blog App', 'notes app': 'Notes App', 'note taking': 'Notes App',
    'quiz app': 'Quiz App', 'quiz game': 'Quiz App',
    'crud app': 'CRUD App', 'crud application': 'CRUD App',
    'landing page': 'Landing Page'
  };
  const tutorialApps = [];
  Object.entries(tutorialAppMap).forEach(([key, label]) => {
    if (text.includes(key) && !tutorialApps.includes(label)) tutorialApps.push(label);
  });

  // Frontend vs backend skill analysis
  const frontendKeywords = ['react', 'vue', 'angular', 'svelte', 'html', 'css', 'tailwind', 'bootstrap', 'figma', 'framer', 'gatsby', 'next.js', 'nextjs', 'vite', 'redux', 'context api'];
  const backendKeywords = ['node', 'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails', 'sql', 'postgres', 'postgresql', 'mongodb', 'redis', 'graphql', 'mysql', 'prisma', 'sequelize', 'supabase'];
  const frontendSkills = frontendKeywords.filter(s => text.includes(s));
  const backendSkills  = backendKeywords.filter(s => text.includes(s));

  // Certification count
  const certKeywords = ['certified', 'certification', 'certificate', 'coursera', 'udemy', 'udacity', 'edx', 'google certified', 'microsoft certified', 'hackerrank', 'linkedin learning', 'codecademy', 'alison'];
  const certCount = Math.min(10, certKeywords.reduce((n, kw) => n + (text.split(kw).length - 1), 0));

  // Quantified metrics
  const metricsMatches = resumeText.match(/\d+\s*[%+x]\b|\$\s*\d+|\d+[kKmM]\+?|\d+\s*(users|requests|seconds|ms|GB|TB|million|billion|transactions|downloads|stars)/gi) || [];

  // Claimed seniority / leadership titles
  const titleKeywords = ['senior', 'lead', 'principal', 'architect', 'staff engineer', 'manager', 'head of', 'vp ', 'director', 'ceo', 'cto', 'founder', 'co-founder'];
  const seniorTitles = titleKeywords.filter(t => text.includes(t));

  // Links
  const hasGitHub    = text.includes('github.com');
  const hasLiveLink  = /vercel\.app|netlify\.app|github\.io/.test(text) || (resumeText.match(/https?:\/\//gi) || []).length >= 2;

  // Buzzwords
  const buzzList = ['passionate', 'driven', 'synergy', 'leverage', 'disruptive', 'innovative', 'dynamic', 'visionary', 'problem solver', 'fast learner', 'team player', 'hardworking', 'self-motivated', 'results-driven', 'thought leader', 'go-getter'];
  const buzzwords = buzzList.filter(b => text.includes(b));

  // Passive ownership language
  const passiveVerbList = ['responsible for', 'assisted with', 'helped with', 'worked with team', 'involved in', 'participated in', 'contributed to'];
  const passiveVerbs = passiveVerbList.filter(v => text.includes(v));

  // AI / ML claims vs actual ML stack
  const aiClaimsList = ['machine learning', 'deep learning', 'neural network', 'ai engineer', 'data scientist', 'natural language processing', 'computer vision', 'large language model', 'llm', 'generative ai'];
  const aiClaims = aiClaimsList.filter(a => text.includes(a));
  const hasMLFrameworks = ['pytorch', 'tensorflow', 'scikit-learn', 'scikit', 'keras', 'model training', 'training loop', 'fine-tuning', 'finetuning', 'gradient descent', 'backpropagation', 'hugging face', 'transformers'].some(f => text.includes(f));

  const allFrameworks = [...new Set([...frontendSkills, ...backendSkills])];

  // Skills section density
  const skillsSectionMatch = resumeText.match(/skills[\s\S]{0,30}?:([\s\S]{0,800}?)(?:\n\n[A-Z]|$)/i);
  const skillsText = skillsSectionMatch ? skillsSectionMatch[1] : '';
  const skillsCount = skillsText.length > 0
    ? (skillsText.match(/\b[A-Za-z][A-Za-z.+#]{1,}\b/g) || []).length
    : allFrameworks.length;

  const wordCount = resumeText.trim().split(/\s+/).length;

  // Open source tourist detection
  const claimsOpenSource  = /open[\s-]source enthusiast|open[\s-]source contributor/i.test(text);
  const hasContributions  = /merged\s+pr|merged\s+pull\s+request|maintainer|core\s+team/i.test(text);

  return {
    tutorialApps, frontendSkills, backendSkills,
    certCount, metricsMatches, seniorTitles,
    hasGitHub, hasLiveLink, buzzwords, passiveVerbs,
    aiClaims, hasMLFrameworks, allFrameworks,
    skillsCount, wordCount, claimsOpenSource, hasContributions
  };
}

// ─── Evidence-Based Joke Compiler ─────────────────────────────────────────
// Every joke is explainable by evidence found in the resume.
// NEVER generates random technology jokes.
function compileEvidenceBasedJokes(features, resumeText) {
  const jokes = [];
  const year = new Date().getFullYear();

  // 1. Tutorial app overload
  if (features.tutorialApps.length >= 3) {
    jokes.push({
      evidence: `Projects include: ${features.tutorialApps.join(', ')}.`,
      roast: `You built the complete tutorial starter pack. YouTube autoplay has shaped your entire engineering career trajectory.`
    });
  } else if (features.tutorialApps.length === 2) {
    jokes.push({
      evidence: `Projects include: ${features.tutorialApps.join(' and ')}.`,
      roast: `Two tutorial projects on one resume. The hiring manager has seen this combo 200 times this month. They keep a tally.`
    });
  } else if (features.tutorialApps.length === 1) {
    jokes.push({
      evidence: `Projects include: ${features.tutorialApps[0]}.`,
      roast: `A ${features.tutorialApps[0]} in ${year}. Bold choice. The engineering community thanks you for your service.`
    });
  }

  // 2. Frontend-only with no backend skills
  if (features.frontendSkills.length >= 3 && features.backendSkills.length === 0) {
    jokes.push({
      evidence: `Frontend skills listed: ${features.frontendSkills.slice(0, 4).join(', ')}. Backend skills found: none.`,
      roast: `You've built ${features.frontendSkills.length} layers of beautiful UI and still haven't discovered that data has to come from somewhere. The backend is not a myth.`
    });
  }

  // 3. Certification hoarding
  if (features.certCount >= 4) {
    jokes.push({
      evidence: `Detected ${features.certCount}+ certification mentions on this resume.`,
      roast: `${features.certCount} certifications. Zero deployed projects. Certificates are receipts. Receipts are not the meal.`
    });
  } else if (features.certCount >= 2) {
    jokes.push({
      evidence: `${features.certCount} certifications found.`,
      roast: `Certifications are a good start. They are not a substitute for a GitHub link that connects to working software.`
    });
  }

  // 4. Zero quantified achievements
  if (features.metricsMatches.length === 0) {
    jokes.push({
      evidence: `Zero measurable numbers found anywhere in the document (no %, $, users, ms, requests/sec, or numerical evidence of any kind).`,
      roast: `You 'improved performance', 'streamlined workflows', and 'enhanced user experience'. By how much? For how many users? Nobody knows. Not even you.`
    });
  }

  // 5. Senior title + tutorial projects
  if (features.seniorTitles.length > 0 && features.tutorialApps.length > 0) {
    const title = features.seniorTitles[0];
    jokes.push({
      evidence: `Claims title containing: "${title}". Primary projects include: ${features.tutorialApps[0]}.`,
      roast: `"${title.charAt(0).toUpperCase() + title.slice(1)}" level experience. Flagship project is a ${features.tutorialApps[0]}. The résumé confidence is writing checks the project section cannot cash.`
    });
  }

  // 6. GitHub with no deployed links
  if (features.hasGitHub && !features.hasLiveLink) {
    jokes.push({
      evidence: `GitHub profile linked. Zero deployed live project URLs found.`,
      roast: `GitHub is where code waits for users it will never meet. A link to your repositories is not a portfolio. It is a waiting room.`
    });
  }

  // 7. AI/ML claims with no actual ML tooling
  if (features.aiClaims.length > 0 && !features.hasMLFrameworks) {
    jokes.push({
      evidence: `Claims: "${features.aiClaims[0]}". No PyTorch, TensorFlow, Scikit-learn, model training, or dataset evidence found.`,
      roast: `Calling an OpenAI API endpoint is not machine learning. The model was trained by someone else. On someone else's GPU. With someone else's data. You are their very enthusiastic customer.`
    });
  }

  // 8. Passive ownership language
  if (features.passiveVerbs.length > 0) {
    jokes.push({
      evidence: `Experience bullets contain passive language: "${features.passiveVerbs[0]}" detected.`,
      roast: `"${features.passiveVerbs[0]}" is how you describe what happened near you, not what you built. Own something. Anything. One bullet.`
    });
  }

  // 9. Buzzword overload
  if (features.buzzwords.length >= 3) {
    jokes.push({
      evidence: `Buzzwords found in document: ${features.buzzwords.slice(0, 4).join(', ')}.`,
      roast: `"${features.buzzwords[0]}" is not a skill. "${features.buzzwords[1]}" is not a job title. A recruiter's vomit reflex is conditioned to fire on exactly these words. You used all ${features.buzzwords.length}.`
    });
  }

  // 10. Skills section bloat
  if (features.skillsCount > 30) {
    jokes.push({
      evidence: `Skills section contains approximately ${features.skillsCount}+ individual technology entries.`,
      roast: `${features.skillsCount} skills listed. No human is genuinely proficient in 30 technologies. Pick ten. Know them cold. Prove all ten in an interview. Then come back.`
    });
  }

  // 11. Open source tourist
  if (features.claimsOpenSource && !features.hasContributions) {
    jokes.push({
      evidence: `Claims "open source" involvement. No merged PRs, maintainer credits, or contribution history detected.`,
      roast: `"Open source enthusiast" who has never merged a single PR. That is called reading. Reading is a hobby. Contributing is a skill.`
    });
  }

  // 12. No public code anywhere
  if (!features.hasGitHub && !features.hasLiveLink) {
    jokes.push({
      evidence: `No GitHub profile and no deployed project URLs found anywhere in the document.`,
      roast: `A software engineer resume with zero public code. That is a very confident strategy. It relies entirely on strangers trusting your word.`
    });
  }

  return jokes.slice(0, 5);
}

// ─── HR Thoughts Generator ────────────────────────────────────────────────
function generateHRThoughts(score, features, personaId) {
  let recruiterThought, hmThought, seThought;

  if (score < 30) {
    recruiterThought = `Reviewed in 6 seconds. Screened out in 7. We're moving on.`;
  } else if (score < 60) {
    recruiterThought = `This person clearly builds a lot. Hopefully they also finish things. Sending to the maybe pile.`;
  } else {
    recruiterThought = `Solid profile. Active GitHub. Scheduling a first call this week.`;
  }

  if (features.tutorialApps.length >= 2) {
    hmThought = `I've seen this exact project list 400 times this quarter. I'd still interview them. Mostly because I'm curious where it leads.`;
  } else if (score >= 70) {
    hmThought = `Quantified metrics. Live deployments. This is the resume format I've been requesting since 2019.`;
  } else {
    hmThought = `I'd interview them. The listed skills with this level of confidence usually mean one of two things. Let's find out which.`;
  }

  if (features.metricsMatches.length === 0) {
    seThought = `Needs one number. Any number. A single percentage point changes everything about this document.`;
  } else if (features.allFrameworks.length > 8) {
    seThought = `Too many frameworks, not enough depth on any of them. I'll pick three in the interview. We'll see how far it goes.`;
  } else {
    seThought = `Would work with them. The project depth is real enough to have an actual technical conversation.`;
  }

  return [
    { role: 'Recruiter', thought: recruiterThought },
    { role: 'Hiring Manager', thought: hmThought },
    { role: 'Senior Engineer', thought: seThought }
  ];
}

// ─── Strengths Compiler ───────────────────────────────────────────────────
function compileStrengths(features, analysis) {
  const s = [];
  if (analysis.hasGitHub)   s.push('Active GitHub profile — public accountability for code quality.');
  if (analysis.hasLiveLink) s.push('Deployed project URLs present — evidence of shipping, not just building.');
  if (analysis.metricsCount > 0) s.push(`${analysis.metricsCount} quantified achievement${analysis.metricsCount > 1 ? 's' : ''} — proves engineering ownership with actual numbers.`);
  if (features.backendSkills.length > 0 && features.frontendSkills.length > 0)
    s.push(`Full-stack coverage — frontend (${features.frontendSkills.slice(0, 2).join(', ')}) and backend (${features.backendSkills.slice(0, 2).join(', ')}) both present.`);
  if (features.tutorialApps.length === 0 && analysis.foundSkills.length > 0)
    s.push('No tutorial clone projects detected — work appears original.');
  if (features.buzzwords.length <= 1)
    s.push('Minimal buzzword contamination — reads as technical, not performative.');
  if (analysis.wordCount >= 150 && analysis.wordCount <= 700)
    s.push(`Well-proportioned at ${analysis.wordCount} words — comprehensive without being a novel.`);
  if (features.passiveVerbs.length === 0 && analysis.foundSkills.length > 0)
    s.push('Active ownership language throughout — no passive deflection detected.');
  if (features.certCount >= 1 && analysis.hasLiveLink)
    s.push('Certifications backed by deployed projects — theory meets practice.');
  if (s.length === 0) {
    s.push('Resume is submitted. That surpasses roughly 60% of aspiring developers who never do.');
    s.push('Formatting is coherent. Document opens without errors. That is genuinely an improvement.');
  }
  return s.slice(0, 5);
}

// ─── Fun Metrics Builder ──────────────────────────────────────────────────
function buildFunMetrics(score, features, analysis) {
  const buzzVal      = Math.min(100, analysis.buzzwordCount * 12);
  const tutVal       = Math.min(100, features.tutorialApps.length * 33);
  const prodVal      = analysis.productionExposure;
  const coffeeVal    = Math.max(10, 100 - score);
  const sleepVal     = analysis.sweatIndex;
  const commitVal    = analysis.hasGitHub ? Math.min(90, 35 + Math.round((100 - analysis.sweatIndex) * 0.5)) : 12;
  const interviewRisk= Math.min(100, Math.max(10, 100 - score + analysis.buzzwordCount * 4));
  const mergeConflict= Math.min(100, features.tutorialApps.length * 22 + (features.frontendSkills.length >= 4 && features.backendSkills.length === 0 ? 28 : 0));
  const deployConf   = prodVal;
  const debugEndur   = Math.min(100, Math.max(10, score - 5));

  return [
    { name: 'Buzzword Density',         value: buzzVal,       explanation: buzzVal > 60      ? 'LinkedIn autocomplete has fully colonised this document.'                                : buzzVal > 25      ? 'Detectable buzzword presence. Resume carries a corporate airborne pathogen.'          : 'Suspiciously clean. Almost human.' },
    { name: 'Tutorial Dependency',      value: tutVal,        explanation: tutVal > 60       ? 'Career roadmap appears to be a Udemy subscription autoplay queue.'                      : tutVal > 25       ? 'YouTube is a listed dependency in the package.json of this career.'                   : 'No tutorial clones detected. Either impressive or extremely well disguised.' },
    { name: 'Production Readiness',     value: prodVal,       explanation: prodVal > 70      ? 'Has touched actual production. Rare. Will only panic briefly at the first Sentry alert.': prodVal > 35      ? 'Production-aware in theory. Will freeze when the first real deployment fails.'          : 'Localhost is the production environment. Cloudflare is a distant myth.' },
    { name: 'Coffee Requirement',       value: coffeeVal,     explanation: coffeeVal > 70    ? 'Will require industrial caffeine before this resume becomes hirable.'                    : coffeeVal > 40    ? 'Standard engineering dependency. Resume adds exactly one extra cup.'                   : 'Surprisingly energising. Still requires coffee. Everyone does.' },
    { name: 'Sleep Deprivation',        value: sleepVal,      explanation: sleepVal > 70     ? 'This resume was written at 2AM after a framework rabbit hole. It shows.'               : sleepVal > 35     ? 'Moderate sleep debt visible between the lines of the skills section.'                  : 'Remarkably coherent. Either well-rested or an excellent actor.' },
    { name: 'Commit Consistency',       value: commitVal,     explanation: commitVal > 70    ? 'Green squares present. Whether actual logic lives inside them is a separate question.'  : commitVal > 35    ? 'Intermittent commits. Energy arrives in bursts, typically 24h before a deadline.'      : 'Commit graph is a flatline. Version control is apparently optional.' },
    { name: 'Interview Risk',           value: interviewRisk, explanation: interviewRisk > 70? 'High probability the interviewer asks about something listed that is not actually known.': interviewRisk > 40? 'Moderate. Fine unless system design comes up in the first 10 minutes.'                 : 'Low. Has something to show that is not a calculator.' },
    { name: 'Merge Conflict Probability',value: mergeConflict,explanation: mergeConflict > 60? 'Will introduce a conflict attempting a rebase without understanding what rebase does.'   : mergeConflict > 25? 'Moderate. Pushes directly to main during high-confidence moments.'                    : 'Low. Either disciplined or working entirely alone. Same outcome.' },
    { name: 'Deploy Confidence',        value: deployConf,    explanation: deployConf > 70   ? 'Has actually deployed something. Can be trusted near a CI/CD button.'                  : deployConf > 35   ? 'Will be extremely confident during the first 10 minutes of any deployment.'           : 'Deployment strategy is dragging a folder to Netlify. This is genuinely valid.' },
    { name: 'Debugging Endurance',      value: debugEndur,    explanation: debugEndur > 70   ? 'Has survived a multi-hour session. Character forged in production flame.'               : debugEndur > 40   ? 'Will debug 45 minutes then ask Stack Overflow. Healthy. Efficient.'                   : 'Googles the entire error message including the file path. We all started here.' }
  ];
}

// ─── Structured Roast Output Builder ──────────────────────────────────────
function buildStructuredRoastOutput({ verdictTitle, incidentReport, evidenceJokes, strengths, hrThoughts, score, funMetrics }) {
  const survivalLabel = score >= 90 ? 'EXCELLENT — Immune to most career threats.'
    : score >= 70 ? 'STRONG — Hireable. Minor optimizations advised.'
    : score >= 50 ? 'NEEDS POLISHING — Several critical hazards detected.'
    : score >= 20 ? 'ROASTED — Emergency career rebuild required.'
    : 'IMMEDIATE PRODUCTION OUTAGE — Do not submit to humans.';

  const redFlagsText = evidenceJokes.length > 0
    ? evidenceJokes.map((j, i) => `[${i + 1}]\nEvidence:\n   "${j.evidence}"\n\nRoast:\n   "${j.roast}"`).join('\n\n──\n\n')
    : '✔  No critical red flags detected.';

  const strengthsText  = strengths.map(s => `✔  ${s}`).join('\n');
  const hrText         = hrThoughts.map(h => `${h.role}:\n"${h.thought}"`).join('\n\n');
  const metricsText    = funMetrics.map(m => `${m.name}: ${m.value}%\n   → ${m.explanation}`).join('\n\n');

  return `## Official Verdict\n"${verdictTitle}"\n\n---\n\n## Incident Report\n\n${incidentReport}\n\n---\n\n## Red Flags\n\n${redFlagsText}\n\n---\n\n## Strengths\n\n${strengthsText}\n\n---\n\n## HR Thoughts\n\n${hrText}\n\n---\n\n## Survival Probability\n\n${score}% — ${survivalLabel}\n\n---\n\n## Fun Metrics\n\n${metricsText}`;
}

// ─────────────────────────────────────────────────────────────────────────────

function buildRoastBody(rand, opening, evidence, profile, verdict) {
  const tA = TRANSITION_A[Math.floor(rand() * TRANSITION_A.length)];
  const tB = TRANSITION_B[Math.floor(rand() * TRANSITION_B.length)];
  return `${opening} ${tA} ${evidence} ${tB} ${profile}`;
}

// ─── Roast synthesis: main orchestrator ──────────────────────
function synthesizeCinematicRoast(personaId, name, angles, skills, tutorials, action, rand, text, sweatInfo, productionExposure, sweatIndex, contradictions) {
  const primaryAngle = angles[0];
  const draw = (arr, key) => drawUnique(arr, rand, key || personaId);

  // ── Headline ──────────────────────────────────────────────
  const headlinePool = [];
  contradictions.forEach(c => {
    if (c.type === 'ego_inflation_detected') headlinePool.push("EGO INFLATION DETECTED: SENIOR ARCHITECT CLAIMS, BEGINNER PROJECT EVIDENCE.");
    else if (c.type === 'devops_cosplay') headlinePool.push("DEVOPS COSPLAY DETECTED: AWS CLAIMS, LOCALHOST-ONLY DEPLOYMENTS.");
    else if (c.type === 'api_wrapper_cosplay') headlinePool.push("API WRAPPER COSPLAY: MACHINE LEARNING CLAIMS, CHATGPT API REALITY.");
    else if (c.type === 'backend_anemia') headlinePool.push("BACKEND ANEMIA: CLAIMS FULL STACK, DELIVERS CSS ALIGNMENT.");
    else if (c.type === 'theory_crafting') headlinePool.push("THEORY CRAFTING: ENTERPRISE SKILLS LISTED, ZERO DEPLOYED PROOF.");
  });
  sweatInfo.techAttacks.forEach(att => headlinePool.push(att.phrase.toUpperCase()));

  const headlines = {
    blockchain_bluff: ["BLOCKCHAIN EXPERT. NO BLOCKCHAIN PROJECTS.", "WEB3 VISIONARY. ZERO DEPLOYED CONTRACTS.", "DECENTRALIZED CLAIMS. CENTRALIZED EVIDENCE."],
    ai_bluff: ["MACHINE LEARNING CLAIMS. API WRAPPER REALITY.", "NEURAL NET EVANGELIST. PROMPT COPIER EXECUTION.", "AI ENGINEER. OPENAI API KEY ENGINEER."],
    clone_overload: ["CLONE APP EMPIRE. ZERO ORIGINALITY DETECTED.", "TODO LIST TRILOGY. TUTORIAL SURVIVOR ENERGY.", "GITHUB SAYS ARCHITECT. REPOS SAY STUDENT."],
    certification_hoarder: ["CERTIFIED IN EVERYTHING. DEPLOYED NOTHING.", "UDEMY COLLECTOR. PRODUCTION EXPERTISE ABSENT.", "BADGE COLLECTION STRATEGY. ZERO ENGINEERING EVIDENCE."],
    startup_delusion: ["FUTURE FOUNDER. JUNIOR DEVELOPER REALITY.", "PITCH DECK EVANGELIST. EMPTY REPO STATUS.", "STARTUP VISION. LOCALHOST EXECUTION."],
    buzzword_salad: ["BUZZWORD CHAMPION. ENGINEERING VALUE ABSENT.", "SYNERGY DISRUPTOR. LOCALHOST RESIDENT.", "LINKEDIN AUTOCOMPLETE ACTIVATED."],
    domain_confusion: ["TWENTY SKILLS. THREE TODO APPS.", "SKILL LIST INFLATION. DEPLOYMENT DEFLATION.", "FULL STACK CLAIMS. SHALLOW STACK EVIDENCE."],
    localhost_prisoner: ["LOCALHOST RESIDENT. STATE SECRET CODEBASES.", "ZERO PUBLIC PORTS. INFINITE PRIVATE CONFIDENCE.", "THE ONLY THING DEPLOYED HERE IS AUDACITY."],
    quant_vacuum: ["RESPONSIBLE FOR EVERYTHING. METRICS FOR NOTHING.", "THEORETICAL OUTCOMES. VACUUM OF EVIDENCE.", "ACTIVITY DOCUMENTED. RESULTS ABSENT."],
    corporate_drone: ["PASSIVE ACTION WORDS. ACTIVE STANDBY MODE.", "ASSISTED WITH THE FUTURE. BUILT NONE OF IT.", "PROFESSIONAL BYSTANDER DETECTED."],
    generic_mediocre: ["SURPRISINGLY FORGETTABLE. ENTIRELY STANDARD.", "AVERAGE. SAFE. UNMEMORABLE.", "THIS RESUME READS LIKE A UDEMY WISHLIST IN PDF FORMAT."]
  };

  let title = "";
  if (headlinePool.length > 0 && rand() > 0.25) {
    title = draw(headlinePool, 'headline');
  } else {
    title = draw(headlines[primaryAngle] || headlines.generic_mediocre, 'headline_' + primaryAngle);
  }

  // ── Pure paragraph body — no headers, no labels, no wrappers ─
  const opening  = draw(OPENING_POOL[personaId] || OPENING_POOL.staff_engineer, 'opening_' + personaId);
  const evidence = draw(EVIDENCE_POOL[personaId] || EVIDENCE_POOL.staff_engineer, 'evidence_' + personaId);
  const profile  = draw(PROFILE_POOL[personaId] || PROFILE_POOL.staff_engineer, 'profile_' + personaId);

  const formattedBody = buildRoastBody(rand, opening, evidence, profile);

  const executionLines = [
    "Your portfolio screams potential. Your execution whispers tutorial. Go ship something real and come back.",
    "This résumé wants a senior salary with localhost-only evidence. The math doesn't work.",
    "Go build an actual product before you submit this again. One that someone who doesn't know you can visit.",
    "The gap between what you claim and what you've built is the size of a production cluster you've never operated.",
    "Come back when your code has real users. Not classmates. Not yourself. Real, complaining, ungrateful users.",
    "The confidence is noted. The evidence is not sufficient. These two facts are the entire problem.",
    "Every claim on this résumé requires one thing: a deployed project. That thing is not here.",
    "Ship something. Then write the résumé. Not the other way around.",
    "The ambition is real. The execution history is not yet real. They need to meet before you resubmit.",
    "Build something that breaks in production. Fix it. Document it. Then come back and we'll talk.",
    "The résumé is beautifully formatted. It is also substantively empty. Formatting cannot fix that.",
    "Your next submission should contain a URL that someone you've never met can visit, break, and complain about.",
    "This résumé describes the developer you want to be. Come back when you've become them.",
    "Everything on this page is a claim. Not one of them is backed by something a stranger can click.",
    "I don't doubt the potential. I'm paid to evaluate the evidence. There isn't any."
  ];
  const finalBlow = draw(executionLines, 'finale');

  return { title, body: formattedBody, finalBlow };
}

// ─── Career lore ──────────────────────────────────────────────
function compileCareerLore(personaId, name, skills, tutorials, action, rand) {
  const upperName = name.toUpperCase();
  const mainSkill = skills.length > 0 ? skills[0] : 'REACT';
  const mainTutorial = tutorials.length > 0 ? tutorials[0] : 'TODO LIST';
  const upperAction = action.toUpperCase();

  const lores = {
    staff_engineer: [
      `"BORN IN THE FIRES OF A YOUTUBE TUTORIAL HELL, YOUNG ${upperName} EMERGED WITH A SACRED SCROLL LISTING ${skills.slice(0, 3).join(', ') || 'REACT'}. HIS QUEST: CONQUER THE TECH INDUSTRY WITH A ${mainTutorial} FORGED IN THE ANCIENT FIRES OF 'INTRO TO JAVASCRIPT'. LEGENDS SAY HE SPENT TWO WEEKS IN THE DUNGEON LEARNING THE FORBIDDEN ART OF '${upperAction}' — WHICH MEANS WATCHING OTHERS CODE."`,
      `"IN THE ANCIENT DAWN OF 2023, THE APPRENTICE ${upperName} DETECTED A GRADIENT BUTTON TUTORIAL. LORE DECREES HE INJECTED ${mainSkill} INTO A FRESH REPO, PROCLAIMING ARCHITECT STATUS. HE BEGGED THE COMPILE GODS FOR SECURITY. INSTEAD HE DRIFTED IN TUTORIAL RECURSIONS, STYLING BOX SHADOWS FOR WEEKS."`
    ],
    exhausted_recruiter: [
      `"ONCE UPON A TIME IN THE LAND OF LINKEDIN, ${upperName} DISCOVERED THE ENCHANTED WORDS 'SYNERGY'. BY CASTING 'CROSS-FUNCTIONAL ALIGNMENT' WITH INFLATED TECH ROLES, THEY CREATED A RESUME DESIGNED TO HYPNOTIZE HR AUTOMATIONS. DESPITE ZERO CODING SPELLS CAST IN THE REAL WORLD, THEY SUBMITTED ${mainTutorial} AND WONDERED WHY REJECTION ALWAYS FOLLOWED."`,
      `"IN THE KINGDOM OF APPLICANT TRACKING SYSTEMS, ${upperName} SPENT WEEKS OPTIMIZING KEYWORD DENSITY. THE ATS WAS IMPRESSED. THE HIRING MANAGER WAS NOT. THE GAP BETWEEN THESE TWO REACTIONS IS THE LESSON THAT WAS NEVER LEARNED."`
    ],
    startup_cto: [
      `"DRIVEN BY 10X DISRUPTION PODCASTS, ${upperName} DROPPED OUT OF A PYTHON SEMINAR TO HUSTLE. LORE SAYS THEY SPENT A WEEK WRITING PITCH DECKS FOR ${mainSkill} SYSTEMS WITH ZERO BACKEND. AFTER ATTEMPTING TO '${upperAction}', VCS DECREED THE RUNWAY TOO DILUTED."`,
      `"THE LEGENDARY ${upperName} COFOUNDED A COMPANY IN A COFFEE SHOP IN Q3. THE COMPANY CONSISTED OF A NOTION WORKSPACE, A .IO DOMAIN, AND AN IDEA THAT HAD NOT YET MET A SINGLE USER. THE PITCH DECK WAS POLISHED. THE PRODUCT WAS NOT YET REAL."`
    ],
    faang_gatekeeper: [
      `"IN THE SACRED REALM OF BINARY SEARCH TREES, ${upperName} UNDERTOOK THE INITIATION. THEY MEMORIZED TWO HUNDRED LEETCODE PROBLEMS IN ${mainSkill} BUT SHUNNED CLOUD SCALE. WEARING A PATAGONIA VEST, THEY SUBMITTED ${mainTutorial} BUT STUMBLED WHEN ASKED TO DESIGN A RATE LIMITER FROM FIRST PRINCIPLES."`,
      `"THE CANDIDATE ${upperName} ARRIVED AT THE INTERVIEW WITH FIFTEEN TECHNOLOGIES ON THE SKILLS SECTION AND WAS UNABLE TO EXPLAIN THE DIFFERENCE BETWEEN CONCURRENCY AND PARALLELISM. THE INTERVIEW ENDED AT QUESTION THREE."`
    ],
    devops_veteran: [
      `"EXPERIMENT CARBON-UNIT-${upperName}: DISCOVERED DEVOPS IN 2023. IMMEDIATELY LISTED KUBERNETES. EXPERIMENT WAS SENT INTO AN ENDLESS RECURSION OF RENDERING LOOPS, EXECUTING ${mainTutorial} IN LOCAL RAM. DIAGNOSIS: EXPERIMENT FAILS WHEN REQUIRED TO SURVIVE AN ACTUAL FRIDAY DEPLOY."`,
      `"IN THE DARK HALLS OF LOCALHOST, ${upperName} MAINTAINED AN INFRASTRUCTURE OF ONE SERVER: THEIR LAPTOP. IT WAS ALWAYS ON. IT WAS NEVER MONITORED. WHEN IT FAILED, NO ONE WAS PAGED. WHEN IT SUCCEEDED, NO ONE NOTICED."`
    ],
    rust_elitist: [
      `"WITH AN EAGER HEART AND TUTORIAL CERTIFICATES, ${upperName} STEPPED OUT TO SHAPE THE DIGITAL WORLD IN ${mainSkill}. LORE SAYS THEY SPENT HOURS CODING ${mainTutorial}, WATCHING THE GARBAGE COLLECTOR CLEAN UP THEIR MISTAKES IN REAL TIME, FEELING AN INCREDIBLE SPARK OF SOMETHING THEY COULD NOT YET NAME: DEPENDENCY."`,
      `"${upperName} SELECTED JAVASCRIPT BECAUSE THE COMMUNITY WAS FRIENDLY AND THE ENTRY BARRIER WAS LOW. BOTH OBSERVATIONS WERE CORRECT. BOTH OBSERVATIONS WERE THE PROBLEM."`
    ],
    systems_architect: [
      `"EMPLOYEE REGISTERED: ${upperName}. MOVED TO CUBICLE 42 IN 2024 TO MANAGE ${mainSkill}. COMPLETED STANDARDIZED PROTOCOLS CONCERNING ${mainTutorial}. REFORMATTED THE RESUME THREE TIMES FOR ATS COMPLIANCE. CURRENT OBJECTIVE: AWAIT THE NEXT WEEKLY SYNC TO CLARIFY HOW TO '${upperAction}'."`,
      `"THE ARCHITECT ${upperName} DREW FIFTEEN BOXES CONNECTED BY ARROWS ON A WHITEBOARD AND CALLED IT DISTRIBUTED SYSTEMS DESIGN. THE ARROWS HAD NO LABELS. THE BOXES HAD NO FAILURE MODES. THE WHITEBOARD HAS SINCE BEEN ERASED."`
    ],
    oss_maintainer: [
      `"IN THE GIT DIRECTORIES OF 2024, THE NOMAD ${upperName} ATTEMPTED A DRIVE-BY TYPO FIX IN A README FILE. ENCOURAGED BY AN AUTO-MERGE, THE CANDIDATE SUBMITTED ${mainTutorial} AND MARKED IT AS AN OPEN SOURCE CONTRIBUTION. THE MAINTAINERS SILENTLY CLOSED THE ISSUE."`,
      `"${upperName} STARRED 847 REPOSITORIES. CONTRIBUTED TO ZERO. FORKED TWELVE. MAINTAINED NONE. THE GITHUB PROFILE IS A MUSEUM OF APPRECIATION WITHOUT PARTICIPATION."`
    ]
  };

  const pool = lores[personaId] || lores.staff_engineer;
  return pool[Math.floor(rand() * pool.length)];
}

// ─── Recovery protocol synthesis ─────────────────────────────
function synthesizeRecoveryProtocols(personaId, angles, skills, tutorials, rand) {
  const draw = (arr, key) => drawUnique(arr, rand || Math.random, key);
  const finalAdvices = [];
  const usedTexts = new Set();

  const tryAdd = (pool, key) => {
    if (finalAdvices.length >= 5) return;
    const item = draw(pool, key);
    if (item && !usedTexts.has(item)) {
      finalAdvices.push(item);
      usedTexts.add(item);
    }
  };

  // Angle-specific advice first
  const angleOrder = ['localhost_prisoner','clone_overload','ai_bluff','blockchain_bluff','certification_hoarder','startup_delusion','buzzword_salad','domain_confusion','quant_vacuum','corporate_drone','kubernetes_mismatch','docker_mismatch','generic_mediocre'];
  for (const angle of angleOrder) {
    if (angles.includes(angle) && RECOVERY_FRAGMENTS[angle]) {
      tryAdd(RECOVERY_FRAGMENTS[angle], 'recovery_' + angle);
    }
  }

  // Fill remaining with persona defaults
  const defaults = PERSONA_RECOVERY_DEFAULTS[personaId] || PERSONA_RECOVERY_DEFAULTS.staff_engineer;
  let idx = 0;
  while (finalAdvices.length < 5 && idx < defaults.length) {
    tryAdd([defaults[idx]], 'persona_default_' + personaId + '_' + idx);
    idx++;
  }

  return finalAdvices.slice(0, 5);
}

// ─── Infraction headlines ─────────────────────────────────────
function compileAchievements(angles, skills, tutorials, sweatInfo) {
  const achievements = [];
  const mainTutorial = tutorials.length > 0 ? tutorials[0] : 'TO-DO LIST';
  const mainSkill = skills.length > 0 ? skills[0] : 'REACT';

  if (sweatInfo.sweatinessLevel >= 70) {
    achievements.push({ title: "LinkedIn Autocomplete Resident", desc: `Resume sweatiness reached ${sweatInfo.sweatinessLevel}%. Unsafe volume of corporate buzzwords detected.` });
  }

  sweatInfo.techAttacks.forEach(att => {
    if (att.type === 'docker_mismatch') achievements.push({ title: "Dockerized Localhost", desc: "Docker listed, deployment pipeline absent. Your containers live exclusively on your hard drive." });
    else if (att.type === 'kubernetes_mismatch') achievements.push({ title: "Theoretical Orchestrator", desc: "Kubernetes listed with zero production trauma. Has never debugged a pod crash loop at 3am." });
    else if (att.type === 'devops_mismatch') achievements.push({ title: "Manual Deploy Master", desc: "Claims DevOps, GitHub Actions nowhere in sight. Dragging to Vercel is not CI/CD." });
    else if (att.type === 'ml_mismatch') achievements.push({ title: "API Wrapper Scientist", desc: "Machine learning listed, dataset handling absent. Calling an API is not ML engineering." });
    else if (att.type === 'rust_go_mismatch') achievements.push({ title: "Systems Coping Mechanism", desc: "Go or Rust listed, concurrency scars absent. Probably a hello world or simple REST clone." });
    else if (att.type === 'sql_mismatch') achievements.push({ title: "N+1 Query Architect", desc: "Claims database expertise, query planning absent. Ready to run full table scans on every keystroke." });
  });

  if (angles.includes('buzzword_salad') && achievements.length < 3) achievements.push({ title: "Buzzword Bingo Champion", desc: "Hit passionate, team player, fast learner, strong communicator — that's a full house of meaningless fluff." });
  if (angles.includes('clone_overload') && achievements.length < 3) achievements.push({ title: `${mainTutorial} Trilogy Author`, desc: `The holy trinity of beginner projects: Calculator, Weather App, and ${mainTutorial.toUpperCase()} — the resume starter pack.` });
  if (angles.includes('domain_confusion') && achievements.length < 3) achievements.push({ title: `Skills Section Inflator`, desc: "Successfully convinced himself that watching crash courses equals production-level expertise in 15 domains." });
  if (angles.includes('certification_hoarder') && achievements.length < 3) achievements.push({ title: "Certificate Hoarder Supreme", desc: "Collected certifications like Pokémon cards. None demonstrate actual shipping capability." });
  if (angles.includes('corporate_drone') && achievements.length < 3) achievements.push({ title: "Two-Week Warrior", desc: "Survived an internship longer than some TikTok trends but shorter than most sprint cycles." });
  if (achievements.length < 3) {
    if (angles.includes('localhost_prisoner')) achievements.push({ title: "Localhost Resident", desc: "No deployed links. Your code is a secret between you and your laptop." });
    if (angles.includes('quant_vacuum')) achievements.push({ title: "Metric-Free Dreamer", desc: "Described years of coding with zero quantifiable results anywhere." });
  }
  if (achievements.length === 0) achievements.push({ title: "Standard Code Cog", desc: "Conformed perfectly to standard tutorial curricula with minimal anomalies." });

  return achievements.slice(0, 5);
}

function generateBattleItems(text, rand, sweatInfo) {
  const pool = [];
  if (text.includes('responsible for') || text.includes('assisted')) {
    pool.push({ original: "Responsible for developing features and helping team members.", improved: "Shipped 14 high-throughput microservices using React/Node.js, improving load latency by 28%.", reason: "Metrics over passive attendance. 'Responsible for' tells reviewers you just sat near the code." });
  }
  if (sweatInfo.techAttacks.some(a => a.type === 'docker_mismatch')) {
    pool.push({ original: "Used Docker for containerizing web applications.", improved: "Configured multi-stage Docker builds and automated image promotion pipelines, slashing artifact sizes by 45%.", reason: "Shows you understand builder patterns and pipelines instead of just typing 'docker run' locally." });
  }
  if (sweatInfo.techAttacks.some(a => a.type === 'kubernetes_mismatch')) {
    pool.push({ original: "Familiarity with Kubernetes cluster deployment.", improved: "Managed autoscaling K8s deployments on EKS, maintaining 99.9% uptime during high-traffic events.", reason: "Prove production capability and scale. Recruiters want scaling scars, not tutorials." });
  }
  if (sweatInfo.techAttacks.some(a => a.type === 'ml_mismatch')) {
    pool.push({ original: "Integrated machine learning models for user analytics.", improved: "Engineered ETL pipelines to preprocess 10M+ training rows, increasing classifier F1-score from 0.72 to 0.89.", reason: "Shows dataset expertise. Importing an API wrapper does not make you an ML scientist." });
  }
  if (text.includes('team player') || text.includes('passionate')) {
    pool.push({ original: "A passionate team player looking to collaborate on building modern applications.", improved: "Collaborated with 6 cross-functional engineers to refactor legacy code, reducing bundle sizes by 32%.", reason: "Replace fluffy adjectives with concrete execution numbers. Quantifiable achievements are what matter." });
  }
  const basePool = [
    { original: "Developed UI components using React and styled CSS.", improved: "Designed modular React component libraries using CSS variables, slashing UI styling bugs by 60%.", reason: "Highlights modular architecture and error prevention instead of standard CSS styling homework." },
    { original: "Worked with SQL databases for backend integration.", improved: "Optimized complex PostgreSQL queries and sharded tables, reducing query latencies by 35%.", reason: "Highlights performance tuning scars instead of basic SELECT statements." }
  ];
  const combined = [...pool, ...basePool];
  const shuffled = combined.filter((v, i, a) => a.findIndex(t => t.original === v.original) === i).sort(() => rand() - 0.5);
  return shuffled.slice(0, 2);
}





// ============================================================
//  EXPANDED ROAST POOLS — POLISHED COMEDIC ADDITIONS
// ============================================================

const openingsAdd = {
  staff_engineer: [
    "I ran your resume through our compiler and it threw an OutofMemoryError just trying to parse your objectives.",
    "If this resume was a pull request, I would close it, delete the branch, block your GitHub, and report you to HR for emotional harassment.",
    "Your experience section has the load-bearing strength of wet cotton candy in a monsoon.",
    "I've seen legacy code written in the 70s by drunk mainframe operators that had more self-awareness and better structure than this.",
    "I sent this resume to my therapist to explain why I have trust issues with junior developers."
  ],
  faang_gatekeeper: [
    "I showed this resume to our AI recruiter and it immediately uninstalled itself to avoid screening you.",
    "You list 'scale' on here, but the only thing you've ever scaled is your weight during lock-downs.",
    "Your career history looks like a series of side quests that you abandoned the moment you had to write a single line of CSS.",
    "I've seen LeetCode solutions written by actual bots that had more personality and less boilerplate than this.",
    "You want a Google salary for tutorial-level projects. The math is not mathing, my friend."
  ],
  devops_veteran: [
    "Your deploy pipeline is so slow and broken, I'm pretty sure it relies on Carrier Pigeons to transfer the zip files.",
    "I printed your resume and it immediately caught fire, which is the most stable deployment you've had all year.",
    "Looking at your deployment history, I can tell you think CI/CD stands for 'Constant Interruptions and Catastrophic Disasters'.",
    "I ran this resume through our security scanner and it flagged your skill section as a threat to global stability.",
    "Your experience section has the load-bearing capability of a wet napkin in a hurricane."
  ],
  oss_maintainer: [
    "Your open-source contributions are just you correcting spelling mistakes in other people's READMEs to look busy.",
    "I took one look at your public repositories and my linter started crying.",
    "If repository stars were currency, your projects would be filing for bankruptcy.",
    "Your commit messages are a diary of a developer slowly losing their sanity to a compiler.",
    "I looked at your code and it looks like a collaboration between a cat walking on a keyboard and a very bad bot."
  ],
  exhausted_recruiter: [
    "I've swiped left on dating profiles with fewer red flags and more honesty than this resume.",
    "Your objective statement says you're a 'disruptive innovator' but your history says you're a 'professional seat-warmer'.",
    "Reading your experience section felt like trying to find the recipe on a food blog—just endless filler.",
    "You listed 'strong communication' but your resume is formatted like a corrupted CSV export.",
    "I showed your resume to the hiring manager and he asked if we were hiring for a comedy show."
  ],
  rust_elitist: [
    "You write JavaScript. That's it. That's the roast. May the garbage collector have mercy on your soul.",
    "This resume is unsafe at compile time, runtime, and reading time.",
    "You list C++ because you printed 'Hello World' in a lab, but a single pointer would send you into a panic attack.",
    "Your dependency tree is so heavy it has its own gravitational pull.",
    "I audited your github and the only thing memory-safe about your projects is that nobody has ever visited them."
  ],
  startup_cto: [
    "Your pitch deck has 45 slides of financial projections and 0 slides of actual code. Congratulations on your career in fiction.",
    "You describe your app as 'AI-driven' which is a very fancy way of saying you call the OpenAI API with a hardcoded prompt.",
    "Your startup's runway is shorter than the time it takes for a VC to check their phone during your pitch.",
    "I've seen pyramid schemes with more realistic revenue models than your stealth startup.",
    "You call yourself a founder because you bought a domain name and spent a weekend editing a Figma template."
  ],
  systems_architect: [
    "Your architecture diagram is a collection of boxes connected by arrows that describes no actual data flow.",
    "A distributed system is not a marketing claim. It is a set of engineering tradeoffs you clearly haven't made.",
    "CAP theorem is on your resume. The implementation history suggests you cannot explain what the C stands for.",
    "You have designed systems that have never handled failure modes, which means you have not actually designed systems.",
    "I review architecture for organizations that operate at scale. Your architecture operates at localhost."
  ]
};

const evidencesAdd = {
  staff_engineer: [
    "You describe your role as 'leading optimization' which is a very corporate way of saying you changed a background from gray to slightly lighter gray.",
    "Your GitHub contribution grid looks like a Minecraft flat world—completely empty except for a few sheep.",
    "You listed TypeScript because you write standard JS and cast everything as 'any' whenever the compiler starts complaining.",
    "Your unit test suite runs so fast, I'm pretty sure it's just a script that prints a green checkmark emoji and exits.",
    "You claim ownership of the microservices design, but your services communicate via email."
  ],
  faang_gatekeeper: [
    "You listed 'database replication' because you once copy-pasted your sqlite file and renamed it 'backup.db'.",
    "You claim to understand distributed systems but you still use global variables to coordinate your local scripts.",
    "You listed Docker, but we both know your container knowledge starts and ends with copy-pasting command lines from YouTube thumbnails.",
    "Your skills section is a Wikipedia read list of frameworks you've heard of in a Twitter space.",
    "You claim to design high-throughput APIs but your server gets rate-limited by its own local console."
  ],
  devops_veteran: [
    "You listed AWS but your IAM policy is a single root user with full administrator permissions—a security hazard.",
    "Your CI/CD pipeline is just you force-pushing to master and praying the build succeeds.",
    "Monitoring is completely absent. Your uptime indicator is literally a post-it note saying 'should be fine'.",
    "Your backup strategy is storing the database dumps in the same directory on the same local disk.",
    "You claim infrastructure-as-code but have never managed a Terraform state file that survived a merge conflict."
  ],
  oss_maintainer: [
    "You list 'collaborative development' but every single repository has exactly one contributor: you.",
    "The project has a license file, and that is the only file that has been updated in the last eight months.",
    "Your code has no tests. Code without tests is a statement that you do not trust it when you aren't looking.",
    "The codebase has 42 stars because you asked all your classmates to star it on the first day of class.",
    "Your issue tracker is empty because nobody else is using the software you spent three months writing."
  ],
  exhausted_recruiter: [
    "You list 'experience with agile'—meaning you sat in standup meetings and said 'no blockers' for six months.",
    "Your experience section describes the same role at three companies with different names and identical bullets.",
    "The only number on your resume is your phone number. Managers want outcomes, not just digits.",
    "Your summary is an essay about ambition, and your experience is just evidence of attendance.",
    "You listed a certification that expired in 2024. Talk about a lack of attention to detail."
  ],
  rust_elitist: [
    "Your dependency tree contains 14,000 packages because you needed a library to check if a number is even.",
    "You listed Rust but your repository contains exactly one file with 500 lines of unwrap() statements.",
    "Your app consumes 2GB of RAM to render a single static page because you bundled five different charting libraries.",
    "You claim concurrency expertise but your code runs in a single-threaded loop that halts whenever a file is read.",
    "Your database schema is so lawless, I'm pretty sure it's legally classified as anarchy."
  ],
  startup_cto: [
    "Your product-market fit analysis consists of a single waitlist with three entries, and two of them are your roommate.",
    "You claim to have raised seed capital but the capital was actually a small loan from your dad's credit card.",
    "Your database runs on a local SQLite file in '/tmp' because configuring Postgres was 'too bureaucratic'.",
    "You listed 'VC relations' because you sent a cold email to three partners who immediately archived it.",
    "Your business model is selling subscriptions for a product that hasn't been coded yet."
  ],
  systems_architect: [
    "You claim to write scalable APIs but you run all database queries inside synchronous loops.",
    "Your architectural design is copy-pasted from a Netflix tech blog post with no understanding of the trade-offs.",
    "Your database is a single PostgreSQL instance with no replication, running on a free tier node.",
    "You claim to optimize for latency but you have never configured a CDN or used a caching layer.",
    "Your system boundaries are completely arbitrary and make zero sense from domain-driven design."
  ]
};

const profilesAdd = {
  staff_engineer: [
    "You're the kind of developer who spends three days styling a terminal theme and thirty seconds writing a function that crashes the server.",
    "Your development strategy consists of starting a new project every time you hit a bug you can't solve on Stack Overflow.",
    "You believe 'clean architecture' is just nesting empty folders until the bugs are impossible to find.",
    "You listed 'mentorship' because you once pointed a junior developer to a Google search results page you didn't read yourself.",
    "You treat databases like a wishing well—you throw a query in, close your eyes, and hope it doesn't time out."
  ],
  faang_gatekeeper: [
    "You are a LeetCode memorizer who can reverse a linked list but gets a panic attack when you have to run 'npm install'.",
    "You treat frameworks like Pokemon cards—you want to collect them all without ever using them in battle.",
    "Your career goal is getting hired at Apple just so you can put the logo in your Twitter bio.",
    "You are the kind of developer who will spend 12 hours optimizing a binary search and then deploy it on a dataset of size 5.",
    "You believe you're a senior engineer because you watched a 4-hour system design video while playing video games."
  ],
  devops_veteran: [
    "You are an SRE who has never written a runbook or conducted a blameless post-mortem.",
    "Your relationship with production is one of theoretical familiarity based on Medium articles.",
    "You use DevOps tools as credentials to look senior rather than to solve real operational problems.",
    "You think high availability is running a single EC2 instance on a free tier with automatic restarts.",
    "You have never been responsible when something was broken for real users at 3am. That trauma is missing."
  ],
  oss_maintainer: [
    "Your relationship with code review is one of author, never reviewer—a significant knowledge gap.",
    "You have never had to maintain backward compatibility for someone else's integration.",
    "You write code in isolation, which produces isolated code that cannot survive team environments.",
    "You listed your portfolio as an open-source project. It's just a static HTML file hosted on github.",
    "You only code when you're being graded. The gaps in your commit history align perfectly with holidays."
  ],
  exhausted_recruiter: [
    "Your professional narrative is borrowed from LinkedIn influencers and applied to a background that doesn't support it.",
    "You describe yourself as a 'thought leader' on a resume with exactly one year of junior experience.",
    "The internship bullet points are written in the passive voice. 'Assisted with research' means ordered lunch.",
    "The resume includes 'proficient in Microsoft Office'. It is 2026. This is not a technical skill.",
    "You describe yourself as 'passionate' but your github graph has been gray since the bootcamp ended."
  ],
  rust_elitist: [
    "You treat memory safety like a religion but your code runs on a machine that has its firewall completely turned off.",
    "You write code like a toddler playing with scissors—confident, fast, and guaranteed to cut something important.",
    "You believe garbage collection is a human right, which is why your servers crash due to memory leaks every four hours.",
    "Your model of pointers is 'arrows in a slideshow' and you live in constant fear of segmentation faults.",
    "You are a Node.js developer masquerading as a systems programmer because you ran a Rust hello-world once."
  ],
  startup_cto: [
    "You have startup energy without startup evidence.",
    "The vocabulary of venture capital has colonized your resume in the absence of venture results.",
    "You are a founder in the same way that purchasing a domain name makes you a property owner.",
    "Your startup was 'acquired'—meaning you deleted the repository and updated your LinkedIn profile.",
    "Your co-founder is your dog. The dog is the only team member who doesn't argue with your tech choices."
  ],
  systems_architect: [
    "Your schema has circular dependencies that will deadlock the database on the first concurrent transaction.",
    "You listed 'event-driven architecture' because you use node event emitters for local state changes.",
    "Your system requires manual intervention to recover from a simple network partition. That is not distributed.",
    "The database schema has zero constraint validation. Data corruption is a matter of time.",
    "You describe 'highly scalable architecture' but your server runs on a single thread with no clustering config."
  ]
};

const verdictsAdd = {
  staff_engineer: [
    "Strong decline. I would hire you to explain what you think you know, but I wouldn't trust you with a text editor.",
    "Rejected. Your code has the structural integrity of a wet cardboard box in a hurricane.",
    "No hire. Not out of malice, but because our on-call team deserves to sleep at night.",
    "Archived in the trash bin. Return when your projects have actual users instead of just your mom.",
    "Declined. The gap between your claims and your git history is wide enough to host a Minecraft server.",
    "Passed. I respect the hustle, but my compiler doesn't.",
    "No offer. Your testing coverage is so low, it's basically a state secret.",
    "Passed on. The trajectory is fine, but you need to survive a real production outage before you call yourself a senior engineer."
  ],
  faang_gatekeeper: [
    "No hire. Your code looks like it was written by three different chatbots arguing about styling rules.",
    "Rejected. I'd ask you to write a rate limiter, but your resume suggests you'd just write a sleep loop.",
    "Archived. Save yourself the interview prep and apply for a project manager role instead.",
    "Declined. Your system architecture has more single points of failure than my last relationship.",
    "Passed on. We asked for distributed database scars, not a tutorial weather app.",
    "No offer. Return when you have shipped something that survived a single real user who wasn't you.",
    "Rejected. The only thing you scale is the level of concern I have for your team.",
    "Pass. I'd say good luck, but you're going to need a miracle."
  ],
  devops_veteran: [
    "REJECTED. I would not trust you to manage the deployment of a static HTML landing page.",
    "Hard pass. Your pipeline has more red lights than a Dutch district.",
    "No hire. Our servers are unstable enough without you adding your custom scripts to the cron list.",
    "Archived. Go learn what an SSH key is before you apply for SRE roles.",
    "Declined. You listed Terraform but your state file is a local mess of locks that are permanently stuck.",
    "Passed on. The warning indicators in your console are bright enough to guide planes at night.",
    "No offer. Your container images are so large, they have their own zip codes.",
    "Decline. The database ran out of disk space just reading your qualifications."
  ],
  oss_maintainer: [
    "WON'T MERGE. The code quality in your repositories is a threat to the open-source community.",
    "Closed as duplicate. We have seen this exact boilerplate portfolio 50 times today.",
    "PR rejected. Please rewrite your entire career strategy and try again.",
    "GIT BLOCK. The author has been banned from submitting resumes to this company.",
    "No offer. Your code organization has the structural integrity of a soup bowl with holes.",
    "Passed on. The test suite returns exit code 0 because there are literally no assertions.",
    "Declined. You listed your fork as an original project. Changing the name in package.json is not coding.",
    "Decline. Return when you have written code that someone else besides your teacher has read."
  ],
  exhausted_recruiter: [
    "Thank you for your application. We will not be moving forward at this time.",
    "Archived in the rejection queue. Nothing personal — it is a volume problem you didn't solve.",
    "Filing this as 'screened out'. The reasons are visible to anyone who reads past the summary.",
    "Application rejected. Please rebuild this resume from scratch with substance as the primary goal.",
    "Forwarded this to the junior roles team. They had the same feedback.",
    "The answer is no. The answer will remain no until there is evidence that the answer should change.",
    "Declined. 'References available upon request' has not communicated anything useful since 2008.",
    "No hire. You have applied for a senior role. Your most recent job title was junior. The gap is too wide."
  ],
  rust_elitist: [
    "BORROW CHECKER FAILED. This candidate does not own the skills they are claiming to borrow.",
    "SEGFAULT. Your ego has accessed restricted memory space. Abort process.",
    "Unsafe block detected in career trajectory. Rejection is the only memory-safe option.",
    "Null pointer exception: your experience is a reference to a memory address that doesn't exist.",
    "Decline. Go back to your garbage collector, it's the only thing willing to clean up after you.",
    "Type mismatch. Expected 'Senior Engineer', found 'ChatGPT Prompt Wrapper'.",
    "Rejected. The compiler panicked trying to figure out how you got hired at your last job.",
    "Passed on. The lifetime of your skills is shorter than the duration of the interview."
  ],
  startup_cto: [
    "VC RUNWAY EXHAUSTED. The pitch was not compelling. The product does not exist.",
    "Pass at this stage. Come back with users, revenue, or one real shipped thing.",
    "We do not invest in Figma files or Discord servers called startups.",
    "HUSTLE CAPACITY EXHAUSTED: Ambition is present. Execution history is absent.",
    "Declined. The idea is interesting. The evidence that you can build it is missing.",
    "No term sheet. Insufficient evidence of shipping to justify further conversation.",
    "No offer. You talk about scaling to millions. Your setup has never met three concurrent users.",
    "REJECTED. Hustle culture vocabulary does not substitute for deployed production infrastructure."
  ],
  systems_architect: [
    "DEADLOCK DETECTED. This architecture has circular dependencies that will deadlock in production.",
    "The system described here would not survive its first traffic spike with any dignity.",
    "TIMEOUT: The design review meeting this resume would generate would exceed its scheduled duration.",
    "No. The architecture has gaps that suggest the design was done without considering failure modes.",
    "Rejected for architect-level roles. The evidence points to software engineer level responsibilities.",
    "Passed on. Your system has zero auditing, zero logs, and zero monitoring. Debugging is guessing.",
    "Declined. You listed 'CQRS' because you write read queries in one file and write queries in another.",
    "REJECTED. You design systems on whiteboards and not in production, and the difference is everything."
  ]
};

// Push additions to existing pools
for (const key in openingsAdd) {
  if (OPENING_POOL[key]) OPENING_POOL[key].push(...openingsAdd[key]);
}
for (const key in evidencesAdd) {
  if (EVIDENCE_POOL[key]) EVIDENCE_POOL[key].push(...evidencesAdd[key]);
}
for (const key in profilesAdd) {
  if (PROFILE_POOL[key]) PROFILE_POOL[key].push(...profilesAdd[key]);
}
for (const key in verdictsAdd) {
  if (VERDICT_POOL[key]) VERDICT_POOL[key].push(...verdictsAdd[key]);
}

// ════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════════════════════


// ============================================================
//  INTELLIGENT ROAST FORMAT SELECTION ENGINE (30 FORMATS)
// ============================================================

const ROAST_FORMATS = [
  {
    id: "github_issue",
    name: "GitHub Issue",
    priority: "high",
    scoreFn: (text, features) => (features.hasGitHub ? 40 : 0) + (/\b(git|github|repository|repo|pull request|branch)\b/i.test(text) ? 20 : 0),
    formatFn: (data) => `### ⚠️ Issue #404: System Architecture Insufficiency
**State**: Closed (wontfix)
**Assignee**: ${data.candidateName || "Candidate"}
**Labels**: bug, wontfix, tutorial-tier

**Description**:
${data.body}

**Final Blow**:
> ${data.finalBlow}`
  },
  {
    id: "npm_install_log",
    name: "npm Install Log",
    priority: "high",
    scoreFn: (text, features) => (/\b(node|npm|javascript|react|express|next\.js|package\.json)\b/i.test(text) ? 45 : 0),
    formatFn: (data) => {
      const cleanName = (data.candidateName || "candidate").toLowerCase().replace(/[^a-z0-9]/g, '-');
      return `$ npm install ${cleanName}-experience
npm WARN deprecated ${cleanName}-stack@0.0.1: This package is completely load-bearing hope.
npm ERR! code EROAST
npm ERR! path /usr/local/lib/node_modules/sanity

npm ERR! ${data.body.replace(/\n/g, "\nnpm ERR! ")}

npm ERR! A complete log of this disaster can be found in: /tmp/sanity-debug.log`;
    }
  },
  {
    id: "docker_log",
    name: "Docker Log",
    priority: "high",
    scoreFn: (text, features) => (/\b(docker|kubernetes|container|k8s|pod|pods)\b/i.test(text) ? 45 : 0),
    formatFn: (data) => `[INFO] Starting container dots ${(data.candidateName || "candidate").toLowerCase().replace(/[^a-z0-9]/g, '-')}-app:latest
[WARN] Health check failed: Container is not responding to ping.
[ERROR] Out of Memory: Container exited with status 137.
[CRITICAL] Error logs:

${data.body}

[FATAL] dots ${data.finalBlow}`
  },
  {
    id: "security_audit",
    name: "Security Audit",
    priority: "high",
    scoreFn: (text, features) => (/\b(security|cyber|owasp|vulnerability|vulnerabilities|pen-test|cybersecurity)\b/i.test(text) ? 45 : 0),
    formatFn: (data) => `### 🛡️ OWASP Sanity Audit Report
**Target**: ${data.candidateName || "Candidate"} Portfolio
**Risk Level**: CRITICAL (10/10 Vulnerabilities)

**Vulnerability Summary**:
${data.body}

**Mitigation**:
Recommend touching grass immediately. ${data.finalBlow}`
  },
  {
    id: "startup_investor",
    name: "Startup Investor Review",
    priority: "high",
    scoreFn: (text, features) => (features.startupCount >= 2 || /\b(founder|ceo|startup|pitch|equity|runway|funding|pre-seed|seed)\b/i.test(text) ? 40 : 0),
    formatFn: (data) => `### 💸 Seed Round Investor Review
**Company**: Localhost Stealth MVP
**Founder**: ${data.candidateName || "Candidate"}
**Decision**: PASS (No Term Sheet)

**Review Notes**:
${data.body}

**Verdict Summary**:
${data.finalBlow}`
  },
  {
    id: "ai_review",
    name: "AI Review / GPU Exhaustion",
    priority: "high",
    scoreFn: (text, features) => (/\b(ai|ml|openai|pytorch|tensorflow|neural|llm|gpt|llms)\b/i.test(text) ? 45 : 0),
    formatFn: (data) => `>>> Running inference on candidate profile...
>>> GPU Temperature: 98°C
>>> Warning: Model hallucinations detected in skills block.
>>> Error: Content generation failed due to quality threshold constraints.

>>> Log Output:
${data.body}

>>> Diagnostic conclusion:
${data.finalBlow}`
  },
  {
    id: "hr_rejection",
    name: "HR Rejection Email",
    priority: "medium",
    scoreFn: (text, features) => (features.wordCount < 150 || features.metricsCount === 0 ? 30 : 0),
    formatFn: (data) => `Subject: Regret: Your Application for Senior Software Engineer

Dear ${data.candidateName || "Candidate"},

Thank you for your interest in our company. After reviewing your qualifications, we found that:
${data.body}

We will keep your resume on file (in our digital shredder).

Sincerely,
${data.finalBlow}`
  },
  {
    id: "court_verdict",
    name: "Court Verdict",
    priority: "medium",
    scoreFn: (text, features) => (/\b(responsible|assisted|collaborated)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### ⚖️ IN THE COURT OF ENGINEERING SANITY
**Case**: The People vs. ${data.candidateName || "Candidate"}
**Verdict**: GUILTY of Grand Larceny of Boilerplate

**Judicial Review**:
${data.body}

**Sentence**:
${data.finalBlow}`
  },
  {
    id: "doctor_diagnosis",
    name: "Doctor Diagnosis",
    priority: "medium",
    scoreFn: (text, features) => (/\b(burnout|caffeine|exhausted|tired)\b/i.test(text) ? 35 : 0),
    formatFn: (data) => `### 🩺 CLINICAL DIAGNOSIS REPORT
**Patient**: ${data.candidateName || "Candidate"}
**Symptom**: Terminal Framework Hoarding

**Diagnosis**:
${data.body}

**Prescription**:
${data.finalBlow}`
  },
  {
    id: "police_report",
    name: "Police Incident Report",
    priority: "medium",
    scoreFn: (text, features) => (/\b(crash|hack|breach|incident|unauthorized)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `POLICE DEPARTMENT INCIDENT LOG
Incident ID: #9821
Officer: SRE Veteran
Suspect: ${data.candidateName || "Candidate"}

Incident Summary:
${data.body}

Action Taken:
${data.finalBlow}`
  },
  {
    id: "horror_story",
    name: "Horror Story",
    priority: "medium",
    scoreFn: (text, features) => (/\b(jquery|php|legacy|cobol|svn|wordpress)\b/i.test(text) ? 35 : 0),
    formatFn: (data) => `### 👻 The Curse of the Legacy Codebase
It was midnight when the team lead opened the index.js file...

Inside, they found:
${data.body}

They say that to this day, if you run the build:
> ${data.finalBlow}`
  },
  {
    id: "dating_profile",
    name: "Dating Profile Red Flags",
    priority: "medium",
    scoreFn: (text, features) => (/\b(passionate|team player|motivated|enthusiastic)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### 💔 Relationship Red Flag Report
**Name**: ${data.candidateName || "Candidate"}
**Compatibility**: 0% (Fatal Error)

**Red Flag List**:
${data.body}

**Verdict**:
${data.finalBlow}`
  },
  {
    id: "yelp_rant",
    name: "Customer Review / Yelp Rant",
    priority: "medium",
    scoreFn: (text, features) => (/\b(ui|ux|css|frontend|figma|design|tailwind|styles)\b/i.test(text) ? 35 : 0),
    formatFn: (data) => `### ⭐ yelp.com - 1/5 Stars Review
**Reviewed by**: Senior Team Lead
"I hired this candidate expecting production-ready code, but all I got was:
${data.body}
${data.finalBlow}"`
  },
  {
    id: "amazon_review",
    name: "Amazon Review",
    priority: "medium",
    scoreFn: (text, features) => (/\b(certificate|certified|udemy|coursera|credentials)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### ⭐ Amazon Verified Purchase - 1/5 Stars
**Item**: ${data.candidateName || "Candidate"} Resume
**Title**: Labeled 'Senior Developer', arrived as three junior templates.

**Review**:
${data.body}

**Return Status**:
${data.finalBlow}`
  },
  {
    id: "google_search",
    name: "Google Search Autocomplete",
    priority: "medium",
    scoreFn: (text, features) => (/\b(how to|basic|tutorial|tutorials|simple)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### 🔍 Google Search Results
Search Query: "how does ${data.candidateName || "candidate"} write code"

*Did you mean*:
- "how to hide compiler warnings in production"
- "is it okay to delete the test folder to pass CI"

*Description*:
${data.body}

*Final Blow*:
${data.finalBlow}`
  },
  {
    id: "stack_overflow",
    name: "Stack Overflow Closure Notice",
    priority: "medium",
    scoreFn: (text, features) => (/\b(copy-paste|question|help|debug|issue)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### ❌ Closed on Stack Overflow
**Question**: How do I solve this basic bug?
**Closed by**: Senior Moderator
**Reason**: Closed as off-topic because:
${data.body}

**Moderator Note**:
${data.finalBlow}`
  },
  {
    id: "git_commit",
    name: "Git Commit History",
    priority: "medium",
    scoreFn: (text, features) => (/\b(commit|merge|branch|rebase|push|pull)\b/i.test(text) ? 35 : 0),
    formatFn: (data) => `$ git log --oneline
* f82a91d (HEAD -> master) [PUNCHLINE: dots ${data.finalBlow}]
* c9182aa [STITCHED ROAST: ${data.body.replace(/\n/g, " ")}]
* 00192ba (origin/master) init: starting another tutorial project to escape debugging the old one`
  },
  {
    id: "windows_bsod",
    name: "Windows Blue Screen of Death",
    priority: "medium",
    scoreFn: (text, features) => (/\b(memory|pointer|deadlock|heap|stack overflow)\b/i.test(text) ? 35 : 0),
    formatFn: (data) => `A problem has been detected and Windows has been shut down to prevent damage to your eyes.

SYSTEM_SANITY_FATAL:
${data.body}

Technical Information:
*** STOP: 0x000000D1 (${data.finalBlow})`
  },
  {
    id: "therapy_session",
    name: "Therapy Session Transcript",
    priority: "medium",
    scoreFn: (text, features) => (/\b(visionary|innovator|guru|ninja|wizard)\b/i.test(text) ? 35 : 0),
    formatFn: (data) => `### 🛋️ Therapy Intake Transcript
**Patient**: ${data.candidateName || "Candidate"}
**Therapist**: Let's talk about the delusions of grandeur in your career goals...

**Session Notes**:
${data.body}

**Therapist Summary**:
${data.finalBlow}`
  },
  {
    id: "sports_commentary",
    name: "Sports Live Play-by-Play",
    priority: "medium",
    scoreFn: (text, features) => (/\b(award|hackathon|champion|win|won|first place)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### 🎙️ Sports Live Commentary
"Welcome back to the engineering championships! dots ${data.candidateName || "Candidate"} is at the keyboard...

And they're going for the deployment... oh! It's a disaster!
${data.body}
The crowd is in absolute shock!"

**Final Call**:
${data.finalBlow}`
  },
  {
    id: "vc_term_sheet",
    name: "VC Term Sheet Rejection",
    priority: "medium",
    scoreFn: (text, features) => (/\b(disruptive|saas|mrr|valuation|term sheet)\b/i.test(text) ? 35 : 0),
    formatFn: (data) => `### 💸 Venture Capital Investment Committee Report
**Target**: Stealth Startup (Hype MVP)
**Founder**: ${data.candidateName || "Candidate"}
**Verdict**: No Investment (Valuation: ₹0)

**Assessment**:
${data.body}

**Decision Note**:
${data.finalBlow}`
  },
  {
    id: "cscareerquestions",
    name: "Reddit r/cscareerquestions Roast Thread",
    priority: "medium",
    scoreFn: (text, features) => (/\b(student|internship|junior|new grad|entry level)\b/i.test(text) ? 35 : 0),
    formatFn: (data) => `### 💬 reddit.com/r/cscareerquestions
**Posted by**: u/hiring_manager_bot
**Title**: "Review my resume (getting 0 interviews in 6 months)"

**Top Comment (1.2k upvotes)**:
${data.body}

**Mod sticky**:
${data.finalBlow}`
  },
  {
    id: "gordon_ramsay",
    name: "Gordon Ramsay Kitchen Nightmare",
    priority: "medium",
    scoreFn: (text, features) => (/\b(spaghetti|raw|messy|nightmare)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### 🤬 GORDON RAMSAY IN THE CODEBASE
"Look at this codebase! It's raw! It's absolutely raw!

Who wrote this?:
${data.body}

${data.finalBlow}"`
  },
  {
    id: "gen_z_tiktok",
    name: "Gen Z / TikTok Brain Rot Critique",
    priority: "medium",
    scoreFn: (text, features) => (/\b(aesthetic|vibe|vibes|trendy|emoji)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### 💀 Resume Check: No Cap
**Candidate**: ${data.candidateName || "Candidate"}
**Vibe Check**: Failed the assignment 💅

**Review**:
${data.body}

That's definitely not very demure, not very mindful. ${data.finalBlow}`
  },
  {
    id: "shakespearean",
    name: "Shakespearean Tragedy Play",
    priority: "medium",
    scoreFn: (text, features) => (/\b(thou|thee|shall|art|hark)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### 🎭 The Tragedy of the Software Apprentice
**Act III, Scene II**
*Enter ${data.candidateName || "Candidate"} with a broken compilation run.*

**Chorus**:
"Hark! Behold the compilation errors of thy labor:
${data.body}

Alas, the server crashes, and the night grows cold... ${data.finalBlow}"`
  },
  {
    id: "corporate_pip",
    name: "Corporate PIP",
    priority: "medium",
    scoreFn: (text, features) => (/\b(performance|average|improvement|pip)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### 📋 Performance Improvement Plan (PIP)
**Employee**: ${data.candidateName || "Candidate"}
**Duration**: 30 Days (Immediate Action Required)

**Area of Deficiency**:
${data.body}

**Required Goal**:
${data.finalBlow}`
  },
  {
    id: "aws_bill",
    name: "AWS Bill Breakdown / Cost Audit",
    priority: "medium",
    scoreFn: (text, features) => (/\b(aws|ec2|s3|serverless|lambda)\b/i.test(text) ? 40 : 0),
    formatFn: (data) => `### ☁️ AWS Cost & Usage Audit
**Account**: ${data.candidateName || "Candidate"} Personal Sandbox
**Monthly Bill**: $4,912.43 (Tier: Free Tier Mistake)

**Resource Cost Breakdown**:
- Unused Kubernetes clusters running hello-world: $4,200.00
- Serverless cold-starts on static page: $712.43

**Infrastructure Review**:
${data.body}

**AWS Support Message**:
${data.finalBlow}`
  },
  {
    id: "linkedin_influencer",
    name: "LinkedIn Influencer Post",
    priority: "medium",
    scoreFn: (text, features) => (/\b(network|leader|influence|growth|b2b)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### 🤝 linkedin.com - Professional Post
"I am thrilled to announce that after 30 seconds of reviewing this resume, I've decided to share a toxic positivity lesson...

Here is what this candidate's background taught me:
${data.body}

Agree? Let's connect! dots dots ${data.finalBlow}"`
  },
  {
    id: "clippy_dialog",
    name: "Clippy Assistant Warning Dialog",
    priority: "medium",
    scoreFn: (text, features) => (/\b(office|word|excel|administrative|clippy)\b/i.test(text) ? 30 : 0),
    formatFn: (data) => `### 📎 Microsoft Word Assistant
"It looks like you are trying to write a software engineering resume.

Would you like help with:
- Explaining why your projects are just tutorial forks?
- Removing Microsoft Office from your tech skills?

**Suggestions**:
dots ${data.body}

${data.finalBlow}"`
  },
  {
    id: "database_deadlock",
    name: "Database Deadlock / SQL Dump Audit",
    priority: "medium",
    scoreFn: (text, features) => (/\b(sql|database|postgres|mysql|transaction|query)\b/i.test(text) ? 35 : 0),
    formatFn: (data) => `-- TRANSACTION DEADLOCK DETECTED
-- LATEST DETECTED CONFLICTING TRANSACTION:
BEGIN TRANSACTION;
-- [STITCHED ROAST]:
-- ${data.body.replace(/\n/g, " ")}

ROLLBACK TRANSACTION; -- Reason: Integrity constraints violated. dots ${data.finalBlow}`
  }
];



// ============================================================
//  QUALITY ENHANCEMENTS — COOLDOWN, TONE & DOMAIN ENGINES
// ============================================================

function detectDomain(text) {
  const domains = [
    { name: "DevOps", keywords: ["docker", "kubernetes", "k8s", "pod", "aws", "terraform", "pipeline", "ci/cd", "jenkins", "ansible"] },
    { name: "Cybersecurity", keywords: ["security", "cyber", "owasp", "pen-test", "vulnerability", "encryption", "firewall", "breach", "mitigation"] },
    { name: "AI", keywords: ["ai", "machine learning", "openai", "pytorch", "tensorflow", "neural", "llm", "deep learning", "nlp", "model"] },
    { name: "Mobile", keywords: ["flutter", "react native", "swift", "kotlin", "android", "ios", "mobile", "app store"] },
    { name: "Frontend", keywords: ["react", "frontend", "css", "html", "tailwind", "figma", "three.js", "framer motion", "ui/ux"] },
    { name: "Backend", keywords: ["node", "backend", "express", "django", "postgres", "sql", "database", "mongodb", "api", "graphql"] }
  ];

  let bestDomain = "Generic";
  let maxCount = 0;

  for (const dom of domains) {
    let count = 0;
    for (const kw of dom.keywords) {
      if (text.includes(kw)) count++;
    }
    if (count > maxCount) {
      maxCount = count;
      bestDomain = dom.name;
    }
  }
  return bestDomain;
}

function getTone(str) {
  // Deterministic tone distribution classification
  const hash = cyrb53(str) % 100;
  if (hash < 20) return "light";
  if (hash < 60) return "funny";
  if (hash < 85) return "savage";
  if (hash < 95) return "brutal";
  return "legendary";
}

function getEasterEggTier(str) {
  const hash = cyrb53(str) % 1000;
  if (hash < 1) return "mythic";      // 0.1%
  if (hash < 10) return "legendary";  // 0.9%
  if (hash < 90) return "epic";       // 8.0%
  if (hash < 290) return "rare";      // 20.0%
  return "common";                    // 71.0%
}

function getHistory(key) {
  if (typeof window === 'undefined') return [];
  try {
    const data = sessionStorage.getItem(`roast_history_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveHistory(key, item, limit) {
  if (typeof window === 'undefined') return;
  try {
    const list = getHistory(key);
    list.push(item);
    if (list.length > limit) list.shift();
    sessionStorage.setItem(`roast_history_${key}`, JSON.stringify(list));
  } catch (e) {}
}

function pickWithCooldown(arr, historyList, rand) {
  const available = arr.filter(item => !historyList.includes(item));
  if (available.length > 0) {
    return available[Math.floor(rand() * available.length)];
  }
  return arr[Math.floor(rand() * arr.length)];
}

function pickByTone(arr, targetTone, historyList, rand) {
  const matching = arr.filter(item => getTone(item) === targetTone && !historyList.includes(item));
  if (matching.length > 0) {
    return matching[Math.floor(rand() * matching.length)];
  }
  const matchingAny = arr.filter(item => getTone(item) === targetTone);
  if (matchingAny.length > 0) {
    return matchingAny[Math.floor(rand() * matchingAny.length)];
  }
  return pickWithCooldown(arr, historyList, rand);
}

function pickEasterEgg(arr, targetTier, rand) {
  const matching = arr.filter(e => getEasterEggTier(e) === targetTier);
  if (matching.length > 0) return matching[Math.floor(rand() * matching.length)];
  return arr[Math.floor(rand() * arr.length)];
}

function getOverlapScore(str1, str2) {
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "if", "because", "as", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", "should", "now"]);
  const words1 = new Set(str1.toLowerCase().split(/[^a-z0-9]+/i).filter(w => w.length > 2 && !stopWords.has(w)));
  const words2 = str2.toLowerCase().split(/[^a-z0-9]+/i).filter(w => w.length > 2 && !stopWords.has(w));
  let overlap = 0;
  for (const w of words2) {
    if (words1.has(w)) overlap++;
  }
  return overlap;
}

const fallbackData = {
  candidateName: "Candidate",
  project: "your project",
  language: "your programming language",
  framework: "your framework",
  skill: "your skill",
  github: "your repository",
  experience: "your experience",
  achievement: "your achievement",
  education: "your education",
  missingSection: "testing coverage",
  certification: "your certification"
};

function selectRoastFormat(text, resumeText, features, rand) {
  const scored = [];
  const domain = detectDomain(text);
  const cooldownFormats = getHistory("formats");

  for (const fmt of ROAST_FORMATS) {
    if (cooldownFormats.includes(fmt.id)) continue;

    let rawScore = fmt.scoreFn(text, features);

    // Domain scoring boosts
    if (domain === "DevOps" && ["docker_log", "aws_bill"].includes(fmt.id)) rawScore += 25;
    else if (domain === "Cybersecurity" && fmt.id === "security_audit") rawScore += 25;
    else if (domain === "AI" && fmt.id === "ai_review") rawScore += 25;
    else if (domain === "Frontend" && fmt.id === "yelp_rant") rawScore += 25;
    else if (domain === "Backend" && fmt.id === "database_deadlock") rawScore += 25;

    const priorityWeight = { high: 2.0, medium: 1.2, low: 0.8 }[fmt.priority] || 1.0;
    const finalScore = rawScore * priorityWeight;

    scored.push({ format: fmt, score: finalScore });
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0 || scored[0].score < 30) {
    return null;
  }

  // Tied-Score Randomizer
  if (scored.length > 1 && Math.abs(scored[0].score - scored[1].score) <= 5) {
    return rand() < 0.5 ? scored[0].format : scored[1].format;
  }

  return scored[0].format;
}
export function analyzeResume(resumeText, personality) {
  const text = resumeText.toLowerCase();
  const textSeed = cyrb53(resumeText);
  const rand = createRandom(textSeed);
  const candidateName = extractName(resumeText);
  const wordCount = resumeText.trim().split(/\s+/).length || 1;

  // ─── Easter Eggs Overrides ─────────────────────────────────
  const lowerText = text.toLowerCase();
  if (lowerText.includes('rishi sharma') || lowerText.includes('rishisharma029') || candidateName.toLowerCase() === 'rishi') {
    return {
      score: 100,
      seed: textSeed,
      roastId: "IMMUNE01",
      candidateName: "Rishi Sharma",
      verdictTitle: "DEVELOPER IMMUNITY DETECTED",
      verdictBody: "Wait... the parser hit a secure index. Deployer override signature found. You spent weeks optimizing CSS margins at 3 AM, debugging procedural Web Audio waves, and designing visual imperfections. Our systems cannot roast the hands that built us. Your resume is completely immune to emotional damage. Go drink some water and get some actual sleep.",
      verdictFinalBlow: "Developer immunity active. Star the repo or git out.",
      redFlagsCount: 0,
      buzzwordsCount: 0,
      careerLore: "A sleep-deprived indie hacker who obsessed over margins, fonts, scanlines, and audio synthesis between midnight and 4 AM.",
      recoveryProtocols: [
        "Go outside and look at actual green trees. Yes, they exist.",
        "Your contribution graph is green enough. Rest for 24 hours.",
        "Drink a glass of water instead of another cup of coffee."
      ],
      achievements: [
        { title: "CREATOR OF CHADS", desc: "Immunity unlocked. You built this database of pain." },
        { title: "3AM CODING VETERAN", desc: "Survived dependency conflicts and state transitions." }
      ],
      battleItems: [
        { original: "Wrote all code singlehandedly", improved: "Commanded a legion of 8 distinct fictional AI executioners to roast applicant egos", reason: "Infrastructure superiority" }
      ],
      sweatinessLevel: 0,
      tryHardVibe: "THE CHAD CREATOR",
      archetype: { badge: "👑 THE CREATOR", desc: "The sleep-deprived engineer who built this app. Completely immune to roasts.", color: "#39ff14" },
      sweatIndex: 0,
      linkedinDelusion: "NONE",
      tutorialDependency: 0,
      productionExposure: 100,
      founderHallucination: "NONE",
      sweatIndexJustification: "Creator is perfectly balanced.",
      linkedinDelusionJustification: "Zero corporate fluff found.",
      tutorialDependencyJustification: "This is a custom built original codebase.",
      productionExposureJustification: "Live on GitHub Pages with active branch commits.",
      founderHallucinationJustification: "Actually shipped the product.",
      contradictions: [],
      detectedAngles: [],
      foundSkills: ["React", "Web Audio API", "CSS Grid", "Determined Seed RNG"],
      foundTutorials: [],
      metrics: {
        buzzwordDensity: 0,
        tutorialDependency: 0,
        hasGitHub: true,
        hasLiveLink: true,
        wordCount: wordCount
      }
    };
  }

  if (lowerText.includes('antigravity')) {
    return {
      score: 42,
      seed: textSeed,
      roastId: "ANTIGRAV",
      candidateName: candidateName || "Antigravity Agent",
      verdictTitle: "WARNING: ANOMALOUS MASS DETECTED",
      verdictBody: "You uploaded a resume mentioning 'antigravity'. The parser is currently floating above the computer desk. Gravity check has returned negative. We cannot evaluate your performance metrics because your skills are currently drifting out of the browser window. If you feel lightheaded, please hold on to your keyboard.",
      verdictFinalBlow: "import antigravity; // Floating away in 3, 2, 1...",
      redFlagsCount: 0,
      buzzwordsCount: 0,
      careerLore: "A developer who refuses to be bound by standard physical laws (or local gravity parameters).",
      recoveryProtocols: [
        "Read xkcd.com/353/ immediately to compile flight patterns.",
        "Tie yourself to a heavy desk chair before running npm run dev next time.",
        "Watch out for ceiling fans."
      ],
      achievements: [
        { title: "ZERO GRAVITY", desc: "Uploaded the secret keyword. Physical laws bypassed." },
        { title: "XKCD AFICIONADO", desc: "Imported antigravity successfully." }
      ],
      battleItems: [
        { original: "Experienced backend engineer", improved: "Disrupted the gravitational pull of local server racks to reduce ping latency", reason: "Breaks physical constraints" }
      ],
      sweatinessLevel: 42,
      tryHardVibe: "FLOATING AWAY",
      archetype: { badge: "🎈 SPACE EVANGELIST", desc: "A developer who is currently floating away from their workspace.", color: "#38bdf8" },
      sweatIndex: 42,
      linkedinDelusion: "MILD",
      tutorialDependency: 0,
      productionExposure: 50,
      founderHallucination: "NONE",
      sweatIndexJustification: "Gravity-defying parameters detected.",
      linkedinDelusionJustification: "Low delusion, high levitation.",
      tutorialDependencyJustification: "Standard tutorials assume gravity is present.",
      productionExposureJustification: "Hard to push to main when your keyboard is floating.",
      founderHallucinationJustification: "No startup claims, just floating.",
      contradictions: [],
      detectedAngles: [],
      foundSkills: ["Gravitational Disruption", "xkcd python packages"],
      foundTutorials: [],
      metrics: {
        buzzwordDensity: 0,
        tutorialDependency: 0,
        hasGitHub: true,
        hasLiveLink: true,
        wordCount: wordCount
      }
    };
  }

  // Programmatic Humanity Check: Genuinely Good Resume (Rule 16)
  const checkGitHub = lowerText.includes('github.com');
  const checkLiveLink = lowerText.includes('vercel.app') || lowerText.includes('netlify.app') || lowerText.includes('github.io');
  const checkMetricsMatches = resumeText.match(METRICS_REGEX) || [];
  const checkMetricsCount = checkMetricsMatches.length;
  
  let tempBuzzwordCount = 0;
  BUZZWORDS.forEach(word => { tempBuzzwordCount += (lowerText.split(word).length - 1); });
  
  let tempTutorialCount = 0;
  TUTORIAL_PROJECTS.forEach(project => { if (lowerText.includes(project)) tempTutorialCount += 1; });

  const isGenuinelyGood = (
    (wordCount > 100 &&
     checkGitHub &&
     checkLiveLink &&
     checkMetricsCount >= 2 &&
     tempBuzzwordCount <= 1 &&
     tempTutorialCount === 0) ||
    lowerText.includes('respect earned') ||
    lowerText.includes('humanity check')
  );

  if (isGenuinelyGood) {
    return {
      score: 99,
      seed: textSeed,
      roastId: "HUMAN01",
      candidateName: candidateName || "Respectable Developer",
      isGenuinelyGood: true,
      verdictTitle: "...",
      verdictBody: "wait.\n\nthis one is actually good.",
      verdictFinalBlow: "respect earned.",
      redFlagsCount: 0,
      buzzwordsCount: 0,
      careerLore: "A developer who actually ships production-grade software and respects engineering trade-offs.",
      recoveryProtocols: [
        "No recovery needed. Keep shipping.",
        "Ensure you are paid what you are worth."
      ],
      achievements: [
        { title: "RESPECT EARNED", desc: "Uploaded a genuinely high-quality resume. Silence is the highest praise." }
      ],
      battleItems: [],
      sweatinessLevel: 10,
      tryHardVibe: "GENUINE ENGINEER",
      archetype: { badge: "🛠️ REAL ENGINEER", desc: "No hacks, no fluff, just working software. Respect earned.", color: "#10b981" },
      sweatIndex: 10,
      linkedinDelusion: "NONE",
      tutorialDependency: 0,
      productionExposure: 99,
      founderHallucination: "NONE",
      sweatIndexJustification: "Perfect balance of tech and metrics.",
      linkedinDelusionJustification: "No buzzword fluff detected.",
      tutorialDependencyJustification: "All projects are original deployments.",
      productionExposureJustification: "Live URLs and source control verified.",
      founderHallucinationJustification: "No startup delusions, just solid engineering.",
      contradictions: [],
      detectedAngles: [],
      foundSkills: ["Production Deployment", "Quantitative Metrics", "Clean Structure"],
      foundTutorials: [],
      metrics: {
        buzzwordDensity: 0,
        tutorialDependency: 0,
        hasGitHub: true,
        hasLiveLink: true,
        wordCount: wordCount
      }
    };
  }

  // Heuristics
  let buzzwordCount = 0;
  BUZZWORDS.forEach(word => { buzzwordCount += (text.split(word).length - 1); });
  const buzzwordDensity = Math.min((buzzwordCount / wordCount) * 100, 30);

  let tutorialCount = 0;
  const foundTutorials = [];
  TUTORIAL_PROJECTS.forEach(project => { if (text.includes(project)) { tutorialCount += 1; foundTutorials.push(project.toUpperCase()); } });

  const foundSkills = [];
  KNOWN_SKILLS.forEach(skill => { if (text.includes(skill)) foundSkills.push(skill.toUpperCase()); });

  const metricsMatches = resumeText.match(METRICS_REGEX) || [];
  const metricsCount = metricsMatches.length;
  const linksMatches = resumeText.match(LINK_REGEX) || [];
  const hasGitHub = text.includes('github.com');
  const hasLinkedIn = text.includes('linkedin.com');
  const hasLiveLink = text.includes('vercel.app') || text.includes('netlify.app') || text.includes('github.io') || (linksMatches.length > 2);

  const sweatInfo = analyzeSweatinessAndTech(resumeText);

  let visionaryCount = 0;
  const visionaryWords = ['visionary','innovator','disrupt','paradigm','thought leader','evangelist','hustle','expert','master','passion','strategic','leverage'];
  visionaryWords.forEach(w => { if (text.includes(w)) visionaryCount += (text.split(w).length - 1); });

  let startupCount = 0;
  const startupWords = ['founder','ceo','co-founder','pitch','runway','equity','funding','startup','exit','seed','burn rate','mvp'];
  startupWords.forEach(w => { if (text.includes(w)) startupCount += (text.split(w).length - 1); });

  let frameworkCount = 0;
  const frameworks = ['react','next.js','vue','angular','svelte','solid','node','django','flask','spring','express','nest','fastapi','laravel','rails','kubernetes','docker','aws','terraform','graphql','tailwind'];
  frameworks.forEach(fw => { if (text.includes(fw)) frameworkCount += 1; });

  const sweatIndex = Math.max(10, Math.min(100, Math.round(buzzwordCount * 5 + visionaryCount * 8 + frameworkCount * 4 + startupCount * 6)));

  let linkedinDelusion = "MILD";
  if (buzzwordCount + visionaryCount >= 10) linkedinDelusion = "CRITICAL";
  else if (buzzwordCount + visionaryCount >= 6) linkedinDelusion = "HIGH";
  else if (buzzwordCount + visionaryCount >= 3) linkedinDelusion = "ELEVATED";

  let tutorialDependency = Math.min(100, Math.round(tutorialCount * 30 + (frameworkCount > 6 ? 20 : 0)));
  if (tutorialDependency === 0 && text.includes('todo')) tutorialDependency = 25;

  let productionExposure = 5;
  if (hasLiveLink) productionExposure += 45;
  if (hasGitHub) productionExposure += 25;
  if (metricsCount > 0) productionExposure += 25;
  productionExposure -= Math.min(50, tutorialCount * 15);
  productionExposure = Math.max(0, Math.min(99, productionExposure));

  let founderHallucination = "NONE";
  if (text.includes('founder') || text.includes('ceo') || text.includes('co-founder')) {
    if (!hasLiveLink && !hasGitHub) founderHallucination = "STAGE 4 (CRITICAL)";
    else if (!hasLiveLink) founderHallucination = "STAGE 3 (LOCALHOST CO-FOUNDER)";
    else founderHallucination = "STAGE 2 (MVP SHUTDOWN)";
  } else if (text.includes('evangelist') || text.includes('visionary') || text.includes('innovator')) {
    founderHallucination = "STAGE 1 (PRODUCTIVITY COSPLAY)";
  }

  const archetypeStats = { tutorialCount, buzzwordCount, productionExposure };
  const archetype = classifyArchetype(resumeText, archetypeStats);

  // Heuristics for the 12 selected Easter Eggs
  const isCSSWizard = frameworks.filter(fw => text.includes(fw)).length >= 4 && !(/sql|postgres|node|redis|database|mongodb|backend/i.test(text));
  const isReadmePhilosopher = /readme|documentation|docs\b|writing guidelines|markdown/i.test(text);
  const isUnicornDetector = /startup|pitch deck|seed round|pre-seed|venture capital|founder|ceo/i.test(text) && !(/revenue|profit|arr\b|mrr\b|users|paying/i.test(text));
  const isPitchDeckSurvivor = /pitch deck|slides|powerpoint|keynote/i.test(text);
  const isAncientResume = wordCount > 1300;
  const isOpenSourceTourist = /forked|cloned|contribution|merged/i.test(text) && !(/deployed|maintained|original|primary author/i.test(text));
  const isFinalFinalV2 = /final[-_]final|REAL|v7|v2\b/i.test(text) || (resumeText && /final_final/i.test(resumeText));
  const isProductivityGuru = tutorialCount >= 2 || text.includes('clone') || text.includes('todo list');

  const specificObservations = [];
  if (text.includes('weather')) specificObservations.push("weather app addiction");
  if (text.includes('calculator')) specificObservations.push("calculator project recurrence");
  if (text.includes('todo') || text.includes('to-do')) specificObservations.push("todo list clones");
  if (!hasLiveLink) specificObservations.push("localhost-only projects");
  if (hasGitHub && !hasLiveLink) specificObservations.push("README with zero screenshots");
  if (hasGitHub && sweatInfo.techAttacks.some(a => a.type === 'devops_mismatch')) specificObservations.push("GitHub contribution graph farming");
  if (/landing\s*page|portfolio|personal\s*site/i.test(text)) specificObservations.push("copied landing pages");
  if (/auth|jwt|login|signup|register/i.test(text) && tutorialCount > 0) specificObservations.push("unfinished authentication systems");
  if (/stealth|saas|io\b|\.ai\b/i.test(text) && (text.includes('founder') || text.includes('ceo'))) specificObservations.push("fake startup naming conventions");
  if (text.includes('figma') && (text.includes('founder') || text.includes('ceo')) && !hasLiveLink) specificObservations.push("Figma-only startups");
  if (!hasLiveLink && hasGitHub) specificObservations.push("deployment links returning 404");
  if (/framer\s*motion|gsap|three\.js|animation/i.test(text) && !/sql|postgres|node|redis|database|mongodb/i.test(text)) specificObservations.push("portfolio animations hiding weak backend skills");
  if (!hasGitHub && wordCount < 180) specificObservations.push("naming files final-final-v2-REAL.zip");

  if (isCSSWizard) specificObservations.push("backend whereabouts unknown");
  if (isReadmePhilosopher) specificObservations.push("documentation exceeds implementation");
  if (isUnicornDetector) specificObservations.push("unicorn status: ₹0 ARR");
  if (isPitchDeckSurvivor) specificObservations.push("more slides than active users");
  if (isAncientResume) specificObservations.push("ancient scroll text length");
  if (isOpenSourceTourist) specificObservations.push("open source repo tourism");
  if (isFinalFinalV2) specificObservations.push("naming files final-final-v2-REAL.pdf");
  if (isProductivityGuru) specificObservations.push("500 tutorials build nothing");

  const listedFrameworks = frameworks.filter(fw => text.includes(fw)).map(fw => fw.toUpperCase());

  // Score justifications
  let sweatIndexJustification = "Low because resume layout remains relatively clean and focused on implementation.";
  if (frameworkCount > 5 && metricsCount === 0) {
    sweatIndexJustification = `High because too many frameworks (${listedFrameworks.slice(0, 3).join(', ')}) listed with no measurable outcomes.`;
    if (specificObservations.includes("portfolio animations hiding weak backend skills")) sweatIndexJustification = "High because of portfolio animations hiding weak backend skills.";
  } else if (sweatIndex > 65) sweatIndexJustification = "High because of high buzzword density (synergy talk with empty repos).";
  else if (sweatIndex > 30) sweatIndexJustification = "Elevated due to framework stacking without clear outcomes.";

  let linkedinDelusionJustification = "Low because professional jargon is kept to a minimum.";
  if (linkedinDelusion === 'CRITICAL') linkedinDelusionJustification = "LinkedIn final boss energy.";
  else if (linkedinDelusion === 'HIGH') linkedinDelusionJustification = "LinkedIn final boss energy.";
  else if (linkedinDelusion === 'ELEVATED') linkedinDelusionJustification = "LinkedIn final boss energy.";

  let tutorialDependencyJustification = "Low because no generic tutorial template projects or clones were detected.";
  if (specificObservations.includes("weather app addiction") || specificObservations.includes("calculator project recurrence")) {
    tutorialDependencyJustification = "This repo smells like YouTube autoplay.";
  } else if (tutorialCount > 0) tutorialDependencyJustification = "This repo smells like YouTube autoplay.";
  else if (tutorialDependency > 40) tutorialDependencyJustification = "This repo smells like YouTube autoplay.";

  let productionExposureJustification = "High because live URLs and active public repository links are verifiable.";
  if (productionExposure < 35) {
    if (specificObservations.includes("localhost-only projects")) productionExposureJustification = "Low because no deployment links (localhost-only projects with zero screenshots).";
    else if (specificObservations.includes("deployment links returning 404")) productionExposureJustification = "Low because deployment links are returning 404.";
    else productionExposureJustification = "Low because deployment links are completely absent.";
  } else if (productionExposure < 65) {
    if (specificObservations.includes("GitHub contribution graph farming")) productionExposureJustification = "Low because of GitHub contribution graph farming without actual production environments.";
    else productionExposureJustification = "Medium because live links are present but Git history suggests mostly tutorial clones.";
  }

  let founderHallucinationJustification = "None because no startup founder delusions were detected.";
  if (specificObservations.includes("Figma-only startups")) founderHallucinationJustification = 'High because resume says "visionary" or "founder" of a Figma-only startup.';
  else if (founderHallucination.includes('STAGE 4') || text.includes('founder') || text.includes('ceo')) {
    if (specificObservations.includes("fake startup naming conventions")) founderHallucinationJustification = "High because of fake startup naming conventions (calling localhost apps stealth projects).";
    else founderHallucinationJustification = 'High because resume says "visionary/founder" with no live deployed codebase.';
  } else if (founderHallucination.includes('STAGE 1')) founderHallucinationJustification = "Elevated because resume uses visionary words without shipping a single API endpoint.";

  let redFlags = 1;
  if (tutorialCount > 0) redFlags += tutorialCount;
  if (buzzwordCount > 4) redFlags += 1;
  if (!hasLiveLink) redFlags += 1;
  if (!hasGitHub) redFlags += 1;
  if (wordCount < 130) redFlags += 1;
  if (metricsCount === 0) redFlags += 1;
  redFlags += sweatInfo.techAttacks.length;

  const detectedAngles = detectInfractions(text, wordCount, buzzwordCount, tutorialCount, metricsCount, hasLiveLink, hasGitHub, foundSkills, foundTutorials, sweatInfo);
  const contradictions = analyzeContradictions(text, archetypeStats, sweatInfo, hasLiveLink, tutorialCount, foundTutorials);

  let baseScore = 60;
  baseScore -= buzzwordCount * 3.5;
  baseScore -= tutorialCount * 13;
  baseScore -= sweatInfo.scorePenalty;
  baseScore -= contradictions.length * 8;
  if (hasGitHub) baseScore += 7;
  if (hasLiveLink) baseScore += 9;
  baseScore += Math.min(metricsCount * 3.5, 14);
  if (detectedAngles.includes('blockchain_bluff') || detectedAngles.includes('ai_bluff')) baseScore -= 10;
  if (detectedAngles.includes('startup_delusion')) baseScore -= 8;
  baseScore = Math.max(8, Math.min(95, baseScore));

  const offsets = { staff_engineer: -10, faang_gatekeeper: -8, devops_veteran: -9, oss_maintainer: -6, exhausted_recruiter: -4, rust_elitist: -7, startup_cto: -6, systems_architect: -2 };
  const offset = offsets[personality.id] || 0;
  const variance = Math.floor(rand() * 5) - 2;
  const finalScore = Math.max(5, Math.min(99, Math.round(baseScore + offset + variance)));

  const experienceAction = extractExperienceAction(resumeText, rand);

  const dynamicRoast = synthesizeCinematicRoast(personality.id, candidateName, detectedAngles, foundSkills, foundTutorials, experienceAction, rand, text, sweatInfo, productionExposure, sweatIndex, contradictions);
  
  
  
  // Format selection engine execution
  const formatFeatures = {
    hasGitHub,
    hasLiveLink,
    buzzwordCount,
    tutorialCount,
    metricsCount,
    wordCount,
    startupCount,
    frameworkCount,
    frameworks: listedFrameworks,
    founderHallucination,
    sweatIndex,
    isCSSWizard,
    isReadmePhilosopher,
    isUnicornDetector,
    isPitchDeckSurvivor,
    isAncientResume,
    isOpenSourceTourist,
    isFinalFinalV2,
    isProductivityGuru
  };

  
  const matchedFormat = selectRoastFormat(text, resumeText, formatFeatures, rand);
  if (matchedFormat) {
    const pools = formatsData[matchedFormat.id];
    if (pools) {
      // Cooldown history lists
      const hTitles = getHistory("titles");
      const hPunchlines = getHistory("punchlines");
      const hVerdicts = getHistory("verdicts");

      // Pick tone distribution
      const toneRoll = rand() * 100;
      let targetTone = "funny";
      if (toneRoll < 20) targetTone = "light";
      else if (toneRoll < 60) targetTone = "funny";
      else if (toneRoll < 85) targetTone = "savage";
      else if (toneRoll < 95) targetTone = "brutal";
      else targetTone = "legendary";

      // Interpolator
      const interpolate = (str, data) => str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        if (data[key] && data[key] !== "undefined" && String(data[key]).trim().length > 0) {
          return data[key];
        }
        return fallbackData[key] || match;
      });

      // 1. Pick Title
      const title = pickWithCooldown(pools.titles, hTitles, rand);
      
      // 2. Pick Opening
      const opening = pickWithCooldown(pools.openings, [], rand);
      
      // 3. Pick 2 distinct findings with no wording overlap
      const rawFindings = [];
      let tries = 0;
      while (rawFindings.length < 2 && tries < 40) {
        const candidate = pickByTone(pools.findings, targetTone, [], rand);
        if (!rawFindings.includes(candidate)) {
          if (rawFindings.length === 0 || getOverlapScore(rawFindings[0], candidate) === 0) {
            rawFindings.push(candidate);
          }
        }
        tries++;
      }
      if (rawFindings.length < 2) {
        rawFindings.push(pools.findings[0]);
      }

      const interpolationData = {
        candidateName: candidateName || "Candidate",
        project: pickWithCooldown(foundSkills, [], rand) || "localhost app",
        language: pickWithCooldown(foundSkills, [], rand) || "JavaScript",
        framework: pickWithCooldown(foundSkills, [], rand) || "React",
        skill: pickWithCooldown(foundSkills, [], rand) || "coding",
        github: hasGitHub ? "GitHub portfolio" : "local repository",
        experience: experienceAction || "development work",
        achievement: pickWithCooldown(foundSkills, [], rand) || "learning new tech",
        certification: pickWithCooldown(foundSkills, [], rand) || "certification check",
        education: "degree path",
        missingSection: "testing coverage"
      };
      const findings = rawFindings.map(f => interpolate(f, interpolationData)).join(" ");
      
      // 4. Pick Punchline (ensuring no word overlap with findings/title)
      let punchline = "";
      tries = 0;
      while (tries < 30) {
        const candidate = pickByTone(pools.punchlines, targetTone, hPunchlines, rand);
        if (getOverlapScore(findings, candidate) === 0) {
          punchline = candidate;
          break;
        }
        tries++;
      }
      if (!punchline) {
        punchline = pickWithCooldown(pools.punchlines, hPunchlines, rand);
      }
      
      // 5. Pick Verdict
      const verdict = pickByTone(pools.verdicts, targetTone, hVerdicts, rand);
      
      // 6. Easter Egg probability & tiering check
      let easterEgg = "";
      const eggRoll = rand() * 1000;
      let chosenEgg = null;
      if (eggRoll < 1) { // 0.1% Mythic
        chosenEgg = pickEasterEgg(pools.easterEggs, "mythic", rand);
      } else if (eggRoll < 10) { // 0.9% Legendary
        chosenEgg = pickEasterEgg(pools.easterEggs, "legendary", rand);
      } else if (eggRoll < 30) { // 2.0% Epic
        chosenEgg = pickEasterEgg(pools.easterEggs, "epic", rand);
      } else if (eggRoll < 80) { // 5.0% Rare
        chosenEgg = pickEasterEgg(pools.easterEggs, "rare", rand);
      } else if (eggRoll < 180) { // 10.0% Common
        chosenEgg = pickEasterEgg(pools.easterEggs, "common", rand);
      }

      if (chosenEgg) {
        const tierBadge = { mythic: "🔴 MYTHIC", legendary: "🟡 LEGENDARY", epic: "🟣 EPIC", rare: "🔵 RARE", common: "⚪ COMMON" }[getEasterEggTier(chosenEgg)] || "COMMON";
        easterEgg = "\n\n🚨 [EASTER EGG - " + tierBadge + "] " + chosenEgg;
      }

      let bodyText = `${opening} ${findings} ${punchline}${easterEgg}`;

      // 7. Multi-Stage connected chain roast (for final scores >= 80)
      if (finalScore >= 80) {
        const secondary = ROAST_FORMATS.find(f => f.id !== matchedFormat.id);
        if (secondary) {
          const secPools = formatsData[secondary.id];
          if (secPools) {
            const secTitle = pickWithCooldown(secPools.titles, [], rand);
            const secFinding = interpolate(pickWithCooldown(secPools.findings, [], rand), interpolationData);
            const secVerdict = pickWithCooldown(secPools.verdicts, [], rand);
            
            const secondaryBody = secondary.formatFn({
              title: secTitle,
              body: secFinding,
              finalBlow: secVerdict,
              candidateName,
              personalityId: personality.id
            });
            bodyText += `\n\n---\n\n### 🔗 LINKED SUB-INCIDENT REPORT\n${secondaryBody}`;
          }
        }
      }
      
      const formattedBody = matchedFormat.formatFn({
        title,
        body: bodyText,
        finalBlow: verdict,
        candidateName,
        personalityId: personality.id
      });

      // Save histories
      saveHistory("formats", matchedFormat.id, 10);
      saveHistory("titles", title, 20);
      saveHistory("punchlines", punchline, 20);
      saveHistory("verdicts", verdict, 20);

      dynamicRoast.title = title;
      dynamicRoast.body = formattedBody;
      dynamicRoast.finalBlow = verdict;
    }
  
  }

  const stackOverflowDetected = text.includes('self learner') || text.includes('self-learner') || text.includes('problem solver') || text.includes('problem-solver');
  if (stackOverflowDetected) {
    dynamicRoast.body = `SOURCE ANALYSIS:\n92% Stack Overflow inheritance detected\n\n${dynamicRoast.body}`;
  }

  const mergeConflictEvent = wordCount < 80 || !(/experience|work|history|jobs|position/i.test(text));
  if (mergeConflictEvent) {
    dynamicRoast.body = `<<<<<<< EXPERIENCE\nReact Developer\n=======\nVisionary Innovator\n>>>>>>> linkedin-post-final-v2\n\n${dynamicRoast.body}`;
  }

  const youtubeThumbnailsWarning = buzzwordCount >= 6;
  if (youtubeThumbnailsWarning) {
    dynamicRoast.body = `WARNING:\nresume appears fully constructed from YouTube thumbnails\n\n${dynamicRoast.body}`;
  }

  const careerLore = compileCareerLore(personality.id, candidateName, foundSkills, foundTutorials, experienceAction, rand);
  const recoveryProtocols = synthesizeRecoveryProtocols(personality.id, detectedAngles, foundSkills, foundTutorials, rand);
 
  const unlockedAchievements = compileAchievements(detectedAngles, foundSkills, foundTutorials, sweatInfo);
  contradictions.forEach(c => {
    unlockedAchievements.unshift({ title: c.type.toUpperCase().replace(/_/g, ' '), desc: c.phrase });
  });

  if (isCSSWizard) unlockedAchievements.push({ title: "CSS WIZARD", desc: "Too much frontend styling. Backend whereabouts unknown." });
  if (isReadmePhilosopher) unlockedAchievements.push({ title: "README PHILOSOPHER", desc: "Documentation length exceeds original logic implementation." });
  if (isUnicornDetector) unlockedAchievements.push({ title: "STEALTH UNICORN", desc: "Pre-revenue, pre-product, pre-sanity startup claims." });
  if (isPitchDeckSurvivor) unlockedAchievements.push({ title: "PITCH DECK SURVIVOR", desc: "Successfully survived 45 slide reviews with 0 active users." });
  if (isAncientResume) unlockedAchievements.push({ title: "THE ANCIENT SCROLL", desc: "Resume text count exceeds 1300 words. Lengthy scroll of code." });
  if (isOpenSourceTourist) unlockedAchievements.push({ title: "OPEN SOURCE TOURIST", desc: "Forked 50 repositories but never contributed a single PR comment." });
  if (isFinalFinalV2) unlockedAchievements.push({ title: "FINAL-FINAL-V2", desc: "Uploaded a resume matching classic file naming disasters." });
  if (isProductivityGuru) unlockedAchievements.push({ title: "PRODUCTIVITY GURU", desc: "Completed 50 tutorials, built 0 original production items." });

  const battleItems = generateBattleItems(text, rand, sweatInfo);

  // --- Evidence-Based Structured Roast Assembly ---
  const resumeFeatures = extractResumeFeatures(resumeText);
  const evidenceJokes  = compileEvidenceBasedJokes(resumeFeatures, resumeText);
  const hrThoughts     = generateHRThoughts(finalScore, resumeFeatures, personality.id);
  const strengths      = compileStrengths(resumeFeatures, {
    hasGitHub, hasLiveLink, metricsCount, wordCount, foundSkills
  });
  const funMetrics = buildFunMetrics(finalScore, resumeFeatures, {
    buzzwordCount, tutorialCount, productionExposure, sweatIndex, hasGitHub
  });

  dynamicRoast.body = buildStructuredRoastOutput({
    verdictTitle: dynamicRoast.title,
    incidentReport: dynamicRoast.body,
    evidenceJokes,
    strengths,
    hrThoughts,
    score: finalScore,
    funMetrics
  });

  return {
    score: finalScore,
    seed: textSeed,
    roastId: textSeed.toString(16).toUpperCase().slice(0, 8),
    candidateName,
    verdictTitle: dynamicRoast.title,
    verdictBody: dynamicRoast.body,
    verdictFinalBlow: dynamicRoast.finalBlow,
    redFlagsCount: redFlags,
    buzzwordsCount: buzzwordCount,
    careerLore,
    recoveryProtocols,
    achievements: unlockedAchievements,
    battleItems,
    sweatinessLevel: sweatInfo.sweatinessLevel,
    tryHardVibe: sweatInfo.tryHardVibe,
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
    contradictions,
    detectedAngles,
    foundSkills,
    foundTutorials,
    stackOverflowDetected,
    mergeConflictEvent,
    youtubeThumbnailsWarning,
    isCSSWizard,
    isReadmePhilosopher,
    isUnicornDetector,
    isPitchDeckSurvivor,
    isAncientResume,
    isOpenSourceTourist,
    isFinalFinalV2,
    isProductivityGuru,
    metrics: {
      buzzwordDensity: Math.round(buzzwordDensity),
      tutorialDependency: Math.min(tutorialCount * 25, 100),
      hasGitHub,
      hasLiveLink,
      wordCount
    }
  };
}