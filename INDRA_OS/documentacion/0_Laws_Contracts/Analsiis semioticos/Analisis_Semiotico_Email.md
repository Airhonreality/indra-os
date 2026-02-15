# Análisis Semiótico: Terminal Mail (Email)
### Arquetipo: TERMINAL
### Dominio: COMMUNICATION

Este documento define la fenomenología del artefacto "Terminal Mail" en sus tres estados fundamentales de existencia dentro del Indra OS.

---

## 1. Estado WIDGET (El Pulso)
**Semántica:** Vigilancia Pasiva, Alerta Temprana, Salud del Canal.
**Contexto de Uso:** Dashboard Principal, Grid de Monitoreo.

### Representación Visual
No es una lista de correos. Es un **monitor de constantes vitales** comunicación.
*   **Glifo Central:** Sobre cerrado o Señal de Radio (minimalista).
*   **Indicadores de Estado (Vital Signs):**
    *   *SMTP Relay:* Un punto pulsante (Verde = Activo, Ámbar = Latencia, Rojo = Caído).
    *   *Volume:* Gráfico de sparkline mostrando la densidad de tráfico entrante en la última hora.
    *   *Quota:* Barra de progreso sutil indicando el uso de almacenamiento.
*   **Interacción:** Clic en el cuerpo expande a BRIDGE. Hover revela tooltip con detalles técnicos ("SMTP Latency: 45ms").

### Contrato de Datos (Widget Projection)
```json
{
  "view": "WIDGET",
  "data": {
    "status": "ONLINE",
    "unread_count": 12, // Badge numérico discreto
    "last_sync": "12s ago",
    "vital_signs": { "Relay": "NOMINAL", "SpamFilter": "ACTIVE" }
  }
}
```

---

## 2. Estado NODE (La Anatomía)
**Semántica:** Estructura, Conectividad, Flujo.
**Contexto de Uso:** Editor de Grafos (Low-Code), Visor de Dependencias.

### Representación Visual
Es un **circuito integrado** dentro de la maquinaria mayor.
*   **Chasis:** Cápsula rectangular con puertos de entrada (Izquierda) y salida (Derecha).
*   **Puertos (Inputs - Trigger/Gate):**
    *   `send` (Trigger): Acepta señales de "Disparo" con payload {to, subject, body}.
    *   `query` (Gate): Acepta filtros de búsqueda.
*   **Puertos (Outputs - Stream/Probe):**
    *   `onReceive` (Stream): Emite un evento cada vez que llega un correo.
    *   `scanResults` (Probe): Emite arrays de mensajes tras una búsqueda.
*   **Cuerpo:** Muestra el nombre "Terminal Mail" y el icono de dominio. Si hay error, el nodo se tiñe de rojo.

### Contrato de Datos (Node Projection)
```json
{
  "view": "NODE",
  "ports": {
    "in": ["send", "search_trigger", "config"],
    "out": ["message_stream", "error_log", "ack"]
  },
  "visuals": {
    "color": "var(--color-communication-500)",
    "icon": "mail_lock"
  }
}
```

---

## 3. Estado BRIDGE (La Cabina)
**Semántica:** Operación, Inmersión, Control Total.
**Contexto de Uso:** Pantalla Completa, Ventana Modal de Tarea, Panel Lateral Extendido.

### Representación Visual
Es una **terminal de telecomunicaciones** soberana. No imita a Gmail; reinventa el control del mensaje.
*   **Layout:** "Terminal Stream" (Flujo continuo de datos) + "Command Bar" (Barra de comandos inferior).
*   **Zona de Lectura (Stream):** 
    *   Los correos no son filas de tabla; son "bloques de transmisión". 
    *   Tipografía monoespaciada para headers. 
    *   Renderizado de HTML saneado dentro de iframes sandboxed pero estilizados para encajar en el modo oscuro.
*   **Zona de Escritura (Composer):**
    *   Editor Markdown con previsualización en tiempo real.
    *   No hay botón "Enviar" azul gigante; hay comandos: `> DISPATCH`, `> DRAFT`, `> CRYPTO_SIGN`.
    *   Inputs de `To` y `Subject` tratadas como parámetros de función CLI.
*   **Panel Lateral (Contexto):**
    *   Muestra metadatos del hilo seleccionado (Ruta de servidores, firmas digitales, análisis de sentimiento por IA).

### Contrato de Datos (Bridge Projection)
```json
{
  "view": "BRIDGE",
  "capabilities": ["compose", "search", "thread_view", "archive"],
  "layout_engine": "TERMINAL_STREAM",
  "StreamConfig": {
    "rendering": "RICH_TEXT",
    "actions": ["reply", "forward", "raw_source"]
  }
}
```

---

## Síntesis de Transiciones

1.  El usuario ve que el **WIDGET** parpadea (correo nuevo).
2.  Hace clic y el sistema proyecta el **BRIDGE** (La Cabina).
3.  El usuario lee y decide automatizar una respuesta.
4.  Cambia a vista de Grafo, viendo el **NODE**, y conecta la salida `onReceive` a un nodo LLM.

**Axioma:** La funcionalidad es la misma (el Canon), pero la proyección (Semiótica) se adapta a la intención del usuario.





