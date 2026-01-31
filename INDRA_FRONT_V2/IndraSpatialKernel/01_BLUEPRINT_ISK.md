# 🌌 BLUEPRINT: INDRA SPATIAL KERNEL (ISK)
## Motor de Manifestación y Proyección Sistémica (v3.0 - SUH Canon)

> **ESTADO**: CANONIZADO (Hybrid 3.0)
> **FECHA**: 2026-01-26
> **REEMPLAZA**: Render Vector Pro (RVP)
> **AXIOMAS**: Sovereign (S), Universal (U), High-Fidelity (H)

---

## 1. DEFINICIÓN SISTÉMICA
El **Indra Spatial Kernel (ISK)** es un motor de proyección espacial de alta fidelidad que actúa como la interfaz de manifestación física de los contratos del Core. No es un editor de dibujo; es un entorno de **reificación reactiva** donde la geometría es una función del estado del sistema.

### ¿Qué lo define como Nodo Híbrido?
1.  **Soberanía de Ejecución (S)**: El 90% de la fuerza de cálculo (Motor Geométrico, Expression Engine) reside en el Cliente (Edge), permitiendo operatividad offline total tras la carga del contrato.
2.  **Universalidad de Proyección (U)**: Geometría agnóstica a la plataforma. El ISK puede proyectar en WebGL, AR o paneles LED sin cambiar la lógica del `SpatialLaw`.
3.  **Alta Fidelidad (H)**: Respuesta instantánea (latencia < 16ms) con manejo de hasta 10,000 elementos reactivos mediante culling espacial persistente.

---

## 2. EL "STARK FACTOR" (Reactividad Pura)
El núcleo del ISK es su motor de expresiones reactivas. Permite que cualquier atributo visual (posición, color, escala, filtro) esté vinculado a una fuente de datos sistémica.

**Sintaxis**: `{{ source.path | filter | math }}`

**Ejemplo de Reificación**:
```json
{
  "id": "pulse_circle",
  "type": "geometry.circle",
  "radius": "{{ microphone.volume | noise(0.5) | map(0, 1, 50, 200) }}",
  "fill": "hsla({{ system.load | map(0, 100, 200, 0) }}, 80%, 50%, 1)"
}
```
*Traducción*: El círculo pulsa según el volumen del micro y cambia de color (Azul -> Rojo) según la carga de CPU del sistema.

---

## 3. ARQUITECTURA DE INTEGRACIÓN (The ISK Stack)

```
┌─────────────────────────────────────────────────────────────────┐
│                    INDRA SPATIAL KERNEL (ISK)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         L1: CAPA DE LEY (SpatialLaw / DNA)                │ │
│  │  • Expression Engine (Soberanía de cálculo)               │ │
│  │  • Dependency Graph (Resolución de vínculos)              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            ▲                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         L2: CAPA DE PROYECCIÓN (Kernel Core)              │ │
│  │  • Spatial Index (R-Tree / 60 FPS Culling)                │ │
│  │  • Attribute Buffers (Zero-latency data injection)         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            ▲                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         L3: CAPA DE MANIFESTACIÓN (Anatomy)               │ │
│  │  • GLSL Shaders (Post-procesamiento matemático)           │ │
│  │  • Module_AutoLayout / Module_FX                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────┬─────────────────────────────────────┬─────────────┘
              │ Universal Connection (CoreBridge)   │
              ▼                                     ▼
┌─────────────────────────────┐       ┌───────────────────────────┐
│      PROJECTION KERNEL      │       │      VECTOR ADAPTER       │
│ (Semántica y Contratos IO)  │       │ (Persistencia y Assets)   │
└─────────────────────────────┘       └───────────────────────────┘
```

---

## 4. CONEXIÓN CON EL CORE

### `ProjectionKernel`
Es la fuente de verdad semántica. El ISK consulta al Kernel para:
1.  **Descubrimiento**: "¿Qué capacidades (nodos) están habilitadas en mi contrato?".
2.  **Validación**: Asegurar que las expresiones `{{ ... }}` apuntan a fuentes de datos autorizadas por el rol del usuario.

### `VectorAdapter` (Core Service)
Servicio especializado para el soporte del Nodo Híbrido:
- **Double Persistence**: Gestiona el `.layout.json` (visuales) sincronizado con el `.flow.json` (lógica).
- **Library Provider**: Suministra los símbolos base y definiciones de Shaders GLSL para L3.
- **Export Engine**: Convierte proyecciones espaciales en artefactos estáticos (PDF, SVG).

---

## 5. REGLAS DE ORO (ISK Canon)

1.  **Geometría es Función**: Ningún píxel se mueve sin un "por qué" sistémico.
2.  **Zero Glitch Policy**: La UI debe ser fluida. Si un cálculo de expresión es pesado, se desplaza a un WebWorker para no bloquear L2.
3.  **Soberanía Total**: Si el Core cae, el ISK sigue funcionando con la última captura de estado, permitiendo edición local.
4.  **Agnosticismo de Datos**: El `.layout.json` no guarda valores; guarda intenciones (Fórmulas).
