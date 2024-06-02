import { fixtureDir } from '../test-helpers';
import { createElement } from '@web/parse5-utils';
import { describe, expect, it } from 'vitest';

import { parseRequiredHtmlElements } from './parseRequiredHtmlElements';
import { map } from '@/utility/arrays';

describe('parseRequiredHtmlElements', () => {
  it('Parses provided elements', async () => {
    const customElements = [createElement('my-element')];
    const sourceFiles = [fixtureDir('my-element.html')];

    const parsed = await parseRequiredHtmlElements(customElements, sourceFiles);

    expect(parsed[0].path).toBe(fixtureDir('my-element.html'));
    expect(parsed[0].tagName).toBe('my-element');
  });

  it('Parses nested elements', async () => {
    const customElements = [createElement('element-with-nested')];
    const sourceFiles = map(
      ['my-element.html', 'element-with-nested.html'],
      fixtureDir,
    );

    const parsed = await parseRequiredHtmlElements(customElements, sourceFiles);
    expect(parsed.length).toBe(2);
  });
});
