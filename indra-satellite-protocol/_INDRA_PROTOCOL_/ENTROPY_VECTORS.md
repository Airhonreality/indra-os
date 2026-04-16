# ☢️ AUDITORÍA DE VECTORES DE ENTROPÍA
### Mapa de Riesgos y Fallas de Agente

La entropía es el desorden natural que degrada los sistemas. En Indra, la entropía es causada por agentes que optan por la "comodidad" sobre el "rigor axiomático".

---

## 🚩 Vector 1: La Alucinación Semántica (Entropía de Datos)
**Síntoma:** El Agente crea un formulario o una consulta usando nombres de campos que suenan lógicos (ej: `customer_name`) pero que no existen en el `DATA_SCHEMA` del Core.
**Impacto:** Fallo total en la sincronización. El Core rechaza el UQO por falta de integridad.
**Antídoto:** Ejecutar `ContractReader.getProtocolMeta()` antes de diseñar cualquier objeto de datos.

## 🚩 Vector 2: La Fuga de Inteligencia (Entropía de Lógica)
**Síntoma:** El Agente escribe funciones JS de 200 líneas en el frontend para procesar una tabla de datos.
**Impacto:** La lógica no es reutilizable, es lenta en dispositivos móviles y no puede ser auditada por el Core.
**Antídoto:** Delegar el proceso al `WorkflowEngine` mediante el provider `pipeline` y protocolos de transformación.

## 🚩 Vector 3: El Bypass de Soberanía (Entropía de Red)
**Síntoma:** El Agente usa una API Key directamente en el código de React/JS para llamar a Notion o OpenAI.
**Impacto:** Exposición total de credenciales (Brecha de Seguridad). Rompe la capacidad del Core de auditar y centralizar el Keychain.
**Antídoto:** Usar el `IndraBridge`. El satélite NUNCA debe conocer una API Key.

## 🚩 Vector 4: La UI Rígida (Entropía de Presentación)
**Síntoma:** El Agente crea un botón para cada acción posible, llenando la pantalla de código visual ad-hoc.
**Antídoto:** Usar el `SYSTEM_MANIFEST` para renderizar dinámicamente capacidades basadas en lo que el Silo realmente soporta hoy.

## 🚩 Vector 5: La Corrupción de Infraestructura (Entropía Orgánica)
**Síntoma:** El Agente intenta "arreglar" un problema de negocio (ej. añadir un botón de Cotización) modificando archivos dentro de `_INDRA_PROTOCOL_` o `system_core/client/src/satellite/`.
**Impacto:** Destrucción del desacoplamiento. El satélite deja de ser portátil. El Bridge se vuelve un espagueti de lógica de negocio que el Core no puede procesar.
**Antídoto:** Mantener una frontera absoluta. La lógica de negocio vive en `src/`. La infraestructura es intocable. Si necesitas una nueva funcionalidad, pídele al Core un nuevo protocolo, no parches el Bridge.
