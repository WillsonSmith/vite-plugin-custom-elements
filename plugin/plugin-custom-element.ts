import { getChildNodes, getTagName } from '@web/parse5-utils';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import { Document } from 'parse5/dist/tree-adapters/default';

import { generateManifest, getCustomElementsFromManifest } from './manifest';
import { findCustomElements } from './parsers';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles';
import {
  RequiredElement,
  parseRequiredHtmlElements,
} from './parsers/HtmlCustomElements/parseRequiredHtmlElements/parseRequiredHtmlElements';
import { replaceElementsContent } from './parsers/HtmlCustomElements/replaceElementsContent/replaceElementsContent';

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

      const jsM = await generateManifest(projectDir);
      const jsEls = getCustomElementsFromManifest(jsM);

      // use this to get ones marked as hydratable
      // If one has `hydrate="true"` then auto-inject
      const includedJsEls = jsEls.filter((el) => {
        return customElements.find((element) => {
          return getTagName(element) === el.tagName;
        });
      });

      return serialize(document);
    },
  };
}

function injectStyles(elements: RequiredElement[], root: Document) {
  const styleSet = new Set<string>();

  for (const element of elements) {
    const tags = element.parsed.styleTags;
    for (const tag of tags) {
      const content = getChildNodes(tag)[0];
      if (content.nodeName === '#text') {
        styleSet.add(scopeStyleToElement(element.tagName, content.value));
      }
    }
  }
}

function scopeStyleToElement(tagName: string, cssText: string) {
  return cssText;
}
