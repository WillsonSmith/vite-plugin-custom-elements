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

    expect(parseHtmlElement(fragment).styleTags.length).toBe(2);
  });

  it('Does not extract <style> tags when in shadowroot', async () => {
    const fixture = readFile(
      join(fixtureDir, 'shady-element-styles.html'),
      'utf8',
    );
    const fragment = parseFragment(await fixture);

    expect(parseHtmlElement(fragment).styleTags.length).toBe(0);
  });

  it('Extracts <script> tags', async () => {
    const fragment = createDocumentFragment();
    appendChild(fragment, createScript());
    appendChild(fragment, createScript());

    expect(parseHtmlElement(fragment).scriptTags.length).toBe(2);
  });

  it('Does not extract <script> tags when in shadowroot', async () => {
    const fixture = readFile(
      join(fixtureDir, 'shady-element-scripts.html'),
      'utf8',
    );
    const fragment = parseFragment(await fixture);

    expect(parseHtmlElement(fragment).scriptTags.length).toBe(0);
  });
  it('Extract <script> tags when next to shadowroot', async () => {
    const fixture = readFile(
      join(fixtureDir, 'shady-element-scripts-external.html'),
      'utf8',
    );
    const fragment = parseFragment(await fixture);

    const parsed = parseHtmlElement(fragment);
    expect(parsed.scriptTags.length).toBe(1);
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
