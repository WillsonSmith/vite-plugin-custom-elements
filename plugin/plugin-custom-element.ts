import {
  appendChild,
  createElement,
  findElement,
  getChildNodes,
  getParentNode,
  getTagName,
  insertBefore,
} from '@web/parse5-utils';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, parseFragment, serialize } from 'parse5';

import { generateManifest, getCustomElementsFromManifest } from './manifest';
import { findCustomElements } from './parsers';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles';
import {
  loadAndParseHtmlElement,
  loadAndParseHtmlElements,
} from './parsers/HtmlCustomElements/loadAndParseHtmlElements/loadAndParseHtmlElements';
import {
  ParsedHtmlElement,
  parseHtmlElement,
} from './parsers/HtmlCustomElements/parseHtmlElement/parseHtmlElement';
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
      const projectDir = path.join(cwd, root);

      const document = parse(content);
      const elements: Element[] = findCustomElements(document);

      const htmlCustomElementFiles = await findHtmlElementFiles(
        path.join(projectDir, elementDir),
      );

      const parsedElements = await parseAvailableElements(
        elements,
        htmlCustomElementFiles,
      );

      parsedElements.forEach((e) => console.log(e.tagName));

      // these need to include tagName
      // const parsedHtmlElements = await loadAndParseHtmlElements(files);
      //
      // console.log(parsedHtmlElements);
      // transformers go here

      const jsM = await generateManifest(projectDir);
      const jsEls = getCustomElementsFromManifest(jsM);

      // use this to get ones marked as hydratable
      // If one has `hydrate="true"` then auto-inject
      const includedJsEls = jsEls.filter((el) => {
        return elements.find((element) => {
          return getTagName(element) === el.tagName;
        });
      });

      // console.log(includedJsEls);

      return serialize(document);
    },
  };
}

type AvailableElement = {
  tagName: string;
  element: ParsedHtmlElement;
};
async function parseAvailableElements(
  elements: Element[],
  files: string[],
): Promise<AvailableElement[]> {
  const result: AvailableElement[] = [];

  for (const element of elements) {
    const tagName: string = getTagName(element);
    const thisFile = files.find((file) => file.includes(tagName));

    if (thisFile) {
      const parsed = await loadAndParseHtmlElement(thisFile);
      const nested = findCustomElements(parsed.content);
      if (nested.length > 0) {
        console.log(`nested: {{tagName}}`);
      }

      result.push({
        tagName,
        element: parsed,
      });
    }
  }
  return result;
}
