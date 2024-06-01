import {
  appendChild,
  createDocumentFragment,
  createElement,
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
  it('Extracts <style> content', async () => {
    const frag = createDocumentFragment();
    appendChild(frag, createStyle());
    appendChild(frag, createStyle());
    const parsed = await parseHtmlElement(frag);
    expect(parsed?.styleTags.length).toBe(2);
  });
  it('Extracts <script> content', () => {});
  it('Transform <style> content', () => {});
  it('Transforms <script> sources', () => {});
  it('Transforms <script> imports', () => {});
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
