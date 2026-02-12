/**
 * 🧪 6_Tests/FlowCompiler.spec.js
 * 
 * Verifies the graph-to-sequence compilation logic (Topological Sort).
 */
function testFlowCompiler() {
    const { assert, logTestResult } = setupTest('FlowCompiler');

    const errorHandler = {
        createError: (code, msg) => {
            const e = new Error(msg);
            e.code = code;
            return e;
        }
    };

    const compiler = createFlowCompiler({ errorHandler });

    try {
        // Test 1: Linear Graph
        (function () {
            const flow = {
                nodes: {
                    "A": { instanceOf: "notion", method: "query" },
                    "B": { instanceOf: "llm", method: "transform" },
                    "C": { instanceOf: "email", method: "send" }
                },
                connections: [
                    { from: "A", to: "B" },
                    { from: "B", to: "C" }
                ]
            };

            const steps = compiler.compile(flow);

            assert.strictEqual(steps.length, 3, "Length should be 3");
            assert.strictEqual(steps[0].id, "A", "First step should be A");
            assert.strictEqual(steps[1].id, "B", "Second step should be B");
            assert.strictEqual(steps[2].id, "C", "Third step should be C");
            logTestResult("compile_linear_graph", true);
        })();

        // Test 2: Branching/Merge
        (function () {
            const flow = {
                nodes: {
                    "start": { instanceOf: "trigger" },
                    "branch1": { instanceOf: "notion" },
                    "branch2": { instanceOf: "calendar" },
                    "merge": { instanceOf: "email" }
                },
                connections: [
                    { from: "start", to: "branch1" },
                    { from: "start", to: "branch2" },
                    { from: "branch1", to: "merge" },
                    { from: "branch2", to: "merge" }
                ]
            };

            const steps = compiler.compile(flow);

            assert.strictEqual(steps.length, 4, "Length should be 4");
            assert.strictEqual(steps[0].id, "start", "Start should be first");
            assert.strictEqual(steps[3].id, "merge", "Merge should be last");

            const middleIds = [steps[1].id, steps[2].id];
            assert.isTrue(middleIds.includes("branch1"), "Middle should contain branch1");
            assert.isTrue(middleIds.includes("branch2"), "Middle should contain branch2");
            logTestResult("compile_branching_topology", true);
        })();

        // Test 3: Circular Dependency
        (function () {
            const flow = {
                nodes: {
                    "A": { instanceOf: "adapter" },
                    "B": { instanceOf: "adapter" }
                },
                connections: [
                    { from: "A", to: "B" },
                    { from: "B", to: "A" }
                ]
            };

            assert.throws(() => compiler.compile(flow), "Circuital Paradox Detected", "Should detect cycle");
            logTestResult("reject_circular_dependency", true);
        })();

        return true;

    } catch (e) {
        logTestResult("FlowCompiler_Suite", false, e.message);
        throw e;
    }
}
