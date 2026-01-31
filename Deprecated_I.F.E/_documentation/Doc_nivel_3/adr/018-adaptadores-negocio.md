# ADR-018: Arquitectura de Adaptadores Stark (Negocio)
> **Estado:** Aceptado
> **Contexto:** Para que INDRA trascienda las herramientas tradicionales (Retool/N8N), debe ser capaz de invocar funciones de negocio complejas sin que el Satélite conozca los detalles de implementación.

## ⚖️ Decisión
El `IndraKernel` actuará como un **Orquestador de Adaptadores**.
1. **Registro de Capacidades:** El Kernel carga en el boot un archivo `core.capabilities.sys.json` que lista qué adaptadores están vivos (ej: `notionAdapter`, `driveAdapter`, `pdfDistiller`).
2. **Llamada de Función Universal:** El Satélite solo ejecuta: 
   `IndraKernel.transport.call('nombre_adaptador', 'metodo', { payload })`.
3. **Mapeo de Intención:** El Nodo de la UI traduce la interacción espacial (clic/arrastre) en ese payload técnico.

## ✅ Consecuencias
- **Positivas:** El Satélite (la UI) se mantiene ligero y agnóstico. Toda la "fuerza bruta" del negocio (generar un PDF de 50 páginas, cruzar 5 tablas) ocurre en el Orbital Core de Google Apps Script.
- **Negativas:** Dependencia total de la latencia del Neutrón para operaciones síncronas.
