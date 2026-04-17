import { useState } from 'react';
import { MIE_PRESETS } from '../../../../services/multimedia_core/mie_config';
import { IndraIcon } from '../../../utilities/IndraIcons';

export const MIEConfigPanel = ({ mieState }) => {
    const presets = Object.values(MIE_PRESETS);
    
    // Fallback safe defaults just in case
    const { currentPreset, updatePreset, config, updateConfig } = mieState || {};

    const [isAdvanced, setIsAdvanced] = useState(true);

    if (!config) return <div className="util-hint">Cargando Aduana...</div>;

    const handleBitrateChange = (e) => {
        updateConfig({ video: { ...config.video, target_bitrate: Number(e.target.value) } });
    };

    const handleResChange = (e) => {
        updateConfig({ video: { ...config.video, max_resolution: Number(e.target.value) } });
    };

    const formatMb = (bytes) => (bytes / 1000000).toFixed(1);

    return (
        <div className="mie-config-panel stack--loose">
            <style>{`
                .preset-dropdown {
                    width: 100%;
                    background: rgba(var(--color-bg-elevated-rgb, 20, 20, 25), 0.5);
                    border: 1px solid var(--color-border);
                    color: var(--color-text-primary);
                    padding: 10px;
                    border-radius: var(--radius-sm);
                    font-size: 11px;
                    outline: none;
                    cursor: pointer;
                    transition: border-color var(--transition-base);
                }
                .preset-dropdown:focus { border-color: var(--color-accent); }
                .preset-dropdown option { background: var(--color-bg-deep); color: white; }
                
                .slider-row { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
                .slider-label { display: flex; justify-content: space-between; font-size: 10px; color: var(--color-text-secondary); }
                
                .mie-slider {
                    -webkit-appearance: none; width: 100%; height: 4px; background: var(--color-border); border-radius: 2px;
                }
                .mie-slider::-webkit-slider-thumb {
                    -webkit-appearance: none; width: 14px; height: 14px; background: var(--color-accent); border-radius: 50%; cursor: pointer;
                    box-shadow: 0 0 10px var(--color-accent-dim);
                }
            `}</style>
            
            <select 
                className="preset-dropdown font-syncopate"
                value={currentPreset}
                onChange={(e) => updatePreset(e.target.value)}
            >
                {presets.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                ))}
            </select>

            <div className="preset-hint" style={{ fontSize: '11px', opacity: 0.7, lineHeight: 1.4 }}>
                {MIE_PRESETS[currentPreset]?.hint}
            </div>

            <div className="advanced-divider shelf--tight" style={{ marginTop: '16px', cursor: 'pointer', opacity: isAdvanced ? 1 : 0.5, transition: 'opacity 0.2s' }} onClick={() => setIsAdvanced(!isAdvanced)}>
                {/* Fallback to play if chevron down isn't available in indra icon set immediately */}
                <IndraIcon name={isAdvanced ? "ARROW_DOWN" : "ARROW_RIGHT"} size="10px" />
                <span className="util-label" style={{ fontSize: '9px' }}>PÁRAMETROS DEL MODO</span>
            </div>

            {isAdvanced && config?.video && (
                <div className="advanced-options stack--loose anim-fade-in" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--color-border)', marginTop: '8px' }}>
                    <div className="slider-row">
                        <div className="slider-label">
                            <span>BITRATE DE VIDEO (MAX)</span>
                            <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{formatMb(config.video.target_bitrate)} Mbps</span>
                        </div>
                        <input type="range" className="mie-slider" 
                            min="1000000" max="25000000" step="500000" 
                            value={config.video.target_bitrate} 
                            onChange={handleBitrateChange} 
                        />
                    </div>
                    
                    <div className="slider-row">
                        <div className="slider-label">
                            <span>RESOLUCIÓN (LÍMITE)</span>
                            <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{config.video.max_resolution}p</span>
                        </div>
                        <input type="range" className="mie-slider" 
                            min="480" max="2160" step="240" 
                            value={config.video.max_resolution} 
                            onChange={handleResChange} 
                        />
                    </div>

                    <div className="slider-row" style={{ marginTop: '8px' }}>
                        <div className="slider-label">
                            <span>COMPRESIÓN DE AUDIO</span>
                            <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{(config.audio.bitrate / 1000).toFixed(0)} kbps</span>
                        </div>
                        <input type="range" className="mie-slider" 
                            min="64000" max="320000" step="32000" 
                            value={config.audio.bitrate} 
                            onChange={(e) => updateConfig({ audio: { ...config.audio, bitrate: Number(e.target.value) } })} 
                        />
                    </div>
                    
                    <div className="slider-row stack--tight" style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                         <div className="shelf--between">
                            <span className="slider-label" style={{ opacity: 0.6 }}>CODEC H.W.</span>
                            <span className="font-mono" style={{ fontSize: '9px', color: 'var(--color-text-primary)' }}>{config.video.codec}</span>
                        </div>
                        <div className="shelf--between">
                            <span className="slider-label" style={{ opacity: 0.6 }}>AUDIO ENGINE</span>
                            <span className="font-mono" style={{ fontSize: '9px', color: 'var(--color-text-primary)' }}>{config.audio.codec}</span>
                        </div>
                        <div className="shelf--between">
                            <span className="slider-label" style={{ opacity: 0.6 }}>IMÁGEN BASE</span>
                            <span className="font-mono" style={{ fontSize: '9px', color: 'var(--color-text-primary)' }}>image/{config.image.format} ~{Math.round(config.image.quality*100)}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
