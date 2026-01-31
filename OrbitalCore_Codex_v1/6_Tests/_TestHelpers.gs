// ======================================================================
// ARTEFACTO: _TestHelpers.gs
// CAPA: 6_Tests
// DHARMA: Librería de Utilidades de Testing Minimalista y Nativa.
// ======================================================================

/**
 * Objeto global que agrupa todas las funciones de aserción.
 */
const assert = {
  isTrue: function(value, message) {
    if (value !== true) {
      const errorMessage = message || `Expected true but got '${value}'`;
      throw new Error(errorMessage);
    }
  },
  isFalse: function(value, message) {
    if (value !== false) {
      const errorMessage = message || `Expected false but got '${value}'`;
      throw new Error(errorMessage);
    }
  },
  areEqual: function(expected, actual, message) {
    if (actual !== expected) {
      const errorMessage = message || `Expected '${expected}' but got '${actual}'`;
      throw new Error(errorMessage);
    }
  },
  equal: function(actual, expected, message) {
    if (actual !== expected) {
      const errorMessage = message || `Expected '${expected}' but got '${actual}'`;
      throw new Error(errorMessage);
    }
  },
  strictEqual: function(actual, expected, message) {
    if (actual !== expected) {
      const errorMessage = message || `Expected '${expected}' but got '${actual}'`;
      throw new Error(errorMessage);
    }
  },
  deepEqual: function(actual, expected, message) {
    try {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        const errorMessage = message || `Expected deep equal but got '${a}' vs '${b}'`;
        throw new Error(errorMessage);
      }
    } catch (e) {
      if (actual !== expected) {
        const errorMessage = message || `Expected deep equal but got non-equal values`;
        throw new Error(errorMessage);
      }
    }
  },
  isObject: function(value, message) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      const errorMessage = message || `Expected object but got '${value === null ? 'null' : typeof value}'`;
      throw new Error(errorMessage);
    }
  },
  isFunction: function(value, message) {
    if (typeof value !== 'function') {
      const errorMessage = message || `Expected function but got '${typeof value}'`;
      throw new Error(errorMessage);
    }
  },
  isString: function(value, message) {
    if (typeof value !== 'string') {
      const errorMessage = message || `Expected string but got '${typeof value}'`;
      throw new Error(errorMessage);
    }
  },
  isNotNull: function(value, message) {
    if (value === null || value === undefined) {
      const errorMessage = message || 'Expected value to be not null/undefined';
      throw new Error(errorMessage);
    }
  },
  isNull: function(value, message) {
    if (value !== null) {
      const errorMessage = message || `Expected null but got '${value}'`;
      throw new Error(errorMessage);
    }
  },
  isDefined: function(value, message) {
    if (value === undefined) {
      const errorMessage = message || `Expected value to be defined, but got undefined`;
      throw new Error(errorMessage);
    }
  },
  isUndefined: function(value, message) {
    if (value !== undefined) {
      const errorMessage = message || `Expected undefined but got '${typeof value}'`;
      throw new Error(errorMessage);
    }
  },
  throws: function(func, errorCodeOrMessagePart, customMessage) {
    if (typeof func !== 'function') throw new Error('assert.throws: First argument must be a function');
    let didThrow = false;
    let caughtError = null;
    try { func(); } catch (error) { didThrow = true; caughtError = error; }
    if (!didThrow) throw new Error(customMessage || 'Expected function to throw an error, but it did not');
    if (errorCodeOrMessagePart !== undefined && errorCodeOrMessagePart !== null) {
      const actualCode = caughtError.code;
      const actualMessage = caughtError.message || '';
      const matchesCode = actualCode === errorCodeOrMessagePart;
      const matchesMessage = actualMessage.indexOf(errorCodeOrMessagePart) !== -1;
      
      if (!matchesCode && !matchesMessage) {
        let errorDetail = actualCode ? `code '${actualCode}'` : `message '${actualMessage}'`;
        throw new Error(customMessage || `Expected error to match '${errorCodeOrMessagePart}', but got ${errorDetail}`);
      }
    }
  },
  isType: function(value, expectedType, message) {
    if (expectedType === 'array') {
      if (!Array.isArray(value)) throw new Error(message || `Expected type 'array' but got '${typeof value}'`);
      return;
    }
    if (expectedType === 'null') {
      if (value !== null) throw new Error(message || `Expected type 'null' but got '${typeof value}'`);
      return;
    }
    const actualType = typeof value;
    if (actualType !== expectedType) throw new Error(message || `Expected type '${expectedType}' but got '${actualType}'`);
  },
  arrayContains: function(array, element, message) {
    if (!Array.isArray(array)) throw new Error('assert.arrayContains: First argument must be an array');
    if (!array.includes(element)) throw new Error(message || `Expected array to contain '${element}', but it does not`);
  },
  arrayLength: function(array, expectedLength, message) {
    if (!Array.isArray(array)) throw new Error('assert.arrayLength: First argument must be an array');
    if (array.length !== expectedLength) throw new Error(message || `Expected array length to be ${expectedLength}, but got ${array.length}`);
  },
  hasProperty: function(obj, property, message) {
    if (typeof obj !== 'object' || obj === null) throw new Error('assert.hasProperty: First argument must be an object');
    if (!(property in obj)) throw new Error(message || `Expected object to have property '${property}'`);
  },
  approximately: function(expected, actual, delta, message) {
    if (typeof delta !== 'number') delta = 0.0001;
    const diff = Math.abs(expected - actual);
    if (diff > delta) throw new Error(message || `Expected approximately ${expected} (±${delta}), but got ${actual} (diff: ${diff})`);
  },
  arrayEquals: function(actual, expected, message) {
    if (!Array.isArray(actual)) throw new Error(`arrayEquals: First argument is not an array`);
    if (!Array.isArray(expected)) throw new Error(`arrayEquals: Second argument is not an array`);
    if (actual.length !== expected.length) throw new Error(message || `Expected array of length ${expected.length}, but got length ${actual.length}`);
    for (let i = 0; i < actual.length; i++) {
      const actualStr = JSON.stringify(actual[i]);
      const expectedStr = JSON.stringify(expected[i]);
      if (actualStr !== expectedStr) throw new Error(message || `Arrays differ at index ${i}`);
    }
  },
  exists: function(value, message) {
    if (value === null || value === undefined) throw new Error(message || `Expected value to exist but got '${value}'`);
  },
  includes: function(needle, haystack, message) {
    if (typeof haystack === 'string' || Array.isArray(haystack)) {
      if (!haystack.includes(needle)) throw new Error(message || `Expected '${haystack}' to include '${needle}'`);
    } else throw new Error('assert.includes: Second argument must be a string or an array');
  },
  fail: function(message) {
    throw new Error(message || 'Test failed explicitly');
  }
};

/**
 * Factory para crear un mock de una función simple.
 */
var mockFactory = {
  fn: function(implementation) {
    var calls = [];
    var _returnValue = undefined;
    var _implementation = implementation;
    var mockFn = function() {
      var args = Array.prototype.slice.call(arguments);
      calls.push({ args: args });
      if (typeof _implementation === 'function') return _implementation.apply(null, args);
      return _returnValue;
    };
    mockFn.calls = calls;
    mockFn.mockReturnValue = function(val) { _returnValue = val; return mockFn; };
    mockFn.mockImplementation = function(fn) { _implementation = fn; return mockFn; };
    mockFn.getCallCount = function() { return calls.length; };
    return mockFn;
  },
  create: function(implementation) { return this.fn(implementation); },
  /**
   * Crea un mock completo del MonitoringService (Axioma H7-RESILIENCE)
   */
  createMonitor: function() {
    return {
      logDebug: this.fn(),
      logInfo: this.fn(),
      logWarn: this.fn(),
      logError: this.fn(),
      logEvent: this.fn(),
      sendCriticalAlert: this.fn(),
      _isMock: true
    };
  }
};

function createTestHarness(suiteName) {
  return {
    test: function(description, fn) {
      try { fn(); } catch (e) {
        console.error("  ❌ FAILED: " + suiteName + " - " + description + " - " + e.message);
        throw e;
      }
    },
    assert: assert,
    mock: mockFactory
  };
}

function setupTest(testName) {
  var logTestResult = function(name, success, details) {
    if (success === undefined && details === undefined) {
      console.log("  ✅ PASSED: " + name);
      return;
    }
    if (success) console.log("  ✅ PASSED: " + name);
    else console.error("  ❌ FAILED: " + name + " - " + details);
  };
  return { assert: assert, logTestResult: logTestResult, mockFactory: mockFactory };
}

if (typeof global !== 'undefined') { global.assert = assert; }
