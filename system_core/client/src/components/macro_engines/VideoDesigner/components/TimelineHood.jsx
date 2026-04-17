import React from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * Módulo: TimelineHood
 * Dharma: Herramientas de edición y manipulación de clips.
 */
export const TimelineHood = ({ currentTool, onSelectTool, onAddTrack, onSnapToggle, snapEnabled }) => {
    return (
        <div className="shelf--tight px-2" style={{ 
            height: '32px', 
            backgroundColor: 'var(--color-bg-void)', 
            borderBottom: '1px solid var(--color-border)',
            zIndex: 10
        }}>
            <div className="engine-hood__capsule">
                <button 
                    className={`engine-hood__btn ${currentTool === 'select' ? 'engine-hood__btn--active' : ''}`} 
                    onClick={() => onSelectTool('select')}
                    title="Select Tool (V)"
                >
                    <IndraIcon name="TARGET" size="10px" color={currentTool === 'select' ? 'var(--color-accent)' : 'white'} />
                </button>
                <button 
                    className={`engine-hood__btn ${currentTool === 'cut' ? 'engine-hood__btn--active' : ''}`} 
                    onClick={() => onSelectTool('cut')}
                    title="Razor Tool (C)"
                >
                    <IndraIcon name="SCISSORS" size="10px" color={currentTool === 'cut' ? 'var(--color-accent)' : 'white'} />
                </button>
            </div>

            <div className="engine-hood__capsule">
                <button 
                    className={`engine-hood__btn ${snapEnabled ? 'engine-hood__btn--active' : ''}`} 
                    onClick={onSnapToggle}
                    title="Toggle Magnet Snap (S)"
                    style={{ background: snapEnabled ? 'var(--color-accent-dim)' : 'transparent' }}
                >
                    <IndraIcon name="SYNC" size="10px" color={snapEnabled ? 'var(--color-accent)' : 'var(--color-text-secondary)'} />
                </button>
            </div>

            <div className="fill" />

            <div className="engine-hood__capsule">
                <button className="engine-hood__btn" onClick={() => onAddTrack()} style={{ width: 'auto', padding: '0 8px', gap: '4px' }}>
                    <IndraIcon name="PLUS" size="8px" color="var(--color-accent)" />
                    <span className="font-mono" style={{ fontSize: '9px', fontWeight: 'bold' }}>ADD_LANE</span>
                </button>
            </div>
        </div>
    );
};
