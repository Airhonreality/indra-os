import React, { useEffect, useState } from 'react';
import useCoreStore from '../core/state/CoreStore';
import CoreBridge from '../core/bridge/CoreBridge';
import { resolver } from '../core/bridge/SchemaResolver';
import { Folder, FileText, Database, Settings, RefreshCw, ChevronRight, ChevronDown, Plus, Box, Trash2, ExternalLink, XCircle } from 'lucide-react';

/**
 * 🗂️ FileSystemPanel: Artifact Explorer
 * Provides access to 'flows', 'layouts', 'projects' and 'system' configurations.
 */
const FileSystemPanel = () => {
    const { registry, setRegistry, addLog, loadProject, currentProject, clearTopology, setProject } = useCoreStore();
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({ flows: true, layouts: true, system: true });

    const refreshFiles = async () => {
        setLoading(true);
        addLog('info', 'FILESYSTEM >> Querying Sensing Registry...');
        try {
            await resolver.loadSystemContext();

            // 1. Fetch Flows & Projects via purified 'sensing' node
            const flowResults = await CoreBridge.callCore('sensing', 'find', {
                query: "(title contains '.json' or title contains '.project') and not title contains '.tokens' and not title contains '.spatial' and trashed = false"
            });

            // 2. Fetch Layouts
            const layoutResults = await CoreBridge.callCore('sensing', 'find', {
                query: "(title contains 'system_layout' or title contains '.spatial_shadow') and trashed = false"
            });

            setRegistry({
                flows: flowResults?.foundItems || [],
                layouts: layoutResults?.foundItems || []
            });

            addLog('success', 'FILESYSTEM >> Registry Refreshed.');
        } catch (e) {
            addLog('error', `FILESYSTEM >> Sync Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (registry.flows.length === 0 && registry.layouts.length === 0) {
            refreshFiles();
        }
    }, []);

    const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

    const handleLoad = (item) => {
        if (item.name.endsWith('.project.json')) {
            loadProject(item.id, item.name, item.folderId || 'root');
        } else if (item.name.endsWith('.json')) {
            addLog('info', `FILESYSTEM >> Loading flow: ${item.name}`);
        }
    };

    const handleDelete = async (e, item) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;

        setLoading(true);
        try {
            await CoreBridge.callCore('sensing', 'deleteArtifact', { fileId: item.id });
            addLog('success', `FILESYSTEM >> Artifact: ${item.name} Trashed.`);
            if (currentProject?.id === item.id) clearTopology();
            refreshFiles();
        } catch (e) {
            addLog('error', `FILESYSTEM >> Delete Failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel file-system-panel" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: 'var(--border-thick)',
            background: 'var(--color-surface)'
        }}>
            <header className="panel-header" style={{
                padding: 'var(--space-sm)',
                borderBottom: '1px solid var(--color-surface-bright)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--color-surface-soft)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={14} className="text-secondary" />
                    <span className="mono-bold text-xs" style={{ letterSpacing: '1px' }}>WORKSPACE_EXPLORER</span>
                </div>
                <RefreshCw
                    size={12}
                    className={`action-icon ${loading ? 'spin-anim' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={refreshFiles}
                />
            </header>

            {currentProject && (
                <div style={{
                    padding: '12px',
                    background: 'var(--color-surface-bright)',
                    borderBottom: 'var(--border-thick)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    <span className="mono" style={{ fontSize: '9px', opacity: 0.5 }}>ACTIVE_WORKSPACE</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="mono-bold" style={{ fontSize: '11px', color: 'var(--accent-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {currentProject.name}
                        </span>
                        <button
                            onClick={() => clearTopology()}
                            className="icon-button"
                            title="Close Project"
                        >
                            <XCircle size={14} style={{ opacity: 0.6 }} />
                        </button>
                    </div>
                </div>
            )}

            <div className="file-tree" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-xs)' }}>
                <TreeSection
                    title="FLOWS & PROJECTS"
                    icon={RefreshCw}
                    isOpen={expanded.flows}
                    onToggle={() => toggle('flows')}
                >
                    {registry.flows.map(item => {
                        const isProj = item.name.endsWith('.project.json');
                        const isActive = currentProject?.id === item.id;
                        return (
                            <FileItem
                                key={item.id}
                                name={item.name}
                                type={isProj ? "PROJ" : "FLOW"}
                                color={isProj ? "var(--accent-primary)" : "var(--color-accent)"}
                                isActive={isActive}
                                onClick={() => handleLoad(item)}
                                onDelete={(e) => handleDelete(e, item)}
                            />
                        );
                    })}
                    <ActionItem
                        label="New Flow..."
                        onClick={() => {
                            const name = prompt("Enter flow name:", "unnamed_flow.json");
                            if (name) {
                                clearTopology();
                                setProject({ id: `new-${Date.now()}`, name: name.endsWith('.json') ? name : `${name}.json` });
                            }
                        }}
                    />
                </TreeSection>

                <TreeSection
                    title="SPATIAL SHADOWS"
                    icon={Box}
                    isOpen={expanded.layouts}
                    onToggle={() => toggle('layouts')}
                >
                    {registry.layouts.map(item => (
                        <FileItem
                            key={item.id}
                            name={item.name}
                            type="LAYOUT"
                            color="var(--color-primary)"
                            onDelete={(e) => handleDelete(e, item)}
                        />
                    ))}
                </TreeSection>

                <TreeSection
                    title="SYSTEM (LAWS)"
                    icon={Settings}
                    isOpen={expanded.system}
                    onToggle={() => toggle('system')}
                >
                    <FileItem name="SystemManifest.json" type="SYS" color="var(--text-dim)" />
                    <FileItem name="MasterLaw.json" type="SYS" color="var(--text-dim)" />
                </TreeSection>
            </div>
        </div>
    );
};

const TreeSection = ({ title, icon: Icon, isOpen, onToggle, children }) => (
    <div className="tree-section" style={{ marginBottom: '4px' }}>
        <div onClick={onToggle} className="hover-bright" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', cursor: 'pointer', opacity: 0.8 }}>
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {Icon && <Icon size={12} />}
            <span className="mono" style={{ fontSize: '10px', fontWeight: 600 }}>{title}</span>
        </div>
        {isOpen && <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>{children}</div>}
    </div>
);

const FileItem = ({ name, type, color, isActive, onClick, onDelete }) => (
    <div className={`file-item hover-bg group ${isActive ? 'active-file' : ''}`} onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: isActive ? 'var(--accent-primary)' : 'var(--text-main)', background: isActive ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'transparent', borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent', borderRadius: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <div className="mono" style={{ fontSize: '9px', padding: '1px 3px', background: color, color: 'var(--color-bg)', borderRadius: '2px', minWidth: '35px', textAlign: 'center' }}>{type}</div>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
        </div>
        {onDelete && <Trash2 size={12} className="opacity-0 group-hover:opacity-100 hover:text-error transition-all" onClick={onDelete} style={{ flexShrink: 0 }} />}
    </div>
);

const ActionItem = ({ label, onClick }) => (
    <div className="file-item hover-bright" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '10px', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '2px' }}>
        <Plus size={10} />
        <span>{label}</span>
    </div>
);

export default FileSystemPanel;
