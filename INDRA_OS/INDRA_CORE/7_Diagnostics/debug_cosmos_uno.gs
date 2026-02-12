/**
 * DIAGNÓSTICO DIRECTO
 * debug_cosmos_uno.gs
 * 
 * Lee directamente el archivo uno.json desde Drive y muestra su contenido
 */

function debug_ReadCosmosUno() {
  const cosmosId = '1hkhQ1M8WNpOV88ycZLPPzP2anHX_sqay';
  
  console.log('='.repeat(80));
  console.log('[DEBUG] Reading Cosmos uno.json directly from Drive');
  console.log('='.repeat(80));
  
  try {
    // Leer archivo
    const file = DriveApp.getFileById(cosmosId);
    const content = file.getBlob().getDataAsString();
    
    console.log('\n📄 RAW CONTENT (string):');
    console.log(content);
    console.log('\n');
    
    // Parsear
    const parsed = JSON.parse(content);
    
    console.log('📦 PARSED OBJECT:');
    console.log(JSON.stringify(parsed, null, 2));
    console.log('\n');
    
    console.log('🔑 OBJECT KEYS:');
    console.log(Object.keys(parsed));
    console.log('\n');
    
    console.log('🆔 IDENTITY:');
    console.log(JSON.stringify(parsed.identity, null, 2));
    console.log('\n');
    
    console.log('🗂️ NAMESPACE:');
    console.log(JSON.stringify(parsed.namespace, null, 2));
    console.log('\n');
    
    // Simular el spread
    const spreadTest = {
      ...parsed,
      mounted: true,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔄 SPREAD TEST:');
    console.log(JSON.stringify(spreadTest, null, 2));
    console.log('\n');
    
    console.log('✅ Diagnosis complete');
    
  } catch (e) {
    console.error('❌ ERROR:', e.message);
    console.error(e.stack);
  }
}
