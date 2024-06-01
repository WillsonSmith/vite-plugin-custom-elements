import {
  findElement,
  findElements,
  getAttribute,
  getChildNodes,
  getTagName,
  remove,
} from '@web/parse5-utils';
import { DocumentFragment } from 'parse5/dist/tree-adapters/default';

import { findTag } from '@/plugin/util/parse5';

export async function parseHtmlElement(fragment: DocumentFragment) {
  const shadowTemplate = findShadowTemplate(fragment);
  if (shadowTemplate) {
    console.log('Handle shadowroot element');
  }

  const extracted = extractParts(fragment);
  console.log(extracted);
  return extracted;
}

export function extractParts(fragment: DocumentFragment) {
  const styleTags = findElements(fragment, findTag('style'));
  const scriptTags = findElements(fragment, findTag('script'));

  for (const style of styleTags) {
    remove(style);
  }
  for (const script of scriptTags) {
    remove(script);
  }

  return { styleTags, scriptTags, content: getChildNodes(fragment) };
}

function findShadowTemplate(fragment: DocumentFragment) {
  return findElement(fragment, (el) => {
    const tagNameMatch = getTagName(el) === 'template';
    const attributeMatch = getAttribute(el, 'shadowrootmode');
    if (tagNameMatch && attributeMatch) {
      return true;
    }
    return false;
  });
}
