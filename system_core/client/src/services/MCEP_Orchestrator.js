import { sovereignIntelligence } from './SovereignIntelligenceProvider';
import { executeDirective } from './directive_executor';
import { useAppState } from '../state/app_state';

class MCEP_Orchestrator {
    
    /**
     * Inicia un ciclo MCEP de alto estándar.
     * Gestiona las iteraciones Thought -> Action -> Observation hasta
     * tener una respuesta final textual para el humano.
     */
    async orchestrateCycle(prompt, context, onStatusUpdate) {
        let cycleCount = 0;
        const maxCycles = 5; // Evitar loops infinitos de IA
        
        let currentMessages = [...context.history];
        
        // El prompt inicial
        const userMsg = { role: 'user', content: prompt };
        currentMessages.push(userMsg);
        
        while (cycleCount < maxCycles) {
            cycleCount++;
            onStatusUpdate(`THINKING [Ciclo ${cycleCount}/${maxCycles}]...`);
            
            try {
                // Enviamos todo el historial al bridge
                const responsePayload = await sovereignIntelligence.ask(prompt, {
                    ...context,
                    history: currentMessages
                });

                // CASO 1: Respuesta textual directa (Ciclo Finalizado)
                if (responsePayload.type === 'message') {
                    return {
                        finalResponse: responsePayload.text,
                        history: currentMessages
                    };
                }
                
                // CASO 2: Llamada a herramienta (ReAct Loop)
                if (responsePayload.type === 'tool_calls') {
                    const calls = responsePayload.calls;
                    onStatusUpdate(`EJECUTANDO ${calls.length} DIRECTIVAS...`);
                    
                    // Add tool calls to history
                    // For UI purposes later we might want to track this, but for the API, 
                    // it needs the assistant message with tool calls, then tool role messages.
                    
                    // We'll execute them all
                    const callResults = await Promise.all(calls.map(async (call) => {
                        return await this._executeTool(call);
                    }));
                    
                    // Añadimos la respuesta mock de las tools al historial local para que en
                    // la siguiente iteración el provider_intelligence envíe el "SYSTEM_RESULT"
                    currentMessages.push({
                        role: 'assistant', // In simple tracking this is just context
                        content: `Ejecuté: ${calls.map(c => c.name).join(', ')}`
                    });

                    // Cada resultado se agrega como 'tool' role para que _chatGemini/OpenAICompatible lo parsee
                    callResults.forEach(res => {
                        currentMessages.push({
                            role: 'tool',
                            name: res.name,
                            content: typeof res.result === 'string' ? res.result : JSON.stringify(res.result)
                        });
                    });

                    // El prompt para la siguiente iteración es vacío (o señal de continuación) 
                    // ya que el historial ya contiene la observation.
                    prompt = "Observación devuelta por el sistema. Analiza la data y da una respuesta final, o usa otra herramienta si es necesario.";
                }

            } catch (error) {
                console.error('[MCEP_Orchestrator] Fallo en ciclo:', error);
                throw error;
            }
        }

        throw new Error("Límite máximo de ciclos cognitivos alcanzado sin respuesta final.");
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
        
        const { coreUrl, sessionSecret } = useAppState.getState();
        
        console.log(`[MCEP_Orchestrator] Directiva en progreso: ${provider}.${protocol}`, data);

        try {
            const result = await executeDirective({
                executor: provider,
                method: protocol,
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
