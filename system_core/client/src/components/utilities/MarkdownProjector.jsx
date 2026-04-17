import { useState, useEffect } from 'react';

/**
 * MarkdownProjector (Dharma Edition)
 * Un parseador ultra-ligero para proyectar READMEs técnicos sin dependencias pesadas.
 */
export const MarkdownProjector = ({ url }) => {
    const [content, setContent] = useState('CARGANDO_CONOCIMIENTO...');

    useEffect(() => {
        fetch(url)
            .then(res => res.text())
            .then(text => {
                const html = parseMarkdown(text);
                setContent(html);
            })
            .catch(err => setContent("ERROR_DE_PROYECCION: " + err.message));
    }, [url]);

    // Un parseador minimalista compatible con la estética de Indra
    const parseMarkdown = (text) => {
        return text
            .replace(/^# (.*$)/gm, '<h1 style="font-size: 24px; color: var(--color-accent); margin-top: 20px;">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 style="font-size: 18px; color: var(--color-text-primary); margin-top: 30px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">$1</h2>')
            .replace(/^### (.*$)/gm, '<h3 style="font-size: 14px; font-weight: 600; margin-top: 20px;">$1</h3>')
            .replace(/^- (.*$)/gm, '<li style="margin-left: 20px; font-size: 13px; opacity: 0.8; margin-bottom: 6px;">$1</li>')
            .replace(/\*\*(.*)\*\*/gm, '<strong>$1</strong>')
            .replace(/`(.*)`/gm, '<code style="background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #58a6ff;">$1</code>')
            .replace(/```([\s\S]*?)```/gm, '<pre style="background: #0d1117; padding: 16px; border-radius: 8px; border: 1px solid #30363d; overflow-x: auto; font-size: 11px; color: #e6edf3; font-family: monospace;"><code>$1</code></pre>')
            .replace(/\n\n/g, '<br/>');
    };

    return (
        <div 
            className="indra-markdown" 
            style={{ 
                textAlign: 'left', 
                lineHeight: '1.6', 
                color: 'var(--color-text-secondary)',
                fontFamily: 'inherit'
            }}
            dangerouslySetInnerHTML={{ __html: content }} 
        />
    );
};
