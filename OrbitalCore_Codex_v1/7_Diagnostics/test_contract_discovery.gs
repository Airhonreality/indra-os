/**
 * 🔬 CONTRACT DISCOVERY AUDIT (DIRECT)
 * Diagnóstico directo usando PublicAPI como punto de entrada
 */

function testContractDiscovery() {
  Logger.log('=== 🔬 CONTRACT DISCOVERY AUDIT ===');
  
  // PASO 1: Obtener contratos desde PublicAPI (punto de entrada real)
  Logger.log('\n📦 PASO 1: _assembleExecutionStack().public.getSystemContracts()');
  
  const stack = _assembleExecutionStack();
  const systemContracts = stack.public.getSystemContracts();
  Logger.log(`✅ PublicAPI executed successfully`);
  
  // Si systemContracts tiene propiedad .contracts (formato array), úsala.
  // Si no, asume que es un mapa { key: contract } y convierte a array.
  const contracts = systemContracts.contracts 
    ? systemContracts.contracts 
    : Object.values(systemContracts);
  Logger.log(`Total contracts returned: ${contracts.length}`);
  
  // PASO 2: Agrupar por arquetipo
  Logger.log('\n� PASO 2: Contracts by Archetype');
  const byArchetype = {};
  const contractsByArchetype = {};
  
  contracts.forEach(contract => {
    const arch = contract.archetype || 'UNKNOWN';
    byArchetype[arch] = (byArchetype[arch] || 0) + 1;
    
    if (!contractsByArchetype[arch]) {
      contractsByArchetype[arch] = [];
    }
    contractsByArchetype[arch].push(contract.label);
  });
  
  Object.keys(byArchetype).sort().forEach(arch => {
    Logger.log(`  ${arch}: ${byArchetype[arch]}`);
    contractsByArchetype[arch].forEach(label => {
      Logger.log(`    - ${label}`);
    });
  });
  
  // PASO 3: Verificar nodos esperados
  Logger.log('\n🎯 PASO 3: Expected Critical Nodes');
  const expectedNodes = {
    'ADAPTER': [
      'EmailAdapter', 'CalendarAdapter', 'LLMAdapter', 'MapsAdapter',
      'MessengerAdapter', 'WhatsAppAdapter', 'InstagramAdapter', 
      'TikTokAdapter', 'OracleAdapter', 'AudioAdapter', 'YouTubeAdapter',
      'MonitoringAdapter', 'DriveAdapter', 'SheetAdapter', 'NotionAdapter',
      'GoogleDocsAdapter', 'GoogleFormsAdapter', 'GoogleSlidesAdapter',
      'GoogleDriveRestAdapter', 'CognitiveSensingAdapter'
    ],
    'GATE': ['SystemInitializer'],
    'STREAM': ['FlowControlService'],
    'LOGIC_CORE': ['IntelligenceOrchestrator'],
    'SYSTEM_INFRA': [
      'TokenManager', 'MetabolicService', 'MonitoringService',
      'MathService', 'TextService', 'DateService', 'CollectionService'
    ]
  };
  
  const allContractLabels = contracts.map(c => c.label);
  
  Object.keys(expectedNodes).forEach(archetype => {
    const expected = expectedNodes[archetype];
    const missing = expected.filter(label => !allContractLabels.includes(label));
    
    if (missing.length > 0) {
      Logger.log(`\n❌ ${archetype} - Missing ${missing.length}/${expected.length}:`);
      missing.forEach(label => Logger.log(`    - ${label}`));
    } else {
      Logger.log(`\n✅ ${archetype} - All ${expected.length} nodes present`);
    }
  });
  
  // PASO 4: Verificar métodos por contrato
  Logger.log('\n🔍 PASO 4: Contracts with 0 methods (SUSPICIOUS)');
  const emptyContracts = contracts.filter(c => !c.methods || c.methods.length === 0);
  
  if (emptyContracts.length > 0) {
    Logger.log(`⚠️ Found ${emptyContracts.length} contracts with no methods:`);
    emptyContracts.forEach(c => {
      Logger.log(`  - ${c.label} [${c.archetype}]`);
    });
  } else {
    Logger.log('✅ All contracts have methods');
  }
  
  // PASO 5: Verificar schemas
  Logger.log('\n📋 PASO 5: Schema Validation');
  const contractsWithoutSchemas = contracts.filter(c => !c.schemas || Object.keys(c.schemas).length === 0);
  
  if (contractsWithoutSchemas.length > 0) {
    Logger.log(`⚠️ Found ${contractsWithoutSchemas.length} contracts without schemas:`);
    contractsWithoutSchemas.forEach(c => {
      Logger.log(`  - ${c.label} [${c.archetype}]`);
    });
  } else {
    Logger.log('✅ All contracts have schemas');
  }
  
  // PASO 6: Resumen final
  Logger.log('\n📊 PASO 6: Summary');
  Logger.log(`Total contracts: ${contracts.length}`);
  Logger.log(`Archetypes: ${Object.keys(byArchetype).length}`);
  Logger.log(`Contracts with methods: ${contracts.length - emptyContracts.length}`);
  Logger.log(`Contracts with schemas: ${contracts.length - contractsWithoutSchemas.length}`);
  
  // Calcular total esperado
  let totalExpected = 0;
  Object.keys(expectedNodes).forEach(arch => {
    totalExpected += expectedNodes[arch].length;
  });
  
  const coverage = ((contracts.length / totalExpected) * 100).toFixed(1);
  Logger.log(`\nCoverage: ${contracts.length}/${totalExpected} (${coverage}%)`);
  
  if (contracts.length < totalExpected) {
    Logger.log(`❌ INCOMPLETE: ${totalExpected - contracts.length} contracts missing`);
  } else {
    Logger.log('✅ COMPLETE: All expected contracts present');
  }
  
  Logger.log('\n=== END OF AUDIT ===');
}
