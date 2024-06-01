import {
  findElement,
  findElements,
  getAttribute,
  getChildNodes,
  getTagName,
  getTemplateContent,
  remove,
} from '@web/parse5-utils';
import { DocumentFragment } from 'parse5/dist/tree-adapters/default';

export async function parseHtmlElement(fragment: DocumentFragment) {
  const shadowTemplate = findShadowTemplate(fragment);
  if (shadowTemplate) {
    console.log('Handle shadowroot element');
  }

  const extracted = extractParts(fragment);

  return extracted;
}

export function extractParts(fragment: DocumentFragment) {
  const shadowTemplate = findShadowTemplate(fragment);

  const styleTags = findStyles(fragment, shadowTemplate);
  const scriptTags = findScripts(fragment, shadowTemplate);

  for (const style of styleTags) {
    remove(style);
  }
  for (const script of scriptTags) {
    remove(script);
  }

  return { styleTags, scriptTags, content: getChildNodes(fragment) };
}

function findNonShaded(
  fragment: DocumentFragment,
  shadowTemplate: Element,
  tagName: string,
) {
  return findElements(fragment, (element) => {
    if (getTagName(element) !== tagName) return false;
    if (shadowTemplate) {
      const content = getTemplateContent(shadowTemplate);
      if (findElements(content, (el) => el === element)) {
        return false;
      }
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
