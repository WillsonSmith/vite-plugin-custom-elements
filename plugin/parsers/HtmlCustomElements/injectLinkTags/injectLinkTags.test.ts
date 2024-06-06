import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import { createDocument, createElement, getAttribute } from '@web/parse5-utils';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { transformLinkUrls } from './injectLinkTags';

describe('transformLinkUrls', () => {
  it('Transforms link URLs', async () => {
    expect(true).toBeTruthy();

    const element: RequiredElement = {
      tagName: 'x-tag',
      path: path.join(process.cwd(), 'tags/x-component.html'),
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
    };

    transformLinkUrls(process.cwd(), element);
    const link = element.parsed.linkTags[0];
    const href = getAttribute(link, 'href');
    console.log(href);
    expect(href).toContain('tags/x-component.css');
  });
});

function newDoc(content: string): string {
  return createDocument(
    `
    <!doctype html>
      <html>
        <head></head>
        <body>
          ${content || ''}
        </body>
      </html>
      `,
  );
}
