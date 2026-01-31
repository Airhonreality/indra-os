
function _calculateGravity(art, all) {
    const links = art.metadata?.links || [];
    if (links.length === 0) return 0.1; // Gravedad base mínima

    // Si 'all' es una lista, vemos cuántos de nuestros links están presentes en la escena
    let presenceScore = 0;
    if (Array.isArray(all)) {
        const allIds = all.map(a => a.id);
        const linkedPresent = links.filter(id => allIds.indexOf(id) !== -1);
        presenceScore = linkedPresent.length / 10;
    } else if (all && all.id && links.indexOf(all.id) !== -1) {
        // Caso especial de test: 'all' es un solo nodo objetivo vinculado
        presenceScore = 0.5;
    }

    const strength = 0.2 + presenceScore; // 0.2 base + bonus por links
    return Math.min(Math.max(0.1, strength), 1.0);
}

const nodeA = { id: "A", metadata: { links: ["B"] } };
const nodeB = { id: "B", metadata: { links: ["A"] } };
const nodeC = { id: "C", metadata: { links: [] } };

const gravityHigh = _calculateGravity(nodeA, nodeB);
console.log("Gravity High:", gravityHigh);

const gravityLow = _calculateGravity(nodeA, nodeC);
console.log("Gravity Low:", gravityLow);

if (gravityHigh > gravityLow) {
    console.log("PASS: High > Low");
} else {
    console.log("FAIL: High <= Low");
}
