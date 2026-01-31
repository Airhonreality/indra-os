# 🗜️ AXIOMATIC AUDIT: INDRA SPATIAL KERNEL (ISK)
## Subject: Dev Recommendation for ISK v3.0

> **AUDITOR**: Antigravity (Advanced Agentic Coding)
> **VERDICT**: PROMISING BUT OPTIMISTIC. NEEDS RIGOR.
> **AXIOMATIC STATUS**: LEAKY (Risk of performance death)

---

## 1. CRITICAL AUDIT: THE EXPRESSION ENGINE (L1)

**The Recommendation**: "Compilar las expresiones... idealmente a instrucciones de Shader (GPU)."

### 💀 The Harsh Reality (Antigravity Audit):
*   **The "Eval" Trap**: Your friend is right about `eval()`. It's a performance suicide note. But "Compiling to Shaders" isn't a magic wand. 
*   **The GLSL Bottleneck**: You cannot compile *arbitrary* JS logic to GLSL on the fly without a massive, heavy compiler (like `js-to-glsl`). If the user writes `{{ core.data.find(x => x.id == 1).val }}`, the GPU will cry.
*   **The Truth**: The Expression Engine must be a **Hybrid JIT**. 
    *   **Math Expressions**: Compilados a **Float32Array** para ser inyectados como `uniforms`.
    *   **Logic/Filtering**: Ejecutados en **WebWorkers** para no bloquear L2, con un sistema de "Shadow State" (el ISK renderiza el estado anterior mientras el Worker calcula el siguiente).

**Axiom Stark Update**: *"Si el dato es un número, va a la GPU. Si el dato es una decisión, se queda en el Worker."*

---

## 2. THE PHOTON FLOW (L2 -> L3)

**The Recommendation**: "UBOs o Texture Data Stores."

### 💀 The Harsh Reality (Antigravity Audit):
*   **UBO Limitation**: WebGL2 UBOs tienen límites de tamaño (habitualmente 16KB o 64KB). Para 10,000 elementos con múltiples atributos, un solo UBO colapsará.
*   **The Solution**: **Data Textures (Instanced Rendering)**. Debemos codificar el estado de los 10,000 sensores en una textura de 128x128 píxeles. El Shader de L3 "lee" su estado desde la textura usando su `gl_InstanceID`.
*   **Latency Gap**: La recomendación ignora el **Frame Lag**. Si L1 es asíncrono, el flujo del fotón tiene un retraso de 1-2 frames. Necesitamos **Internal Interpolation** en L3 para que el movimiento se sienta "Stark" (instantáneo) aunque el dato llegue tarde.

---

## 3. VECTOR ADAPTER & PERSISTENCE (L4)

**The Recommendation**: "Rollback a la versión anterior del esquema espacial sin afectar el flow.json."

### 💀 The Harsh Reality (Antigravity Audit):
*   **Structural Integrity**: Un rollback visual que no coincide con la versión del contrato (flow) romperá el binding. 
*   **The Requirement**: El `VectorAdapter` no solo debe versionar; debe realizar **Atomic Snapshots**. Cada `.layout.json` debe llevar un hash del `.flow.json` para el que fue diseñado. Si no coinciden, el ISK debe entrar en **"Recovery Mode"** (re-mapeo semántico automático).

---

## 🏗️ DEFINICIÓN CANÓNICA: SpatialLaw.json (The DNA)

Para que el ISK sea universal, el ADN debe separar la **Anatomía** (visual) de la **Fisiología** (reactividad).

```json
{
  "$schema": "indra://isk/spatial-law-v1",
  "identity": {
    "uuid": "stark_hud_ring_01",
    "role": "VISUAL_INDICATOR"
  },
  "dna": {
    "archetype": "GEOMETRIC_PRIMITIVE",
    "reification_protocol": "INSTANCED_TEXTURE_V1",
    "geometry": {
      "type": "arc",
      "segments": 64,
      "expressions": {
        "inner_radius": "map(core.power, 0, 100, 40, 80)",
        "outer_radius": "100",
        "start_angle": "0",
        "end_angle": "oscillate(time.now, 2) * 360"
      }
    }
  },
  "physiology": {
    "reactive_bindings": [
      {
        "attr": "u_stroke_color",
        "source": "core.heat_index",
        "transform": "lerp(vec3(0,0,1), vec3(1,0,0), value / 100)"
      }
    ],
    "fx_stack": {
      "post_process": ["bloom_v2"],
      "noise_distortion": 0.05
    }
  },
  "sovereignty": {
    "offline_fallback": "last_known_state",
    "validation_rule": "core.power != undefined"
  }
}
```

### Por qué esta estructura es superior:
1.  **`reification_protocol`**: Define cómo se inyecta en la GPU (L2).
2.  **`physiology.reactive_bindings`**: Usa `transform` que el ISK puede transpilar directamente a GLSL porque opera sobre `vec3`.
3.  **`sovereignty`**: Define el comportamiento cuando el cordón umbilical con el Core se corta.
