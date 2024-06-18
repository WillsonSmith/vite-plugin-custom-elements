import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { generateProjectManifest } from './generateProjectManifest.js';

const expectedManifest = {
  elements: [
    {
      fileName: 'x-clock.html',
      tagName: 'x-clock',
      type: 'html',
    },
    {
      fileName: 'x-clock.ts',
      tagName: 'x-clock',
      type: 'ts',
    },
    {
      fileName: 'x-paragraph/x-paragraph.html',
      tagName: 'x-paragraph',
      type: 'html',
    },
  ],
};

const fixtureDir = fileURLToPath(
  path.join(path.dirname(import.meta.url), 'fixtures'),
);

describe('generateProjectManifest', () => {
  it('Generates a manifest from a directory', async () => {
    const manifest = await generateProjectManifest([fixtureDir]);
    const actualElements = manifest.elements;
    for (const el of expectedManifest.elements) {
      const tagName = el.tagName;
      expect(
        actualElements.find((e) => {
          return e.tagName === tagName;
        }),
      ).toBeTruthy();
    }
  });
});
