import { generateManifest } from '../generateManifest/generateManifest';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  type DefinedElement,
  getCustomElementsFromManifest,
} from './getCustomElementsFromManifest';

const fixtureDir = fileURLToPath(join(dirname(import.meta.url), 'fixtures'));
const manifest = await generateManifest(fixtureDir);
const ce = getCustomElementsFromManifest(manifest);

describe('getCustomElementsFromManifest', () => {
  it('Finds custom elements with JSDoc tag names', async () => {
    expect(normalizeResult(ce)).toStrictEqual([
      {
        path: '/x-jsdoc-def.ts',
        tagName: 'x-jsdoc-def',
        className: 'XJSDocDef',
      },
      {
        path: '/x-defined.ts',
        tagName: 'x-defined',
        className: 'XDefined',
      },
    ]);
  });

  it('Does not find custom elements without defined tags', () => {
    expect(
      normalizeResult(ce).find((e) => {
        return e.path === '/undefiend-component.ts';
      }),
    ).toBeUndefined();
  });
});

function normalizeResult(ce: DefinedElement[]) {
  return ce.map((e) => {
    const { tagName, className } = e;
    return {
      path: e.path.split(fixtureDir).join(''),
      tagName,
      className,
    };
  });
}
