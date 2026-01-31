# ADR-006: Auto-Rendering Terminal System

**Status:** Proposed  
**Date:** 2026-01-08  
**Deciders:** Arquitecto Principal  
**Tags:** #auto-rendering #terminals #schema-driven #v11

---

## Context

Currently, each adapter (Notion, Gmail, Drive, etc.) requires a **manually coded terminal component**. This creates several problems:

1. **Scalability**: Adding a new adapter requires writing a new React component from scratch
2. **Duplication**: Each terminal reimplements the same patterns (inputs, selects, validation)
3. **Maintenance**: Changing UI patterns requires updating 10+ terminal files
4. **Inconsistency**: Each terminal may have slightly different UX
5. **Disconnect**: Core payload schemas and Front UI are not synchronized

### Current State

**Core Side:**
- ✅ Payload contracts defined in `LEY_CANONICA_FLUJOS.md`
- ✅ `CoreOrchestrator` renders `inputMapping` against `flowContext`
- ❌ No UI metadata exposed (labels, types, validations)

**Front Side:**
- ✅ Blueprints exist in `Discovery.js` with type metadata (`t: 'text'`, `t: 'select'`)
- ❌ Each terminal is manually coded (NotionTerminal.jsx, GmailTerminal.jsx, etc.)
- ❌ No auto-rendering engine

---

## Decision

Implement a **Schema-Driven Auto-Rendering System** with three components:

### 1. Core Manifest Extension
Extend `Core_Manifest.sys.json` with full field schemas including:
- Type information (`string`, `number`, `select`, `object`, etc.)
- Validation rules (min/max, regex patterns, required)
- UI hints (multiline, placeholder, description)
- Conditional rendering (show field B only if field A = X)

### 2. Universal AutoTerminal Component
Create `AutoTerminal.jsx` that:
- Reads blueprint from `Discovery.js`
- Renders fields dynamically based on schema
- Handles all input types (text, select, number, date, json, etc.)
- Manages state and validation automatically

### 3. Type → Component Mapping
Create `FieldRenderer.jsx` that maps field types to React components:
```
'text' → <input type="text" />
'select' → <select />
'number' → <input type="number" />
'date' → <input type="date" />
'json' → <textarea /> (with JSON validation)
```

---

## Consequences

### Positive
- ✅ **Single Source of Truth**: Modify schema → UI updates automatically
- ✅ **Scalability**: Add new adapters without writing UI code
- ✅ **Consistency**: All terminals follow the same UX patterns
- ✅ **Maintainability**: Change one file instead of 10+ terminals
- ✅ **Type Safety**: Core schemas validate Front inputs
- ✅ **CSS Centralization**: All styles in `auto_terminal.css`, zero CSS in components

### Negative
- ⚠️ **Migration Effort**: Existing terminals must be deprecated gradually
- ⚠️ **Learning Curve**: Developers must understand schema structure
- ⚠️ **Flexibility Loss**: Highly custom UIs may be harder to implement

### Mitigations
- **Parallel Existence**: AutoTerminal coexists with manual terminals during migration
- **Escape Hatch**: Allow custom terminals for special cases (e.g., RendererCanvas)
- **Documentation**: Comprehensive schema documentation and examples

---

## Alternatives Considered

### Option 1: Keep Manual Terminals
**Rejected**: Technical debt will eventually paralyze development.

### Option 2: Form Builder Library (React Hook Form, Formik)
**Rejected**: Too generic, doesn't integrate with our blueprint system.

### Option 3: Code Generation (Generate terminals from schemas)
**Rejected**: Adds build complexity, runtime rendering is simpler.

---

## Implementation Details

### Schema Example
```json
{
  "adapters": {
    "notion": {
      "methods": {
        "createPage": {
          "schema": {
            "databaseId": {
              "type": "string",
              "label": "Database ID",
              "required": true,
              "placeholder": "{{dbNivel1.id}}",
              "validation": { "pattern": "^[a-f0-9-]{36}$" }
            },
            "title": {
              "type": "string",
              "label": "Page Title",
              "required": true,
              "maxLength": 200
            }
          }
        }
      }
    }
  }
}
```

### AutoTerminal Usage
```jsx
// Before (manual terminal)
<NotionTerminal nodeId="notion_123" />

// After (auto-rendered)
<AutoTerminal nodeId="notion_123" />
```

### CSS Architecture
All styles centralized in `auto_terminal.css`:
- `.auto-terminal` - Container
- `.field-container` - Field wrapper
- `.field-input` - Input styles
- `.field-select` - Select styles
- **Zero inline styles or CSS-in-JS**

---

## Migration Path

### Phase 1: Foundation (Week 1)
- [ ] Extend Core_Manifest with schemas
- [ ] Create AutoTerminal.jsx
- [ ] Create FieldRenderer.jsx
- [ ] Create auto_terminal.css

### Phase 2: Pilot (Week 2)
- [ ] Migrate Notion adapter to AutoTerminal
- [ ] Test and gather feedback
- [ ] Refine schema structure

### Phase 3: Full Migration (Week 3-4)
- [ ] Migrate all adapters to AutoTerminal
- [ ] Deprecate manual terminals
- [ ] Update documentation

### Phase 4: Cleanup (Week 5)
- [ ] Remove manual terminal files
- [ ] Update contracts and ADRs

---

## Related

- [Implementation Plan](../../.gemini/antigravity/brain/b400647c-24d5-4c6f-8f1b-bb156c7ee074/auto_rendering_implementation_plan.md)
- [Discovery.contract.md](../Doc_nivel_2/core-bridge/Discovery.contract.md)
- [04_system_structure.md](../Doc_nivel_1/04_system_structure.md)
- [LEY_CANONICA_FLUJOS.md](../../OrbitalCore_Codex_v1/_documentation/Doc_nivel_1/LEY_CANONICA_FLUJOS.md)
