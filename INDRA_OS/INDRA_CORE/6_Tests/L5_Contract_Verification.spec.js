/**
 * 🧪 6_Tests/L5_Contract_Verification.spec.js
 * 
 * Formal Verification of Morphisms (Yoneda Alignment).
 * Verifies that the compiler blocks connections with incompatible schemas.
 */
function testL5ContractVerification() {
    const { assert, logTestResult } = setupTest('L5_Verification');

    const errorHandler = {
        createError: (code, msg) => {
            const e = new Error(msg);
            e.code = code;
            return e;
        }
    };

    const blueprintRegistry = {
        validatePayload: () => ({ isValid: true }) // Mock
    };

    const compiler = createFlowCompiler({ errorHandler, blueprintRegistry });

    try {
        // Test 1: L5 Mismatch (Array -> String)
        (function () {
            const nodeRegistry = {
                "notion": {
                    schemas: {
                        "query": {
                            io_interface: {
                                outputs: {
                                    "results": { type: "array" }
                                }
                            }
                        }
                    }
                },
                "llm": {
                    schemas: {
                        "transform": {
                            io_interface: {
                                inputs: {
                                    "context": { type: "string" }
                                }
                            }
                        }
                    }
                }
            };

            const flow = {
                nodes: {
                    "A": { instanceOf: "notion", method: "query" },
                    "B": { instanceOf: "llm", method: "transform" }
                },
                connections: [
                    { from: "A", fromPort: "results", to: "B", toPort: "context" }
                ]
            };

            assert.throws(() => compiler.compile(flow, nodeRegistry), "Incompatibilidad Estructural (L5+)", "Should verify mismatches");
            logTestResult("detect_schema_mismatch", true);
        })();

        // Test 2: Matching Types
        (function () {
            const registryOk = {
                "notion": {
                    schemas: {
                        "query": { io_interface: { outputs: { "results": { type: "string" } } } }
                    }
                },
                "llm": {
                    schemas: {
                        "transform": { io_interface: { inputs: { "context": { type: "string" } } } }
                    }
                }
            };

            const flow = {
                nodes: {
                    "A": { instanceOf: "notion", method: "query" },
                    "B": { instanceOf: "llm", method: "transform" }
                },
                connections: [
                    { from: "A", fromPort: "results", to: "B", toPort: "context" }
                ]
            };

            const steps = compiler.compile(flow, registryOk);
            assert.strictEqual(steps.length, 2, "Steps should be generated");
            logTestResult("allow_matching_schemas", true);
        })();

        return true;

    } catch (e) {
        logTestResult("L5_Contract_Verification_Suite", false, e.message);
        throw e;
    }
}
