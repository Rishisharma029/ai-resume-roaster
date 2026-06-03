// 8 Custom Rotated Roaster Personalities and their configurations
export const PERSONALITIES = [
  {
    id: 'staff_engineer',
    name: 'Sleep Deprived Staff Engineer',
    role: 'Reviews PRs at 3AM. Survives on double-espresso and pure, unrefined spite. Hates React hooks.',
    avatar: '☕',
    themeClass: 'theme-techlead',
    scanLogs: [
      'Accessing git blame database...',
      'Counting StackOverflow dependencies...',
      'Checking if you commit node_modules...',
      'Ego-to-skill ratio analysis: CRITICAL OUT OF BOUNDS',
      'Detecting Vim exits... Wait, you use VSCode. Disappointment: 99%',
      'Compiling code audacity metrics...'
    ]
  },
  {
    id: 'faang_gatekeeper',
    name: 'FAANG Gatekeeper',
    role: 'Obsessed with Big-O notation, sharding tables, and judging your school prestige. Wears Patagonia vests.',
    avatar: '👔',
    themeClass: 'theme-faang',
    scanLogs: [
      'Running LeetCode similarity checker...',
      'Checking time complexity of your career path (O(n^2) at best)...',
      'Scanning for system design buzzwords: Load Balancers, Sharding...',
      'Verifying brand name prestige on experience list...',
      'Optimizing rejection letter latency...'
    ]
  },
  {
    id: 'devops_veteran',
    name: 'DevOps War Veteran',
    role: 'Has PTSD from AWS billing alerts and Kubernetes pod crash loops. Screams at YAML indentation.',
    avatar: '💣',
    themeClass: 'theme-ai',
    scanLogs: [
      'Parsing YAML configuration files... Indentation error bypass active.',
      'Checking Prometheus alerting thresholds...',
      'Scanning for unencrypted SSH keys...',
      'Checking if Docker container runs as root... (Oh God, why)',
      'Calculating AWS pricing model bankruptcy probability...'
    ]
  },
  {
    id: 'oss_maintainer',
    name: 'Open Source Maintainer',
    role: 'Closes your PRs without comments. Hates drive-by documentation fixes. Close-with-comment energy.',
    avatar: '🐙',
    themeClass: 'theme-founder',
    scanLogs: [
      'Checking sign-off requirements for commits...',
      'Detecting drive-by README typo fixes...',
      'Scanning for untested lines in pull requests...',
      'Checking issues opened vs closed ratio...',
      'Assessing probability of marking PR as duplicate and locking thread...'
    ]
  },
  {
    id: 'exhausted_recruiter',
    name: 'Recruiter Who Has Seen Things',
    role: 'Scans resumes in 1.2 seconds. Rejects candidates based on buzzword density. Has 45 tabs open.',
    avatar: '👩‍💼',
    themeClass: 'theme-hr',
    scanLogs: [
      'Ignoring candidate name...',
      'Measuring alignment with corporate jargon...',
      'Searching for cultural fit indicators...',
      'Attention span meter: dropping to 2 seconds...',
      'Assessing probability of candidate asking for remote work...'
    ]
  },
  {
    id: 'rust_elitist',
    name: 'Rust Elitist',
    role: 'Replaces everything with unsafe code block detectors. Rewrites your career in Rust. Hates GC.',
    avatar: '🦀',
    themeClass: 'theme-mentor',
    scanLogs: [
      'Checking memory safety guarantees...',
      'Scanning for garbage collector dependencies...',
      'Verifying if cargo clippy yields warnings...',
      'Measuring cargo build times (ETA: 45 minutes)...',
      'Searching for unsafe code blocks in your achievements...'
    ]
  },
  {
    id: 'startup_cto',
    name: 'Startup CTO After Funding Collapse',
    role: 'Cynical, burned runway, pitch deck fatigue, zero user reality. Survives on coffee and equity hope.',
    avatar: '📉',
    themeClass: 'theme-founder',
    scanLogs: [
      'Evaluating runway compatibility...',
      'Checking equity-to-salary expectations...',
      'Analyzing startup hustle index...',
      'Searching for 80-hour work week flags...',
      'Measuring cap-table dilution tolerance...'
    ]
  },
  {
    id: 'systems_architect',
    name: 'Systems Architect with Sleep Deprivation',
    role: 'Obsessed with sharding databases, distributed locks, and P99 latency. Sleep is a luxury.',
    avatar: '💀',
    themeClass: 'theme-npc',
    scanLogs: [
      'Syncing with distributed consensus algorithms...',
      'Standardizing output formats (A4 compliance checked)...',
      'Checking for potential deadlock conditions in achievements...',
      'Calculating database transaction isolation levels...',
      'Analyzing latency of your database query profiles...'
    ]
  }
];

export function getPersonalityById(id) {
  return PERSONALITIES.find(p => p.id === id) || PERSONALITIES[0];
}
