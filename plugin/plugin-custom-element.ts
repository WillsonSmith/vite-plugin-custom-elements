import {
  appendChild,
  findElement,
  getChildNodes,
  getParentNode,
  getTagName,
  insertBefore,
  remove,
} from '@web/parse5-utils';
import path from 'node:path';
import { parse, parseFragment, serialize } from 'parse5';
import { Document, DocumentFragment } from 'parse5/dist/tree-adapters/default';

import { generateManifest, getCustomElementsFromManifest } from './manifest';
import { findCustomElements } from './parsers';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles';
import {
  RequiredElement,
  parseRequiredHtmlElements,
} from './parsers/HtmlCustomElements/parseRequiredHtmlElements/parseRequiredHtmlElements';
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

      // console.log(includedJsEls);

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
  console.log(tagName);
  return cssText;
}

function replaceElementsContent(
  replacers: RequiredElement[],
  root: Document | DocumentFragment | Element,
) {
  const customElements = findCustomElements(root);

  for (const customElement of customElements) {
    const tag = getTagName(customElement);
    const replacer = replacers.find((replacer) => {
      return replacer.tagName === tag;
    });

    if (replacer) {
      const cloned = cloneNode(replacer.parsed.content);
      replaceElementsContent(replacers, cloned);

      // TODO: Handle multiple slots
      const slot = findElement(cloned, findTag('slot'));
      const elementChildren = getChildNodes(customElement);
      if (slot) {
        for (const child of elementChildren) {
          insertBefore(getParentNode(slot), child, slot);
        }
        remove(slot);
      }

      for (const child of elementChildren) {
        remove(child);
      }
      for (const child of getChildNodes(cloned)) {
        appendChild(customElement, child);
      }
    }
  }
}

function cloneNode(fragment: DocumentFragment) {
  return parseFragment(serialize(fragment));
}
