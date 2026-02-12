/**
 * MÓDULO TEMPORAL DE DIAGNÓSTICO
 * CosmosInspector.jsx
 * 
 * Muestra el estado completo del Cosmos montado para verificar
 * qué datos están disponibles y qué falta implementar.
 */

import React from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';

const CosmosInspector = () => {
    const { state } = useAxiomaticStore();
    const cosmos = state.phenotype.cosmosIdentity;

    if (!cosmos) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#888',
                fontFamily: 'monospace'
            }}>
                No Cosmos mounted
            </div>
        );
    }

    return (
        <div style={{
            padding: '20px',
            backgroundColor: '#0a0a0a',
            color: '#e0e0e0',
            fontFamily: 'monospace',
            fontSize: '12px',
            height: '100vh',
            overflow: 'auto'
        }}>
            <div style={{
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '2px solid #00ff88'
            }}>
                <h1 style={{ margin: 0, color: '#00ff88', fontSize: '24px' }}>
                    🔬 Cosmos Inspector
                </h1>
                <p style={{ margin: '5px 0', color: '#888' }}>
                    Estado del Cosmos montado
                </p>
            </div>

            {/* Identity */}
            <Section title="🆔 Identity">
                <KeyValue label="Label" value={cosmos.identity?.label} />
                <KeyValue label="Description" value={cosmos.identity?.description} />
                <KeyValue label="ID" value={cosmos.id} />
            </Section>

            {/* Namespace */}
            <Section title="🗂️ Namespace">
                <KeyValue label="UI" value={cosmos.namespace?.ui} />
                <KeyValue label="Logic" value={cosmos.namespace?.logic} />
                <KeyValue label="Data" value={cosmos.namespace?.data} />
                <KeyValue label="Media" value={cosmos.namespace?.media} />
            </Section>

            {/* Active Layout */}
            <Section title="🎨 Active Layout">
                {cosmos.activeLayout ? (
                    <pre style={{
                        backgroundColor: '#1a1a1a',
                        padding: '10px',
                        borderRadius: '4px',
                        overflow: 'auto'
                    }}>
                        {JSON.stringify(cosmos.activeLayout, null, 2)}
                    </pre>
                ) : (
                    <div style={{ color: '#ff6b6b', padding: '10px' }}>
                        ⚠️ No activeLayout defined
                    </div>
                )}
            </Section>

            {/* Active Flow */}
            <Section title="⚡ Active Flow">
                {cosmos.activeFlow ? (
                    <pre style={{
                        backgroundColor: '#1a1a1a',
                        padding: '10px',
                        borderRadius: '4px',
                        overflow: 'auto'
                    }}>
                        {JSON.stringify(cosmos.activeFlow, null, 2)}
                    </pre>
                ) : (
                    <div style={{ color: '#ff6b6b', padding: '10px' }}>
                        ⚠️ No activeFlow defined
                    </div>
                )}
            </Section>

            {/* Flow State */}
            <Section title="💾 Flow State (Persistence)">
                {cosmos.flow_state ? (
                    <pre style={{
                        backgroundColor: '#1a1a1a',
                        padding: '10px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        maxHeight: '300px'
                    }}>
                        {JSON.stringify(cosmos.flow_state, null, 2)}
                    </pre>
                ) : (
                    <div style={{ color: '#ffa500', padding: '10px' }}>
                        ℹ️ No flow_state (empty persistence)
                    </div>
                )}
            </Section>

            {/* Full Cosmos Object */}
            <Section title="📦 Full Cosmos Object">
                <pre style={{
                    backgroundColor: '#1a1a1a',
                    padding: '10px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '400px'
                }}>
                    {JSON.stringify(cosmos, null, 2)}
                </pre>
            </Section>

            {/* Recommendations */}
            <Section title="💡 Recommendations">
                <div style={{ padding: '10px', lineHeight: '1.6' }}>
                    {!cosmos.activeLayout && (
                        <div style={{ color: '#ff6b6b', marginBottom: '10px' }}>
                            ❌ <strong>Missing activeLayout:</strong> Implement default layout or allow user to select one
                        </div>
                    )}
                    {!cosmos.activeFlow && (
                        <div style={{ color: '#ffa500', marginBottom: '10px' }}>
                            ⚠️ <strong>Missing activeFlow:</strong> Cosmos has no logic flow defined
                        </div>
                    )}
                    {!cosmos.flow_state && (
                        <div style={{ color: '#ffa500', marginBottom: '10px' }}>
                            ⚠️ <strong>Missing flow_state:</strong> No persistence layer configured
                        </div>
                    )}
                    {cosmos.namespace?.ui === 'STANDARD_LAYOUT' && (
                        <div style={{ color: '#00ff88', marginBottom: '10px' }}>
                            ✅ <strong>Standard Layout:</strong> Can use default OMD-07 Project Explorer
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
};

// Helper Components
const Section = ({ title, children }) => (
    <div style={{
        marginBottom: '20px',
        border: '1px solid #333',
        borderRadius: '4px',
        overflow: 'hidden'
    }}>
        <div style={{
            backgroundColor: '#1a1a1a',
            padding: '10px',
            fontWeight: 'bold',
            borderBottom: '1px solid #333'
        }}>
            {title}
        </div>
        <div style={{ padding: '10px' }}>
            {children}
        </div>
    </div>
);

const KeyValue = ({ label, value }) => (
    <div style={{
        display: 'flex',
        padding: '5px 0',
        borderBottom: '1px solid #222'
    }}>
        <span style={{ color: '#888', minWidth: '120px' }}>{label}:</span>
        <span style={{ color: '#00ff88', flex: 1 }}>
            {value || <span style={{ color: '#666' }}>undefined</span>}
        </span>
    </div>
);

export default CosmosInspector;
