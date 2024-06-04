import { createElement, getAttribute } from '@web/parse5-utils';
import { Package } from 'custom-elements-manifest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { generateHydrationScripts } from './generateHydrationScripts';

describe('generateHydrationScript', () => {
  it('Creates script tags for hydrated elements from manifest', async () => {
    const hydrate = await generateHydrationScripts(
      path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures'),
      [createElement('some-el', { hydrate: '' })],
    );

    expect(getAttribute(hydrate[0], 'src')).toBe('/some-el.ts');
  });

  it("Doesn't create scripts for elements not marked to hydrate", async () => {
    const hydrate = await generateHydrationScripts(
      path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures'),
      [createElement('some-el')],
    );

    expect(hydrate.length).toBe(0);
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function demoManifeist(): Package {
  return {
    schemaVersion: '1.0.0',
    readme: '',
    modules: [
      {
        kind: 'javascript-module',
        path: path.join(process.cwd(), 'some-el.ts'),
        declarations: [
          {
            kind: 'class',
            description: '',
            name: 'SomeEl',
            tagName: 'some-el',
            customElement: true,
          },
        ],
        exports: [
          {
            kind: 'js',
            name: 'SomeEl',
            declaration: {
              name: 'SomeEl',
              module: path.join(process.cwd(), 'some-el.ts'),
            },
          },
        ],
      },
    ],
  };
}
