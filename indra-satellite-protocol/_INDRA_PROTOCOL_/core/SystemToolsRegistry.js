/**
 * =============================================================================
 * INDRA SYSTEM TOOLS REGISTRY (Arsenal Universal v1.1)
 * =============================================================================
 */

import sys_genesis_express from './system_workflows/sys_genesis_express.js';
import sys_resonance_heal from './system_workflows/sys_resonance_heal.js';
import sys_data_export from './system_workflows/sys_data_export.js';
import sys_atom_inspector from './system_workflows/sys_atom_inspector.js';
import sys_lexicon_sync from './system_workflows/sys_lexicon_sync.js';
import sys_contract_compliance from './system_workflows/sys_contract_compliance.js';

export const SYSTEM_TOOLS = [
    sys_genesis_express,
    sys_resonance_heal,
    sys_data_export,
    sys_atom_inspector,
    sys_lexicon_sync,
    sys_contract_compliance
];
