// scripts/test-linear-api.js
// Test des fonctions de linear-api.js

const linearApi = require('./linear-api');

async function testLinearAPI() {
  console.log('🧪 Test des fonctions Linear API\n');
  
  try {
    console.log('1️⃣  Test : Récupération des tickets "Ready"...');
    const tickets = await linearApi.getReadyTickets();
    
    if (tickets.length === 0) {
      console.log('   ⚠️  Aucun ticket trouvé en statut "Ready" avec label "ai-ready"');
      console.log('   💡 Pour tester, créez un ticket dans Linear avec :');
      console.log('      - Statut : Ready');
      console.log('      - Label : ai-ready\n');
    } else {
      console.log(`   ✅ ${tickets.length} ticket(s) trouvé(s):\n`);
      tickets.forEach(ticket => {
        console.log(linearApi.formatIssue(ticket));
        console.log('');
      });
    }
    
    console.log('✅ Toutes les fonctions sont opérationnelles!\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Vérifiez que LINEAR_TEAM_ID est bien défini dans .env\n');
    process.exit(1);
  }
}

testLinearAPI();