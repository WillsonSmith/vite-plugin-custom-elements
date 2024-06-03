import {
  appendChild,
  createElement,
  findElement,
  findElements,
  getChildNodes,
} from '@web/parse5-utils';
import { parse, parseFragment } from 'parse5';
import { describe, expect, it } from 'vitest';

import { injectStyles } from './injectStyles';
import { findTag } from '@/plugin/util/parse5';

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

    const elements = createParsedElements(
      createStyle('.my-selector { color: black; }'),
    );

    await injectStyles(elements, document);
    const head = findElement(document, findTag('head'));
    const styles = findElements(head, findTag('style'));
    expect(styles.length).toBe(1);
  });

  it('Prefixes selectors', async () => {
    const document = parse(DOCUMENT_TEMPLATE);
    const component = createElement('x-component');
    appendChild(document, component);

    const elements = createParsedElements(
      createStyle('.my-selector { color: black; }'),
    );
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

    const elements = createParsedElements(
      createStyle('.my-selector { a { color: black; } }'),
    );
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

function createParsedElements(styleTag: Element, content?: string) {
  return [
    {
      path: '',
      tagName: 'x-component',
      parsed: {
        styleTags: [styleTag],
        scriptTags: [],
        content: parseFragment(
          content || '<div class="my-selector">hello</div>',
        ),
      },
    },
  ];
}
