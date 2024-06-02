import { fixtureDir } from '../test-helpers';
import { createElement } from '@web/parse5-utils';
import { describe, expect, it } from 'vitest';
import { i } from 'vitest/dist/reporters-yx5ZTtEV.js';

import { parseRequiredHtmlElements } from './parseRequiredHtmlElements';

describe('parseRequiredHtmlElements', () => {
  it('Parses provided elements', async () => {
    const customElements = [createElement('my-element')];
    const sourceFiles = [fixtureDir('my-element.html')];

    const parsed = await parseRequiredHtmlElements(customElements, sourceFiles);

    expect(parsed[0].tagName).toBe('my-element');
  });

  it('Parses nested elements', async () => {
    const customElements = [createElement('my-element')];
    const sourceFiles = ['my-element.html', 'element-with-nested.html'].map(
      fixtureDir,
    );

    const parsed = await parseRequiredHtmlElements(customElements, sourceFiles);
    console.log(parsed);
    expect(parsed.length).toBe(2);
  });
});
