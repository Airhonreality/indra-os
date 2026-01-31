import React from 'react';
import useCoreStore from '../../core/state/CoreStore';
import { OntologyService } from '../../core/integrity/OntologyService';

/**
 * 🧵 CableLayer: The Loom (Phase H)
 * Implements "Borehole Architecture" (ADR-008) & "Thorne Metric Space" (ADR-004).
 * Pure SVG layer for high-performance connection rendering.
 *
 * @component
 */
const CableLayer = () => {
    // 1. Selector Performance: Get only what's needed
    const flows = useCoreStore(state => state.flows);
    const layouts = useCoreStore(state => state.layouts);
    const nodes = useCoreStore(state => state.nodes); // Changed from contracts to nodes to access instance methods

    // 2. Connections Array safety check
    const connections = flows?.connections || [];

    // Optimization: If no connections, don't render SVG (Borehole Efficiency)
    if (connections.length === 0) return null;

    return (
        <svg
            className="cable-layer-borehole"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none', // Allow clicking through to nodes (Borehole)
                overflow: 'visible',
                zIndex: 0 // Below nodes
            }}
        >
            <defs>
                {/* 3. Logical Markers (Directionality) */}
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-dim, #666)" />
                </marker>
            </defs>

            {connections.map(conn => (
                <Cable key={conn.id || `${conn.from}-${conn.to}`} connection={conn} layouts={layouts} nodes={nodes} />
            ))}
        </svg>
    );
};

/**
 * Individual Cable Component.
 * Encapsulates Bézier Physics and Semantic Coloring.
 */
const Cable = ({ connection, layouts, nodes }) => {
    // 4. Thorne Space Resolution
    const sourceLayout = layouts[connection.from];
    const targetLayout = layouts[connection.to];
    const sourceNode = nodes[connection.from];
    const targetNode = nodes[connection.to];

    if (!sourceLayout || !targetLayout || !sourceNode || !targetNode) return null;

    const { NODE_WIDTH, HEADER_HEIGHT, ROW_HEIGHT } = OntologyService.getLayoutTokens();
    const ROW_CENTER = ROW_HEIGHT / 2;

    // Helper to calculate port Y position
    const getPortY = (node, method) => {
        // Hydrated from OntologyService (Deterministic Rendering)

        const index = (node.methods || []).indexOf(method);
        if (index === -1) return 0; // Fallback to top

        return HEADER_HEIGHT + (index * ROW_HEIGHT) + ROW_CENTER;
    }

    // Dynamic Calculation (Ignores Stale Metadata)
    const p0 = {
        x: sourceLayout.x + NODE_WIDTH,
        y: sourceLayout.y + getPortY(sourceNode, connection.fromPort)
    };

    const p3 = {
        x: targetLayout.x,
        y: targetLayout.y + getPortY(targetNode, connection.toPort)
    };

    // Extract Archetype for coloring
    const archetypeKey = sourceNode.archetype || 'UNKNOWN';
    const archetypeConfig = OntologyService.getArchetype(archetypeKey);
    const strokeColor = archetypeConfig.color || '#888';

    // 6. Bézier Physics (Forward Tension) based on Thorne Metric Laws
    const { cable_tension, cable_width, cable_opacity } = OntologyService.getPhysicsTokens();

    const dist = Math.abs(p3.x - p0.x);
    // Thorne Tension: Apply declarative tension from Core
    const tension = Math.max(dist * cable_tension, 80);

    const cp1 = { x: p0.x + tension, y: p0.y };
    const cp2 = { x: p3.x - tension, y: p3.y };

    const pathData = `M ${p0.x} ${p0.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p3.x} ${p3.y}`;

    // 7. Semantic Visuals (Mapped to UIMasterLaw.json)
    const sourceMethod = connection.fromPort;
    const methodSchema = sourceNode.schemas?.[sourceMethod] || {};
    const intent = methodSchema.intent || 'READ';

    // A. Visual Grammar Mapping (Hydrated via OntologyService)
    const theme = OntologyService.getIntentTheme(intent);

    const activeWidth = parseFloat(theme.cableConfig?.width_active) || cable_width;
    const cableClass = theme.className || 'pulse-cable';

    return (
        <path
            d={pathData}
            stroke={strokeColor || theme.color} // Use node color or intent token
            strokeWidth={activeWidth}
            fill="none"
            markerEnd="url(#arrowhead)"
            opacity={cable_opacity}
            className={cableClass}
            style={{
                transition: 'all 0.2s ease',
            }}
        />
    );
};

export default React.memo(CableLayer); // Pure component to prevent unneeded re-renders
