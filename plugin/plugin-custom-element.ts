import {
  Element,
  appendChild,
  findElement,
  getAttribute,
} from '@web/parse5-utils';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import type { PluginOption } from 'vite';

import { generateHydrationScripts } from './hydration/generateHydrationScripts/generateHydrationScripts';
import { findCustomElements } from './parsers';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles';
import { transformLinkUrls } from './parsers/HtmlCustomElements/injectLinkTags/injectLinkTags';
import {
  injectScripts,
  transformShadowScripts,
} from './parsers/HtmlCustomElements/injectScripts/injectScripts';
import { injectStyles } from './parsers/HtmlCustomElements/injectStyles/injectStyles';
import {
  RequiredElement,
  parseRequiredHtmlElements,
} from './parsers/HtmlCustomElements/parseRequiredHtmlElements/parseRequiredHtmlElements';
import { replaceElementsContent } from './parsers/HtmlCustomElements/replaceElementsContent/replaceElementsContent';
import { findTag } from './util/parse5';

const cwd = process.cwd();

type PluginCustomElementOptions = {
  root?: string;
  elementDir?: string;
};
export function pluginCustomElement({
  root = './',
  elementDir = 'components',
}: PluginCustomElementOptions) {
  return {
    name: 'plugin-custom-element',
    transformIndexHtml: {
      order: 'pre',
      handler: async (content: string, { path: indexPath }) => {
        const document = parse(content);
        const body = findElement(document, findTag('body'));

        const projectDir = path.join(cwd, root);
        const indexDir = path.join(cwd, root, path.dirname(indexPath));

        const customElements: Element[] = findCustomElements(document);
        const customElementSourceFiles = await findHtmlElementFiles(
          path.join(projectDir, elementDir),
        );

        const parsedElements = await parseRequiredHtmlElements(
          customElements,
          customElementSourceFiles,
        );

        for (const el of parsedElements) {
          await transformLinkUrls(indexDir, el);
        }

        processShadowedItems(indexDir, parsedElements);
        replaceElementsContent(parsedElements, document);

        injectStyles(parsedElements, document);
        injectScripts(indexDir, parsedElements, document);

        const hydrateScripts = await generateHydrationScripts(
          projectDir,
          indexDir,
          customElements,
        );

        for (const script of hydrateScripts) {
          appendChild(body, script);
        }

        return serialize(document);
      },
    },
  } as PluginOption;
}

function processShadowedItems(rootDir: string, elements: RequiredElement[]) {
  for (const element of elements) {
    const content = element.parsed.content;

    const template = findElement(content, (element) => {
      return (
        element.tagName === 'template' &&
        getAttribute(element, 'shadowrootmode') === 'open'
      );
    });

    if (template) {
      transformShadowScripts(template, element, rootDir);
    }
  }
}
