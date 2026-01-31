# ADR-005: Arquitectura de Perspectivas Sinestésicas
> **Estado:** Aceptado
> **Contexto:** Las apps clásicas usan pestañas para separar funciones. INDRA OS usa un único lienzo donde la "Perspectiva" cambia la percepción de la materia.

## ⚖️ Decisión
Definir cuatro planos de realidad operativa que coexisten en el mismo espacio espacial:

1. **BIOS (Infraestructura):** Visualiza los archivos del sistema (`.sys.json`) y la salud del Kernel. Es el plano de la "Realidad Base".
2. **EIDOS (Forma):** El plano del diseño visual. Las entidades muestran su cara estética y tipografía.
3. **LOGOS (Nervio):** Las entidades se vuelven translúcidas y revelan sus **Sockets** y cables sinápticos. Es el plano de la lógica de datos.
4. **SOMA (Cuerpo):** El modo de ejecución. Los bloques se vuelven interactivos y permiten la entrada de datos o la actuación sobre el mundo real (Notion/Drive).

## ✅ Consecuencias
- **Positivas:** Reducción drástica de la carga cognitiva. El usuario no "salta" entre herramientas, sino que "ve a través" del sistema.
- **Negativas:** Complejidad técnica en el `EntityDispatcher` para manejar múltiples estados de renderizado según la perspectiva activa.
