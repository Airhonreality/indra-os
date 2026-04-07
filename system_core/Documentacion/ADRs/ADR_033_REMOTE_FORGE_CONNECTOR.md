# ADR_033: REMOTE_FORGE_CONNECTOR (El Satélite)

> **Versión:** 1.0 (Arquitectura de Control Headless)
> **Estado:** PROPUESTA — Pendiente de Revisión
> **Alcance:** Integración de Indra en frontends externos (NOMON, etc.) mediante inyección dinámica.

## 1. Contexto y Problema
Un Arquitecto de Indra diseña UIs personalizadas (Soberanas) fuera del ecosistema de Indra. Sin embargo, necesita mantener la **Sinceridad de Datos** con su Core. En lugar de copiar carpetas o configurar URLs manualmente, el sistema requiere un método de **"Cero Fricción"** para conectar el código local con la infraestructura de Indra.

## 2. Decisión Arquitectónica
Se implementará el **Indra Satellite HUD**, un micro-script inyectable que dota a cualquier frontend de capacidades de "Forja" en tiempo de desarrollo.

### 2.1 El Mecanismo de Inyección (The Probe)
El Arquitecto añade una sonda única a su proyecto:
```html
<script src="https://indra.io/satellite/v1/hud.js"></script>
```

### 2.2 Autodescubrimiento y Auth (Handshake)
En lugar de `config.json` manuales:
- **Google OAuth:** El usuario se loguea en el HUD.
- **Core Discovery:** El HUD consulta a un servicio central de Indra: *"¿Cuál es la URL del Core de este usuario?"*.
- **Puntero Dinámico:** El HUD se conecta automáticamente al GAS del usuario.

### 2.3 El Patrón "Vigilante" (Drift Detection)
- **Local Schema Discovery:** El HUD escanea el objeto `window.INDRA_SCHEMAS` (declarado por el dev en su código).
- **Remote Schema Fetch:** El HUD lee los esquemas del Core.
- **Sync Logic:** Si hay diferencias, el HUD muestra una alerta visual y ofrece un botón de `[SINCRONIZAR]`.

### 2.4 Restricciones de Seguridad
- **Dev-Only:** El HUD solo se renderiza si `window.location.hostname === 'localhost'` o mediante un `SovereignToken`.
- **Shadow DOM:** El HUD vive en un Shadow DOM para no contaminar los estilos del proyecto anfitrión ni sufrir interferencias de CSS externo.

## 3. Experiencia de Usuario (HUD Interface)
- Un icono flotante (Indra Luma) en la esquina inferior.
- Al expandirse: Lista de esquemas detectados localmente vs en Indra.
- Botones de acción: **Ignitar Silo**, **Sincronizar ADN**, **Abrir Designer**.

## 4. Artefactos y Modos de Despliegue
- `satellite/hud.js`: Script de entrada ligero.
- `satellite/discovery.gs`: Endpoint en el Core para resolver identidades.
- `satellite/manual_publico.md`: Documentación para desarrolladores PRO.

---
*Este ADR canoniza a Indra como un Servicio Ubicuo, agnóstico al soporte físico de la interfaz.*
