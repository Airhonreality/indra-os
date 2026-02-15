💎 Blueprint OMD-05.1: Reactive Bridge (Sub-módulo de Propiedades)
1. Identificación y Alcance
ID Técnico: module_reactive_bridge
Nombre Funcional: Reactive Bridge (El Conector).
Naturaleza: Extensión de Componente de UI (Hospedado en cada fila del OMD-05).
Axioma de Diseño: "Toda propiedad es una constante hasta que se le otorga una conciencia."
2. Anatomía de la Interacción (Micro-UX)
El usuario no "abre" el mapeador; lo invoca sobre una propiedad específica:
A. El Gatillo (The Link Trigger)
Al lado de cada slider o input en el Inspector (OMD-05), aparece un icono de "Cadena/Vínculo" sutil.
Estado Off: Icono gris. Valor manual activo.
Estado On: Icono cian pulsante. Valor dinámico activo.
B. La Expansión Contextual (The Inline Forge)
Al hacer clic en el vínculo, la fila de la propiedad se expande hacia abajo o abre un pop-over inmediato:
Buscador de Origen (Quick Pick): Un input que invoca al OMD-10 (The Source). Escribes "Ventas" y seleccionas el campo.
Calibrador de Rango (The Tuner): Aparecen dos campos pequeños: Input Range (lo que viene) y Output Range (lo que quieres).
Visualizador de Flujo: Una pequeña línea de luz que se mueve entre el valor de entrada y el de salida para confirmar que el "puente" está pasando datos.
3. Ciclo de Uso Intuitivo (The AXIOM Path)
Creación: Dibujas un círculo en el ISK.
Selección: Lo tocas. El OMD-05 muestra: Radio: 50px.
Intención: Quieres que el radio dependa del stock. Haces clic en el icono de vínculo al lado de 50px.
Conexión: Escribes "Stock" en el buscador que aparece ahí mismo. Lo seleccionas.
Ajuste: El sistema te dice: "Stock viene de 0 a 100. ¿Radio de cuánto a cuánto?". Escribes 20 a 150.
Cierre: Haces clic fuera. Ahora la fila del radio en el inspector es azul y muestra: Radio: {{ stock }}.
4. Auditoría de Diseño: ¿Por qué es más intuitivo?
Continuidad Espacial: El usuario nunca quita la vista de la propiedad que quiere afectar.
Andamiaje Progresivo: No abrumamos al usuario con fórmulas matemáticas complejas desde el inicio. Primero conecta, luego calibra.
Feedback Inmediato: Al estar integrado en el inspector, el usuario ve cómo cambia el círculo en el escenario mientras ajusta los números del mapeo. Es un bucle de retroalimentación cerrado.
5. JSON de Integración: module_reactive_bridge
code
JSON
{
  "omd_05_1": {
    "id": "module_reactive_bridge",
    "parent": "view_context_inspector",
    "interaction_model": "INLINE_EXPANSION",
    "states": {
      "STATIC": { "ui": "SLIDER_INPUT", "logic": "CONSTANT" },
      "REACTIVE": { "ui": "EXPRESSION_FIELD", "logic": "JIT_FUNCTION" }
    },
    "quick_tools": [
      { "id": "auto_range", "label": "Auto-Calibrar", "action": "MATCH_INPUT_LIMITS" },
      { "id": "invert", "label": "Invertir", "action": "SWAP_OUTPUT_LIMITS" }
    ]
  }
}




