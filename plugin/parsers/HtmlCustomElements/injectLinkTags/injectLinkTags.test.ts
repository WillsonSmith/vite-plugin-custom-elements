import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements.js';
import {
  appendChild,
  createDocument,
  createElement,
  findElement,
  getAttribute,
} from '@web/parse5-utils';
import path from 'node:path';
import { parseFragment } from 'parse5';
import { describe, expect, it } from 'vitest';

import { transformLinkUrls } from './injectLinkTags.js';

describe('transformLinkUrls', () => {
  it('Does NOT transforms link URLs if light DOM', async () => {
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

    await transformLinkUrls(process.cwd(), element);
    const link = element.parsed.linkTags[0];
    const href = getAttribute(link, 'href');
    expect(href).toBe('./x-component.css');
  });

  it('Removes link tags from light DOM', async () => {
    const linkTag = createElement('link', {
      rel: 'stylesheet',
      href: './x-component.css',
    });

    const content = createElement('div');
    appendChild(content, linkTag);

    expect(findElement(content, (e) => e === linkTag)).toBeTruthy();

    const element: RequiredElement = {
      tagName: 'x-tag',
      path: path.join(process.cwd(), 'tags/x-component.html'),
      parsed: {
        scriptTags: [],
        styleTags: [],
        linkTags: [linkTag],
        content: createElement('div'),
      },
    };

    await transformLinkUrls(process.cwd(), element);
    expect(findElement(content, (e) => e === linkTag)).toBeFalsy();
  });

  it('Transforms link URLs if shadow DOM', async () => {
    const content = `
      <template shadowrootmode="open">
        <link rel="stylesheet" href="./x-component.css" />
      </template>
    `;
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
        content: parseFragment(content),
      },
    };
    await transformLinkUrls(process.cwd(), element);
    const link = element.parsed.linkTags[0];
    const href = getAttribute(link, 'href');
    expect(href).toContain('tags/x-component.css');
  });
});
