import {
  Element,
  appendChild,
  createScript,
  findElement,
  getAttribute,
  getAttributes,
  getTagName,
} from '@web/parse5-utils';
import { Package } from 'custom-elements-manifest';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import { Document } from 'parse5/dist/tree-adapters/default';

import { generateManifest, getCustomElementsFromManifest } from './manifest';
import { DefinedElement } from './manifest/getCustomElementsFromManifest/getCustomElementsFromManifest';
import { findCustomElements } from './parsers';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles';
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
    transformIndexHtml: async (content: string) => {
      const document = parse(content);
      const body = findElement(document, findTag('body'));

      const projectDir = path.join(cwd, root);
      const customElements: Element[] = findCustomElements(document);
      const customElementSourceFiles = await findHtmlElementFiles(
        path.join(projectDir, elementDir),
      );

      const parsedElements = await parseRequiredHtmlElements(
        customElements,
        customElementSourceFiles,
      );

      replaceElementsContent(parsedElements, document);
      injectStyles(parsedElements, document);

      // Hydrate marked JS elements
      const elementsToHydrate = customElements.filter((element) => {
        return getAttribute(element, 'hydrate') !== undefined;
      });

      const hydrateScripts = await generateHydrationScripts(
        projectDir,
        elementsToHydrate,
      );

      for (const script of hydrateScripts) {
        appendChild(body, script);
      }

      return serialize(document);
    },
  };
}

async function generateHydrationScripts(
  dir: string,
  customElements: Element[],
) {
  const scriptSources = new Set<string>();
  const availableElementts = getCustomElementsFromManifest(
    await generateManifest(dir),
  );

  for (const el of customElements) {
    const available = availableElementts.find((element) => {
      return element.tagName === getTagName(el);
    });

    if (available) {
      scriptSources.add(available.path.split(dir)[1]);
    }
  }

  return Array.from(scriptSources, (source) => {
    return createScript({ type: 'module', src: source });
  });
}
