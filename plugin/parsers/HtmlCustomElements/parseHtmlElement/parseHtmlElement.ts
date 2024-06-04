import { findTag } from '../../../util/parse5';
import {
  findElement,
  findElements,
  getAttribute,
  getChildNodes,
  getTagName,
  getTemplateContent,
  remove,
} from '@web/parse5-utils';
import { serialize } from 'parse5';
import { DocumentFragment } from 'parse5/dist/tree-adapters/default';

export type ParsedHtmlElement = {
  styleTags: Element[];
  content: DocumentFragment;
  scriptTags: Element[];
};

/** Extracts style tags, script tags, and content from an HTML Element fragment
 * @param {DocumentFragment} fragment - The HTML Element as a parse5 DocumentFragment
 * */
export function parseHtmlElement(
  fragment: DocumentFragment,
): ParsedHtmlElement {
  const shadowTemplate = findShadowTemplate(fragment);

  const extracted = extractParts(fragment);
  if (shadowTemplate) {
    console.log('Handle shadowroot element');
  }

  return extracted;
}

function extractParts(fragment: DocumentFragment) {
  const shadowTemplate = findShadowTemplate(fragment);

  const styleTags = findStyles(fragment, shadowTemplate);
  const scriptTags = findScripts(fragment, shadowTemplate);

  for (const style of styleTags) {
    remove(style);
  }
  for (const script of scriptTags) {
    remove(script);
  }

  return { styleTags, scriptTags, content: fragment };
}

function findNonShaded(
  fragment: DocumentFragment,
  shadowTemplate: Element,
  tagName: string,
) {
  return findElements(fragment, (element) => {
    if (getTagName(element) !== tagName) return false;

    if (shadowTemplate) {
      const within = findElement(getTemplateContent(shadowTemplate), (el) => {
        return el === element;
      });
      if (within) return false;
    }
    return true;
  });
}

function findStyles(fragment: DocumentFragment, shadowTemplate: Element) {
  return findNonShaded(fragment, shadowTemplate, 'style');
}

function findScripts(fragment: DocumentFragment, shadowTemplate: Element) {
  return findNonShaded(fragment, shadowTemplate, 'script');
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
