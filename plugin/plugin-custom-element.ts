import {
  Element,
  appendChild,
  findElement,
  getAttribute,
} from '@web/parse5-utils';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import type { Plugin, PluginOption } from 'vite';

import { generateHydrationScripts } from './hydration/generateHydrationScripts/generateHydrationScripts.js';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles.js';
import { transformLinkUrls } from './parsers/HtmlCustomElements/injectLinkTags/injectLinkTags.js';
import {
  injectScripts,
  transformShadowScripts,
} from './parsers/HtmlCustomElements/injectScripts/injectScripts.js';
import { injectStyles } from './parsers/HtmlCustomElements/injectStyles/injectStyles.js';
import {
  RequiredElement,
  parseRequiredHtmlElements,
} from './parsers/HtmlCustomElements/parseRequiredHtmlElements/parseRequiredHtmlElements.js';
import { replaceElementsContent } from './parsers/HtmlCustomElements/replaceElementsContent/replaceElementsContent.js';
import { findCustomElements } from './parsers/index.js';
import { findTag } from './util/parse5.js';

const cwd = process.cwd();

type PluginCustomElementOptions = {
  root?: string;
  elementDir?: string;
};

type PluginCustomElementOptions2 = {
  root: string;
  elementsDir: string;
};

export function pluginCustomElement2({
  root = './',
  elementsDir = 'custom-elements',
}: PluginCustomElementOptions2): Plugin {
  return {
    name: 'plugin-custom-elements',
    transformIndexHtml: {
      order: 'pre',
      handler: async (context: string, { path: indexPath }) => {
        console.log(context, indexPath);
      },
    },
  };
}

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
