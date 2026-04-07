import React, { useState, useRef } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

export const MIEDropzone = ({ onFiles, isProcessing, globalProgress }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div 
            className={`mie-dropzone center stack--loose ${isDragging ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={handleClick}
            style={{ cursor: isProcessing ? 'wait' : 'pointer' }}
        >
            <input 
                type="file" 
                multiple 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                onChange={(e) => onFiles(Array.from(e.target.files))}
            />
            
            <div className="dropzone-vibrance" style={{ 
                position: 'absolute', width: '100%', height: '100%', 
                background: `conic-gradient(from 0deg, transparent, var(--color-accent-dim), transparent)`,
                animation: isProcessing ? 'spin 5s linear infinite' : 'none',
                opacity: isProcessing ? 1 : 0
            }} />

            <IndraIcon 
                name={isProcessing ? 'SYNC' : 'ADD'} 
                size="48px" 
                color="var(--color-accent)" 
                className={isProcessing ? 'spin' : ''} 
            />
            
            <div className="text-content center stack--tight">
                <h2 className="font-syncopate" style={{ fontSize: '24px', fontWeight: 900 }}>
                    {isProcessing ? 'PROCESANDO ARCHIVOS...' : 'ARRASTRA ARCHIVOS AQUÍ'}
                </h2>
                <p className="util-hint" style={{ opacity: 0.5 }}>
                    {isProcessing ? `Progreso: ${(globalProgress * 100).toFixed(1)}%` : 'Haz clic o arrastra tus recursos multimedia (Video, Audio, Imagen).'}
                </p>
            </div>

            {isProcessing && (
                <div className="progress-track" style={{ width: '80%', height: '2px', background: 'var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div className="progress-fill" style={{ width: `${globalProgress * 100}%`, height: '100%', background: 'var(--color-accent)', transition: 'all 0.3s ease' }} />
                </div>
            )}
        </div>
    );
};
