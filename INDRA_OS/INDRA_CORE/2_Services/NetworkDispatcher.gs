/**
 * 🌐 NetworkDispatcher.gs (Capa 2 - Services)
 * Version: 1.0.0
 * Dharma: Sovereign traffic manager with timeout awareness and burst execution.
 *         Executes paginated operations on behalf of adapters while maintaining
 *         their agnosticism and preventing timeout failures.
 * 
 * AXIOMAS:
 * 1. Adapters declare "what", NetworkDispatcher handles "how much"
 * 2. Timeout awareness - stop at 50s to avoid 60s GAS limit
 * 3. Session-aware credential caching
 * 4. ISR-compliant aggregation
 * 5. Continuation token support for resumable operations
 */

/**
 * Factory: Creates a NetworkDispatcher instance
 * @param {object} deps - Dependencies
 * @param {object} deps.errorHandler - Error handler service
 * @param {object} deps.monitoringService - Monitoring service
 * @param {object} deps.tokenManager - Token manager for session caching
 * @returns {object} NetworkDispatcher instance
 */
function createNetworkDispatcher({ errorHandler, monitoringService, tokenManager }) {
  
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('[NetworkDispatcher] errorHandler contract not fulfilled');
  }
  
  const _monitor = monitoringService || { 
    logDebug: () => {}, logInfo: () => {}, logWarn: () => {}, logError: () => {} 
  };
  
  /**
   * Executes a burst operation with timeout awareness and result aggregation.
   * 
   * @param {object} config - Burst configuration
   * @param {object} config.adapter - Adapter instance to execute against
   * @param {string} config.method - Method name to call on adapter
   * @param {object} config.payload - Initial request payload
   * @param {object} config.burstConfig - Adapter's BURST_CONFIG declaration
   * @param {number} config.maxTime - Maximum execution time in ms (default: 50000)
   * @param {number} config.maxRecords - Optional maximum records to fetch
   * @returns {object} Aggregated ISR response with continuation token if needed
   */
  function executeBurst({ 
    adapter, 
    method, 
    payload, 
    burstConfig, 
    maxTime = 50000,
    maxRecords = null 
  }) {
    
    // Validate inputs
    if (!adapter || typeof adapter[method] !== 'function') {
      throw errorHandler.createError(
        'INVALID_INPUT',
        `[NetworkDispatcher] Adapter method '${method}' not found`
      );
    }
    
    if (!burstConfig || !burstConfig.cursorField || !burstConfig.hasMoreField || !burstConfig.resultsField) {
      throw errorHandler.createError(
        'INVALID_INPUT',
        '[NetworkDispatcher] Invalid burstConfig - missing required fields'
      );
    }
    
    const startTime = Date.now();
    const aggregatedResults = [];
    let currentPayload = { ...payload };
    let hasMore = true;
    let pageCount = 0;
    let totalRecords = 0;
    let lastResponse = null;
    let sessionId = null;
    
    _monitor.logInfo(`[NetworkDispatcher] Starting burst operation: ${adapter.id || 'unknown'}.${method}`);
    _monitor.logInfo(`[NetworkDispatcher] Config: maxTime=${maxTime}ms, maxRecords=${maxRecords || 'unlimited'}`);
    
    try {
      // Start credential session for burst duration
      if (tokenManager && typeof tokenManager.startSession === 'function') {
        sessionId = tokenManager.startSession({
          provider: adapter.id,
          accountId: payload.accountId
        });
        _monitor.logDebug(`[NetworkDispatcher] Session started: ${sessionId}`);
      }
      
      // Burst loop
      while (hasMore) {
        const elapsedTime = Date.now() - startTime;
        
        // AXIOMA: Timeout Protection (50s threshold)
        if (elapsedTime >= maxTime) {
          _monitor.logWarn(`[NetworkDispatcher] Timeout threshold reached (${elapsedTime}ms). Stopping burst.`);
          break;
        }
        
        // AXIOMA: Record Limit Protection
        if (maxRecords && totalRecords >= maxRecords) {
          _monitor.logInfo(`[NetworkDispatcher] Record limit reached (${totalRecords}/${maxRecords}). Stopping burst.`);
          break;
        }
        
        // Execute single page request
        _monitor.logDebug(`[NetworkDispatcher] Fetching page ${pageCount + 1}...`);
        const response = adapter[method].call(adapter, currentPayload);
        lastResponse = response;
        pageCount++;
        
        // Extract results from response
        const pageResults = _extractResults(response, burstConfig.resultsField);
        if (pageResults && Array.isArray(pageResults)) {
          aggregatedResults.push(...pageResults);
          totalRecords += pageResults.length;
          _monitor.logDebug(`[NetworkDispatcher] Page ${pageCount}: ${pageResults.length} records (total: ${totalRecords})`);
        }
        
        // Check for more pages
        hasMore = _hasMorePages(response, burstConfig.hasMoreField);
        
        if (hasMore) {
          // Extract next cursor
          const nextCursor = _extractCursor(response, burstConfig);
          if (!nextCursor) {
            _monitor.logWarn('[NetworkDispatcher] hasMore=true but no cursor found. Stopping burst.');
            hasMore = false;
            break;
          }
          
          // Inject cursor into next payload
          currentPayload = { ...currentPayload };
          currentPayload[burstConfig.cursorField] = nextCursor;
        }
      }
      
      // End credential session
      if (sessionId && tokenManager && typeof tokenManager.endSession === 'function') {
        tokenManager.endSession({ sessionId });
        _monitor.logDebug(`[NetworkDispatcher] Session ended: ${sessionId}`);
      }
      
      const totalTime = Date.now() - startTime;
      _monitor.logInfo(`[NetworkDispatcher] Burst complete: ${pageCount} pages, ${totalRecords} records in ${totalTime}ms`);
      
      // Build aggregated ISR response
      return _buildAggregatedResponse({
        results: aggregatedResults,
        lastResponse,
        hasMore,
        burstConfig,
        metadata: {
          pageCount,
          totalRecords,
          executionTime: totalTime,
          stoppedEarly: hasMore // If hasMore is still true, we stopped due to timeout/limit
        }
      });
      
    } catch (error) {
      // Cleanup session on error
      if (sessionId && tokenManager && typeof tokenManager.endSession === 'function') {
        tokenManager.endSession({ sessionId });
      }
      
      _monitor.logError(`[NetworkDispatcher] Burst failed: ${error.message}`);
      throw errorHandler.createError(
        'BURST_EXECUTION_FAILED',
        `Burst operation failed after ${pageCount} pages: ${error.message}`,
        { pageCount, totalRecords, originalError: error }
      );
    }
  }
  
  /**
   * Extracts results array from response based on field path.
   * @private
   */
  function _extractResults(response, resultsField) {
    if (!response) return [];
    
    // Support dot notation for nested fields (e.g., "data.items")
    const parts = resultsField.split('.');
    let current = response;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return [];
      }
    }
    
    return Array.isArray(current) ? current : [];
  }
  
  /**
   * Checks if more pages are available.
   * @private
   */
  function _hasMorePages(response, hasMoreField) {
    if (!response) return false;
    
    // Check in PAGINATION first (ISR standard)
    if (response.PAGINATION && typeof response.PAGINATION.hasMore === 'boolean') {
      return response.PAGINATION.hasMore;
    }
    
    // Fallback to direct field
    const parts = hasMoreField.split('.');
    let current = response;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }
    
    return !!current;
  }
  
  /**
   * Extracts pagination cursor from response.
   * @private
   */
  function _extractCursor(response, burstConfig) {
    if (!response) return null;
    
    // Check in PAGINATION first (ISR standard)
    if (response.PAGINATION && response.PAGINATION.nextToken) {
      return response.PAGINATION.nextToken;
    }
    
    // Fallback to direct field (for non-ISR responses)
    const cursorPath = burstConfig.nextCursorField || burstConfig.cursorField;
    const parts = cursorPath.split('.');
    let current = response;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    
    return current || null;
  }
  
  /**
   * Builds aggregated ISR-compliant response.
   * @private
   */
  function _buildAggregatedResponse({ results, lastResponse, hasMore, burstConfig, metadata }) {
    const response = {
      results: results,
      ORIGIN_SOURCE: lastResponse?.ORIGIN_SOURCE || 'unknown',
      SCHEMA: lastResponse?.SCHEMA || null,
      PAGINATION: {
        hasMore: hasMore,
        nextToken: hasMore ? _extractCursor(lastResponse, burstConfig) : null,
        total: metadata.totalRecords,
        count: metadata.totalRecords,
        pageCount: metadata.pageCount
      },
      IDENTITY_CONTEXT: lastResponse?.IDENTITY_CONTEXT || {},
      BURST_METADATA: {
        executionTime: metadata.executionTime,
        stoppedEarly: metadata.stoppedEarly,
        estimatedCompletion: metadata.stoppedEarly ? 
          Math.round((metadata.totalRecords / metadata.pageCount) * 100) : 100
      }
    };
    
    // Add continuation token if stopped early
    if (hasMore && metadata.stoppedEarly) {
      response.CONTINUATION_TOKEN = {
        cursor: _extractCursor(lastResponse, burstConfig),
        recordsProcessed: metadata.totalRecords,
        pagesProcessed: metadata.pageCount
      };
    }
    
    return response;
  }
  
  /**
   * Verifies connection to the dispatcher service.
   */
  function verifyConnection() {
    return { 
      status: "ACTIVE", 
      capabilities: ["burst_execution", "timeout_protection", "session_caching"] 
    };
  }
  
  // Schemas for contract compliance
  const schemas = {
    executeBurst: {
      description: "Executes a burst operation with timeout awareness and result aggregation.",
      semantic_intent: "STREAM",
      io_interface: {
        inputs: {
          adapter: { type: "object", io_behavior: "GATE", description: "Adapter instance to execute against." },
          method: { type: "string", io_behavior: "GATE", description: "Method name to call on adapter." },
          payload: { type: "object", io_behavior: "STREAM", description: "Initial request payload." },
          burstConfig: { type: "object", io_behavior: "SCHEMA", description: "Adapter's BURST_CONFIG declaration." },
          maxTime: { type: "number", io_behavior: "GATE", description: "Maximum execution time in milliseconds." },
          maxRecords: { type: "number", io_behavior: "GATE", description: "Optional maximum records to fetch." }
        },
        outputs: {
          results: { type: "array", io_behavior: "STREAM", description: "Aggregated results from all pages." },
          PAGINATION: { type: "object", io_behavior: "STREAM", description: "Pagination metadata." },
          CONTINUATION_TOKEN: { type: "object", io_behavior: "STREAM", description: "Token for resuming operation if stopped early." }
        }
      }
    }
  };
  
  return {
    id: "networkDispatcher",
    label: "Network Dispatcher",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    description: "Sovereign traffic manager with timeout awareness and burst execution capabilities.",
    semantic_intent: "STREAM",
    schemas: schemas,
    
    // Public methods
    executeBurst,
    verifyConnection
  };
}

// Export for tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createNetworkDispatcher };
}
