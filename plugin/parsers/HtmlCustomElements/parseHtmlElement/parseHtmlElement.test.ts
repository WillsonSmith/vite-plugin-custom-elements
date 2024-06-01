import {
  appendChild,
  createDocumentFragment,
  createElement,
  createScript,
} from '@web/parse5-utils';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFragment, serialize } from 'parse5';
import { describe, expect, it } from 'vitest';

import { parseHtmlElement } from './parseHtmlElement';

const fixtureDir = fileURLToPath(
  join(dirname(import.meta.url), '..', 'fixtures'),
);

describe('parseHtmlElement', () => {
  it('Parses element content', async () => {});

  it('Extracts <style> tags', async () => {
    const fragment = createDocumentFragment();
    appendChild(fragment, createStyle());
    appendChild(fragment, createStyle());

    expect((await parseHtmlElement(fragment)).styleTags.length).toBe(2);
  });

  it('Does not extract <style> tags when in shadowroot', async () => {
    const fixture = await readFile(
      join(fixtureDir, 'shady-element-styles.html'),
      'utf8',
    );
    const fragment = parseFragment(fixture);

    expect((await parseHtmlElement(fragment)).styleTags.length).toBe(0);
  });

  it('Extracts <script> tags', async () => {
    const fragment = createDocumentFragment();
    appendChild(fragment, createScript());
    appendChild(fragment, createScript());

    expect((await parseHtmlElement(fragment)).scriptTags.length).toBe(2);
  });

  it('Does not extract <script> tags when in shadowroot', async () => {
    const fixture = await readFile(
      join(fixtureDir, 'shady-element-scripts.html'),
      'utf8',
    );
    const fragment = parseFragment(fixture);

    expect((await parseHtmlElement(fragment)).scriptTags.length).toBe(0);
  });
});

function normalize(path: string): string {
  return path.split(fixtureDir).join('');
}

function createStyle(text?: string) {
  const style = createElement('style');
  style.childNodes = [
    {
      nodeName: '#text',
      value: text || 'h1 { margin: 0 }',
      parentNode: null,
      attrs: [],
      __location: undefined,
    },
  ];
  return style;
}
