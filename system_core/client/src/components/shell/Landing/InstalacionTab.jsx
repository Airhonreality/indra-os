import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';

export const InstalacionTab = ({ onStartSync }) => {
    const installCommand = `iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Airhonreality/indra-os/main/install.ps1'))`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(installCommand);
        // Toast invisible o notificación sutil
    };

    const steps = [
        { id: '01', desc: 'En Windows ve a Inicio y escribe "PowerShell". En Mac/Linux abre la Terminal.' },
        { 
            id: '02', 
            desc: 'Copia y pega el comando de instalación y presiona Enter.',
            isCommand: true
        },
        { id: '03', desc: 'Sigue las instrucciones. Se te pedirá loguearte con Google para alojar tu Core.' },
        { id: '04', desc: 'Puedes instalar un Core por cada cuenta de Google que desees manejar.' },
        { id: '05', desc: 'Indra creará la carpeta "_indra_system_". No la borres ni la toques manualmente.' },
        { id: '06', desc: 'Una vez instalado, obtendrás una URL. Úsala para sincronizar tu entorno.' }
    ];

    return (
        <div style={{maxWidth: '800px', width: '90%', margin: '0 auto', padding: '160px 0'}}>
            <div style={{ marginBottom: '80px', textAlign: 'center' }}>
                <h2 style={{fontSize: '32px', fontWeight: 300, letterSpacing: '0.2em', marginBottom: '20px'}}>INICIAR DESPLIEGUE</h2>
                <p style={{ opacity: 0.4, fontSize: '10px', letterSpacing: '0.1em' }}>PROTOCOLO DE INSTALACIÓN SOBERANA</p>
            </div>

            <div className="stack" style={{gap: '16px'}}>
                {steps.map((step) => (
                    <div key={step.id} className="indra-card" style={{
                        display:'flex', 
                        flexDirection: 'column',
                        gap: '20px', 
                        padding: '30px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div className="badge-step" style={{ 
                                width: '24px', height: '24px', fontSize: '10px', fontWeight: 300,
                                background: 'transparent', border: '1px solid var(--color-accent)', color: 'var(--color-accent)'
                            }}>{step.id}</div>
                            <div style={{fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 300, opacity: 0.8}}>
                                {step.desc}
                            </div>
                        </div>

                        {step.isCommand && (
                            <div style={{ position: 'relative', marginTop: '10px' }}>
                                <code style={{ 
                                    display: 'block', 
                                    padding: '24px', 
                                    background: 'rgba(0,0,0,0.2)', 
                                    borderRadius: '8px', 
                                    fontSize: '11px', 
                                    color: 'var(--color-accent)',
                                    wordBreak: 'break-all',
                                    fontFamily: 'monospace',
                                    paddingRight: '60px',
                                    border: '1px solid rgba(123, 47, 247, 0.2)'
                                }}>
                                    {installCommand}
                                </code>
                                <button 
                                    className="btn btn--mini btn--ghost" 
                                    onClick={copyToClipboard}
                                    style={{ 
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'var(--color-bg-surface)', border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <IndraIcon name="COPY" size="12px" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div style={{ marginTop: '100px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', opacity: 0.4, marginBottom: '24px' }}>¿Ya tienes tu URL del Core lista y copiada?</p>
                <button className="btn btn--ghost" style={{ padding: '20px 40px', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', fontWeight: 300 }} onClick={onStartSync}>
                    SINCRONIZAR CORE CON INDRA
                </button>
            </div>
        </div>
    );
};
