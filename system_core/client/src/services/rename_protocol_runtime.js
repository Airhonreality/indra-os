/**
 * =============================================================================
 * ARTEFACTO: services/rename_protocol_runtime.js
 * RESPONSABILIDAD: Runtime canónico de renombramiento con gate DRY_RUN.
 *
 * AXIOMA:
 *  - Un solo flujo para cualquier instancia de rename (schema, bridge, document, etc).
 *  - Sin fallback local: si falla protocolo, no se persiste materia no canónica.
 * =============================================================================
 */

function _buildRenameError(result, fallbackCode) {
    const code = result?.metadata?.error || result?.metadata?.code || fallbackCode || 'RENAME_FAILED';
    const err = new Error(code);
    err.code = code;
    err.metadata = result?.metadata || {};
    return err;
}

function _require(value, code) {
    if (!value) {
        const err = new Error(code || 'INVALID_INPUT');
        err.code = code || 'INVALID_INPUT';
        throw err;
    }
}

export async function prepareCanonicalRename({
    bridge,
    provider = 'system',
    protocol,
    contextId,
    data,
    kind,
}) {
    _require(bridge, 'BRIDGE_REQUIRED');
    _require(protocol, 'RENAME_PROTOCOL_REQUIRED');
    _require(contextId, 'RENAME_CONTEXT_REQUIRED');
    _require(data && data.new_alias, 'RENAME_NEW_ALIAS_REQUIRED');

    const dryRunResult = await bridge.request({
        provider,
        protocol,
        context_id: contextId,
        data: { ...(data || {}), dry_run: true }
    });

    const status = dryRunResult?.metadata?.status;

    if (status === 'DRY_RUN') {
        return {
            status: 'PENDING',
            pendingRename: {
                kind,
                provider,
                protocol,
                context_id: contextId,
                data: { ...(data || {}) },
                preview: dryRunResult.metadata,
            }
        };
    }

    if (status === 'NOOP' && dryRunResult?.items?.[0]) {
        return {
            status: 'NOOP',
            result: dryRunResult,
        };
    }

    throw _buildRenameError(dryRunResult, 'DRY_RUN_FAILED');
}

export async function commitCanonicalRename({ bridge, pendingRename }) {
    _require(bridge, 'BRIDGE_REQUIRED');
    if (!pendingRename) throw new Error('PENDING_RENAME_REQUIRED');
    if (pendingRename?.preview?.has_blockers) {
        const err = new Error('RENAME_BLOCKED_BY_COLLISION');
        err.code = 'RENAME_BLOCKED_BY_COLLISION';
        err.metadata = pendingRename?.preview || {};
        throw err;
    }

    const commitResult = await bridge.request({
        provider: pendingRename.provider || 'system',
        protocol: pendingRename.protocol,
        context_id: pendingRename.context_id,
        data: { ...(pendingRename.data || {}), dry_run: false }
    });

    const status = commitResult?.metadata?.status;
    if ((status === 'OK' || status === 'NOOP') && commitResult?.items?.[0]) {
        return commitResult;
    }

    throw _buildRenameError(commitResult, 'RENAME_COMMIT_FAILED');
}
