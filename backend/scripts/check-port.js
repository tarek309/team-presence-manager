#!/usr/bin/env node

const { checkPortAvailability, findFreePort, getAvailablePort } = require('../src/utils/portUtils');

/**
 * Script utilitaire pour vérifier la disponibilité des ports
 * Usage: node scripts/check-port.js [port] [host]
 */

async function main() {
  const args = process.argv.slice(2);
  const port = parseInt(args[0]) || 3000;
  const host = args[1] || 'localhost';
  
  console.log('🔍 Vérification des ports - Team Presence Manager\n');
  
  try {
    console.log(`📋 Configuration:`);
    console.log(`   Port à vérifier: ${port}`);
    console.log(`   Hôte: ${host}\n`);
    
    // Test 1: Vérifier le port spécifique
    console.log('🧪 Test 1: Vérification du port spécifique');
    const isAvailable = await checkPortAvailability(port, host);
    console.log(`   Port ${port}: ${isAvailable ? '✅ Libre' : '❌ Occupé'}\n`);
    
    // Test 2: Recherche de ports libres
    console.log('🧪 Test 2: Recherche de 5 ports libres suivants');
    try {
      for (let i = 0; i < 5; i++) {
        const freePort = await findFreePort(port + i, host, 50);
        const status = await checkPortAvailability(freePort, host);
        console.log(`   Port ${freePort}: ${status ? '✅ Libre' : '⚠️  Était libre mais plus maintenant'}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
    
    console.log();
    
    // Test 3: Fonction getAvailablePort
    console.log('🧪 Test 3: Fonction getAvailablePort');
    try {
      const availablePort = await getAvailablePort(port, host);
      console.log(`   Port recommandé: ${availablePort}`);
      
      if (availablePort === port) {
        console.log('   ✅ Le port demandé est disponible');
      } else {
        console.log(`   ⚠️  Port alternatif proposé (${port} occupé)`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
    
    console.log();
    
    // Test 4: Plage de ports
    console.log('🧪 Test 4: Scan d\'une plage de ports (3000-3010)');
    const portsToCheck = Array.from({ length: 11 }, (_, i) => 3000 + i);
    
    for (const testPort of portsToCheck) {
      const status = await checkPortAvailability(testPort, host);
      const statusIcon = status ? '✅' : '❌';
      const statusText = status ? 'Libre' : 'Occupé';
      console.log(`   Port ${testPort}: ${statusIcon} ${statusText}`);
    }
    
    console.log('\n📊 Résumé:');
    const freePortsInRange = [];
    for (const testPort of portsToCheck) {
      const status = await checkPortAvailability(testPort, host);
      if (status) {
        freePortsInRange.push(testPort);
      }
    }
    
    console.log(`   Ports libres dans la plage 3000-3010: ${freePortsInRange.length}`);
    if (freePortsInRange.length > 0) {
      console.log(`   Ports disponibles: ${freePortsInRange.join(', ')}`);
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

// Fonction d'aide
function showHelp() {
  console.log(`
🔍 Script de vérification des ports - Team Presence Manager

Usage:
  node scripts/check-port.js [port] [host]

Paramètres:
  port    Port à vérifier (défaut: 3000)
  host    Hôte à utiliser (défaut: localhost)

Exemples:
  node scripts/check-port.js
  node scripts/check-port.js 8080
  node scripts/check-port.js 3000 0.0.0.0
  node scripts/check-port.js 5000 127.0.0.1

Options:
  --help, -h    Affiche cette aide
  `);
}

// Gestion des arguments d'aide
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Exécution
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { main };