import React from 'react';
import { CoreRadialDiagram } from './CoreRadialDiagram';
import { UIDashboardMockup } from './UIDashboardMockup';
import { SovereignInfraDiagram } from './SovereignInfraDiagram';

/**
 * ArquitecturaTab — Axiomatic Narrative Edition
 * Fluid spacing, system tokens, no viewport-lock.
 */
export const ArquitecturaTab = () => {
    return (
        <div style={{ maxWidth: '1200px', width: '90%', margin: '0 auto', color: 'var(--color-text-primary)' }}>
            <section className="stack" style={{ gap: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
                
                {/* ── FASE 1: INFRAESTRUCTURA SOBERANA (EL MODELO MENTAL) ── */}
                <div style={{ textAlign: 'center', padding: 'var(--space-12) 0' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 350, letterSpacing: '0.4em' }}>01. SOBERANÍA DE INFRAESTRUCTURA</h3>
                        <p style={{ opacity: 0.4, fontSize: 'var(--text-2xs)', letterSpacing: '0.2em' }}>¿DÓNDE VIVE INDRA?</p>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '64px', alignItems: 'center' }}>
                        <div style={{ padding: '40px', background: 'var(--glass-light)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
                            <SovereignInfraDiagram />
                        </div>
                        <div className="stack" style={{ gap: '40px', textAlign: 'left' }}>
                            <div style={{ borderLeft: '2px solid var(--color-cold)', paddingLeft: '24px' }}>
                                <h4 style={{ color: 'var(--color-cold)', fontSize: 'var(--text-sm)', marginBottom: '10px', letterSpacing: '0.1em' }}>01. EL MOTOR (GAS/V8)</h4>
                                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 300, color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                                    INDRA no requiere servidores propios. El núcleo reside en Google Apps Script, ejecutándose bajo el potente motor V8 de Google. Soberanía técnica total sin costes de mantenimiento.
                                </p>
                            </div>
                            <div style={{ borderLeft: '2px solid var(--diag-core)', paddingLeft: '24px' }}>
                                <h4 style={{ color: 'var(--diag-core)', fontSize: 'var(--text-sm)', marginBottom: '10px', letterSpacing: '0.1em' }}>02. LA MEMORIA (GOOGLE DRIVE)</h4>
                                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 300, color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                                    Tus datos son archivos .json en tu propio Google Drive. No hay bases de datos centralizadas; tú eres el dueño absoluto de cada bit almacenado.
                                </p>
                            </div>
                            <div style={{ borderLeft: '2px solid var(--diag-proyect)', paddingLeft: '24px' }}>
                                <h4 style={{ color: 'var(--diag-proyect)', fontSize: 'var(--text-sm)', marginBottom: '10px', letterSpacing: '0.1em' }}>03. LA PROYECCIÓN (VITE/REACT)</h4>
                                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 300, color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                                    La interfaz es una proyección ligera que se comunica de forma asíncrona con el núcleo. El Dashboard es solo la ventana a tu realidad digital.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── FASE 2: TOPOLOGÍA DEL NÚCLEO (MODELO TÉCNICO) ── */}
                <div style={{ textAlign: 'center', padding: 'var(--space-12) 0' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 350, letterSpacing: '0.4em' }}>02. TOPOLOGÍA DEL NÚCLEO</h3>
                        <p style={{ opacity: 0.4, fontSize: 'var(--text-2xs)', letterSpacing: '0.2em' }}>ARQUITECTURA DE TRES ANILLOS SOBERANOS</p>
                    </div>
                    
                    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
                        <CoreRadialDiagram />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '64px', gap: '32px', textAlign: 'left' }}>
                        <div style={{ background: 'var(--glass-light)', padding: '32px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
                            <h4 style={{ color: 'var(--diag-core)', fontSize: 'var(--text-sm)', marginBottom: '12px', letterSpacing: '0.2em' }}>NÚCLEO Y ORQUESTACIÓN (INNER)</h4>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 300, color: 'var(--color-text-secondary)', lineHeight: '2' }}>
                                • Orquestador: Ejecución y descubrimiento de servicios.<br/>
                                • Núcleo: Motor de transformación de materia y lógica central.<br/>
                                • Entrada: El único túnel de entrada y comunicación segura (HTTPS).<br/>
                                • Registro: El libro mayor y directorio universal del sistema.
                            </div>
                        </div>
                        <div style={{ background: 'var(--glass-light)', padding: '32px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
                            <h4 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginBottom: '12px', letterSpacing: '0.2em' }}>PROVEEDORES EXTERNOS (MIDDLE)</h4>
                            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 300, color: 'var(--color-text-secondary)', lineHeight: '2' }}>
                                La capa donde el ecosistema exterior se conecta. Mediante adaptadores desacoplados, puedes inyectar capacidades de proveedores como SQL, Notion, Calendar o Drive directamente al motor sin comprometer su integridad.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── FASE 3: ANATOMÍA DE LA INTERFAZ ── */}
                <div style={{ textAlign: 'center', padding: 'var(--space-12) 0' }}>
                    <div style={{ marginBottom: '80px' }}>
                        <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 350, letterSpacing: '0.4em' }}>03. ANATOMÍA DEL DASHBOARD</h3>
                        <p style={{ opacity: 0.4, fontSize: 'var(--text-2xs)', letterSpacing: '0.2em' }}>SISTEMA DE PROYECCIÓN TRICANAL</p>
                    </div>

                    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                        <UIDashboardMockup />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: '64px', gap: '24px', textAlign: 'left' }}>
                        <div style={{ padding: '24px', borderLeft: '1px solid var(--color-border)' }}>
                            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '12px', letterSpacing: '0.1em' }}>01. LA MATERIA (ORIGEN)</h4>
                            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 300, color: 'var(--color-text-soft)', opacity: 0.7, lineHeight: '1.8' }}>
                                Columna de hidratación de datos. Aquí es donde INDRA sincroniza tus fuentes externas (SQL, Sheets, Notion) y las convierte en átomos estructurados listos para ser procesados. Tu información, tus reglas.
                            </p>
                        </div>
                        <div style={{ padding: '24px', borderLeft: '1px solid var(--color-border)' }}>
                            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '12px', letterSpacing: '0.1em' }}>02. EL PROCESO (LÓGICA)</h4>
                            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 300, color: 'var(--color-text-soft)', opacity: 0.7, lineHeight: '1.8' }}>
                                El corazón del puente lógico. En esta fase, los átomos de datos se encuentran con tus flujos de automatización. Ingeniería de procesos sin código para transformar la materia en inteligencia operativa.
                            </p>
                        </div>
                        <div style={{ padding: '24px', borderLeft: '1px solid var(--color-border)' }}>
                            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '12px', letterSpacing: '0.1em' }}>03. EL RESULTADO (ARTEFACTOS)</h4>
                            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 300, color: 'var(--color-text-soft)', opacity: 0.7, lineHeight: '1.8' }}>
                                La salida final de valor. Los datos procesados se proyectan como artefactos terminados: un PDF diagramado, un video renderizado o un canvas dinámico. De la lógica invisible al impacto tangible.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
