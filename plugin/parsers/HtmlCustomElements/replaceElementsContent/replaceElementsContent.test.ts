import { findTag } from '../../../util/parse5';
import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import {
  appendChild,
  createDocumentFragment,
  createElement,
  findElement,
  getChildNodes,
} from '@web/parse5-utils';
import { parseFragment } from 'parse5';
import { describe, expect, it } from 'vitest';

import { replaceElementsContent } from './replaceElementsContent';

describe('replaceElementsContent', () => {
  it('Replaces custom element content', async () => {
    const xTagContent = `<div class="x-tag">My tag</div>`;
    const replacers = [
      {
        path: '',
        tagName: 'x-tag',
        parsed: {
          styleTags: [],
          scriptTags: [],
          content: parseFragment(xTagContent),
        },
      },
    ] as unknown as RequiredElement[];

    const frag = createDocumentFragment();
    const el = createElement('x-tag');
    appendChild(frag, el);

    replaceElementsContent(replacers, frag);
    expect(getChildNodes(el).length).toBe(1);
  });

  it('Replaces nesed custom element content', async () => {
    const xTagContent = `<div class="x-tag"><x-tag-2></x-tag-2></div>`;
    const xTag2Content = `<div class="x-tag-2">My second tag</div>`;
    const replacers = [
      {
        path: '',
        tagName: 'x-tag',
        parsed: {
          styleTags: [],
          scriptTags: [],
          content: parseFragment(xTagContent),
        },
      },
      {
        path: '',
        tagName: 'x-tag-2',
        parsed: {
          styleTags: [],
          scriptTags: [],
          content: parseFragment(xTag2Content),
        },
      },
    ] as unknown as RequiredElement[];

    const frag = createDocumentFragment();
    const el = createElement('x-tag');

    appendChild(frag, el);

    replaceElementsContent(replacers, frag);
    expect(getChildNodes(el).length).toBe(1);

    expect(findElement(frag, findTag('x-tag-2'))).not.toBeFalsy();
  });
});
