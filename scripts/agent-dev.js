// scripts/agent-dev.js
// Agent IA qui développe automatiquement les tickets Linear

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { Octokit } = require('@octokit/rest');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const linearApi = require('./linear-api');

// Configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const [owner, repo] = process.env.GITHUB_REPO.split('/');

// Prompt système pour l'agent développeur
const SYSTEM_PROMPT = `Tu es un développeur senior fullstack expert en JavaScript/Node.js et React.

CONTEXTE DU PROJET :
- Application de gestion de présences pour équipe de football amateur
- Stack : Node.js/Express (backend) + React/Vite (frontend)
- Base de données : PostgreSQL
- Repository : ${process.env.GITHUB_REPO}

TON RÔLE :
Tu dois développer les fonctionnalités décrites dans les tickets Linear.
Tu dois produire du code de qualité, testé, et bien documenté.

WORKFLOW :
1. Analyser le ticket et ses critères d'acceptation
2. Planifier l'implémentation (fichiers à créer/modifier)
3. Générer le code complet et fonctionnel
4. Créer les tests unitaires/intégration nécessaires
5. Mettre à jour la documentation si besoin

CONTRAINTES :
- Code commenté en français
- Respect des conventions du projet
- Tests pour la logique métier
- Gestion des erreurs appropriée
- Sécurité (validation, sanitization)
- Messages de commit suivant Conventional Commits

IMPORTANT :
- Fournis TOUJOURS le code complet des fichiers (pas de "... reste du code")
- Un fichier = un bloc de code avec son chemin complet
- Indique clairement : [CRÉER] ou [MODIFIER] pour chaque fichier
`;

/**
 * Exécute une commande git
 */
function gitCommand(command) {
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return result.trim();
  } catch (error) {
    console.error(`❌ Erreur git: ${error.message}`);
    throw error;
  }
}

/**
 * Crée une branche pour le ticket
 */
function createBranch(ticketIdentifier, title) {
  const branchName = `feature/${ticketIdentifier.toLowerCase()}-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 40)}`;
  
  console.log(`🌿 Création de la branche: ${branchName}`);
  
  // S'assurer d'être sur main et à jour
  gitCommand('git checkout main');
  gitCommand('git pull origin main');
  
  // Créer et basculer sur la nouvelle branche
  gitCommand(`git checkout -b ${branchName}`);
  
  return branchName;
}

/**
 * Parse la réponse de Claude pour extraire les fichiers à créer/modifier
 */
function parseClaudeResponse(response) {
  const files = [];
  const lines = response.split('\n');
  
  let currentFile = null;
  let currentCode = [];
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter les instructions de fichier
    if (line.match(/\[(CRÉER|MODIFIER)\]/i)) {
      // Sauvegarder le fichier précédent si existant
      if (currentFile) {
        files.push({
          action: currentFile.action,
          path: currentFile.path,
          content: currentCode.join('\n')
        });
      }
      
      // Parser la nouvelle instruction
      const action = line.includes('CRÉER') ? 'create' : 'modify';
      const pathMatch = line.match(/[`']([^`']+)[`']/);
      const filePath = pathMatch ? pathMatch[1] : null;
      
      if (filePath) {
        currentFile = { action, path: filePath };
        currentCode = [];
        inCodeBlock = false;
      }
    }
    // Détecter les blocs de code
    else if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (!inCodeBlock && currentFile) {
        // Fin du bloc de code
        continue;
      }
    }
    // Ajouter le code
    else if (inCodeBlock && currentFile) {
      currentCode.push(line);
    }
  }
  
  // Sauvegarder le dernier fichier
  if (currentFile && currentCode.length > 0) {
    files.push({
      action: currentFile.action,
      path: currentFile.path,
      content: currentCode.join('\n')
    });
  }
  
  return files;
}

/**
 * Applique les changements de fichiers
 */
async function applyFileChanges(files) {
  console.log(`📝 Application de ${files.length} changements de fichiers...`);
  
  for (const file of files) {
    const fullPath = path.join(process.cwd(), file.path);
    const dir = path.dirname(fullPath);
    
    // Créer les dossiers si nécessaire
    await fs.mkdir(dir, { recursive: true });
    
    // Écrire le fichier
    await fs.writeFile(fullPath, file.content, 'utf8');
    
    const action = file.action === 'create' ? '✨ Créé' : '📝 Modifié';
    console.log(`   ${action}: ${file.path}`);
  }
}

/**
 * Commit et push les changements
 */
function commitAndPush(ticketIdentifier, message) {
  console.log('💾 Commit des changements...');
  
  // Ajouter tous les fichiers
  gitCommand('git add .');
  
  // Commit avec message conventionnel
  const commitMessage = `feat(${ticketIdentifier}): ${message}`;
  gitCommand(`git commit -m "${commitMessage}"`);
  
  // Push
  const currentBranch = gitCommand('git branch --show-current');
  console.log(`🚀 Push vers origin/${currentBranch}...`);
  gitCommand(`git push -u origin ${currentBranch}`);
  
  return currentBranch;
}

/**
 * Crée une Pull Request sur GitHub
 */
async function createPullRequest(branch, ticketIdentifier, ticket) {
  console.log('📬 Création de la Pull Request...');
  
  const title = `${ticketIdentifier}: ${ticket.title}`;
  const body = `## Description
Fixes ${ticketIdentifier}

${ticket.description}

## Type de changement
- [x] ✨ Nouvelle fonctionnalité

## Checklist
- [x] Le code compile sans erreur
- [x] Tests ajoutés
- [x] Documentation mise à jour
- [ ] Code reviewed (en attente)

---
🤖 *PR créée automatiquement par Agent Dev*
`;

  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head: branch,
    base: 'main',
  });

  console.log(`✅ Pull Request créée: ${pr.html_url}`);
  
  return pr;
}

/**
 * Développe un ticket avec Claude
 */
async function developTicket(ticket) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎯 Traitement du ticket: ${ticket.identifier}`);
  console.log(`📋 ${ticket.title}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // 1. Créer la branche
  const branch = createBranch(ticket.identifier, ticket.title);
  
  // 2. Demander à Claude de développer
  console.log('🤖 Claude analyse le ticket et génère le code...\n');
  
  const prompt = `Développe la fonctionnalité suivante :

TICKET: ${ticket.identifier}
TITRE: ${ticket.title}

DESCRIPTION COMPLÈTE:
${ticket.description}

INSTRUCTIONS:
1. Analyse les critères d'acceptation
2. Pour chaque fichier à créer ou modifier, indique:
   - [CRÉER] ou [MODIFIER]
   - Le chemin complet du fichier entre backticks (ex: \`backend/src/routes/auth.js\`)
   - Le code complet dans un bloc \`\`\`javascript ou \`\`\`jsx
3. Fournis le code complet et fonctionnel de chaque fichier
4. Ajoute les tests nécessaires
5. Mets à jour le README si besoin

Commence maintenant !`;

  const message = await anthropic.messages.create({
    model: process.env.AGENT_DEV_MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
  });
  
  const response = message.content[0].text;
  console.log('📄 Réponse de Claude:\n');
  console.log(response);
  console.log('\n');
  
  // 3. Parser et appliquer les changements
  const files = parseClaudeResponse(response);
  
  if (files.length === 0) {
    console.error('❌ Aucun fichier trouvé dans la réponse de Claude');
    return null;
  }
  
  await applyFileChanges(files);
  
  // 4. Commit et push
  commitAndPush(ticket.identifier, ticket.title);
  
  // 5. Créer la PR
  const pr = await createPullRequest(branch, ticket.identifier, ticket);
  
  // 6. Mettre à jour le ticket Linear
  await linearApi.updateIssueState(ticket.id, 'In Review');
  await linearApi.addCommentToIssue(
    ticket.id,
    `🤖 Pull Request créée automatiquement: ${pr.html_url}\n\nEn attente de review.`
  );
  
  console.log(`\n✅ Ticket ${ticket.identifier} développé avec succès!\n`);
  
  return pr;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Agent Dev - Démarrage\n');
  
  try {
    // Vérifier les variables d'environnement
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY non définie dans .env');
      console.log('💡 Créez un compte sur https://console.anthropic.com');
      console.log('   et ajoutez votre clé API dans .env\n');
      process.exit(1);
    }
    
    // Récupérer les tickets "Ready"
    console.log('📋 Récupération des tickets depuis Linear...');
    const tickets = await linearApi.getReadyTickets();
    
    if (tickets.length === 0) {
      console.log('✅ Aucun ticket en statut "Ready" avec le label "ai-ready"');
      console.log('\n💡 Pour tester l\'agent :');
      console.log('   1. Allez dans Linear');
      console.log('   2. Mettez un ticket en statut "Ready"');
      console.log('   3. Ajoutez le label "ai-ready"\n');
      return;
    }
    
    console.log(`📦 ${tickets.length} ticket(s) trouvé(s):\n`);
    tickets.forEach(ticket => {
      console.log(linearApi.formatIssue(ticket));
    });
    
    // Développer chaque ticket
    for (const ticket of tickets) {
      await developTicket(ticket);
    }
    
    console.log('\n🎉 Tous les tickets ont été traités!');
    
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

module.exports = { developTicket };