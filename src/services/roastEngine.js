// ============================================================
//  AI RESUME ROASTER — DYNAMIC ROAST ENGINE v3.0
//  Fragment-based sentence assembly ensures every roast is
//  statistically unique. Pools are large enough that even
//  the same persona roasting the same resume twice produces
//  a different paragraph.
// ============================================================

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

// ════════════════════════════════════════════════════════════════
//  MASSIVE SENTENCE FRAGMENT POOLS
//  Each pool has 15-25 entries per persona so the combinatorial
//  space is enormous — the same roast text almost never repeats.
// ════════════════════════════════════════════════════════════════

// Opening attack sentences — indexed by persona, 15 entries each
const OPENING_POOL = {
  staff_engineer: [
    "Let me be direct: I have reviewed your resume, and my confidence in your ability to survive an actual production incident is currently zero.",
    "I've stared at enough inflated resumes to develop a twitch, and yours just triggered it.",
    "Parsing this document has increased my cortisol levels by a measurable amount.",
    "I want you to understand that reading this resume required genuine emotional labor.",
    "Your summary section reads like it was typed by someone who has never once debugged an issue in a live environment.",
    "After twenty minutes with this document, I need a walk and possibly therapy.",
    "Whoever told you this resume was strong owed you honesty and gave you flattery instead.",
    "There is a confidence gap between what this resume claims and what the evidence supports that I can only describe as architectural.",
    "I have seen code-along certificates printed on actual resume paper with more self-awareness than this.",
    "Your professional summary is a crime scene and I am now the investigator.",
    "This resume is load-bearing buzzwords on a foundation of tutorial sandboxes.",
    "The ambition-to-output ratio here could destabilize a production cluster.",
    "I have reviewed thousands of these. Yours landed somewhere between 'concerning' and 'medically fascinating'.",
    "You have written about yourself with the confidence of someone who has survived zero post-mortems.",
    "The gap between what you claim and what the evidence supports could host a mid-size data center."
  ],
  faang_gatekeeper: [
    "Your resume passed the keyword filter and failed every human review layer simultaneously.",
    "I have run this through the screening pipeline. The result is a structured rejection with detailed annotations.",
    "You listed expertise in technologies whose documentation you have clearly never finished reading.",
    "The system design section of your next interview will expose the structural weakness buried in this document.",
    "Fifteen frameworks on a resume with zero system design context is not a skill stack — it is a Wikipedia reading list.",
    "You have confused watching a conference talk about distributed systems with actually building one.",
    "Listing LeetCode on a resume is bold. Listing LeetCode without mentioning a single solved problem is art.",
    "Your skills section is sized for a principal engineer and backed by evidence for a bootcamp graduate.",
    "The confidence displayed here is a compelling argument for mandatory reality checks before submission.",
    "Every senior interviewer who sees this document will ask the same question: 'Did anyone review this?'",
    "This resume treats technology names like trophies rather than tools that require depth of knowledge.",
    "The signal-to-noise ratio in this document is aggressively negative.",
    "Your profile claims competence at a level that requires production scars you clearly have not earned.",
    "I could teach you more in one whiteboard session than your project history suggests you have learned in two years.",
    "This document wants FAANG compensation for tutorial-tier evidence. The math does not work."
  ],
  devops_veteran: [
    "I have survived seventeen production outages. Your resume has survived exactly zero, and it shows.",
    "Your deployment history is a void. Not a strategic one — just an empty one.",
    "Docker in the skills section. Zero pipeline configuration anywhere. This is a pattern I recognize instantly.",
    "I can identify a developer who has never had a Friday 5pm deploy go wrong within three lines of a resume. You are that developer.",
    "The infrastructure section of your resume is a wish list, not a track record.",
    "You type 'scalability' with the hands of someone whose apps have never met a real user.",
    "Reading this resume required me to take a beta blocker. Please ship something before submitting this again.",
    "Your resume describes DevOps with zero evidence of ops. The 'Dev' part is also questionable.",
    "PagerDuty has never woken you up at 3am. This resume makes that obvious.",
    "You have described cloud infrastructure with the fluency of someone who read a blog post about it once.",
    "The words 'production-ready' appear here with the audacity of someone whose longest deployment was a Vercel preview.",
    "I have reviewed pipelines for companies valued at billions. Your pipeline is a single npm run dev command.",
    "Your on-call experience is zero. Your confidence is a hundred. That mismatch is a liability.",
    "Every deployment claim in this document collapses under a single follow-up question.",
    "I respect the ambition. I cannot respect the evidence. There is none."
  ],
  oss_maintainer: [
    "I have closed more issues than you have opened pull requests. We both know how this ends.",
    "Your GitHub contribution graph tells a story of green squares that represent more copy-paste than original code.",
    "Typo fixes in someone else's README do not constitute open-source contribution. Let us establish that baseline.",
    "A repository with one commit and a 900-line README is not a project — it is a mood board.",
    "I can review a codebase in seconds. Yours tells me you have written code for an audience of one: yourself.",
    "The word 'contributor' on a resume deserves scrutiny. Yours received it.",
    "Your project history is a museum of abandoned ideas with excellent landing pages and empty source directories.",
    "Pull requests require reviewers. You appear to have avoided code review the way others avoid exercise.",
    "Cloning a repository and running it does not make you a developer. Debugging it when it breaks does.",
    "I have maintained projects with ten thousand stars. Your projects maintain a fanbase of zero.",
    "Code without tests is a statement of priorities. Zero test coverage is a statement about you.",
    "Your commit history suggests you treat git like a save button rather than a collaboration tool.",
    "I am looking at your repositories. I am not impressed. I am concerned.",
    "A repository named 'my-portfolio-v7' with seven commits over three years is not growth. It is archaeology.",
    "You have shipped nothing that anyone could find, use, or depend on. That is the summary."
  ],
  exhausted_recruiter: [
    "Dear applicant, thank you for participating in our automated screening experience. The results are not in your favor.",
    "Your resume contains seventeen buzzwords and zero quantified outcomes. The algorithm noticed. I noticed.",
    "You have described your professional history with the specificity of someone writing a horoscope.",
    "Passive voice in a resume bullet is a recruiter's way of knowing you did not actually own the outcome.",
    "The ratio of adjectives to accomplishments in this document is not something I expected to encounter today.",
    "I have screened twelve hundred resumes this quarter. Yours is statistically forgettable.",
    "You listed three certifications and one internship. The internship section contains the word 'assisted' four times.",
    "I am going to be honest in a way that your college career center never was: this needs to be redone from scratch.",
    "Your summary section is an essay about ambition. Your experience section is evidence of attendance.",
    "Every company listed here, your contribution description is identical. You clearly used the same template for all of them.",
    "The resume wants senior-level compensation and provides entry-level specificity. We cannot bridge that gap.",
    "After reading your objective statement, I understand what you want. After reading your experience, I understand why you haven't gotten it.",
    "The word 'passionate' appears twice. Passion without product is just emotion.",
    "This document is beautifully formatted. It is also substantively empty. Design choices cannot fix that.",
    "I have sent this to three colleagues. We all agree on the core issue: there are no measurable results anywhere."
  ],
  rust_elitist: [
    "Your code has a garbage collector doing the one job you should be doing yourself.",
    "I audited your project directory and found exactly zero evidence of systems-level thinking.",
    "You have never written code that required you to understand what memory actually is.",
    "The safety of your runtime environment is inversely proportional to the depth of your understanding.",
    "You listed 'systems programmer' on a resume containing exclusively JavaScript. This is a category error.",
    "A developer who has never reasoned about ownership, borrowing, or lifetimes is a developer with a knowledge gap the size of the heap.",
    "You are running managed runtimes because the alternative would force you to confront how little you understand about execution.",
    "Your resume is technically correct in the same way that 'I touched a piano once' is technically music experience.",
    "I have read your code. Not your repo — your code. The one you didn't think anyone would actually examine.",
    "Type safety is a concept you have heard of. Memory safety is a concept you avoid by using Node.js.",
    "Every abstraction you rely on exists to hide complexity from people who are not ready to face it.",
    "Your runtime panics so you never have to think about why. That is a feature for beginners and a crutch for everyone else.",
    "You have selected comfort over competence at every fork in your learning path.",
    "A dependency tree with 847 packages tells me you have outsourced every hard problem to someone else.",
    "The confidence in this resume is inversely proportional to your apparent understanding of what runs under your frameworks."
  ],
  startup_cto: [
    "We do not fund Figma prototypes. We fund shipped products. Your resume is the former.",
    "I have seen pitch decks from founders with actual revenue. Yours is a pitch deck for your own job application.",
    "The term 'co-founder' appears here without a company name, a product, or a user to validate it.",
    "Your runway is zero. Your ambition is infinity. The math on this venture does not work.",
    "I fund people who have shipped things and failed publicly. You have shipped nothing, which means you have learned nothing.",
    "Your startup experience section is a series of elegant descriptions of conversations that happened in coffee shops.",
    "Hustle culture vocabulary does not substitute for deployed infrastructure. I have made this mistake once.",
    "MVP does not mean Minimum Viable Presentation. It means Minimum Viable Product. You have the first. Not the second.",
    "You describe problems with venture-scale ambition and propose solutions with intern-level execution history.",
    "I have invested in teams. Teams that ship. Your team appears to have shipped a README and a domain name.",
    "The word 'founder' is meaningful only when attached to something that exists and has users. Yours is attached to a Discord server.",
    "You talk about scaling to millions of users. Your architecture has never been tested by three simultaneous users.",
    "Your product-market fit analysis is missing a product and a market.",
    "I respect the energy. I cannot deploy energy to production. I deploy code.",
    "Your conviction is high. Your evidence is low. In venture, that gap is called 'pre-seed' for a reason."
  ],
  systems_architect: [
    "Your architecture diagram is a collection of boxes connected by arrows that describes no actual data flow.",
    "A distributed system is not a marketing claim. It is a set of engineering tradeoffs you clearly have not made.",
    "CAP theorem is on your resume. The implementation history suggests you cannot explain what the C stands for.",
    "You have designed systems that have never handled failure modes, which means you have not actually designed systems.",
    "I review architecture for organizations that operate at scale. Your architecture operates at localhost.",
    "Database schema design is not listing the word 'SQL' in your skills section.",
    "You have described microservices without mentioning service discovery, circuit breakers, or eventual consistency. That is a monolith with extra steps.",
    "Latency, throughput, and durability are not decorations. They are constraints. Your designs have ignored all three.",
    "An architect who has never been responsible for an outage is an architect who has never shipped to production.",
    "The system you described would not survive a single traffic spike, and I suspect you know that.",
    "Your infrastructure cost analysis is absent. That means you have never been responsible for an AWS bill.",
    "Horizontal scaling is not 'spin up more servers'. Your resume suggests that is your entire understanding.",
    "API design that has never been consumed by an external team is not API design — it is wishful documentation.",
    "The architecture described here would introduce three race conditions before the first user registers.",
    "I have designed systems that serve hundreds of millions of requests. Your system serves your demo video."
  ]
};

// Body development — what specifically is wrong, detailed observations
const EVIDENCE_POOL = {
  staff_engineer: [
    "The projects section is a timeline of tutorials completed but never extended. There is no evidence that you have ever added a feature to a codebase someone else wrote.",
    "Your pull request history does not appear on this resume because it would require having had colleagues who reviewed your code.",
    "The skills listed here were last used in a structured learning environment where the answer was provided at the end.",
    "You have described your work experience using the passive voice consistently. 'Assisted with', 'responsible for', 'helped to'. These are proximity words, not ownership words.",
    "The gap between your first and most recent project on this resume reveals the same skill level. Growth requires feedback. Feedback requires deployment.",
    "Every project listed is a solo endeavor, which is fine for learning and disqualifying for senior engineering claims.",
    "You have spent measurable time on the visual presentation of this resume and immeasurable time on the substance of it.",
    "The word 'scalable' appears three times. Not one project linked here has served more than a handful of users.",
    "I am looking at your GitHub. The last meaningful commit was four months ago. The one before that was to a boilerplate setup.",
    "Your technical summary suggests breadth. Your project history confirms shallow contact with every technology listed.",
    "Zero evidence of having debugged something that was not your own code. That is the real differentiator.",
    "The certifications section is proportionally larger than the shipped projects section. That is diagnostic.",
    "You have built several things that could be described as 'working locally'. You have shipped nothing to a real user.",
    "Code quality cannot be assessed because none of the linked repositories have been maintained past the initial commit.",
    "Your experience section describes the work of a junior developer using the vocabulary of a senior engineer."
  ],
  faang_gatekeeper: [
    "Framework knowledge is not engineering. The interview will ask you to reason from first principles and your resume has none.",
    "Every technology listed here was added after watching a conference talk, not after debugging a production incident.",
    "The absence of performance metrics is telling. Real systems have latency numbers. Tutorial projects have completion dates.",
    "Listing fifteen tools without demonstrating depth in any of them is a signal that you optimize for looking impressive rather than being capable.",
    "Your project section contains zero examples of handling failure, edge cases, or scale. These are the questions that matter.",
    "You have studied the vocabulary of senior engineering without studying the craft. The interview will expose this.",
    "System design experience appears to consist of reading articles about system design, not building systems.",
    "A candidate who lists 'distributed systems' but has no discussion of consistency, availability, or partition tolerance has not studied distributed systems.",
    "The absence of any mention of debugging, profiling, or performance optimization is a pattern I recognize in candidates who have worked exclusively in tutorials.",
    "You claim backend expertise but cannot name a query execution plan or explain an N+1 problem in your own words.",
    "The skills section grows horizontally across every buzzword category. The depth section is empty.",
    "Zero mention of code review, pair programming, or technical mentorship. You have coded exclusively in isolation.",
    "Your biggest listed project is a clone of a company that has actual engineers maintaining it. That is not a resume asset.",
    "Listing algorithmic complexity without any evidence of applying it to a real performance problem is a gap this interview process will find.",
    "The confidence in this resume is something I respect as a human quality and fear as an engineering manager."
  ],
  devops_veteran: [
    "Your deployment strategy appears to consist of running npm start and hoping the environment variable is correct.",
    "The pipeline section of this resume is empty because you have never written one that went to actual production.",
    "Docker on the skills list. Zero mention of image layers, build caching, multi-stage builds, or production considerations.",
    "I have maintained infrastructure that serves millions of requests per minute. Your infrastructure serves a demo that broke last Tuesday.",
    "Monitoring appears nowhere in this document. You have never been responsible for knowing when something broke.",
    "Zero on-call experience means zero understanding of what happens when your code meets reality at 2am.",
    "The confidence to list Kubernetes without mentioning pod autoscaling, resource limits, or namespace isolation is a remarkable act of self-belief.",
    "Your 'cloud experience' is a serverless function on a free tier that has never received more than twelve requests.",
    "CI/CD without specifying the tooling, the triggers, or the artifacts produced is not CI/CD. It is an acronym.",
    "No mention of secrets management, environment segregation, or deployment rollback strategies. These are not advanced topics.",
    "You have listed infrastructure tools the way a tourist lists cities they have flown over.",
    "An SRE who has never written a runbook or conducted a blameless post-mortem is a developer with a job title upgrade.",
    "Your infrastructure is stateless in the sense that it does not retain any evidence of having been real.",
    "Database backups, disaster recovery, and failover strategies are conspicuously absent from your DevOps experience.",
    "The difference between your claims and your evidence is measurable in production hours you have not logged."
  ],
  oss_maintainer: [
    "Your repositories have not been touched in months and contain no documentation that would allow another human to use them.",
    "The commit messages in your repository read like internal monologue rather than communicative engineering history.",
    "Zero open issues, zero closed issues, zero contributors beyond yourself. This is not a project. It is a folder.",
    "A project description that begins with 'A simple' is typically correct about the 'simple' and incorrect about everything else.",
    "Your code has no tests. Code without tests is a statement: you do not trust it to work when you are not watching.",
    "Every dependency in your package.json is unpinned. You have never experienced a breaking upstream change.",
    "The README describes what your project does. It does not describe what it does when it breaks. That is the important section.",
    "You have merged your own pull requests into your own repository. That is one data point about your relationship with code review.",
    "Your API surface area has never been consumed by a developer who did not write it. Real APIs require real documentation.",
    "The project has a license file. The license file is the only file that has been edited in eight months.",
    "You have contribution activity that corresponds precisely with course deadlines and nothing in between.",
    "Forking a repository and running it is listed as experience with that project. It is not.",
    "The code quality in your repository would not survive a review from any engineer I have worked with.",
    "Your documentation describes the happy path. You have not considered what happens when something goes wrong.",
    "A repository with star count zero and fork count zero has never been evaluated by anyone who did not already know you."
  ],
  exhausted_recruiter: [
    "Your experience section describes the same role at three companies with different names and identical bullet points.",
    "The objective statement at the top of this resume describes what you want, not what you offer. We are interested in the latter.",
    "Every bullet point in this resume ends with a generality. Not one ends with a number, a metric, or a measurable outcome.",
    "Three years of experience described in four lines is either extreme conciseness or extreme avoidance of specifics.",
    "The skills section contains technologies used professionally and technologies encountered in tutorials listed with equal confidence.",
    "Two internships, both described as foundational, neither described as producing a specific outcome. This is a pattern.",
    "You have used the word 'developed' to describe work that involved configuring a template and adding placeholder text.",
    "The resume font is beautiful. I noticed this because the content gave me nothing to think about.",
    "Education section: listed first, formatted prominently. Experience section: three lines. This is a choice that communicates something.",
    "Your project descriptions are vague in exactly the way that suggests you did not own the work.",
    "We receive many resumes with 'strong communication skills' listed. We have never hired someone because they listed it.",
    "You have applied for a senior role. Your most recent job title was junior. The gap requires explanation. The explanation is not here.",
    "References available upon request is a phrase that has not communicated anything useful since 2008.",
    "The cover letter would be more credible if the experience section supported the claims made in it.",
    "Three companies in eighteen months is not 'diverse experience'. It is a pattern that hiring managers notice."
  ],
  rust_elitist: [
    "Your entire project history runs in environments where memory management is handled by a garbage collector that hides your mistakes.",
    "The frameworks you rely on exist to protect you from understanding what your code is actually doing.",
    "You have never written code where getting the ownership model wrong would prevent compilation. That is a significant knowledge gap.",
    "Async/await in JavaScript is not concurrency. It is the illusion of concurrency in a single-threaded event loop.",
    "Every framework you have listed is an abstraction over an abstraction. You know none of the layers beneath.",
    "Your dependency count suggests that you have never considered what a supply chain attack looks like from the inside.",
    "Type inference is working overtime to protect you from the type system you do not know how to use.",
    "You have written applications that consume memory without understanding how memory works.",
    "The confidence to list 'performance optimization' without ever having measured a flamegraph is a specific kind of courage.",
    "Your test coverage is zero, which means your program is technically correct until the moment it is not.",
    "Safety at runtime is a tax you pay for not understanding what could go wrong at compile time.",
    "You have optimized CSS animations and not once profiled the code that runs behind them.",
    "The abstractions you use are designed to make the hard problems invisible. They are still there.",
    "Your build times are slow because you do not understand what the build is actually doing.",
    "Every tool in your stack has been chosen for developer experience. None of them have been chosen for correctness guarantees."
  ],
  startup_cto: [
    "The product described on this resume has never been evaluated by a user who was not a personal contact.",
    "You have built a landing page and described it as product-market validation. These are not the same category.",
    "Your technical co-founder story ends before the first commit to a shared repository.",
    "The startup section of this resume describes conversations, not shipped features.",
    "You have a domain name and a Notion workspace and you have called it a company.",
    "Revenue figures are absent from your startup experience because the startup has not generated revenue.",
    "Pivot is a term for companies that have shipped something and changed direction. You have pivoted without shipping.",
    "The product roadmap exists. The product does not exist. A roadmap for nothing is a creative writing exercise.",
    "You have described the problem your startup solves with clarity and the solution with a Figma link that no longer works.",
    "Your burn rate is your AWS free tier. Your runway is your parents' patience.",
    "The word 'we' in your startup description refers to you and a Notion document.",
    "Scalable architecture is something you design when you have users. You are pre-user. You do not need a scalable architecture.",
    "Technical leadership at a startup with zero employees is individual contributor work with a better title.",
    "Your startup has a deck that has been presented to three people in a coffee shop and rejected by all three.",
    "I have backed companies from idea to exit. The pattern I see here is a long idea phase with no exit from that phase."
  ],
  systems_architect: [
    "Your architecture documentation describes the system you intended to build, not the one that was built.",
    "Database selection without discussing consistency models, replication, or backup strategies is not database design.",
    "Your service boundaries are named after the data they store rather than the business capability they represent.",
    "An event-driven architecture described without mentioning consumer groups, dead letter queues, or ordering guarantees is a messaging system in name only.",
    "You have described a system that would introduce cascading failures under load, and I do not think you know it.",
    "API versioning strategy is absent from your design work. This means you have never had to maintain backward compatibility.",
    "Your caching strategy is 'add Redis'. That is a tool, not a strategy.",
    "Zero mention of observability: no tracing, no structured logging, no alerting. You would not know if your system was failing.",
    "Schema migrations appear nowhere in your experience. You have never had to evolve a database that was already in production.",
    "The authentication architecture described here has three common vulnerabilities that you appear unaware of.",
    "Your system handles millions of users in the abstract. It has never handled a load test.",
    "Data partitioning strategy is the sentence 'we use a distributed database.' That is not a strategy.",
    "You have designed a system with a single point of failure and appear to believe it is fault-tolerant.",
    "The latency requirements are described without discussing the tail latency implications. P99 is the number that matters.",
    "Your architecture has never been reviewed by another engineer, which is detectable in the way it is described."
  ]
};

// Psychological profile shots — what kind of developer they are
const PROFILE_POOL = {
  staff_engineer: [
    "You are the kind of developer who rewrites the README before the code is ready.",
    "Your primary engineering activity is beginning new projects to escape the complexity of finishing existing ones.",
    "You optimize for the appearance of productivity rather than the output of it.",
    "You have mistaken learning the vocabulary for developing the competence.",
    "The persona of 'engineer' is something you wear comfortably. The work of engineering is something you approach cautiously.",
    "You are technically employed in the field. You are not yet technically effective in it.",
    "Your instinct when facing a hard problem is to describe it, not solve it.",
    "You have accumulated knowledge surface area without depth, which is the developmental profile of a senior bootcamp graduate.",
    "The feedback loop of tutorial completion feels like progress. It is not progress. It is practice for the beginning.",
    "Every framework you have added to your skills list represents a problem someone else solved so you would not have to.",
    "You have been described as a team player by people who have not reviewed your code.",
    "Your comfort zone is the zone of tutorial scaffolding. The edge is where real engineering happens.",
    "You are building a story about yourself as an engineer before you have built the engineering.",
    "The resume is more polished than the repositories it links to. This is a ratio problem.",
    "You learn fast in environments with clear answers and struggle in environments where the answer must be discovered."
  ],
  faang_gatekeeper: [
    "You are preparing for an interview process you do not yet have the experience to pass.",
    "The candidate I am reading would struggle to explain their own project choices under questioning.",
    "You have optimized your resume for keyword matching and not for the technical conversation it will initiate.",
    "Your self-assessment operates significantly above the level supported by your evidence.",
    "You are a candidate who will perform well in a structured learning environment and uncertainly in an unstructured production environment.",
    "The story this resume tells is one of someone who has learned how engineers talk without yet learning how they work.",
    "Pattern matching has allowed you to pass initial screens before. This screen will be different.",
    "You think in terms of technologies rather than tradeoffs, which is the thinking of someone who has not shipped to scale.",
    "Your benchmark for senior engineering is senior engineering job descriptions, not senior engineering outcomes.",
    "The person this resume presents would be outperformed by any candidate with two years of real production experience.",
    "You have studied the form of strong candidates without the substance that makes them strong.",
    "Confidence in an interview is not a substitute for depth, and depth is what is being tested.",
    "You are a good candidate for a role two levels below what you are applying for.",
    "The preparation you have done is real. The experience it is masking the absence of is also real.",
    "I respect that you tried. The interview will reveal what trying without shipping produces."
  ],
  devops_veteran: [
    "You talk about infrastructure with the vocabulary of someone who has read the documentation and the confidence of someone who has survived the alerts.",
    "Real operations engineers have nightmares about the things they have fixed. You sleep soundly because you have fixed nothing.",
    "You have never had to roll back a deployment at midnight with the CTO asking questions in a Slack thread.",
    "Your relationship with production is one of theoretical familiarity.",
    "The DevOps persona requires having operated something. You have administered a local development environment.",
    "You use infrastructure tools as credentials rather than as tools for solving real operational problems.",
    "Real infrastructure engineers do not list tools on resumes. They describe the outages they prevented and the ones they caused.",
    "You have never been the person responsible when something was broken for real users. That experience is irreplaceable.",
    "Your current operating model is localhost. The skills required to graduate from that require graduated exposure to reality.",
    "I would not put you on call. I would not be comfortable explaining why to someone who got paged.",
    "You approach cloud infrastructure as a product catalog rather than an operational responsibility.",
    "The ops part of DevOps is the part you are most comfortable describing and least equipped to perform.",
    "You have selected the title of someone who has been through fires and presented a resume that shows no smoke.",
    "Reliability engineering requires a relationship with failure. You have not been introduced.",
    "Your calmness under operational pressure is untested, which is another way of saying it is unknown."
  ],
  oss_maintainer: [
    "You have written code for yourself and called it open-source contribution.",
    "Your relationship with code review is one of author, never reviewer. This is a knowledge gap.",
    "You have never had to maintain backward compatibility for someone else's integration. That is the test of real API design.",
    "The repositories that represent your best work are private, which means they have never been evaluated.",
    "Open source contribution is about the community. Your history shows no evidence of engaging with one.",
    "You write code in isolation, which produces isolated code. Production codebases are collaborative artifacts.",
    "The confidence to describe yourself as a contributor requires having contributed something someone actually used.",
    "Your project documentation describes the features and not the failure modes, which tells me who wrote it and for whom.",
    "You have never had to answer a question from a stranger about code you wrote. That interaction develops skills nothing else does.",
    "Your codebase has never been forked, cloned, or depended on by anyone who was not you.",
    "Real open source maintenance is unpaid, thankless, and full of edge cases you did not design for. Your experience is none of those things.",
    "You use open source every day and have contributed to it approximately zero times.",
    "The GitHub profile tells a story of bursts of activity followed by months of quiet. That is a tutorials timeline.",
    "You have created repositories. Creating a repository is the beginning of a project, not the evidence of one.",
    "A green contribution graph is not a portfolio. A portfolio requires work that other engineers have evaluated."
  ],
  exhausted_recruiter: [
    "I have seen this exact resume, formatted differently, one hundred and eighty times this quarter.",
    "Your professional narrative is borrowed from LinkedIn influencers and applied to a background that does not support it.",
    "The person described in this resume's summary is significantly more accomplished than the person described in its experience section.",
    "You have formatted a career that has not yet fully happened and submitted it as if it has.",
    "This resume was written for the applicant tracking system and not for the person reading it. I am that person.",
    "The language choices here reveal someone who researched how resumes should sound rather than how careers should be built.",
    "You have made yourself sound like a senior candidate by borrowing the vocabulary of senior candidates. The evidence is not there.",
    "Three different companies, same four bullet points. One of those four bullet points contains a metric. The others are descriptions of attendance.",
    "I do not doubt your ambition. I do doubt the specifics, because there are none.",
    "Your certifications are recent. Your projects are old. Your skills section is current. The timeline does not cohere.",
    "Somewhere between your education and your experience sections, the story stops making sense.",
    "I have recommended candidates who could not spell their own title. I have rejected candidates with perfect resumes. Yours is closer to the latter.",
    "You are not the first person to submit a resume with 'passionate' in the first sentence. You are not the last.",
    "The amount of effort that went into the formatting of this document could have been redirected into the substance of it.",
    "What I want to see is one concrete thing you built, measured, and improved. It is not here."
  ],
  rust_elitist: [
    "You have chosen the most forgiving environments available and called it software engineering.",
    "Your instinct, when facing a bug, is to search Stack Overflow for the error message rather than reason about the cause.",
    "You have never been forced by a compiler to understand why your code is wrong. That is a privilege with a cost.",
    "The abstractions you use daily are built on top of problems you have never been required to solve.",
    "Your model of performance is 'it is fast enough'. You have never measured what fast enough actually means.",
    "You collect languages the way hobbyists collect instruments. You play none of them at a meaningful level.",
    "The runtime handles your mistakes. You have come to rely on that in a way that limits you.",
    "You think of memory as a resource managed by someone else. It is managed by something, and that something is not free.",
    "Your dependency choices are driven by GitHub star counts rather than correctness guarantees.",
    "Every abstraction leak in your codebase is a concept you have not taken the time to understand.",
    "You have optimized for write-time convenience and not for runtime correctness.",
    "The appeal of your stack is that it handles the hard problems without requiring you to face them.",
    "You have written asynchronous code without understanding the execution model it operates within.",
    "Your mental model of what happens between 'I write this' and 'users experience this' has significant gaps.",
    "The confidence to list 'system design' comes from a place that is several years and many production incidents away from earning it."
  ],
  startup_cto: [
    "You have startup energy without startup evidence.",
    "The vocabulary of venture capital has colonized your resume in the absence of venture results.",
    "You are a founder in the same way that purchasing a domain name makes you a property owner.",
    "Your product vision is compelling. Your execution history is a Figma link.",
    "You are solving the pitch before you have solved the problem.",
    "The co-founder title on this resume describes a social agreement, not a functional company.",
    "You have confused the excitement of idea generation with the discipline of product execution.",
    "Your startup was three people, a shared Notion, and diverging opinions. That is a group project.",
    "The investor language in this document is fluent. The product description is absent.",
    "You have been 'building in stealth' for long enough that stealth is no longer a strategy. It is a condition.",
    "Your product has found market: exactly zero users, zero transactions, zero validation.",
    "You describe your startup the way people describe countries they have visited: with authority and without depth.",
    "The metrics mentioned in your startup section are projections. Investors know what projections are worth before revenue.",
    "You are iterating on an idea before you have validated the idea. That is a very expensive loop.",
    "The startup chapter of this career will produce one valuable thing: the lesson that shipping is harder than describing."
  ],
  systems_architect: [
    "You design systems on whiteboards and not in production, and the difference is everything.",
    "Your architecture is theoretically sound in the way that a map is theoretically accurate before the terrain changes it.",
    "The complexity you have introduced exists to demonstrate capability rather than solve a problem.",
    "You have learned architecture vocabulary without learning the operational cost of architectural decisions.",
    "Every system you have designed has been designed in the absence of real constraints.",
    "You overengineer solutions because you have never paid the cost of the maintenance that follows.",
    "Your instinct is to add components. The instinct of experienced architects is to question whether components are necessary.",
    "You have described scalable systems in the absence of load requirements, which makes 'scalable' meaningless.",
    "The architecture you would present in a design review would not survive the first question about failure modes.",
    "You have read about event sourcing, CQRS, and saga patterns. You have not debugged any of them at 3am.",
    "Your system boundaries are arbitrary rather than derived from business domain analysis.",
    "The confidence with which you describe distributed systems is inconsistent with never having debugged a distributed failure.",
    "An architect who has not been responsible for a production incident has not finished their education.",
    "You design for the green path. The red paths are where architecture actually gets tested.",
    "Your technical vocabulary is current. Your operational intuition is not yet developed."
  ]
};

// Final verdict — killer line closing the roast
const VERDICT_POOL = {
  staff_engineer: [
    "File this resume under 'developing' and come back when there is shipped evidence to support the claims.",
    "The gap between what you say and what you can prove is not a communication problem. It is an experience problem.",
    "Rejected. Not with hostility. With the suggestion that you go build something real and try again.",
    "This resume argues for potential. Potential does not get production access.",
    "I would hire you to explain what you think you know. I would not hire you to build anything load-bearing.",
    "Strong no. And I mean that constructively, which I know sounds sarcastic but is actually accurate.",
    "File under: promising candidate who hasn't shipped anything yet. Re-read this in two years.",
    "You have the instincts of someone who will eventually be good. You are not yet good.",
    "The resume is the advertisement. The portfolio is the product. The product is not ready.",
    "Come back when the projects have users. Real ones. Not teammates from the course.",
    "The trajectory is fine. The timeline is not yet right. The answer is no with a future-dated maybe.",
    "Not ready. Not never — just not now. Ship something first. Then send this again."
  ],
  faang_gatekeeper: [
    "The system design round will be educational for everyone involved, including and especially you.",
    "Archived. The keyword filter was impressed. Nothing downstream was.",
    "No offer. Strong recommendation to spend six months building something at scale before the next application.",
    "The interview would have been useful feedback. The resume told us enough.",
    "Not a fit at this time. The definition of 'this time' extends until the project section contains something real.",
    "Declined. Not for lack of enthusiasm — for lack of evidence that the enthusiasm has produced anything.",
    "REJECTED. Return when you have shipping receipts, not just tutorial completion certificates.",
    "The calibration is off. You have assessed yourself at a level that requires years of work you have not yet done.",
    "No hire. Reapply when you have a production incident story. Any production incident story.",
    "The interview loop would close at the first technical screen. Decline to preserve everyone's time.",
    "Passed on. The skills section is impressive. The evidence for any of it is not present.",
    "Not this cycle. Not this level. Two levels down and a year of real shipping and we talk again."
  ],
  devops_veteran: [
    "This resume is a threat assessment. Threat level: high to the uptime of any system you are allowed near.",
    "Do not deploy this person to any environment where real users depend on availability.",
    "The on-call rotation will not be kind to someone with this level of operational preparation.",
    "Keep this candidate away from the production deployment button until further evidence arrives.",
    "Hard pass. I will not explain a downtime to a board because we hired someone based on this resume.",
    "No. And I say that having seen what happens when someone this prepared makes it to production.",
    "DEPLOYMENT FAILED. RETRY AFTER ACCUMULATING REAL OPERATIONAL EXPERIENCE.",
    "This profile is a localhost resident. The production environment is not a training environment.",
    "Rejected for operational roles. Reconsidered only after evidence of surviving a real outage.",
    "I have fired people for less. I have also hired better. This resume is not ready for either category.",
    "Pass. Come back with an on-call story. One real one is worth more than everything listed here.",
    "PIPELINE EXITED WITH CODE 1. The engineer described here is not production-ready."
  ],
  oss_maintainer: [
    "THREAD LOCKED. This contribution history does not meet the standard for meaningful authorship.",
    "Marked as duplicate. We have received this developer profile before with different names.",
    "WON'T MERGE. The evidence for the described experience level is not sufficient.",
    "Closed without comment. The code speaks for itself and it is saying very little.",
    "PR rejected. Fix the fundamental issues before resubmitting.",
    "Archived. The repositories suggest a developer at the beginning of their journey describing themselves at the middle.",
    "This contributor has never had their code reviewed by someone who did not want to be nice to them.",
    "ISSUE CLOSED: WONTFIX. The pattern here requires a different kind of intervention than a code review.",
    "No merge. The codebase you would contribute to deserves a contributor who has shipped to real users.",
    "BLOCKED. Not personally. Professionally, pending evidence of collaborative development.",
    "This PR would not survive a review from anyone who cares about correctness over completion.",
    "GIT BLOCK INITIATED. Resume quality insufficient to justify proceeding to next review stage."
  ],
  exhausted_recruiter: [
    "Archived in the rejection queue. Nothing personal — it is a volume problem that you did not solve.",
    "Thank you for your application. We will not be moving forward. Please also update the project section before your next submission.",
    "Your profile has been reviewed. The outcome is consistent with what the experience section predicts.",
    "Filing this as 'screened out at level'. The reasons are visible to anyone who reads past the summary.",
    "This one is a no. The one you send in a year after building something might be different.",
    "No further steps at this time. Revisit the basics: what did you build, for whom, and how did you measure it.",
    "Application rejected. Resume rejected. Please rebuild both from scratch with substance as the primary goal.",
    "Forwarded this to the junior roles team. They had the same feedback.",
    "You made it past the ATS. You did not make it past me. There is a lesson in that gap.",
    "The answer is no. The answer will remain no until there is evidence that the answer should change.",
    "Rejected. Not because of the formatting, which was honestly good. Because of the absence of anything underneath it.",
    "After review, we have decided to continue with other candidates. Those candidates had outcomes listed in their experience section."
  ],
  rust_elitist: [
    "Your code is unsafe in ways you are not aware of because your runtime hides the evidence.",
    "COMPILE ERROR FATAL: CLAIM VERIFICATION FAILED AT EVERY CONSTRAINT BOUNDARY.",
    "You are not systems programming. You are application programming with delusions of depth.",
    "This resume cannot pass the borrow checker because the ownership of every claim is unclear.",
    "Segmentation fault detected: your confidence has exceeded the bounds of your allocated experience.",
    "Undefined behavior detected in career trajectory. Abort with prejudice.",
    "Type mismatch: claimed level does not match inferred level from evidence.",
    "The garbage collector is working overtime on this resume. Many assumptions need to be freed.",
    "Lifetime error: the experience described here expires before the interview.",
    "No. Learn what you are actually using before claiming to know it at depth.",
    "UNSAFE BLOCK DETECTED WITHOUT SAFETY PROOF. Rejected on first principles.",
    "Your mental model has memory leaks. Every abstraction you rely on is hiding a concept you have not learned."
  ],
  startup_cto: [
    "No term sheet. Insufficient evidence of shipping to justify further conversation.",
    "VC RUNWAY EXHAUSTED. The pitch was not compelling. The product does not exist.",
    "Pass at this stage. Come back with users, revenue, or one real shipped thing.",
    "We do not invest in Figma files or Discord servers called startups.",
    "HUSTLE CAPACITY EXHAUSTED: Ambition is present. Execution history is absent.",
    "Declined. The idea is interesting. The evidence that you can build it is missing.",
    "No commitment at this time. Build something first. Then describe it.",
    "The deck was polished. The product was a concept. We fund products.",
    "You are pre-seed in the truest sense: you need to plant something before you can harvest it.",
    "Not ready. Not because the problem is wrong but because you have not proven you can solve it.",
    "PITCH FAILED. Return with traction. Even small traction. Something real.",
    "No. Ship something. Then ship something again. Then call us."
  ],
  systems_architect: [
    "DEADLOCK DETECTED. This architecture has circular dependencies that will be discovered in production.",
    "The system described here would not survive its first traffic spike with any dignity.",
    "TIMEOUT: The design review meeting this resume would generate would exceed its scheduled duration.",
    "No. The architecture has gaps that suggest the design was done without considering the failure modes.",
    "Rejected for architect-level roles. The evidence points to software engineer level responsibilities.",
    "This design would introduce latency that the product cannot afford and debt that the team cannot pay.",
    "SYSTEM HALT: The described architecture is a whiteboard exercise with no evidence of operational reality.",
    "Hard pass. The tradeoffs were not made — they were not discussed.",
    "Not ready for architecture leadership. Ready for guidance from someone who has shipped at this scale.",
    "EGO DIAGNOSTICS CRITICAL. The gap between confidence and evidence suggests significant calibration needed.",
    "Declined. Return when you have operated what you have designed and survived the experience.",
    "The architecture would work on a whiteboard. The whiteboard is not production. This role requires production."
  ]
};

// ─── Recovery Protocols (5 per resume, drawn from massive angle-aware pools) ──
const RECOVERY_FRAGMENTS = {
  localhost_prisoner: [
    "Ship something to a public URL today. Any URL. Vercel, GitHub Pages, Fly.io — it does not matter. The gap between 'runs locally' and 'deployed publicly' is the gap between developer and engineer.",
    "Deploy one project tonight. Your career cannot prove itself from behind a localhost port.",
    "Your code needs witnesses. Deploy it. People you do not know need to be able to use it and complain about it.",
    "The absence of live links on your resume is not a styling choice. It is a red flag. Fix it before you submit again.",
    "Real engineers ship. The first deployment is terrifying and irreplaceable. Do it before you finish reading this."
  ],
  clone_overload: [
    "Delete the clones. Not from your hard drive — from your featured repositories. Clones prove you can follow instructions. They prove nothing about engineering judgment.",
    "Build something you invented, even if it is small. The originality signal matters more than the complexity signal.",
    "Clone apps prove course completion. Actual problems prove problem-solving. Find one actual problem and build a solution.",
    "Your portfolio currently says 'I can follow a tutorial'. Your portfolio needs to say something else.",
    "The Netflix clone goes in the trash. Not the learning — the lesson was valid. The resume line was not."
  ],
  ai_bluff: [
    "Stop listing machine learning as a skill until you can explain gradient descent without a metaphor.",
    "Calling an API is integration work. It is valuable work. It is not AI engineering. Adjust the language accordingly.",
    "Remove ML from your skills unless you have trained a model. Using a model that someone else trained is a different skill.",
    "You have worked with AI tools. That is real. Describe it accurately and stop inflating it to 'AI engineer'.",
    "The credential 'AI developer' requires having done something with data that you collected, cleaned, and used to train something. If that has not happened, the title has not been earned."
  ],
  blockchain_bluff: [
    "Remove Web3 from your skills unless you have deployed a contract to mainnet and understand what gas fees actually mean.",
    "Listing blockchain as a skill because you understand the concept is like listing aviation because you have been on a plane.",
    "The Web3 hype cycle has produced many resumes with zero projects. Yours is one of them. Fix that.",
    "Crypto credibility requires deployed code, not Wikipedia-level understanding. Remove it or build something real.",
    "Either write a smart contract, deploy it, and use it — or remove the blockchain claim from your skills section."
  ],
  certification_hoarder: [
    "Stop collecting certificates and start collecting shipped projects. One deployed project outweighs five Udemy completions.",
    "Certificates prove you paid attention. Production experience proves you can apply it under pressure. You need the second one.",
    "The certifications section is full. The projects section is not. This tells any experienced reviewer where your time went.",
    "A completion certificate from a course is the beginning of learning that skill, not the credential for it.",
    "Stop buying courses and start finishing projects. The ratio in your resume is diagnostic."
  ],
  startup_delusion: [
    "Remove 'founder' unless the company has a registered entity, actual users, or revenue. A Notion board is not a company.",
    "Co-founder without a product is a social title. When you have something deployed and used, keep the title. Until then, reconsider.",
    "The startup chapter needs to end with a shipped product or a clear lesson from why it did not ship.",
    "Stop describing idea generation as company building. They are different activities with different market values.",
    "Calling yourself a founder before you have shipped to real users is optimism with a PR strategy."
  ],
  buzzword_salad: [
    "Replace one buzzword sentence with a sentence that contains a number. Any number. Users, latency, uptime, lines of code.",
    "Every 'passionate', 'innovative', and 'results-driven' costs you recruiter attention. Remove them and replace with specifics.",
    "Read your resume out loud. Every sentence that does not describe something specific should be deleted.",
    "LinkedIn adjectives do not survive a technical conversation. Remove them before someone has to ask you what they mean.",
    "The summary section should describe what you have built, for whom, and what it achieved. Not who you aspire to be."
  ],
  domain_confusion: [
    "Pick two skills and go deep instead of listing sixteen and staying shallow. The interview will expose the difference.",
    "Forty skills is not impressive. It is a signal that you have sampled widely and committed nowhere.",
    "Your skills section is a menu, not a competency list. Remove everything you cannot discuss technically for twenty minutes.",
    "Stop adding skills you encountered in a tutorial. List skills you can be tested on.",
    "Depth is the credential. List fewer things and be able to defend every one of them under questioning."
  ],
  quant_vacuum: [
    "Add a number to every experience bullet point. Any number. The number proves you measured something. Measurement proves ownership.",
    "Vague verbs — 'assisted', 'helped', 'supported' — tell a reader nothing. Quantify and own.",
    "If you cannot attach a metric to a claim, the claim has no signal for a reviewer. Rebuild the bullets with numbers.",
    "One percent improvement with a measurement is worth more than 'significantly improved' with nothing.",
    "Results-oriented resumes contain results. Your resume contains activity descriptions. Rewrite with outcomes."
  ],
  corporate_drone: [
    "Never write 'responsible for' or 'assisted with' again. Own the outcome or describe your specific contribution clearly.",
    "The passive voice in a resume bullet means you are hiding something. Usually, it is the fact that you did not own the outcome.",
    "Delete 'helped' and replace it with what you specifically contributed, how much, and what changed as a result.",
    "You were there. That is not a resume line. What did you build, change, or prevent?",
    "Experience bullets should start with strong verbs that you can defend: built, shipped, reduced, designed, prevented. Not 'assisted'."
  ],
  kubernetes_mismatch: [
    "Remove Kubernetes from your skills unless you have debugged a pod failure in production. Reading the docs is not operational experience.",
    "K8s without production incidents is theoretical knowledge. Describe it accurately or remove it.",
    "The Kubernetes line says 'I know what this does'. The role requires 'I have kept this running at 3am'. Different things.",
    "List Kubernetes when you can describe a specific failure you diagnosed and resolved. Not before.",
    "Container orchestration is a skill earned through operational experience. The resume implies proficiency you have not yet proven."
  ],
  docker_mismatch: [
    "Docker without a pipeline means you are containerizing local development. That is useful. That is not DevOps.",
    "Remove Docker from your DevOps context until you have it connected to a CI/CD trigger.",
    "Containerization is one step. Deployment automation is the next one. Take the next step before listing DevOps.",
    "Docker on your laptop and Docker in production are different problems. Your resume implies you have solved the second one.",
    "A Dockerfile is a starting point. A production container strategy is the destination. Describe where you actually are."
  ],
  generic_mediocre: [
    "The most common resume problem is that it describes your history rather than your impact. Rewrite every bullet with that distinction in mind.",
    "A resume that is technically correct and genuinely unmemorable will be rejected. Yours is currently that. Fix it by being specific.",
    "Remove everything that does not answer the question 'and this mattered because...'. What remains is your actual resume.",
    "Every bullet point should tell a reader what you did, how much, and why it mattered. The current version does not do this.",
    "Generic resumes produce generic outcomes. The specificity of your descriptions is the differentiator."
  ]
};

const PERSONA_RECOVERY_DEFAULTS = {
  staff_engineer: [
    "Accept feedback publicly. The code review you have been avoiding is the fastest way to grow. Find someone who will be honest with you.",
    "Finish something before starting the next thing. The pattern of abandoned projects is visible in the resume and in the work history.",
    "Write the tests. Not because anyone told you to — because the discipline of testing is what separates junior from senior work.",
    "Debug something that you did not write. The experience of navigating unfamiliar code is irreplaceable.",
    "Ask a senior engineer to review your code and tell them to be honest. The comfort of polite feedback is the enemy of growth."
  ],
  faang_gatekeeper: [
    "Go build something that breaks and fix it. The learning in the fix is worth more than any course completion.",
    "Stop optimizing for the initial screen and start building the depth that survives the technical conversation.",
    "Read the papers, not just the blog posts. First principles matter in technical interviews.",
    "Build a project that has at least one user who is not your friend. Their feedback is real signal.",
    "Contribute to a project larger than yours. The experience of working in an established codebase is irreplaceable."
  ],
  devops_veteran: [
    "Run something in production and watch it fail. Then fix it. Then document it. That is the education you need.",
    "Set up monitoring for a real application. Not a tutorial project — something with a URL that someone else accesses.",
    "Read a post-mortem from a real company and understand every decision described. Then write one of your own.",
    "Build a CI/CD pipeline from scratch for one project. Not from a template — from understanding.",
    "Get paged once, for anything. The experience of responding to a real alert is worth months of reading."
  ],
  oss_maintainer: [
    "Open one PR to a project that has more than a hundred stars. The review process will teach you more than six tutorials.",
    "Write documentation for your project as if someone you have never met needs to use it. Discover what you assumed they knew.",
    "Review someone else's PR before you submit your next one. Reading code critically is a skill that requires practice.",
    "Publish your project publicly and tell three people to try it. Handle their feedback.",
    "Write a test for a bug before you fix it. This discipline is what separates maintained codebases from abandoned ones."
  ],
  exhausted_recruiter: [
    "Every bullet point needs a result. Not an activity — a result. Rewrite all of them.",
    "Reduce the skills section to the things you can discuss for twenty minutes without notes.",
    "Remove every adjective from your summary that you would not say out loud in an interview. Start over from what remains.",
    "Call three people who worked with you and ask them what you were actually good at. Use that language.",
    "Your resume should be one page. If it is not one page, it is not ready."
  ],
  rust_elitist: [
    "Learn one thing below the abstraction layer you currently use. Just one. See what it changes.",
    "Profile your code before you claim to have optimized it. Measurement is what separates optimization from assumption.",
    "Write something with explicit memory management, even if it is a toy project. The discomfort is the lesson.",
    "Read the source code of a library you use every day. Discover what it is actually doing on your behalf.",
    "Pick one problem you use a library to solve and implement the core of it yourself. Once. For understanding."
  ],
  startup_cto: [
    "Ship the simplest possible version of your idea in the next thirty days. Not the ideal version. The real one.",
    "Find one real user and watch them use your product without explaining anything. Then fix what they broke.",
    "Write down what you think the product does and ask someone else to read it and explain it back to you.",
    "Set a shipping date and keep it, even if what ships is embarrassingly small. Shipping is the muscle you need to build.",
    "Stop perfecting the pitch and start shipping the product. The market is not waiting for your deck to be ready."
  ],
  systems_architect: [
    "Operate what you design. Take responsibility for running something in production before designing the next system.",
    "Design for failure before designing for features. Map out three ways your current architecture fails. Then fix them.",
    "Talk to the people who will use your system before finalizing the design. Their constraints will change your decisions.",
    "Read a post-mortem from a system you admire and understand what architectural decision produced the failure.",
    "Estimate the cost of your architecture before you present it. Infrastructure decisions have financial consequences."
  ]
};

// ═══════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════════════════════
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
