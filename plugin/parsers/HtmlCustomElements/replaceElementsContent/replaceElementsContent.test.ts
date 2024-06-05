import { findTag } from '../../../util/parse5';
import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import {
  Element,
  appendChild,
  createDocumentFragment,
  createElement,
  findElement,
  findElements,
  getAttribute,
  getChildNodes,
  getParentNode,
  getTemplateContent,
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

    const nestedTag = findElement(frag, findTag('x-tag-2'));
    expect(
      findElement(nestedTag, (el) => {
        return getAttribute(el, 'class') === 'x-tag-2';
      }),
    );
    expect(nestedTag).toBeTruthy();
  });

  it('Fills default slot', () => {
    const ce = parseFragment(`<div><slot></slot></div>`);
    const replacers = [
      {
        path: '',
        tagName: 'x-tag',
        parsed: {
          styleTags: [],
          scriptTags: [],
          content: ce,
        },
      },
    ];

    const fragment = createDocumentFragment();
    const element = createElement('x-tag');
    appendChild(fragment, element);

    replaceElementsContent(replacers, fragment);
    expect(findElement(element, findTag('div'))).toBeDefined();
  });

  it('Fills default slot with multiple children', () => {
    const ce = parseFragment(`<div><slot></slot></div>`);
    const replacers = [
      {
        path: '',
        tagName: 'x-tag',
        parsed: {
          styleTags: [],
          scriptTags: [],
          content: ce,
        },
      },
    ];

    const fragment = createDocumentFragment();
    const element = createElement('x-tag');
    appendChild(fragment, element);
    for (let i = 0; i < 10; i++) {
      appendChild(element, createElement('p'));
    }

    replaceElementsContent(replacers, fragment);

    const divWithSlot = findElement(element, findTag('div'));
    const children = getChildNodes(divWithSlot).filter(
      (child: Element) => child.nodeName === 'p',
    );

    expect(children.length).toBe(10);
  });

  it('Fills named slots', () => {
    const ce = parseFragment(
      `<div><slot></slot></div><div id="test-container"><slot name="test"></slot></div>`,
    );
    const replacers = [
      {
        path: '',
        tagName: 'x-tag',
        parsed: {
          styleTags: [],
          scriptTags: [],
          content: ce,
        },
      },
    ];

    const fragment = createDocumentFragment();
    const element = createElement('x-tag');
    const slotThis = createElement('p', { slot: 'test' });
    appendChild(element, slotThis);
    appendChild(fragment, element);

    replaceElementsContent(replacers, fragment);
    const withSlotted = findElements(element, (el) => {
      const parent = getParentNode(el);
      return getAttribute(parent, 'id') === 'test-container';
    });

    expect(findElement(withSlotted, findTag('p'))).toBeDefined();
  });

  it('Fills named slots with multiple children', () => {
    const ce = parseFragment(
      `<div><slot></slot></div><div id="test-container"><slot name="test"></slot></div>`,
    );
    const replacers = [
      {
        path: '',
        tagName: 'x-tag',
        parsed: {
          styleTags: [],
          scriptTags: [],
          content: ce,
        },
      },
    ];

    const fragment = createDocumentFragment();
    const element = createElement('x-tag');
    for (let i = 0; i < 10; i++) {
      appendChild(element, createElement('p', { slot: 'test' }));
    }
    appendChild(fragment, element);

    replaceElementsContent(replacers, fragment);
    const withSlotted = findElements(element, (el) => {
      const parent = getParentNode(el);
      return getAttribute(parent, 'id') === 'test-container';
    });

    const slottedParagraphs = withSlotted.filter((s) => s.nodeName === 'p');

    expect(slottedParagraphs.length).toBe(10);
  });

  it('Does not fill slots for shadowroot elements', () => {
    const ce = parseFragment(
      `<template shadowrootmode="open"><slot></slot></template>`,
    );
    const replacers = [
      {
        path: '',
        tagName: 'x-tag',
        parsed: {
          styleTags: [],
          scriptTags: [],
          content: ce,
        },
      },
    ];

    const fragment = createDocumentFragment();
    const element = createElement('x-tag');
    const paragraph = createElement('p');
    appendChild(element, paragraph);
    appendChild(fragment, element);
    replaceElementsContent(replacers, fragment);

    const template = findElement(element, findTag('template'));
    const templateContent = getTemplateContent(template);

    expect(findElement(templateContent, findTag('p'))).toBeNull();
  });
});
