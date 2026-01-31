# ADR-002: Normalización Determinística (Muro de IDs)
> **Contexto:** La interfaz UI mostraba IDs UUID de Notion en lugar de nombres humanos, causando "amnesia cognitiva" en el usuario.

## ⚖️ Decisión
Se prohíbe que la UI (Capa de Presentación) realice cualquier lógica de detección o traducción de IDs. El **IndraKernel** (Capa de Servicio) implementa un "Muro Determinístico":

1. **Enmascaramiento Inmediato:** Al transmutar una partícula, si es de tipo `RELATION`, el campo `display` se inicializa como `null` o `[...]`.
2. **Propiedad Blindada:** El valor crudo del UUID solo existe en la propiedad interna `value`, nunca en `display`.
3. **Resolución Única:** Solo el `Identity Ledger` del Kernel puede escribir nombres en el `nameCache` del Store.

## ✅ Consecuencias
- **Positivas:** Se elimina el parpadeo de IDs en la pantalla. La UI se convierte en un "Espejo Muerto" (Passive UI), reduciendo errores de renderizado.
- **Negativas:** Introduce una latencia visual mínima (`[...]`) mientras el Ledger hidrata la identidad, pero mantiene la integridad visual.
