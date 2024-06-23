import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { loadAndParseHtmlElements } from './loadAndParseHtmlElements.js';

const fixtureDir = fileURLToPath(
  join(dirname(import.meta.url), '..', 'fixtures'),
);

describe('loadAndParseHtmlElements', () => {
  it('Loads and parses files', async () => {
    const files = [join(fixtureDir, 'my-element.html')];
    const parsed = await loadAndParseHtmlElements(files);

    expect(parsed.length).toBe(1);
    expect(parsed[0]).not.toBeFalsy();
    expect(parsed[0].styleTags).not.toBeFalsy();
    expect(parsed[0].scriptTags).not.toBeFalsy();
    expect(parsed[0].content).not.toBeFalsy();
  });
});
