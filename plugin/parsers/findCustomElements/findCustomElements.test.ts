import { appendChild, createElement, getTagName } from '@web/parse5-utils';
import { parse, parseFragment } from 'parse5';
import { describe, expect, it } from 'vitest';

import { findCustomElements } from './findCustomElements';

describe('Finds custom elements', () => {
  it('finds elements in a Document', () => {
    const doc = parse(pageTemplate(`<my-custom-element></my-custom-element`));

    expect(tagNames(findCustomElements(doc))).toStrictEqual([
      'my-custom-element',
    ]);
  });

  it('finds elements in a DocumentFragment', () => {
    const fragment = parseFragment(fragmentTemplate());

    expect(tagNames(findCustomElements(fragment))).toStrictEqual([
      'my-custom-element',
      'my-custom-paragraph',
    ]);
  });

  it('finds elements in an Element', () => {
    const element = createElement('div');
    const customElement = createElement('my-custom-element');
    appendChild(element, customElement);

    expect(tagNames(findCustomElements(element))).toStrictEqual([
      'my-custom-element',
    ]);
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
