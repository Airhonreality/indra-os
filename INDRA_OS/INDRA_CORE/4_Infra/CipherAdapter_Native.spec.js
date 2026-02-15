/**
 * 🧪 PRUEBAS NATIVAS: CipherAdapter
 * 
 * ═══════════════════════════════════════════════════════════════════
 * IMPORTANTE: Este archivo NO mockea Utilities y debe ejecutarse
 * de forma AISLADA del resto de la suite de tests.
 * ═══════════════════════════════════════════════════════════════════
 * 
 * RAZÓN: Los métodos criptográficos de Utilities (encryptBytes, 
 * decryptBytes, etc.) no están disponibles en el momento de carga
 * del script, por lo que no pueden ser capturados por _SATTVA_NATIVE.
 * 
 * EJECUCIÓN: RunCipherAdapterNativeTests()
 * 
 * DHARMA: Validar la integridad de la encriptación AES-256-CBC
 *         en el entorno nativo de Google Apps Script.
 */

/**
 * Test 1: Verifica que el cifrado sea reversible y robusto
 */
function testCipherAdapter_Native_Dharma() {
    console.log('Test: Verifica que el cifrado sea reversible y robusto (SIN MOCKS).');

    const errorHandler = createErrorHandler();
    const cipher = createCipherAdapter({ errorHandler });
    const masterKey = "Axiom-secret-key-2048";
    const secretMessage = "My deeply secret information 12345!";

    const encrypted = cipher.encrypt({ text: secretMessage, key: masterKey });

    assert.isNotNull(encrypted, 'El resultado de la encriptación no debe ser nulo');
    assert.isFalse(encrypted === secretMessage, 'El texto cifrado no debe ser igual al original');
    assert.isTrue(encrypted.length > secretMessage.length, 'El texto cifrado (B64) suele ser más largo');

    const decrypted = cipher.decrypt({ cipher: encrypted, key: masterKey });
    assert.areEqual(decrypted, secretMessage, 'El texto desencriptado debe coincidir con el original');
}

/**
 * Test 2: Verifica que falle la desencriptación con una clave incorrecta
 */
function testCipherAdapter_Native_Security_RejectsWrongKey() {
    console.log('Test: Verifica que falle la desencriptación con una clave incorrecta (SIN MOCKS).');

    const errorHandler = createErrorHandler();
    const cipher = createCipherAdapter({ errorHandler });
    const masterKey = "correct-key-12345";
    const wrongKey = "wrong-key-67890";
    const secretMessage = "Secret data that should not be decryptable with wrong key";

    const encrypted = cipher.encrypt({ text: secretMessage, key: masterKey });

    assert.throws(
        () => cipher.decrypt({ cipher: encrypted, key: wrongKey }),
        'DECRYPTION_FAILED',
        'Debe lanzar error al intentar desencriptar con una clave incorrecta'
    );
}

/**
 * Test 3: Verifica que falle la desencriptación si los datos están corruptos
 */
function testCipherAdapter_Native_Security_TamperingProtection() {
    console.log('Test: Verifica que falle la desencriptación si los datos están corruptos (SIN MOCKS).');

    const errorHandler = createErrorHandler();
    const cipher = createCipherAdapter({ errorHandler });
    const masterKey = "my-secure-key";
    const secretMessage = "Protected data that should detect tampering";

    const encrypted = cipher.encrypt({ text: secretMessage, key: masterKey });

    // Corromper el ciphertext modificando los últimos 5 caracteres
    const tampered = encrypted.substring(0, encrypted.length - 5) + "XXXXX";

    assert.throws(
        () => cipher.decrypt({ cipher: tampered, key: masterKey }),
        'DECRYPTION_FAILED',
        'Debe lanzar error si los datos cifrados han sido manipulados'
    );
}

/**
 * Test 4: Verifica que dos cifrados del mismo texto produzcan resultados diferentes (Unique IV)
 */
function testCipherAdapter_Native_UniqueIV() {
    console.log('Test: Verifica que dos cifrados del mismo texto produzcan resultados diferentes (Unique IV) (SIN MOCKS).');

    const errorHandler = createErrorHandler();
    const cipher = createCipherAdapter({ errorHandler });
    const masterKey = "my-key-for-iv-test";
    const secretMessage = "Same message encrypted twice";

    const encrypted1 = cipher.encrypt({ text: secretMessage, key: masterKey });
    const encrypted2 = cipher.encrypt({ text: secretMessage, key: masterKey });

    assert.isFalse(
        encrypted1 === encrypted2,
        'Dos cifrados del mismo texto deben producir resultados diferentes debido al IV único'
    );

    // Ambos deben desencriptarse correctamente al mismo mensaje
    const decrypted1 = cipher.decrypt({ cipher: encrypted1, key: masterKey });
    const decrypted2 = cipher.decrypt({ cipher: encrypted2, key: masterKey });

    assert.areEqual(decrypted1, secretMessage, 'Primera desencriptación debe ser correcta');
    assert.areEqual(decrypted2, secretMessage, 'Segunda desencriptación debe ser correcta');
}

/**
 * ═══════════════════════════════════════════════════════════════════
 * RUNNER PARA TESTS NATIVOS DE CIPHERADAPTER
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Ejecuta todos los tests nativos de CipherAdapter de forma aislada.
 * No interfiere con la suite principal de tests.
 */
function RunCipherAdapterNativeTests() {
    console.log('========================================');
    console.log('🧪 CIPHER ADAPTER - NATIVE TESTS');
    console.log('========================================');
    console.log('⚠️  Estos tests NO usan mocks y requieren');
    console.log('   el entorno nativo de Google Apps Script');
    console.log('========================================\n');

    const tests = [
        testCipherAdapter_Native_Dharma,
        testCipherAdapter_Native_Security_RejectsWrongKey,
        testCipherAdapter_Native_Security_TamperingProtection,
        testCipherAdapter_Native_UniqueIV
    ];

    let passed = 0;
    let failed = 0;
    const failures = [];

    tests.forEach(test => {
        try {
            console.log(`Running test: ${test.name}...`);
            test();
            console.log(`  ✅ PASSED: ${test.name}`);
            passed++;
        } catch (e) {
            console.error(`  ❌ FAILED: ${test.name}`);
            console.error(`    Mensaje: ${e.message}`);
            if (e.stack) {
                console.error(`    Stack:\n${e.stack}`);
            }
            failed++;
            failures.push({ name: test.name, error: e.message, stack: e.stack });
        }
    });

    console.log('\n========================================');
    console.log('📊 RESUMEN DE EJECUCIÓN');
    console.log('========================================');
    console.log(`Total de pruebas:   ${tests.length}`);
    console.log(`Pruebas pasadas:    ${passed} ✅`);
    console.log(`Pruebas falladas:   ${failed} ❌`);
    console.log('========================================');

    if (failed > 0) {
        console.log('\n🔍 DETALLES DE FALLOS');
        console.log('========================================');
        failures.forEach((failure, index) => {
            console.log(`\n[${index + 1}] ${failure.name}`);
            console.log(`    Mensaje: ${failure.error}`);
            if (failure.stack) {
                console.log(`    Stack:\n${failure.stack}`);
            }
        });
        console.log('========================================');
        console.log('❌ RESULTADO: TESTS FALLIDOS');
        console.log('========================================');
    } else {
        console.log('\n✅ RESULTADO: TODOS LOS TESTS PASARON');
        console.log('========================================');
    }

    return { passed, failed, total: tests.length, failures };
}





