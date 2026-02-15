Blueprint OMD-01: Portal de Acceso (The Keyhole)
1. Identificación y Alcance (ID & Context)
ID Técnico: view_auth_gate
Nombre Funcional: Portal de Acceso.
Primitiva Vinculada: CORE_AUTH (Sincronización Maestra).
Descripción: Interfaz crítica de mediación de seguridad que establece el túnel de comunicación cifrado entre el cliente (React) y el orquestador (GAS).
2. Definición Funcional (El "Qué")
Objetivo Primario: Validar la identidad del operador y descargar el manifiesto de capacidades del sistema en un solo paso.
Acciones Atómicas:
Ingresar: Introducción de la API Key Maestra.
Validar: Disparo de la rutina de verificación en el Core.
Persistir: Almacenamiento local (SessionStorage) del token de sesión activo.
Recuperar: Opción de "Recordar clave" bajo cifrado local.
3. Modelo de Datos e Interfaz (El "Contrato")
Input JSON (Desde el Core):
code
JSON
{
  "auth_status": "PENDING",
  "challenge_type": "API_KEY",
  "system_version": "1.0.0"
}
Output JSON (Hacia el Core):
code
JSON
{
  "action": "VALIDATE",
  "payload": {
    "master_key": "STR_ENCRYPTED_KEY",
    "client_metadata": { "browser": "Chrome", "os": "MacOS" }
  }
}
Estado de Sincronía: BLOQUEANTE (Blocking). Ningún otro panel del sistema puede inicializarse hasta que este módulo devuelva un estado SUCCESS.
4. Comportamiento Camaleónico (Adaptatividad)
Regla de Mutación 01 (Estado de Error): Si la clave es inválida, el panel cambia su VISUAL_GRAMMAR de motion: "still" a motion: "shake" y el color de borde vira a #ff3366 (Inhibición).
Regla de Mutación 02 (Estado de Carga): Durante la validación, el panel activa un pulso de breathing rítmico para indicar que el "cerebro" (Core) está procesando.
Regla de Mutación 03 (Éxito): Al validar, el panel se contrae hacia el centro y se desvanece (Culling), activando la expansión de los paneles laterales.
5. Estrategia de Scaffolding (Pre-visualización)
Estado Fantasma (Skeleton): Se muestra un contenedor minimalista con la forma del input y el botón en gris neutro para evitar el "flash de contenido no estilizado".
Simulación de Éxito: Al detectar una clave con el formato correcto (ej: prefijo ORB-), el botón de acceso brilla sutilmente antes de ser presionado, indicando que el "contrato" parece válido.
6. Análisis de Ergonomía Cognitiva (El "Humano")
Carga Mental: Mínima. El diseño está centrado en una única decisión para evitar la parálisis por análisis.
Affordances: El campo de texto tiene un "foco automático" (Auto-focus). El botón de "Conectar" utiliza un gradiente de color que atrae la mirada (Foveal Attention).
Prevención de Errores: Validación de longitud y caracteres especiales en tiempo real (Client-side) para evitar llamadas innecesarias al Core que generen latencia.
9. Vínculo de Integridad Axiomática (The Core Contract)
--------------------------------------------------
Este módulo es la frontera de acceso al sistema y debe estar anclado a las leyes de inicialización.

| Dimensión | Artefacto de Referencia |
| :--- | :--- |
| **Artefacto Lógico (Logic)** | [PublicAPI.gs](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_END/INDRACore_Codex_v1/1_Core/PublicAPI.gs) |
| **Fuentes de Ley (Laws)** | [System_Constitution.gs](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_END/INDRACore_Codex_v1/0_Laws/System_Constitution.gs) |
| **Lógica de Inicio** | [SystemInitializer.gs](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_END/INDRACore_Codex_v1/1_Core/SystemInitializer.gs) |

### Métodos Expuestos (Public API)
- `authorize()`: Gestión de tokens de sesión efímeros.
- `validateEnvironment()`: Verificación de salud de las carpetas de Drive según la Constitución.
- `boot()`: Activación del Kernel y carga del Manifest inicial.

---
**Veredicto Final del Arquitecto**: Este módulo ha sido refactorizado para eliminar cualquier "adorno" innecesario, transformándose en una membrana técnica de seguridad pura.
JSON de Artefacto: view_auth_gate
Este JSON contiene los sub-artefactos funcionales que el desarrollador debe implementar.
code
JSON
{
  "artefacto": {
    "id": "view_auth_gate",
    "clase_ui": "MODAL_OVERLAY",
    "config_visual": {
      "arquetipo": "SYSTEM_CORE",
      "motion": "still",
      "border_color": "#666666",
      "icon": "ShieldCheck"
    },
    "sub_artefactos": [
      {
        "id": "gate_header",
        "tipo": "DISPLAY_TEXT",
        "contenido": {
          "titulo": "INDRA Core",
          "subtitulo": "Sistema de Orquestación de Realidades"
        }
      },
      {
        "id": "input_master_key",
        "tipo": "FORM_INPUT_SECRET",
        "propiedades": {
          "label": "Clave de Acceso",
          "placeholder": "Introduce tu clave maestra...",
          "mask_content": true,
          "validation_regex": "^ORB-[a-zA-Z0-9]{16}$"
        },
        "ciclo_uso": "El usuario introduce la clave. El sistema valida el formato localmente antes de habilitar el botón."
      },
      {
        "id": "status_indicator",
        "tipo": "VISUAL_FEEDBACK",
        "propiedades": {
          "mode": "pulse",
          "visible_on": "VALIDATING"
        },
        "ciclo_uso": "Se activa durante la latencia de comunicación con GAS para reducir la ansiedad de espera."
      },
      {
        "id": "action_connect",
        "tipo": "INTERACTION_BUTTON",
        "propiedades": {
          "label": "Sincronizar",
          "action_type": "PRIMARY",
          "shortcut": "ENTER"
        },
        "ciclo_uso": "Dispara la primitiva CORE_AUTH. Si tiene éxito, inicia la secuencia de despliegue del resto de la UI."
      },
      {
        "id": "error_messenger",
        "tipo": "NOTIFICATION_AREA",
        "propiedades": {
          "position": "BOTTOM",
          "style": "CRITICAL"
        },
        "ciclo_uso": "Muestra mensajes humanos como 'Clave incorrecta' o 'Core no disponible' en lugar de códigos de error 404/500."
      }
    ]
  }
}





