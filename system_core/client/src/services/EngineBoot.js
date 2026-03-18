/**
 * =============================================================================
 * SERVICIO: EngineBoot.js
 * RESPONSABILIDAD: Punto de entrada para la carga de Macro-Motores.
 * =============================================================================
 */

// Importamos los inits para que se registren en el EngineRegistry
import '../components/macro_engines/DocumentDesigner/init';
import '../components/macro_engines/BridgeDesigner/init';
import '../components/macro_engines/SchemaDesigner/init';
import '../components/macro_engines/WorkflowDesigner/init';
import '../components/macro_engines/AEEFormRunner/init';
import '../components/macro_engines/VideoDesigner/init';
import '../components/macro_engines/CalendarEngine/init';
import '../components/macro_engines/DiagnosticHub/init';


console.log('[EngineBoot] All macro-engines bootstrapped.');
