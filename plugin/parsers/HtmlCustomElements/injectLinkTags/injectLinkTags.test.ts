import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import { createElement } from '@web/parse5-utils';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('injecctLinkTags', () => {
  it('Transforms link URLs', async () => {
    expect(true).toBeTruthy();
    const component = `
      <link rel="stylesheet" href="../x-component.css">
      <div class="x-component">
        <h2>Some content</h2>
        <p><slot></slot></p>
      </div>
    `;

    const elements: RequiredElement[] = [
      {
        tagName: 'x-tag',
        path: path.join(process.cwd(), '../x-component.css'),
        parsed: {
          scriptTags: [],
          styleTags: [],
          linkTags: [
            createElement('link', {
              rel: 'stylesheet',
              href: './x-component.css',
            }),
          ],
          content: createElement('div'),
        },
      },
    ];
  });
});
