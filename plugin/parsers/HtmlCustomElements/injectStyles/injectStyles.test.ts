import { findTag } from '../../../util/parse5';
import {
  appendChild,
  createElement,
  findElement,
  findElements,
  getChildNodes,
} from '@web/parse5-utils';
import { parse, parseFragment, serialize } from 'parse5';
import { describe, expect, it } from 'vitest';

import { injectStyles } from './injectStyles';

const DOCUMENT_TEMPLATE = `
      <!doctype html>
      <html>
        <head>
        </head>
        <body>
        </body>
      </html>
    `;
describe('injectStyles', () => {
  it('Injects style tags', async () => {
    const document = parse(DOCUMENT_TEMPLATE);
    const component = createElement('x-component');
    appendChild(document, component);

    const elements = createParsedElements({
      styleTag: createStyle('.my-selector { color: black; }'),
    });

    await injectStyles(elements, document);
    const head = findElement(document, findTag('head'));
    const styles = findElements(head, findTag('style'));
    expect(styles.length).toBe(1);
  });

  it('Injects styles into shadowroots', async () => {
    const document = parse(DOCUMENT_TEMPLATE);
    const component = createElement('x-component');
    appendChild(document, component);
    const elements = createParsedElements({
      styleTag: createStyle('.my-selector { color: black; }'),
      content: `<template shadowrootmode="open"><p>Hello</p></template>`,
    });

    await injectStyles(elements, document);
    const head = findElement(document, findTag('head'));
    const styles = findElements(head, findTag('style'));
    expect(styles.length).toBe(1);
  });

  it('ONLY injects NESTED ELEMENT styles into shadowroots', async () => {
    const document = parse(DOCUMENT_TEMPLATE);
    const externalComponent = createElement('x-componenet-external');

    const component2 = createElement('x-component-2');
    appendChild(
      component2,
      parseFragment(`
      <template shadowrootmode="open">
        <x-component></x-component>
        <p>test</p>
      </template>
    `),
    );

    const elements = [
      ...createParsedElements({
        tagName: 'x-component-external',
        styleTag: createStyle(`.external-style { color: red }`),
      }),
      ...createParsedElements({
        tagName: 'x-component',
        styleTag: createStyle(`.my-selector { color: red }`),
      }),
      ...createParsedElements({
        tagName: 'x-component-2',
        content: `<template shadowrootmode="open"><x-component></x-component><p>Hello</p></template>`,
      }),
    ];

    const body = findElement(document, findTag('body'));

    appendChild(body, externalComponent);
    appendChild(body, component2);

    await injectStyles(elements, document);
    const styles = findElements(component2, (el) => {
      return el.nodeName === 'style';
    });

    expect(styles.length).toBe(1);
    const styleText = getChildNodes(styles[0])[0].value;
    expect(styleText).not.toContain('external-style');
  });

  it('Prefixes selectors', async () => {
    const document = parse(DOCUMENT_TEMPLATE);
    const component = createElement('x-component');
    appendChild(document, component);

    const elements = createParsedElements({
      styleTag: createStyle('.my-selector { color: black; }'),
    });
    await injectStyles(elements, document);

    const head = findElement(document, findTag('head'));
    const styles = findElement(head, findTag('style'));
    const content = getChildNodes(styles)[0].value;

    expect(content).toContain('x-component .my-selector');
  });

  it('Does NOT prefix nested selectors', async () => {
    const document = parse(DOCUMENT_TEMPLATE);
    const component = createElement('x-component');
    appendChild(document, component);

    const elements = createParsedElements({
      styleTag: createStyle('.my-selector { a { color: black; } }'),
    });
    await injectStyles(elements, document);

    const head = findElement(document, findTag('head'));
    const styles = findElement(head, findTag('style'));
    const content = getChildNodes(styles)[0].value;

    expect(content).not.toContain('x-component a');
  });
});

function createStyle(content: string) {
  const style = createElement('style');
  style.childNodes = [
    {
      nodeName: '#text',
      value: content,
      parentNode: null,
      attrs: [],
    },
  ];
  return style;
}

function createParsedElements({
  styleTag,
  content,
  tagName = 'x-component',
}: {
  styleTag?: Element;
  content?: string;
  tagName?: string;
}) {
  return [
    {
      path: '',
      tagName: tagName,
      parsed: {
        styleTags: styleTag ? [styleTag] : [],
        scriptTags: [],
        linkTags: [],
        content: parseFragment(
          content || '<div class="my-selector">hello</div>',
        ),
      },
    },
  ];
}
