/**
 * ⚡ OMD-11: REACTIVE MAPPER
 * 
 * SOBERANÍA: Motor de reglas y equivalencias.
 * Polimórfico: Se adapta al destino (Color, Brillo, Texto, etc.)
 */

import React from 'react';
import './ReactiveMapper.css';

export const ReactiveMapper = ({ targetType, onConnect }) => {
    return (
        <div className="reactive-mapper">
            <div className="mapper-drop-zone">
                <span className="drop-hint">Drop Variable to Map</span>
            </div>

            <div className="mapper-logic">
                <div className="range-group">
                    <label>Input range</label>
                    <div className="inputs">
                        <input type="number" placeholder="min" />
                        <input type="number" placeholder="max" />
                    </div>
                </div>

                <div className="connector-arrow">➔</div>

                <div className="range-group">
                    <label>Target {targetType}</label>
                    <div className="inputs">
                        <input type="text" placeholder="start" />
                        <input type="text" placeholder="end" />
                    </div>
                </div>
            </div>

            <button className="stark-btn-action">Activate Mapping</button>
        </div>
    );
};

export default ReactiveMapper;
