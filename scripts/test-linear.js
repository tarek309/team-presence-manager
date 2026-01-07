// scripts/test-linear.js
// Script pour tester l'API Linear et récupérer votre Team ID

require('dotenv').config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_API_URL = 'https://api.linear.app/graphql';

async function testLinearAPI() {
  console.log('🔍 Test de connexion à Linear...\n');
  
  if (!LINEAR_API_KEY) {
    console.error('❌ LINEAR_API_KEY non définie dans .env');
    console.log('\n💡 Ajoutez cette ligne dans votre fichier .env :');
    console.log('   LINEAR_API_KEY=lin_api_votre_cle_ici\n');
    process.exit(1);
  }
  
  try {
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': LINEAR_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            teams {
              nodes {
                id
                name
                key
                description
              }
            }
            viewer {
              id
              name
              email
            }
          }
        `
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('❌ Erreur API Linear:');
      data.errors.forEach(err => {
        console.error(`   - ${err.message}`);
      });
      console.log('\n💡 Vérifiez que votre clé API est valide');
      process.exit(1);
    }

    console.log('✅ Connexion réussie!\n');
    
    console.log('═'.repeat(70));
    console.log('👤 UTILISATEUR CONNECTÉ');
    console.log('═'.repeat(70));
    console.log(`   Nom     : ${data.data.viewer.name}`);
    console.log(`   Email   : ${data.data.viewer.email}`);
    console.log(`   ID      : ${data.data.viewer.id}`);
    
    console.log('\n═'.repeat(70));
    console.log('📊 VOS ÉQUIPES (TEAMS)');
    console.log('═'.repeat(70));
    
    if (data.data.teams.nodes.length === 0) {
      console.log('⚠️  Aucune équipe trouvée');
      console.log('   Créez une équipe dans Linear pour continuer\n');
      process.exit(0);
    }
    
    data.data.teams.nodes.forEach((team, index) => {
      console.log(`\n${index + 1}. ${team.name}`);
      console.log(`   ID   : ${team.id}`);
      console.log(`   Key  : ${team.key}`);
      if (team.description) {
        console.log(`   Desc : ${team.description}`);
      }
    });

    console.log('\n═'.repeat(70));
    console.log('📋 CONFIGURATION À AJOUTER DANS .ENV');
    console.log('═'.repeat(70));
    
    // Utiliser la première équipe par défaut
    const mainTeam = data.data.teams.nodes[0];
    console.log(`\nLINEAR_TEAM_ID=${mainTeam.id}`);
    console.log(`# Ou utilisez le Key: ${mainTeam.key}`);
    
    console.log('\n💡 Copiez cette ligne dans votre fichier .env\n');
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('\n💡 Vérifiez :');
    console.log('   1. Votre connexion internet');
    console.log('   2. Que votre clé API Linear est valide');
    console.log('   3. Que le module dotenv est installé (npm install)\n');
    process.exit(1);
  }
}

// Exécuter le test
testLinearAPI();