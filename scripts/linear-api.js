// scripts/linear-api.js
// Utilitaires pour interagir avec l'API Linear

require('dotenv').config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID;
const LINEAR_API_URL = 'https://api.linear.app/graphql';

/**
 * Fonction générique pour faire des requêtes GraphQL à Linear
 */
async function queryLinear(query, variables = {}) {
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': LINEAR_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables })
  });

  const data = await response.json();
  
  if (data.errors) {
    console.error('❌ Erreur Linear API:', data.errors);
    throw new Error(data.errors[0].message);
  }
  
  return data.data;
}

/**
 * Récupère les tickets en statut "Ready" avec le label "ai-ready"
 */
async function getReadyTickets() {
  const query = `
    query($teamId: String!) {
      team(id: $teamId) {
        issues(
          filter: {
            state: { name: { eq: "Ready" } }
            labels: { name: { eq: "ai-ready" } }
          }
          orderBy: updatedAt  
        ) {
          nodes {
            id
            identifier
            title
            description
            priority
            priorityLabel
            labels {
              nodes {
                name
              }
            }
            state {
              name
            }
            assignee {
              name
              email
            }
          }
        }
      }
    }
  `;

  const data = await queryLinear(query, { teamId: LINEAR_TEAM_ID });
  return data.team.issues.nodes;
}

/**
 * Récupère les détails d'un ticket spécifique
 */
async function getIssueById(issueId) {
  const query = `
    query($issueId: String!) {
      issue(id: $issueId) {
        id
        identifier
        title
        description
        priority
        state {
          name
          type
        }
        labels {
          nodes {
            name
            color
          }
        }
      }
    }
  `;

  const data = await queryLinear(query, { issueId });
  return data.issue;
}

/**
 * Met à jour le statut d'un ticket
 */
async function updateIssueState(issueId, stateName) {
  const query = `
    query($teamId: String!) {
      team(id: $teamId) {
        states {
          nodes {
            id
            name
          }
        }
      }
    }
  `;

  const data = await queryLinear(query, { teamId: LINEAR_TEAM_ID });
  const state = data.team.states.nodes.find(s => s.name === stateName);
  
  if (!state) {
    throw new Error(`État "${stateName}" introuvable`);
  }

  const mutation = `
    mutation($issueId: String!, $stateId: String!) {
      issueUpdate(
        id: $issueId
        input: { stateId: $stateId }
      ) {
        success
        issue {
          id
          state {
            name
          }
        }
      }
    }
  `;

  const result = await queryLinear(mutation, { 
    issueId, 
    stateId: state.id 
  });
  
  return result.issueUpdate.success;
}

/**
 * Ajoute un commentaire à un ticket
 */
async function addCommentToIssue(issueId, comment) {
  const mutation = `
    mutation($issueId: String!, $body: String!) {
      commentCreate(
        input: {
          issueId: $issueId
          body: $body
        }
      ) {
        success
        comment {
          id
        }
      }
    }
  `;

  const result = await queryLinear(mutation, { 
    issueId, 
    body: comment 
  });
  
  return result.commentCreate.success;
}

/**
 * Créer un nouveau ticket (pour les bugs trouvés par le QA)
 */
async function createIssue(title, description, labels = [], priority = 0) {
  const labelsQuery = `
    query($teamId: String!) {
      team(id: $teamId) {
        labels {
          nodes {
            id
            name
          }
        }
      }
    }
  `;

  const labelsData = await queryLinear(labelsQuery, { teamId: LINEAR_TEAM_ID });
  const labelIds = labels
    .map(labelName => {
      const label = labelsData.team.labels.nodes.find(l => l.name === labelName);
      return label ? label.id : null;
    })
    .filter(Boolean);

  const mutation = `
    mutation($teamId: String!, $title: String!, $description: String!, $labelIds: [String!], $priority: Int) {
      issueCreate(
        input: {
          teamId: $teamId
          title: $title
          description: $description
          labelIds: $labelIds
          priority: $priority
        }
      ) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;

  const result = await queryLinear(mutation, {
    teamId: LINEAR_TEAM_ID,
    title,
    description,
    labelIds,
    priority
  });

  return result.issueCreate.issue;
}

/**
 * Formater un ticket pour l'affichage
 */
function formatIssue(issue) {
  const labels = issue.labels.nodes.map(l => l.name).join(', ');
  return `
📋 ${issue.identifier}: ${issue.title}
   Priorité: ${issue.priorityLabel || 'None'}
   Labels: ${labels || 'None'}
   État: ${issue.state.name}
  `.trim();
}

module.exports = {
  queryLinear,
  getReadyTickets,
  getIssueById,
  updateIssueState,
  addCommentToIssue,
  createIssue,
  formatIssue
};