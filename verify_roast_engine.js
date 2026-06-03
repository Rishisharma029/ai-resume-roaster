// Headless verify script for the updated roast engine
import { analyzeResume } from './src/services/roastEngine.js';

const presets = {
  tutorial: `React Frontend Engineer - Passionate Learner
Skills: HTML, CSS, JavaScript, React, Next.js, Redux, TailwindCSS, Bootstrap, Node.js, Express, MongoDB
Projects:
- Todo List App: Built a state-of-the-art Todo application in React with local storage.
- Calculator App: Designed and coded a calculator in HTML, CSS, and JS.
- Weather App: Integrated OpenWeather API to display current temperature.`,
  
  ai_engineer: `AI/ML Research Consultant
Skills: Artificial Intelligence, Deep Learning, Large Language Models (LLM), ChatGPT Prompting, Python, LangChain, Machine Learning
Projects:
- AI Chatbot: Created a UI that takes user inputs and calls the OpenAI ChatGPT API.
- Prompt Template Engine: Designed optimized prompt instructions for better translation responses.`,

  docker_k8s_mismatch: `Backend Systems Engineer
Skills: Docker, Kubernetes, DevOps, Machine Learning, Go, SQL, AWS
Projects:
- Todo list: Managed local files.
Experience:
- Configured local environment.`,

  skilled: `Senior Systems Engineer
GitHub: https://github.com/realdev-elite
Portfolio: https://realdev-portfolio.vercel.app
Skills: Golang, Rust, Kubernetes, Docker, AWS, Terraform, PostgreSQL, Redis, gRPC, CI/CD, Git
Projects:
- Custom Cache Engine: Wrote a distributed, thread-safe memory store in Go handling 120,000 requests/sec.
- Infrastructure Automation: Provisioned multi-region AWS environments using Terraform and managed via Kubernetes.`
};

const personalities = [
  { id: 'staff_engineer', name: 'Sleep Deprived Staff Engineer' },
  { id: 'faang_gatekeeper', name: 'FAANG Gatekeeper' },
  { id: 'devops_veteran', name: 'DevOps War Veteran' },
  { id: 'oss_maintainer', name: 'Open Source Maintainer' },
  { id: 'exhausted_recruiter', name: 'Recruiter Who Has Seen Things' },
  { id: 'rust_elitist', name: 'Rust Elitist' },
  { id: 'startup_cto', name: 'Startup CTO After Funding Collapse' },
  { id: 'systems_architect', name: 'Systems Architect with Sleep Deprivation' }
];

console.log("=== RUNNING ENGINE DIAGNOSTIC CHECKS ===");

for (const [key, text] of Object.entries(presets)) {
  console.log(`\n==================================================`);
  console.log(`TEST PROFILE: ${key.toUpperCase()}`);
  console.log(`==================================================`);
  
  // Assign a specific personality for testing
  const pIdx = key === 'skilled' ? 5 : key === 'docker_k8s_mismatch' ? 2 : 0; // Rust Elitist for skilled, DevOps for mismatch, Staff Eng for others
  const p1 = personalities[pIdx];
  const res = analyzeResume(text, p1);
  
  console.log(`Voice: ${p1.name} (${p1.id})`);
  console.log(`Survival Score: ${res.score}%`);
  console.log(`Verdict Title: "${res.verdictTitle}"`);
  console.log(`Sweatiness: ${res.sweatinessLevel}% (${res.tryHardVibe})`);
  
  console.log(`\n--- DYNAMIC SWEAT DIAGNOSTICS ---`);
  console.log(`Archetype Badge:  ${res.archetype.badge}`);
  console.log(`Archetype Desc:   ${res.archetype.desc}`);
  console.log(`Sweat Index:      ${res.sweatIndex}%`);
  console.log(`  Justification:  ${res.sweatIndexJustification}`);
  console.log(`LinkedIn Delusion:${res.linkedinDelusion}`);
  console.log(`  Justification:  ${res.linkedinDelusionJustification}`);
  console.log(`Tutorial Depend:  ${res.tutorialDependency}%`);
  console.log(`  Justification:  ${res.tutorialDependencyJustification}`);
  console.log(`Production Expos: ${res.productionExposure}%`);
  console.log(`  Justification:  ${res.productionExposureJustification}`);
  console.log(`Founder Hallucin: ${res.founderHallucination}`);
  console.log(`  Justification:  ${res.founderHallucinationJustification}`);

  console.log(`\n--- VERDICT BODY ---`);
  console.log(res.verdictBody);
  console.log(`\n--- FINAL BLOW ---`);
  console.log(res.verdictFinalBlow);
  console.log(`\n--- ACHIEVEMENTS ---`);
  res.achievements.forEach(a => console.log(`* [${a.title}] - ${a.desc}`));
  console.log(`\n--- RECOVERY PROTOCOLS ---`);
  res.recoveryProtocols.forEach((rec, i) => console.log(`${i+1}. ${rec}`));
}
