import { findTag } from '../../../util/parse5.js';
import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements.js';
import {
  appendChild,
  createElement,
  findElement,
  findElements,
  getChildNodes,
  getTemplateContent,
  isTextNode,
} from '@web/parse5-utils';
import type { DefaultTreeAdapterMap } from 'parse5';
import postcss, { Rule } from 'postcss';
import prefixSelector from 'postcss-prefix-selector';

type Document = DefaultTreeAdapterMap['document'];

export async function injectStyles(
  elements: RequiredElement[],
  root: Document,
) {
  const styleSet = new Set<string>();

  for (const element of elements) {
    const tags = element.parsed.styleTags;
    for (const tag of tags) {
      const content = getChildNodes(tag)[0];
      if (isTextNode(content)) {
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

  const templates = findElements(root, (el) => {
    return el.nodeName === 'template';
  });

  for (const template of templates) {
    const templateElements = elements.filter((element) => {
      return (
        findElements(template, (el) => {
          return el.nodeName === element.tagName;
        }).length > 0
      );
    });

    await injectStyles(templateElements, getTemplateContent(template));
  }

  const appendTo = findElement(root, findTag('head')) || root;
  const styleContent = styleTag.childNodes[0]?.value;
  if (styleContent.length > 0) {
    appendChild(appendTo, styleTag);
  }
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

  if (rule.parent?.type === 'rule') {
    return selector;
  }

  return prefixedSelector;
}
