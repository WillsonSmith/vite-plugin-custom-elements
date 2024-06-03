import { findTag } from '../../../util/parse5';
import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import {
  appendChild,
  createElement,
  findElement,
  getChildNodes,
} from '@web/parse5-utils';
import { Document } from 'parse5/dist/tree-adapters/default';
import postcss, { Rule } from 'postcss';
// @ts-expect-error No type definitions
import prefixSelector from 'postcss-prefix-selector';

export async function injectStyles(
  elements: RequiredElement[],
  root: Document,
) {
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
