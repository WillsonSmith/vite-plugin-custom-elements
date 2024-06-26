import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { findHtmlElementFiles } from './findHtmlElementFiles.js';

const fixtureDir = fileURLToPath(
  join(dirname(import.meta.url), '..', 'fixtures'),
);
describe('findHtmlElementFiles', () => {
  it('Finds all HTML-based Elements in a directory', async () => {
    const htmlElements = await findHtmlElementFiles(fixtureDir);
    expect(htmlElements.map(normalize)).toStrictEqual([
      '/shady-element-styles.html',
      '/shady-element-scripts.html',
      '/shady-element-scripts-external.html',
      '/shady-element-links.html',
      '/my-element.html',
      '/element-with-nested.html',
    ]);
  });
});

function normalize(path: string): string {
  return path.split(fixtureDir).join('');
}
