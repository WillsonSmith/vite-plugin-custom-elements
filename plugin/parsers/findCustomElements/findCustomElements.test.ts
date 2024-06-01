import { appendChild, createElement, getTagName } from '@web/parse5-utils';
import { parse, parseFragment } from 'parse5';
import { describe, expect, it } from 'vitest';

import { findCustomElements, reservedElements } from './findCustomElements';

describe('findCustomElements', () => {
  it('Finds elements in a Document', () => {
    const doc = parse(pageTemplate(`<my-custom-element></my-custom-element>`));

    expect(tagNames(findCustomElements(doc))).toStrictEqual([
      'my-custom-element',
    ]);
  });

  it('Finds elements in a DocumentFragment', () => {
    const fragment = parseFragment(fragmentTemplate());

    expect(tagNames(findCustomElements(fragment))).toStrictEqual([
      'my-custom-element',
      'my-custom-paragraph',
    ]);
  });

  it('Finds elements in an Element', () => {
    const element = createElement('div');
    const customElement = createElement('my-custom-element');
    appendChild(element, customElement);

    expect(tagNames(findCustomElements(element))).toStrictEqual([
      'my-custom-element',
    ]);
  });

  it('Does NOT find reserved elements', () => {
    const page = parse(pageTemplate(reservedElements.join('\n')));
    expect(findCustomElements(page).length).toBe(0);
  });
});

// TEST HELPERS
function tagNames(elements: Element[]) {
  return elements.map((element) => getTagName(element));
}

const pageTemplate = (body: string) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Home</title>
  </head>

  <body>
    ${body}
  </body>
</html>
`;

const fragmentTemplate = (body: string = '') => `
<div><p>Some content</p>
<div>
  <my-custom-element></my-custom-element>
</div>

<my-custom-paragraph></my-custom-paragraph>

${body}
`;
