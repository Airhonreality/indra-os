import fs from 'node:fs';
import path from 'node:path';

function fail(message, extra = null) {
  const err = new Error(message);
  if (extra) err.extra = extra;
  throw err;
}

function parseEndpointAndPassword() {
  const smokePath = path.resolve(process.cwd(), 'public', 'smoke_tests.json');
  const raw = fs.readFileSync(smokePath, 'utf8');

  const urlMatch = raw.match(/fetch\('([^']+)'/);
  const passwordMatch = raw.match(/password:\s*'([^']+)'/);

  const coreUrl = process.env.INDRA_CORE_URL || (urlMatch ? urlMatch[1] : null);
  const password = process.env.INDRA_CORE_PASSWORD || (passwordMatch ? passwordMatch[1] : null);

  if (!coreUrl) fail('CORE_URL_NOT_FOUND');
  if (!password) fail('CORE_PASSWORD_NOT_FOUND');

  return { coreUrl, password };
}

async function send(coreUrl, password, uqo) {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await fetch(coreUrl, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...uqo, password })
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      fail('INVALID_JSON_RESPONSE', { status: res.status, text: text.slice(0, 400) });
    }

    if (!res.ok) fail(`HTTP_${res.status}`, json);

    const isLockTimeout = json?.metadata?.status === 'CONFLICT' && json?.metadata?.error === 'LOCK_TIMEOUT';
    if (isLockTimeout && attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 300 * attempt));
      continue;
    }

    return json;
  }

  fail('REQUEST_RETRY_EXHAUSTED');
}

function pickField(schema, fieldId) {
  const fields = schema?.payload?.fields || [];
  return fields.find(f => f.id === fieldId);
}

(async () => {
  const { coreUrl, password } = parseEndpointAndPassword();
  const ts = Date.now();
  const schemaLabel = `E2E_ALIAS_SCHEMA_${ts}`;
  const schemaAliasTarget = `e2e_alias_schema_${ts}_renamed`;
  const fieldFrom = 'nombre';
  const fieldTo = `nombre_${String(ts).slice(-5)}`;

  let schemaId = null;

  try {
    console.log('STEP 1: CREATE schema temporal');
    const createRes = await send(coreUrl, password, {
      provider: 'system',
      protocol: 'ATOM_CREATE',
      data: {
        class: 'DATA_SCHEMA',
        handle: { label: schemaLabel },
        payload: {
          fields: [
            { id: 'f_nombre', type: 'TEXT', label: 'Nombre', alias: fieldFrom, config: {} },
            { id: 'f_total', type: 'NUMBER', label: 'Total', alias: 'total', config: {} }
          ]
        }
      }
    });

    const created = createRes?.items?.[0];
    if (!created?.id) fail('CREATE_SCHEMA_FAILED', createRes);
    schemaId = created.id;

    console.log('STEP 2: DRY_RUN field alias rename');
    const dryField = await send(coreUrl, password, {
      provider: 'system',
      protocol: 'SCHEMA_FIELD_ALIAS_RENAME',
      context_id: schemaId,
      data: { field_id: 'f_nombre', old_alias: fieldFrom, new_alias: fieldTo, dry_run: true }
    });

    if (dryField?.metadata?.status !== 'DRY_RUN') fail('FIELD_DRY_RUN_NOT_DRY', dryField?.metadata);

    console.log('STEP 3: COMMIT field alias rename');
    const commitField = await send(coreUrl, password, {
      provider: 'system',
      protocol: 'SCHEMA_FIELD_ALIAS_RENAME',
      context_id: schemaId,
      data: { field_id: 'f_nombre', old_alias: fieldFrom, new_alias: fieldTo, dry_run: false }
    });

    if (!['OK', 'NOOP'].includes(commitField?.metadata?.status)) fail('FIELD_COMMIT_FAILED', commitField?.metadata);

    console.log('STEP 4: VERIFY field alias updated');
    const readAfterField = await send(coreUrl, password, {
      provider: 'system',
      protocol: 'ATOM_READ',
      context_id: schemaId
    });

    const schemaAfterField = readAfterField?.items?.[0];
    const field = pickField(schemaAfterField, 'f_nombre');
    if (!field || field.alias !== fieldTo) fail('FIELD_ALIAS_NOT_UPDATED', { got: field?.alias, expected: fieldTo });

    console.log('STEP 5: DRY_RUN atom alias rename');
    const oldSchemaAlias = schemaAfterField?.handle?.alias;
    const dryAtom = await send(coreUrl, password, {
      provider: 'system',
      protocol: 'ATOM_ALIAS_RENAME',
      context_id: schemaId,
      data: { old_alias: oldSchemaAlias, new_alias: schemaAliasTarget, new_label: schemaLabel, dry_run: true }
    });

    if (dryAtom?.metadata?.status !== 'DRY_RUN') fail('ATOM_DRY_RUN_NOT_DRY', dryAtom?.metadata);

    console.log('STEP 6: COMMIT atom alias rename');
    const commitAtom = await send(coreUrl, password, {
      provider: 'system',
      protocol: 'ATOM_ALIAS_RENAME',
      context_id: schemaId,
      data: { old_alias: oldSchemaAlias, new_alias: schemaAliasTarget, new_label: schemaLabel, dry_run: false }
    });

    if (!['OK', 'NOOP'].includes(commitAtom?.metadata?.status)) fail('ATOM_COMMIT_FAILED', commitAtom?.metadata);

    console.log('STEP 7: VERIFY atom alias updated');
    const readAfterAtom = await send(coreUrl, password, {
      provider: 'system',
      protocol: 'ATOM_READ',
      context_id: schemaId
    });

    const schemaAfterAtom = readAfterAtom?.items?.[0];
    if (schemaAfterAtom?.handle?.alias !== schemaAliasTarget) {
      fail('ATOM_ALIAS_NOT_UPDATED', { got: schemaAfterAtom?.handle?.alias, expected: schemaAliasTarget });
    }

    console.log('STEP 8: COLLISION_SCAN for existing atom alias (should report blocker hit)');
    const scan = await send(coreUrl, password, {
      provider: 'system',
      protocol: 'ALIAS_COLLISION_SCAN',
      data: { target: 'ATOM_ALIAS', alias: schemaAliasTarget, atom_id: 'NON_MATCHING_EXCLUSION' }
    });

    if (scan?.metadata?.status !== 'OK') fail('COLLISION_SCAN_FAILED', scan?.metadata);
    const collisions = scan?.metadata?.collisions || [];
    if (!Array.isArray(collisions) || collisions.length < 1) fail('COLLISION_SCAN_EMPTY_UNEXPECTED', scan?.metadata);

    console.log('E2E_ALIAS_RENAME_OK');
    console.log(JSON.stringify({
      schema_id: schemaId,
      old_field_alias: fieldFrom,
      new_field_alias: fieldTo,
      new_schema_alias: schemaAliasTarget,
      collision_hits: collisions.length
    }, null, 2));

  } catch (err) {
    console.error('E2E_ALIAS_RENAME_FAILED');
    console.error(err.message);
    if (err.extra) console.error(JSON.stringify(err.extra, null, 2));
    process.exitCode = 1;
  } finally {
    if (schemaId) {
      try {
        console.log('STEP 9: CLEANUP temporal schema');
        await send(coreUrl, password, {
          provider: 'system',
          protocol: 'ATOM_DELETE',
          context_id: schemaId
        });
      } catch (cleanupErr) {
        console.error('CLEANUP_FAILED', cleanupErr.message);
      }
    }
  }
})();
