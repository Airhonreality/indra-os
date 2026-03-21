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

(async () => {
  const { coreUrl, password } = parseEndpointAndPassword();
  const ts = Date.now();
  const schemaLabel = `E2E_ALIAS_MASSIVE_${ts}`;
  const N = Number(process.env.INDRA_E2E_MASSIVE_FIELDS || 12);

  let schemaId = null;
  try {
    console.log('STEP 1: CREATE schema temporal massive');
    const fields = Array.from({ length: N }).map((_, i) => ({
      id: `f_${i + 1}`,
      type: 'TEXT',
      label: `Campo ${i + 1}`,
      alias: `campo_${i + 1}`,
      config: {}
    }));

    const createRes = await send(coreUrl, password, {
      provider: 'system',
      protocol: 'ATOM_CREATE',
      data: {
        class: 'DATA_SCHEMA',
        handle: { label: schemaLabel },
        payload: { fields }
      }
    });

    const created = createRes?.items?.[0];
    if (!created?.id) fail('CREATE_SCHEMA_FAILED', createRes);
    schemaId = created.id;

    console.log('STEP 2: MASSIVE rename fields (dry_run + commit)');
    for (let i = 1; i <= N; i += 1) {
      const oldAlias = `campo_${i}`;
      const newAlias = `${oldAlias}_r`;

      const dry = await send(coreUrl, password, {
        provider: 'system',
        protocol: 'SCHEMA_FIELD_ALIAS_RENAME',
        context_id: schemaId,
        data: { field_id: `f_${i}`, old_alias: oldAlias, new_alias: newAlias, dry_run: true }
      });
      if (dry?.metadata?.status !== 'DRY_RUN') fail('FIELD_DRY_RUN_NOT_DRY', { index: i, meta: dry?.metadata });

      const commit = await send(coreUrl, password, {
        provider: 'system',
        protocol: 'SCHEMA_FIELD_ALIAS_RENAME',
        context_id: schemaId,
        data: { field_id: `f_${i}`, old_alias: oldAlias, new_alias: newAlias, dry_run: false }
      });
      if (!['OK', 'NOOP'].includes(commit?.metadata?.status)) fail('FIELD_COMMIT_FAILED', { index: i, meta: commit?.metadata });
    }

    console.log('STEP 3: VERIFY all aliases updated');
    const readRes = await send(coreUrl, password, {
      provider: 'system',
      protocol: 'ATOM_READ',
      context_id: schemaId
    });

    const schema = readRes?.items?.[0];
    const gotFields = schema?.payload?.fields || [];
    const bad = [];

    for (let i = 1; i <= N; i += 1) {
      const f = gotFields.find(x => x.id === `f_${i}`);
      const expected = `campo_${i}_r`;
      if (!f || f.alias !== expected) bad.push({ id: `f_${i}`, got: f?.alias, expected });
    }

    if (bad.length) fail('MASSIVE_VERIFY_FAILED', bad);

    console.log('E2E_ALIAS_RENAME_MASSIVE_OK');
    console.log(JSON.stringify({ schema_id: schemaId, renamed_fields: N }, null, 2));
  } catch (err) {
    console.error('E2E_ALIAS_RENAME_MASSIVE_FAILED');
    console.error(err.message);
    if (err.extra) console.error(JSON.stringify(err.extra, null, 2));
    process.exitCode = 1;
  } finally {
    if (schemaId) {
      try {
        console.log('STEP 4: CLEANUP temporal schema');
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
