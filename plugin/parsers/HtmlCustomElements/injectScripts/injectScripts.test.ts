import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import {
  createDocument,
  createElement,
  createScript,
  findElement,
  getAttribute,
  getChildNodes,
  getTemplateContent,
} from '@web/parse5-utils';
import path from 'node:path';
import { parseFragment } from 'parse5';
import { describe, expect, it } from 'vitest';

import { injectScripts, transformShadowScripts } from './injectScripts';
import { findTag } from '@/plugin/util/parse5';

describe('injectScripts', () => {
  it('Injects scripts from a RequiredElement list into the DOM', async () => {
    const elements: RequiredElement[] = [
      {
        tagName: 'x-tag',
        path: path.join(process.cwd(), 'tags/tag-name.html'),
        parsed: {
          scriptTags: [createScript({ type: 'module' }, `console.log('TEST')`)],
          styleTags: [],
          linkTags: [],
          content: createElement('div'),
        },
      },
    ];

    const doc = createDocument(
      '<!doctype html><html><head></head><body></body></html>',
    );

    injectScripts(process.cwd(), elements, doc);
    expect(findElement(doc, findTag('script'))).not.toBeNull();
  });
});

describe('transformShadowScripts', () => {
  it('Updates import URLs for shadowroot scripts', () => {
    const templateString = `
    <template shadowrootmode="open">
      <script type="module">
        import {test} from './test.ts';
      </script>
    </template>
    `;

    const template = findElement(
      parseFragment(templateString),
      findTag('template'),
    );

    const element: RequiredElement = {
      tagName: 'x-tag',
      path: path.join(process.cwd(), 'tags/tag-name.html'),
      parsed: {
        scriptTags: [],
        styleTags: [],
        linkTags: [],
        content: createElement('div'),
      },
    };

    transformShadowScripts(template, element, process.cwd());

    const changedScript = findElement(
      getTemplateContent(template),
      findTag('script'),
    );

    const content = getChildNodes(changedScript)[0].value;
    expect(content).toContain('tags/test.ts');
  });

  it('Updates src URLs for shadowroot scripts', () => {
    const templateString = `
    <template shadowrootmode="open">
      <script type="module" src="./test.ts">
      </script>
    </template>
    `;

    const template = findElement(
      parseFragment(templateString),
      findTag('template'),
    );

    const element: RequiredElement = {
      tagName: 'x-tag',
      path: path.join(process.cwd(), 'tags/tag-name.html'),
      parsed: {
        scriptTags: [],
        styleTags: [],
        linkTags: [],
        content: createElement('div'),
      },
    };

    transformShadowScripts(template, element, process.cwd());

    const changedScript = findElement(
      getTemplateContent(template),
      findTag('script'),
    );

    const src = getAttribute(changedScript, 'src');
    expect(src).toBe('tags/test.ts');
  });
});
