import { Element, Node, findElements, getTagName } from '@web/parse5-utils';

/** Parse a document and find all custom elements
 * @param node - A parse5 node (Document) to search
 */
export function findCustomElements(node: Node): Element[] {
  return findElements(node, (element) => {
    if (node !== element) {
      return isCustomElement(getTagName(element));
    }
    return false;
  });
}

export const reservedElements = [
  'annotation-xml',
  'color-profile',
  'font-face',
  'font-face-src',
  'font-face-uri',
  'font-face-format',
  'font-face-name',
  'missing-glyph',
];

function isCustomElement(tagName: string) {
  return tagName.includes('-') && !reservedElements.includes(tagName);
}
