import {
  appendChild,
  createElement,
  findElement,
  findElements,
  getChildNodes,
  getParentNode,
  getTagName,
  insertBefore,
  remove,
} from '@web/parse5-utils';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import { DocumentFragment } from 'parse5/dist/tree-adapters/default';

import { generateManifest, getCustomElementsFromManifest } from './manifest';
import { findCustomElements } from './parsers';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles';
import {
  RequiredElement,
  parseRequiredHtmlElements,
} from './parsers/HtmlCustomElements/parseRequiredHtmlElements/parseRequiredHtmlElements';
import { findTag, replaceNode } from './util/parse5';

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

      for (const element of customElements) {
        replaceElementContents(parsedElements, element);
      }

      const jsM = await generateManifest(projectDir);
      const jsEls = getCustomElementsFromManifest(jsM);

      // use this to get ones marked as hydratable
      // If one has `hydrate="true"` then auto-inject
      const includedJsEls = jsEls.filter((el) => {
        return customElements.find((element) => {
          return getTagName(element) === el.tagName;
        });
      });

      // console.log(includedJsEls);

      return serialize(document);
    },
  };
}

function replaceElementContents(
  replacers: RequiredElement[],
  element: Element,
) {
  const tagName = getTagName(element);
  const replaceWith = replacers.find((r) => r.tagName === tagName);

  const nestedElements = findCustomElements(element);
  if (nestedElements) {
    for (const nest of nestedElements) {
      replaceElementContents(replacers, nest);
    }
  }

  const newElement = createElement(tagName);
  const slot = findElement(replaceWith, findTag('slot'));
  if (slot) {
    for (const child of getChildNodes(element)) {
      insertBefore(getParentNode(slot), child, slot);
    }
    remove(slot);
  }

  // I'm probably moving/removing something (child) and so it doesn't exist later.
  if (replaceWith) {
    for (const child of getChildNodes(replaceWith.parsed.content)) {
      appendChild(newElement, child);
    }
    if (element) {
      replaceNode(element, newElement);
    }
  }
}
