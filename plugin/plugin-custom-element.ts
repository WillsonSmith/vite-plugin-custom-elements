import {
  appendChild,
  createElement,
  findElement,
  getChildNodes,
  getTagName,
} from '@web/parse5-utils';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import { Document } from 'parse5/dist/tree-adapters/default';
import postcss, { Rule, document } from 'postcss';
// @ts-expect-error No type definitions
import prefixSelector from 'postcss-prefix-selector';

import { generateManifest, getCustomElementsFromManifest } from './manifest';
import { findCustomElements } from './parsers';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles';
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

async function injectStyles(elements: RequiredElement[], root: Document) {
  const styleSet = new Set<string>();

  for (const element of elements) {
    const tags = element.parsed.styleTags;
    for (const tag of tags) {
      const content = getChildNodes(tag)[0];
      if (content.nodeName === '#text') {
        const scoped = await scopeStyleToElement(
          element.tagName,
          content.value,
        );
        styleSet.add(scoped);
      }
    }
  }

  const styleTag = createElement('style');

  styleTag.childNodes = [
    {
      nodeName: '#text',
      value: Array.from(styleSet).join('\n'),
      parentNode: null,
      attrs: [],
      __location: undefined,
    },
  ];
  appendChild(findElement(root, findTag('head')), styleTag);
}

type TransformOptions = [string, string, string, string, Rule];
async function scopeStyleToElement(tagName: string, cssText: string) {
  const post = postcss([
    prefixSelector({
      prefix: tagName,
      transform: handleTransform,
    }),
  ]);

  return post.process(cssText).then((res) => res.css);
}

function handleTransform(...options: TransformOptions) {
  const [prefix, selector, prefixedSelector, , rule] = options;
  if (selector.startsWith(':host')) return prefix;
  if (selector.startsWith('body') || selector.startsWith('html')) {
    return selector;
  }

  if (
    rule.parent && 'selector' in rule.parent
      ? (rule.parent.selector as string).includes(prefix)
      : false
  ) {
    return selector;
  }

  return prefixedSelector;
}
