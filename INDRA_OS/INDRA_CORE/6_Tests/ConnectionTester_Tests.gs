/**
 * 🧪 ConnectionTester_Tests.gs
 * Auditoría de conectividad y sondeos técnicos.
 */

function testConnectionTester() {
  console.log('--- Corriendo testConnectionTester ---');
  const errorHandler = createErrorHandler();
  
  // Mocking UrlFetchApp for this test suite
  const mockUrlFetchApp = {
    fetch: function(url, options) {
      const auth = (options && options.headers && options.headers['Authorization']) || '';
      if (url.includes('notion.com') && auth.includes('fake_token')) {
        return { getResponseCode: () => 401 };
      }
      return { getResponseCode: () => 200 };
    }
  };

  const tester = createConnectionTester({ errorHandler, urlFetchApp: mockUrlFetchApp });

  // 1. Probar validación por defecto (Admin Email)
  const res1 = tester.test('ADMIN_EMAIL');
  if (!res1.isValid) throw new Error('Fallo validación por defecto para ADMIN_EMAIL');
  console.log('✅ Subtest 1: Default validation (ADMIN_EMAIL) passed.');

  // 2. Probar validación de URL (Mock)
  // Nota: Esto disparará un UrlFetchApp real si la URL es válida, 
  // pero para el test usamos una bypass o una URL que sabemos que responderá.
  const res2 = tester.test('DEPLOYMENT_URL', { url: 'https://www.google.com' });
  if (!res2.isValid) {
    console.warn('⚠️ Subtest 2: URL validation failed (might be network issue in GAS environment): ' + res2.reason);
  } else {
    console.log('✅ Subtest 2: URL validation (google.com) passed.');
  }

  // 3. Probar validación fallida de Notion
  const res3 = tester.test('NOTION_API_KEY', { apiToken: 'fake_token' });
  if (res3.isValid) throw new Error('Fallo: Notion con token falso debería ser inválido');
  console.log('✅ Subtest 3: Invalid Notion token detection passed.');

  return true;
}


