# 🛰️ INDRA OS: Documentation Index

> **Versión:** 1.0.0  
> **Última Actualización:** 2026-01-08  
> **Propósito:** Mapa del territorio documental de INDRA

---

## 📖 Cómo Navegar Esta Documentación

INDRA OS sigue una jerarquía axiomática de 4 niveles, diseñada para diferentes audiencias y profundidades de conocimiento:

### 🧭 Nivel 0: Memoria Estratégica
**Audiencia:** Arquitectos, Product Owners, Stakeholders ejecutivos  
**Contenido:** Visión del sistema, roadmap, bitácora de decisiones estratégicas  
**Formato:** Narrativa colapsada con énfasis en próximos pasos

📍 **[Strategic Memory](Doc_nivel_0/strategic_memory.md)**

---

### 🏛️ Nivel 1: Lógica Fundacional
**Audiencia:** Desarrolladores nuevos, stakeholders técnicos, arquitectos de sistemas  
**Contenido:** Arquitectura conceptual, UX, estructura del sistema, glosario  
**Formato:** Documentos maestros organizados por dominio

📍 **[00 - Glossary](Doc_nivel_1/00_glossary.md)** - Términos axiomáticos de INDRA  
📍 **[01 - Foundational Logic](Doc_nivel_1/01_foundational_logic.md)** - Core vs Front, Sinestesia Soberana  
📍 **[02 - Systemic Logic](Doc_nivel_1/02_systemic_logic.md)** - JSON types, Workspaces, Jerarquías  
📍 **[03 - UX Logic](Doc_nivel_1/03_ux_logic.md)** - Secuencia de nodos, Anatomía, Interacción  
📍 **[04 - System Structure](Doc_nivel_1/04_system_structure.md)** - Estructura de archivos, Anti-monolitos  

📊 **[Diagrams](Doc_nivel_1/diagrams/)** - Visualizaciones del sistema

---

### ⚛️ Nivel 2: Contratos Atómicos
**Audiencia:** Desarrolladores activos, contribuidores  
**Contenido:** Especificaciones técnicas detalladas por archivo/módulo  
**Formato:** Contratos individuales con Dharma, Axiomas, Interfaz

📂 **[Atomic Contracts](Doc_nivel_2/)** - Contratos por módulo

**Estructura:**
```
Doc_nivel_2/
├── store/
│   ├── Amnesia.contract.md
│   ├── CosmosSlice.contract.md
│   └── ...
├── graph-editor/
│   ├── Reality.contract.md
│   ├── NodeEntity.contract.md
│   └── ...
└── core-bridge/
    ├── Neutron.contract.md
    └── ...
```

---

### 📜 Nivel 3: ADRs (Architecture Decision Records)
**Audiencia:** Arquitectos, revisores de código, auditores técnicos  
**Contenido:** Decisiones de diseño, justificaciones, trade-offs  
**Formato:** ADRs numerados con contexto, decisión, consecuencias

📂 **[Architecture Decision Records](Doc_nivel_3/)**

**ADRs Clave:**
- ADR_001: Atomic State Slicing
- ADR_002: Holographic Collapsed Nodes
- ADR_003: Linear Flow Enforcement
- ADR_004: Legacy Isolation Strategy
- ADR_005: CSS Segmentation
- ADR_006: Auto-Rendering Terminal System ✨ **NEW**

---

## 🔗 Quick Links

| Recurso | Descripción | Ubicación |
|---------|-------------|-----------|
| 📖 **Glossary** | Términos axiomáticos | [00_glossary.md](Doc_nivel_1/00_glossary.md) |
| 📊 **Diagrams** | Visualizaciones del sistema | [diagrams/](Doc_nivel_1/diagrams/) |
| 📝 **Changelog** | Historial de versiones | [CHANGELOG.md](CHANGELOG.md) |
| 🗺️ **Migration Map** | Guía de migración documental | [MIGRATION_MAP.md](MIGRATION_MAP.md) |
| 🏗️ **Template de Contrato** | Estándar para contratos L2 | [estandar_contrato_axiomatico.md](estandar_contrato_axiomatico.md) |

---

## 🎯 Rutas de Lectura Recomendadas

### Para Desarrolladores Nuevos
1. [Glossary](Doc_nivel_1/00_glossary.md) - Familiarízate con la nomenclatura
2. [01 - Foundational Logic](Doc_nivel_1/01_foundational_logic.md) - Entiende la arquitectura
3. [03 - UX Logic](Doc_nivel_1/03_ux_logic.md) - Aprende el flujo de usuario
4. [04 - System Structure](Doc_nivel_1/04_system_structure.md) - Navega el código

### Para Arquitectos
1. [Strategic Memory](Doc_nivel_0/strategic_memory.md) - Contexto estratégico
2. [ADRs](Doc_nivel_3/) - Decisiones de diseño
3. [04 - System Structure](Doc_nivel_1/04_system_structure.md) - Auditoría de distribución

### Para Contribuidores Activos
1. [CHANGELOG.md](CHANGELOG.md) - Últimos cambios
2. [Contratos Atómicos](Doc_nivel_2/) - Especificaciones técnicas
3. [ADRs](Doc_nivel_3/) - Contexto de decisiones

---

## 📌 Convenciones de Documentación

### Iconografía
- 🛰️ Sistema / Orbital
- 🧭 Navegación / Orientación
- 🏛️ Fundacional / Arquitectónico
- ⚛️ Atómico / Modular
- 📜 Histórico / Decisional
- 🔗 Referencia / Enlace
- ⚠️ Advertencia / Deprecación
- ✅ Completado / Verificado

### Formato de Enlaces
- **Internos**: `[Texto](ruta/relativa.md)`
- **Código**: `[archivo.js](file:///ruta/absoluta/archivo.js)`
- **Secciones**: `[Texto](archivo.md#seccion)`

### Versionado
- Documentos de Nivel 1 incluyen número de versión en el header
- Cambios significativos se registran en CHANGELOG.md
- ADRs son inmutables una vez publicados (solo se añaden nuevos)

---

*Este índice es el punto de entrada canónico a toda la documentación de INDRA OS. Mantén este archivo actualizado al añadir nuevos documentos.*
