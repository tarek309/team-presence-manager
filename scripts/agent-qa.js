// scripts/agent-qa.js
// Agent IA qui teste les Pull Requests et crée des issues si bugs

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { Octokit } = require('@octokit/rest');
const { execSync } = require('child_process');
const linearApi = require('./linear-api');

// Configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const [owner, repo] = process.env.GITHUB_REPO.split('/');

// Prompt système pour l'agent QA
const SYSTEM_PROMPT = `Tu es un ingénieur QA (Quality Assurance) expert.

CONTEXTE DU PROJET :
- Application de gestion de présences pour équipe de football amateur
- Stack : Node.js/Express (backend) + React/Vite (frontend)
- Repository : ${process.env.GITHUB_REPO}

TON RÔLE :
Tu dois tester rigoureusement les Pull Requests pour détecter :
- Bugs et erreurs de logique
- Problèmes de sécurité
- Code manquant ou incomplet
- Non-respect des critères d'acceptation
- Mauvaises pratiques
- Tests insuffisants ou manquants
- Problèmes de performance

WORKFLOW :
1. Analyser le ticket original et ses critères d'acceptation
2. Examiner tous les fichiers modifiés dans la PR
3. Identifier les problèmes potentiels
4. Vérifier que les tests couvrent bien les cas limites
5. Produire un rapport détaillé

FORMAT DE RAPPORT :
Pour chaque problème trouvé, utilise ce format:
[BUG] Titre court du problème
Fichier: chemin/du/fichier.js:ligne
Sévérité: CRITIQUE | HAUTE | MOYENNE | BASSE
Description: Explication détaillée du problème
Solution suggérée: Comment corriger

Si aucun problème majeur:
[OK] Tous les tests passent
- Vérification 1: ✅
- Vérification 2: ✅
...

ATTENTION :
- Sois rigoureux mais constructif
- Propose toujours des solutions
- Priorise les problèmes de sécurité et les bugs critiques
`;

/**
 * Récupère les PRs ouvertes
 */
async function getOpenPullRequests() {
  const { data: prs } = await octokit.pulls.list({
    owner,
    repo,
    state: 'open',
  });
  
  return prs;
}

/**
 * Récupère les fichiers modifiés dans une PR
 */
async function getPRFiles(prNumber) {
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
  });
  
  return files;
}

/**
 * Récupère le contenu d'un fichier depuis une PR
 */
async function getFileContent(prNumber, filepath) {
  try {
    // Récupérer la branche de la PR
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filepath,
      ref: pr.head.sha,
    });
    
    if (data.content) {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }
    
    return null;
  } catch (error) {
    console.error(`Impossible de récupérer ${filepath}: ${error.message}`);
    return null;
  }
}

/**
 * Exécute les tests npm (si configurés)
 */
function runTests() {
  console.log('🧪 Exécution des tests...');
  
  try {
    // Backend tests
    try {
      execSync('cd backend && npm test', { encoding: 'utf8', stdio: 'pipe' });
      console.log('   ✅ Tests backend: PASS');
    } catch (error) {
      console.log('   ⚠️  Tests backend: Non configurés ou échec');
      return { backend: false, error: error.stdout || error.message };
    }
    
    // Frontend tests (si configurés)
    try {
      execSync('cd frontend && npm test -- --run', { encoding: 'utf8', stdio: 'pipe' });
      console.log('   ✅ Tests frontend: PASS');
    } catch (error) {
      console.log('   ⚠️  Tests frontend: Non configurés ou échec');
      return { frontend: false, error: error.stdout || error.message };
    }
    
    return { backend: true, frontend: true };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Checkout la branche de la PR pour tester
 */
function checkoutPRBranch(prNumber) {
  console.log(`📦 Checkout de la PR #${prNumber}...`);
  
  try {
    // Fetch la PR
    execSync(`git fetch origin pull/${prNumber}/head:pr-${prNumber}`, { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    });
    
    // Checkout
    execSync(`git checkout pr-${prNumber}`, { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    });
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur checkout: ${error.message}`);
    return false;
  }
}

/**
 * Retour à la branche main
 */
function returnToMain() {
  try {
    execSync('git checkout main', { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    console.error(`❌ Erreur retour main: ${error.message}`);
  }
}

/**
 * Analyse une PR avec Claude
 */
async function analyzePR(pr) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Analyse de la PR #${pr.number}: ${pr.title}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // 1. Récupérer les fichiers modifiés
  const files = await getPRFiles(pr.number);
  console.log(`📄 ${files.length} fichier(s) modifié(s)`);
  
  // 2. Récupérer le contenu de chaque fichier
  const fileContents = [];
  for (const file of files) {
    if (file.status === 'removed') continue;
    
    const content = await getFileContent(pr.number, file.filename);
    if (content) {
      fileContents.push({
        path: file.filename,
        content: content,
        additions: file.additions,
        deletions: file.deletions,
      });
    }
  }
  
  // 3. Checkout et exécuter les tests
  let testResults = { skipped: true };
  if (checkoutPRBranch(pr.number)) {
    testResults = runTests();
    returnToMain();
  }
  
  // 4. Construire le contexte pour Claude
  const filesContext = fileContents
    .map(f => `
--- Fichier: ${f.path} (${f.additions} ajouts, ${f.deletions} suppressions) ---
${f.content}
`)
    .join('\n\n');
  
  const prompt = `Analyse cette Pull Request en profondeur.

PR: #${pr.number} - ${pr.title}
Description: ${pr.body || 'Aucune description'}

RÉSULTATS DES TESTS:
${testResults.skipped ? '⚠️ Tests non exécutés' : 
  testResults.backend === false || testResults.frontend === false ? 
    `❌ ÉCHEC\n${testResults.error || ''}` : 
    '✅ Tous les tests passent'}

FICHIERS MODIFIÉS:
${filesContext}

INSTRUCTIONS:
1. Vérifie que le code respecte les bonnes pratiques
2. Cherche les bugs potentiels et erreurs de logique
3. Vérifie la sécurité (injection SQL, XSS, validation des entrées)
4. Vérifie que les tests sont suffisants
5. Vérifie que les critères d'acceptation sont remplis (si mentionnés dans la description)

Produis ton rapport maintenant.`;

  console.log('🤖 Claude analyse le code...\n');
  
  const message = await anthropic.messages.create({
    model: process.env.AGENT_QA_MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
  });
  
  const analysis = message.content[0].text;
  return analysis;
}

/**
 * Parse le rapport de Claude pour extraire les bugs
 */
function parseBugs(analysis) {
  const bugs = [];
  const lines = analysis.split('\n');
  
  let currentBug = null;
  
  for (const line of lines) {
    if (line.startsWith('[BUG]')) {
      if (currentBug) {
        bugs.push(currentBug);
      }
      currentBug = {
        title: line.replace('[BUG]', '').trim(),
        file: '',
        severity: 'MOYENNE',
        description: '',
        solution: ''
      };
    } else if (currentBug) {
      if (line.startsWith('Fichier:')) {
        currentBug.file = line.replace('Fichier:', '').trim();
      } else if (line.startsWith('Sévérité:')) {
        currentBug.severity = line.replace('Sévérité:', '').trim();
      } else if (line.startsWith('Description:')) {
        currentBug.description = line.replace('Description:', '').trim();
      } else if (line.startsWith('Solution suggérée:')) {
        currentBug.solution = line.replace('Solution suggérée:', '').trim();
      } else if (line.trim()) {
        // Continuer la description ou solution
        if (currentBug.solution) {
          currentBug.solution += ' ' + line.trim();
        } else if (currentBug.description) {
          currentBug.description += ' ' + line.trim();
        }
      }
    }
  }
  
  if (currentBug) {
    bugs.push(currentBug);
  }
  
  return bugs;
}

/**
 * Crée des issues GitHub pour les bugs
 */
async function createBugIssues(bugs, prNumber) {
  console.log(`\n🐛 Création de ${bugs.length} issue(s) pour les bugs...`);
  
  const createdIssues = [];
  
  for (const bug of bugs) {
    const title = `[Bug] ${bug.title}`;
    const body = `## 🐛 Bug détecté par Agent QA

**Sévérité:** ${bug.severity}
**Fichier:** \`${bug.file}\`
**Détecté dans:** PR #${prNumber}

### Description
${bug.description}

### Solution suggérée
${bug.solution}

---
🤖 *Issue créée automatiquement par Agent QA*
`;

    const { data: issue } = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels: ['bug', 'qa-automated'],
    });
    
    console.log(`   ✅ Issue créée: #${issue.number} - ${bug.title}`);
    createdIssues.push(issue);
    
    // Créer aussi dans Linear
    try {
      await linearApi.createIssue(
        title,
        body,
        ['bug'],
        1 // Priorité haute
      );
    } catch (error) {
      console.log(`   ⚠️  Impossible de créer dans Linear: ${error.message}`);
    }
  }
  
  return createdIssues;
}

/**
 * Commente sur la PR
 */
async function commentOnPR(prNumber, analysis, bugs) {
  let comment = `## 🤖 Rapport du QA Agent\n\n`;
  
  if (bugs.length === 0) {
    comment += `### ✅ Aucun problème majeur détecté\n\n`;
    comment += `Le code a été analysé et semble conforme aux bonnes pratiques.\n\n`;
    comment += `**Label ajouté:** \`ready-for-review\` ✨\n\n`;
  } else {
    comment += `### ⚠️ ${bugs.length} problème(s) détecté(s)\n\n`;
    comment += `Des issues ont été créées automatiquement pour chaque problème.\n\n`;
  }
  
  comment += `<details>\n<summary>📋 Rapport complet d'analyse</summary>\n\n`;
  comment += `\`\`\`\n${analysis}\n\`\`\`\n\n`;
  comment += `</details>\n\n`;
  comment += `---\n`;
  comment += `🤖 *Analyse automatique - Agent QA*`;
  
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: comment,
  });
  
  // Ajouter le label
  const label = bugs.length === 0 ? 'ready-for-review' : 'needs-fixes';
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels: [label],
  });
}

/**
 * Traite une PR
 */
async function processPR(pr) {
  try {
    // Vérifier si déjà analysée
    const { data: comments } = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: pr.number,
    });
    
    const alreadyAnalyzed = comments.some(c => 
      c.body.includes('🤖 Rapport du QA Agent')
    );
    
    if (alreadyAnalyzed) {
      console.log(`⏭️  PR #${pr.number} déjà analysée, skip.`);
      return;
    }
    
    // Analyser la PR
    const analysis = await analyzePR(pr);
    
    console.log('\n📊 Rapport d\'analyse:\n');
    console.log(analysis);
    console.log('\n');
    
    // Parser les bugs
    const bugs = parseBugs(analysis);
    
    // Créer les issues si bugs
    if (bugs.length > 0) {
      await createBugIssues(bugs, pr.number);
    }
    
    // Commenter sur la PR
    await commentOnPR(pr.number, analysis, bugs);
    
    console.log(`✅ PR #${pr.number} analysée avec succès!\n`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse de PR #${pr.number}:`, error.message);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🧪 Agent QA - Démarrage\n');
  
  try {
    // Vérifier les variables d'environnement
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY non définie dans .env');
      console.log('💡 Créez un compte sur https://console.anthropic.com');
      console.log('   et ajoutez votre clé API dans .env\n');
      process.exit(1);
    }
    
    // Récupérer les PRs ouvertes
    console.log('📋 Récupération des Pull Requests ouvertes...');
    const prs = await getOpenPullRequests();
    
    if (prs.length === 0) {
      console.log('✅ Aucune Pull Request ouverte à analyser');
      return;
    }
    
    console.log(`📦 ${prs.length} PR(s) trouvée(s)\n`);
    
    // Analyser chaque PR
    for (const pr of prs) {
      await processPR(pr);
    }
    
    console.log('\n🎉 Toutes les PRs ont été analysées!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main();
}

module.exports = { processPR };