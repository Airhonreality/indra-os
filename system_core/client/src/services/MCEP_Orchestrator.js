import { sovereignIntelligence } from './SovereignIntelligenceProvider';
import { executeDirective } from './directive_executor';
import { useAppState } from '../state/app_state';
import { discoveryEngine } from './MCEP_DiscoveryEngine';

class MCEP_Orchestrator {
    
    /**
     * Inicia un ciclo MCEP de alto estándar.
     * Gestiona las iteraciones Thought -> Action -> Observation hasta
     * tener una respuesta final textual para el humano.
     */
    async orchestrateCycle(prompt, context, onStatusUpdate) {
        let cycleCount = 0;
        const maxCycles = 4; // Aumentado a 4 para permitir: 1.Sensing -> 2.Action -> 3.Reading Result -> 4.Final Message
        
        let currentMessages = [...context.history];
        
        // El prompt inicial (no lo pusheamos aún a currentMessages porque ask() lo hará)
        let activePrompt = prompt;
        // relevantTools se calcula una vez
        const relevantTools = discoveryEngine.filterToolsByIntent(activePrompt, context.capabilities?.agentTools || []);

        
        // Tiering: Determinamos si tenemos un router viable
        const useTiering = sovereignIntelligence.routerModel && sovereignIntelligence.providers[sovereignIntelligence.routerModel.provider];

        
        while (cycleCount < maxCycles) {
            cycleCount++;
            onStatusUpdate(`THINKING [Ciclo ${cycleCount}/${maxCycles}]...`);
            
            try {
                // COMPRESIÓN DE HISTORIA (Context Sliding)
                const compressedHistory = this._compressHistory(currentMessages);

                // Tiering Logic: Si es un ciclo de decisión (1 o 2), usamos el Router veloz.
                // En el ciclo final (cuando esperamos mensaje) usaremos el Analyst.
                const isFinalAttempt = (cycleCount === maxCycles);
                const tierOptions = (!isFinalAttempt && useTiering) ? {
                    overrideProvider: sovereignIntelligence.routerModel.provider,
                    overrideModel: sovereignIntelligence.routerModel.model
                } : {};

                // Enviamos el prompt activo y el historial previo
                const responsePayload = await sovereignIntelligence.ask(activePrompt, {
                    ...context,
                    capabilities: { ...context.capabilities, agentTools: relevantTools },
                    history: compressedHistory,
                    options: tierOptions
                });

                // CASO 1: Respuesta textual directa (Ciclo Finalizado)
                if (responsePayload.type === 'message') {
                    // Solo al final, consolidamos el intercambio en el historial real si fuera necesario
                    // pero para el orquestador, retornamos la respuesta.
                    return {
                        finalResponse: responsePayload.text,
                        history: [...currentMessages, { role: 'user', content: activePrompt }]
                    };
                }
                
                // CASO 2: Llamada a herramienta (ReAct Loop)
                if (responsePayload.type === 'tool_calls') {
                    const calls = responsePayload.calls;
                    onStatusUpdate(`EJECUTANDO ${calls.length} DIRECTIVAS...`);
                    
                    const callResults = await Promise.all(calls.map(async (call) => {
                        return await this._executeTool(call);
                    }));
                    
                    // Sincronizamos historial: Prompt anterior + Ejecución + Resultados
                    currentMessages.push({ role: 'user', content: activePrompt });
                    currentMessages.push({
                        role: 'assistant',
                        content: `Ejecuté: ${calls.map(c => c.name).join(', ')}`
                    });

                    // COMPRESIÓN DE OBSERVACIONES
                    callResults.forEach(res => {
                        let contentToSave = res.result;
                        if (Array.isArray(contentToSave)) {
                            const totalOriginal = contentToSave.length;
                            contentToSave = contentToSave.slice(0, 20).map(item => ({
                                id: item.id,
                                name: item.name || item.title || (item.handle ? item.handle.alias : 'unknown'),
                                class: item.class || item.type,
                                desc: item.description
                            }));
                            if (totalOriginal > 20) contentToSave.push({ _SYSTEM_NOTE_: `... y ${totalOriginal - 20} más.` });
                        }
                        
                        let stringified = typeof contentToSave === 'string' ? contentToSave : JSON.stringify(contentToSave);
                        if (stringified.length > 4000) stringified = stringified.substring(0, 4000) + '... [DATA TRUNCADA]';

                        currentMessages.push({ role: 'tool', name: res.name, content: stringified });
                    });

                    // El nuevo prompt para la IA es la instrucción de análisis
                    activePrompt = "[SISTEMA]: Herramienta(s) ejecutada(s) con éxito. Analiza la observación y RESPONDE DIRECTAMENTE AL USUARIO. Tienes prohibido seguir usando herramientas en este ciclo a menos que falte información crítica de forma absoluta.";
                }

            } catch (error) {
                console.error('[MCEP_Orchestrator] Fallo en ciclo:', error);
                throw error;
            }
        }

        return {
            finalResponse: `[SISTEMA]: No se pudo consolidar una respuesta final tras ${maxCycles} ciclos. Revisa los logs de los motores.`,
            history: currentMessages
        };
    }

    /**
     * Comprime el historial para evitar Token Limit.
     * Mantiene los últimos 4 mensajes intactos y resume el resto.
     */
    _compressHistory(messages) {
        if (messages.length <= 6) return messages;

        const systemNote = {
            role: 'system',
            content: `[MEMORIA_SINTETIZADA]: El historial anterior contenía ${messages.length - 4} intercambios sobre el sistema. Se ha purgado para ahorrar memoria operativa.`
        };

        // Tomar los últimos 4 mensajes (suelen ser los del ciclo actual)
        const recentOnes = messages.slice(-4);
        return [systemNote, ...recentOnes];
    }

    /**
     * Parsea el nombre "call__provider__protocol" y ejecuta la directiva real.
     */
    async _executeTool(toolCall) {
        const nameParts = toolCall.name.split('__');
        if (nameParts.length < 3) {
            return { name: toolCall.name, result: `ERROR_SISTEMA: Nombre de tool inválido ${toolCall.name}` };
        }
        
        const provider = nameParts[1];
        const protocol = nameParts[2];
        const data = toolCall.arguments || {};
        
        const { coreUrl, sessionSecret, activeWorkspaceId } = useAppState.getState();
        
        // AXIOMA DE CONTEXTO: Inyectar workspace_id si falta y el provider es system
        if (!data.workspace_id && activeWorkspaceId && provider === 'system') {
            data.workspace_id = activeWorkspaceId;
        }
        
        console.log(`[MCEP_Orchestrator] Directiva en progreso: ${provider}.${protocol}`, data);

        try {
            const result = await executeDirective({
                provider: provider,
                protocol: protocol,
                data
            }, coreUrl, sessionSecret);
            
            const payload = result.items || result.results || result.payload || result.metadata || result;
            
            return {
                name: toolCall.name,
                result: payload
            };
        } catch (error) {
            return {
                name: toolCall.name,
                result: `ERROR_SISTEMA: ${error.message}`
            };
        }
    }
}

export const mcepOrchestrator = new MCEP_Orchestrator();
