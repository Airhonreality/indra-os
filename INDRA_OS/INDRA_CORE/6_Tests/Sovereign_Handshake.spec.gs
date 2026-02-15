/**
 * 🧪 6_Tests/Sovereign_Handshake.spec.gs
 * 
 * Verifies the "Safe Harbor" axiom: Discovery methods must be accessible without a token.
 */
function testSovereignHandshake() {
  const { assert, logTestResult } = setupTest('Sovereign_Handshake');

  const executionStack = assembleGenericTestStack();
  const { public: publicAPI } = executionStack;

  try {
    // TEST 1: Accessibility of getSovereignGenotype via Satellite API Mock
    (function() {
      const mockEvent = {
        postData: {
          contents: JSON.stringify({
            action: 'getSystemContracts',
            payload: {}
          })
        }
      };

      // Simulamos una llamada NO autorizada
      const result = _handleSatelliteApiRequest(mockEvent, executionStack, null, false);
      
      assert.strictEqual(result.statusCode, 200, "Should return 200 OK for discovery method");
      assert.strictEqual(result.body.success, true, "Should report success");
      const contracts = result.body.result;
      const hasAdapter = Object.keys(contracts).some(key => contracts[key].archetype === 'ADAPTER');
      assert.isTrue(hasAdapter, "Should contain at least one component with archetype ADAPTER in contracts");
      logTestResult("discovery_handshake_access", true);
    })();

    // TEST 2: Denial of sensitive methods without token
    (function() {
      const mockEvent = {
        postData: {
          contents: JSON.stringify({
            executor: 'sensing',
            method: 'compareSnapshots',
            payload: {}
          })
        }
      };

      assert.throws(() => {
        _handleSatelliteApiRequest(mockEvent, executionStack, null, false);
      }, "UNAUTHORIZED", "Should block sensitive methods without token");
      logTestResult("discovery_handshake_security", true);
    })();

    return true;
  } catch (e) {
    logTestResult("Sovereign_Handshake_Suite", false, e.message);
    throw e;
  }
}





