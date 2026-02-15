/**
 * 6_Tests/_TestHelpers.spec.js
 * 
 * DHARMA: Test de la infraestructura de testeo.
 * DHARMA: Auto-verificación de la pureza de las especificaciones.
 */

function testTestHelpers_RunAll() {
  testTestHelpers_Assert_isTrue();
  testTestHelpers_Assert_isFalse();
  testTestHelpers_Assert_areEqual();
  testTestHelpers_Assert_isNotNull();
  testTestHelpers_Assert_isNull();
  testTestHelpers_Assert_throws();
  testTestHelpers_Assert_isType();
  testTestHelpers_Assert_arrayContains();
  testTestHelpers_Assert_arrayLength();
  testTestHelpers_Assert_hasProperty();
  return true;
}

function _setupTestHelpersTests() {
  return {
    originals: {}
  };
}

function _teardownTestHelpersTests(originals) {
  // Nada que restaurar por ahora
}

function testTestHelpers_Assert_isTrue() {
  const setup = _setupTestHelpersTests();
  try {
    assert.isTrue(true);
    assert.throws(() => assert.isTrue(false));
    assert.throws(() => assert.isTrue(null));
    assert.throws(() => assert.isTrue("true"));
    return true;
  } finally {
    _teardownTestHelpersTests(setup.originals);
  }
}

function testTestHelpers_Assert_isFalse() {
  const setup = _setupTestHelpersTests();
  try {
    assert.isFalse(false);
    assert.throws(() => assert.isFalse(true));
    assert.throws(() => assert.isFalse(null));
    return true;
  } finally {
    _teardownTestHelpersTests(setup.originals);
  }
}

function testTestHelpers_Assert_areEqual() {
  const setup = _setupTestHelpersTests();
  try {
    assert.areEqual(1, 1);
    assert.areEqual("hola", "hola");
    assert.areEqual(true, true);

    // Objetos (comparación por referencia)
    const obj = { a: 1 };
    assert.areEqual(obj, obj);

    assert.throws(() => assert.areEqual(1, 2));
    assert.throws(() => assert.areEqual("hola", "adiós"));
    assert.throws(() => assert.areEqual({ a: 1 }, { a: 1 })); // No son la misma referencia

    return true;
  } finally {
    _teardownTestHelpersTests(setup.originals);
  }
}

function testTestHelpers_Assert_isNotNull() {
  const setup = _setupTestHelpersTests();
  try {
    assert.isNotNull(1);
    assert.isNotNull("");
    assert.isNotNull({});
    assert.throws(() => assert.isNotNull(undefined)); // La implementación actual rechaza undefined
    assert.throws(() => assert.isNotNull(null));
    return true;
  } finally {
    _teardownTestHelpersTests(setup.originals);
  }
}

function testTestHelpers_Assert_isNull() {
  const setup = _setupTestHelpersTests();
  try {
    assert.isNull(null);
    assert.throws(() => assert.isNull(undefined));
    assert.throws(() => assert.isNull(0));
    assert.throws(() => assert.isNull(""));
    return true;
  } finally {
    _teardownTestHelpersTests(setup.originals);
  }
}

function testTestHelpers_Assert_isType() {
  const setup = _setupTestHelpersTests();
  try {
    assert.isType("hola", "string");
    assert.isType(42, "number");
    assert.isType(true, "boolean");
    assert.isType({}, "object");
    assert.isType(() => { }, "function");

    assert.throws(() => assert.isType(42, "string"));
    assert.throws(() => assert.isType("42", "number"));
    assert.isType(null, "object"); // typeof null es "object" en JS/GAS

    return true;
  } finally {
    _teardownTestHelpersTests(setup.originals);
  }
}

function testTestHelpers_Assert_throws() {
  const setup = _setupTestHelpersTests();
  try {
    // Caso de éxito: La función lanza un error
    assert.throws(() => { throw new Error("Algo salió mal"); });

    // Caso de éxito: La función lanza un error y el mensaje coincide parcialmente
    assert.throws(() => { throw new Error("Error: 404 Not Found"); }, "404 Not Found");

    // Caso de fallo: La función NO lanza un error
    assert.throws(() => {
      assert.throws(() => { /* No hacer nada */ });
    }, "Expected function to throw an error, but it did not");

    // Caso de fallo: El mensaje del error no coincide
    assert.throws(() => {
      assert.throws(() => { throw new Error("Mensaje incorrecto"); }, "Mensaje esperado");
    }, "Expected error to match 'Mensaje esperado', but got message 'Mensaje incorrecto'");

    return true;
  } finally {
    _teardownTestHelpersTests(setup.originals);
  }
}

function testTestHelpers_Assert_arrayContains() {
  const setup = _setupTestHelpersTests();
  try {
    assert.arrayContains([1, 2, 3], 2);
    assert.arrayContains(["a", "b", "c"], "a");
    assert.throws(() => assert.arrayContains([1, 2, 3], 4));
    assert.throws(() => assert.arrayContains([], 1));
    return true;
  } finally {
    _teardownTestHelpersTests(setup.originals);
  }
}

function testTestHelpers_Assert_arrayLength() {
  const setup = _setupTestHelpersTests();
  try {
    assert.arrayLength([1, 2, 3], 3);
    assert.arrayLength([], 0);
    assert.throws(() => assert.arrayLength([1], 0));
    assert.throws(() => assert.arrayLength("no es array", 0));
    return true;
  } finally {
    _teardownTestHelpersTests(setup.originals);
  }
}

function testTestHelpers_Assert_hasProperty() {
  const setup = _setupTestHelpersTests();
  try {
    assert.hasProperty({ a: 1 }, "a");
    assert.hasProperty({ b: undefined }, "b");
    assert.throws(() => assert.hasProperty({ a: 1 }, "b"));
    assert.throws(() => assert.hasProperty(null, "a"));
    return true;
  } finally {
    _teardownTestHelpersTests(setup.originals);
  }
}





