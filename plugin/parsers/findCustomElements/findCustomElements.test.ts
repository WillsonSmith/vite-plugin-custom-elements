import { getTagName } from '@web/parse5-utils';
import { parse } from 'parse5';
import { expect, test } from 'vitest';

import { findCustomElements } from './findCustomElements';

test('finds custom elements in a document', () => {
  const doc = parse(pageTemplate(`<my-custom-element></my-custom-element`));

  const customElementNames = findCustomElements(doc).map((element) =>
    getTagName(element),
  );

  expect(customElementNames).toBe(['my-custom-element']);
});

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
