import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { generateManifest } from './generateManifest';

describe('generateManifest', () => {
  it('Generates a manifest from a directory', async () => {
    const dir = fileURLToPath(join(dirname(import.meta.url), 'test'));

    const manifest = await generateManifest(dir);

    const files = manifest.modules.map((mod) => basename(mod.path));
    expect(files).toStrictEqual([
      'someModule.ts',
      'jsdoc-marked.ts',
      'defined-element-one.ts',
    ]);
  });
});
