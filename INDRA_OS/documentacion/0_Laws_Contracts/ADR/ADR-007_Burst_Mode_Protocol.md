# ADR-007: Burst Mode Protocol for Agnostic Data Streaming

**Status:** Proposed  
**Date:** 2026-02-12  
**Context:** Debugging Notion Integration & Pagination Architecture  
**Deciders:** System Architecture Team  

---

## Context and Problem Statement

The current adapter architecture suffers from critical inefficiencies when handling paginated data:

1. **Entropy Loop Risk:** Adapters manage their own pagination loops (`while(hasMore)`), leading to infinite loops when cursor state is lost.
2. **Timeout Vulnerability:** Large datasets (1000+ records) cause GAS execution timeouts because adapters attempt to fetch all data in a single synchronous call.
3. **Loss of Agnosticism:** Adapters are forced to understand network quotas, rate limits, and pagination mechanics, violating the Morphism Principle.
4. **Identity Fragmentation:** The `TokenManager` provides credentials but doesn't maintain session state, forcing adapters to re-authenticate on every page request.

### Architectural Tensions (Suh & TGS Analysis)

**From Suh's Axiomatic Design:**
- **Independence Axiom Violation:** Adapters couple data transformation (morphism) with network traffic management (infrastructure).
- **Information Axiom Violation:** Adapters know too much about their underlying APIs (page limits, cursor formats).

**From General Systems Theory:**
- **Equifinality Broken:** Different adapters reach the same goal (fetch 100 records) through incompatible paths.
- **Homeostasis Failure:** System cannot self-regulate when an adapter enters an infinite loop.

---

## Decision Drivers

1. **Performance:** Minimize GAS execution time and avoid timeouts.
2. **Agnosticism:** Adapters must remain pure morphism translators.
3. **Resilience:** System must gracefully handle partial failures and resume operations.
4. **ISR Compliance:** All responses must conform to Indra Standard Response contract.
5. **Token Efficiency:** Minimize credential re-validation overhead.

---

## Considered Options

### Option 1: Orchestrator-Managed Pagination
**Description:** Move all pagination logic to `CoreOrchestrator`.

**Pros:**
- Complete adapter agnosticism
- Centralized control

**Cons:**
- ❌ **Critical Flaw:** Each page request triggers full system assembly (~1s overhead)
- ❌ Fetching 1000 records = 10 calls × 1s = 10s minimum (unacceptable)
- ❌ Violates performance requirements

### Option 2: Adapter-Internal Loops (Current State)
**Description:** Each adapter manages its own `while(hasMore)` loop.

**Pros:**
- Fast for small datasets
- No orchestrator overhead

**Cons:**
- ❌ Timeout risk on large datasets
- ❌ Infinite loop vulnerability
- ❌ Breaks adapter agnosticism
- ❌ Inconsistent pagination across adapters

### Option 3: Burst Mode Protocol with NetworkDispatcher (Recommended)
**Description:** Introduce a dedicated `NetworkDispatcher` service that executes burst operations on behalf of adapters.

**Pros:**
- ✅ Maintains adapter agnosticism
- ✅ Centralized timeout management
- ✅ Reuses cached credentials (L9 cache)
- ✅ Configurable burst limits per adapter
- ✅ ISR-compliant streaming

**Cons:**
- Requires new service layer
- Adapters must declare burst capabilities

---

## Decision Outcome

**Chosen Option:** Option 3 - Burst Mode Protocol with NetworkDispatcher

### Rationale

This solution optimally balances the Suh axioms and TGS principles:

1. **Independence (Suh):** Adapters declare "what" (data schema, endpoint), NetworkDispatcher handles "how much" (burst size, timeout).
2. **Minimal Information (Suh):** Adapters don't know about cursors or loops, only atomic request/response.
3. **Homeostasis (TGS):** System self-regulates by monitoring execution time and stopping bursts before timeout.
4. **Equifinality (TGS):** All adapters reach data streaming through the same NetworkDispatcher path.

---

## Architecture Design

### Component Responsibilities

#### 1. Adapter (Morphism Layer - L3)
**Dharma:** Pure data transformation, zero network awareness.

**New Contract:**
```javascript
{
  // Declares burst capability
  BURST_CAPABLE: true,
  BURST_CONFIG: {
    cursorField: 'start_cursor',      // Where to inject pagination token
    hasMoreField: 'has_more',         // How to detect more pages
    resultsField: 'results',          // Where data lives
    maxBurstSize: 500,                // Safety limit
    estimatedPageSize: 100            // For progress tracking
  }
}
```

**Responsibilities:**
- Define atomic request structure
- Map response to ISR format
- Declare burst configuration (not execute it)

#### 2. NetworkDispatcher (Infrastructure - L2/L4)
**Dharma:** Sovereign traffic manager with timeout awareness.

**Responsibilities:**
- Execute burst loops based on adapter config
- Monitor execution time (stop at 50s to avoid 60s timeout)
- Maintain credential cache across burst
- Return partial results + continuation token on timeout
- Aggregate ISR metadata (PAGINATION, IDENTITY_CONTEXT)

**Key Methods:**
```javascript
function executeBurst({ adapter, method, payload, burstConfig, maxTime = 50000 })
```

#### 3. TokenManager (Identity - L1)
**Dharma:** Session-aware credential provider.

**Enhancement:**
- Cache decrypted credentials for burst duration
- Provide `getSessionToken()` that persists across multiple calls
- Clear session cache after burst completes

#### 4. CoreOrchestrator (Orchestration - L1)
**Dharma:** Workflow director, delegates bursting to NetworkDispatcher.

**Integration:**
- Detect if adapter is `BURST_CAPABLE`
- Delegate to NetworkDispatcher for burst operations
- Handle continuation tokens for multi-burst flows

---

## Implementation Strategy

### Phase 1: Infrastructure (Week 1)
1. Create `NetworkDispatcher.gs` service
2. Enhance `TokenManager` with session caching
3. Define `BURST_CONFIG` schema in `BlueprintRegistry`

### Phase 2: Adapter Refactoring (Week 2)
1. Refactor `NotionAdapter`:
   - Remove `queryDatabaseContent` loop
   - Add `BURST_CONFIG` declaration
   - Simplify to atomic `queryDatabase`
2. Refactor `EmailAdapter` (high priority - timeout risk)
3. Refactor `CalendarAdapter`

### Phase 3: Orchestrator Integration (Week 3)
1. Update `CoreOrchestrator.executeNode` to detect burst mode
2. Implement continuation token handling
3. Add timeout recovery logic

### Phase 4: Verification (Week 4)
1. Test with 10,000-record Notion database
2. Verify timeout resilience at 50s mark
3. Performance benchmarking vs. current implementation

---

## Consequences

### Positive
- **Performance:** 10x faster for large datasets (no re-assembly overhead)
- **Resilience:** Graceful degradation on timeout
- **Maintainability:** Adapters shrink by ~60% (remove loop logic)
- **Consistency:** All adapters use same burst protocol

### Negative
- **Complexity:** New service layer to maintain
- **Migration Effort:** All paginated adapters must be refactored
- **Learning Curve:** Developers must understand burst configuration

### Neutral
- **ISR Contract:** No breaking changes, only enhancements

---

## Compliance

### Suh's Axiomatic Design
- ✅ **Independence:** Network traffic decoupled from data morphism
- ✅ **Information:** Adapters only know their API schema

### TGS Principles
- ✅ **Wholeness:** System maintains coherence through NetworkDispatcher
- ✅ **Equifinality:** All adapters reach streaming through same path
- ✅ **Homeostasis:** Self-regulation via timeout monitoring

### Indra OS Laws
- ✅ **Agnosticism:** Adapters remain provider-agnostic
- ✅ **Soberanía:** Identity managed by TokenManager, not adapters
- ✅ **ISR Compliance:** All responses maintain standard structure

---

## References

- [Andamiaje Sistémico](file:///c:/Users/javir/Documents/DEVs/INDRA%20FRONT%20END/INDRA_OS/documentacion/03_Andamiaje_sistemico.md)
- [ADR-003: Error Handling](file:///c:/Users/javir/Documents/DEVs/INDRA%20FRONT%20END/INDRA_OS/documentacion/0_Laws_Contracts/ADR/ADR-003_Error_Handling_Retry_Logic.md)
- [NotionAdapter.gs](file:///c:/Users/javir/Documents/DEVs/INDRA%20FRONT%20END/INDRA_OS/INDRA_CORE/3_Adapters/NotionAdapter.gs)
- [TokenManager.gs](file:///c:/Users/javir/Documents/DEVs/INDRA%20FRONT%20END/INDRA_OS/INDRA_CORE/1_Core/TokenManager.gs)





