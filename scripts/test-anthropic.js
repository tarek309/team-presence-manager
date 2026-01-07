// scripts/test-anthropic.js
// Test de connexion à l'API Anthropic

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

async function testAnthropicAPI() {
  console.log('🔍 Test de connexion à l\'API Anthropic...\n');
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY non définie dans .env');
    process.exit(1);
  }
  
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  
  try {
    console.log('🤖 Envoi d\'une requête test à Claude...\n');
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Dis "Hello!" en une phrase courte pour confirmer que tu fonctionnes.'
        }
      ],
    });
    
    const response = message.content[0].text;
    
    console.log('✅ Connexion réussie!\n');
    console.log('═'.repeat(70));
    console.log('📝 RÉPONSE DE CLAUDE');
    console.log('═'.repeat(70));
    console.log(response);
    console.log('═'.repeat(70));
    console.log('\n💰 Utilisation :');
    console.log(`   - Tokens envoyés : ${message.usage.input_tokens}`);
    console.log(`   - Tokens reçus   : ${message.usage.output_tokens}`);
    console.log(`   - Coût estimé    : ~$0.0001`);
    console.log('\n🎉 L\'API Anthropic est opérationnelle!\n');
    
  } catch (error) {
    console.error('❌ Erreur API:', error.message);
    
    if (error.status === 401) {
      console.log('\n💡 Erreur d\'authentification :');
      console.log('   - Vérifiez que votre clé API est correcte');
      console.log('   - La clé doit commencer par "sk-ant-"');
      console.log('   - Créez une nouvelle clé sur https://console.anthropic.com/settings/keys\n');
    } else if (error.status === 429) {
      console.log('\n💡 Limite de taux atteinte :');
      console.log('   - Attendez quelques secondes et réessayez\n');
    } else {
      console.log('\n💡 Vérifiez :');
      console.log('   - Votre connexion internet');
      console.log('   - Que vous avez des crédits disponibles sur console.anthropic.com\n');
    }
    
    process.exit(1);
  }
}

testAnthropicAPI();