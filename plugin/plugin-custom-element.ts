import { getTagName } from '@web/parse5-utils';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import { Document } from 'parse5/dist/tree-adapters/default';

import { generateManifest, getCustomElementsFromManifest } from './manifest';
import { findCustomElements } from './parsers';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles';
import { injectStyles } from './parsers/HtmlCustomElements/injectStyles/injectStyles';
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

      transformScripts(parsedElements, document);

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
export async function transformScripts(
  elements: RequiredElement[],
  root: Document,
) {
  console.log(elements, root);
}
