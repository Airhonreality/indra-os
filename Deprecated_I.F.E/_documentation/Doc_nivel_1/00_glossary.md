# 📚 INDRA OS: Glossary (V3 - Pristine Engineering)

> **Propósito:** Diccionario de términos axiomáticos del sistema, eliminando redundancia metafórica y logrando pureza técnica.

## 1. Axiomas & Filosofía

### Auto-Morphism
**Definición:** La capacidad del sistema para generar, adaptar y evolucionar su propia interfaz de usuario en tiempo real, basándose exclusivamente en los contratos (`schemas`) provistos por el Core.
**Impacto:** Logra la Independencia Funcional (Axioma de Suh).

### Schema Sovereignty (Soberanía del Esquema)
**Definición:** Principio fundamental que dicta que el esquema definido en el Backend (Core) es la única fuente de verdad. El Frontend es un mero intérprete.
**Lema:** "Si no está en el esquema, no existe".

### Translation Kernel (Núcleo de Traducción)
**Definición:** Capa intermedia (`SchemaResolver`) que interpreta Roles Semánticos del backend y los proyecta a Widgets de UI. No contiene lógica de negocio, solo heurísticas de representación visceral.

### Projection Kernel
**Definición:** Motor de renderizado de alto rendimiento encargado de materializar la topología y elementos dinámicos mediante Canvas 2D. Implementa la arquitectura de 3 capas y optimización psicofisiológica.

---

## 2. Heurísticas de Performance

### Dirty Flag (Bandera de Cambio)
**Definición:** Técnica de optimización que marca un nodo o capa como "sucio" solo cuando sus datos han cambiado, activando un redibujado selectivo en el siguiente ciclo de animación (`requestAnimationFrame`).

### Adaptive LOD (Level of Detail)
**Definición:** Ajuste dinámico de la complejidad visual basado en el nivel de zoom o distancia focal. Permite manejar millones de elementos simplificando su representación a medida que el observador se aleja.

### Spatial Indexing (KD-Trees / R-Trees)
**Definición:** Estructuras de datos geométricas que permiten realizar búsquedas ultra-rápidas (`O(log n)`) de elementos en pantalla para Hit-Testing y Snapping, independientemente de la densidad visual.

### Un-Ex (Universal Execution)
**Definición:** Protocolo unificado de transporte. No existen múltiples endpoints API. Existe un solo puente (`CoreBridge`) que transporta intenciones semánticas (`Adapter.method`) hacia el núcleo.

---

## 3. Arquitectura de Capas

### Core / Logic Layer
**Definición:** El conjunto de módulos encargados de la comunicación, estado y validación de contratos.
**Componentes:** `bridge`, `state`, `integrity`.

### Presentation Layer
**Definición:** La manifestación visual calculada. Es una proyección reactiva de los estados del Core.
**Componentes:** `dynamic-canvas`, `auto-forms`, `method-invoker`.

### System Contracts
**Definición:** El objeto JSON dinámico que define las capacidades totales del ecosistema Indra. Se obtiene mediante el Handshake `getSystemContracts`.

---

## 3. Componentes de Interfaz

### Method Invoker
**Definición:** Orquestador de UI dinámico que autoconstruye el formulario de ejecución basado en el esquema del método seleccionado.

### Dynamic Canvas
**Definición:** Espacio de proyección espacial para nodos y flujos de trabajo.

### Event Stream (Formerly Pulse Console)
**Definición:** Interfaz de monitoreo de telemetría que visualiza el flujo de eventos y estados en tiempo real.

---

## 4. Roles Semánticos (Axiomatic JSON Schema v6.0)

### Identity (Role: id/fingerprint)
Instruye a la UI para usar visualizadores de claves o identificadores únicos.

### Contact (Role: contact/contact_mail)
Instruye a la UI para renderizar selectores de cuenta o avatares.

---

## 5. Legacy / Deprecated (Metaphor Purge)

### Brain / Skin
**Estado:** *Deprecated*. Reemplazado por **Core** y **Presentation Layer**.

### Neutron
**Estado:** *Deprecated*. Reemplazado por **CoreBridge**.

### Cosmos / Materia
**Estado:** *Deprecated*. Reemplazado por **Topology State** (Nodes/Connections).

### Amnesia / Recall
**Estado:** *Deprecated*. Reemplazado por **PersistenceManager**.
