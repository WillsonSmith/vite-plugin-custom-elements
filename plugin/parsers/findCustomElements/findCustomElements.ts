import { Node, findElements, getTagName } from '@web/parse5-utils';

export function findCustomElements(node: Node) {
  return findElements(node, (element) => isCustomElement(getTagName(element)));
}

function isCustomElement(tagName: string) {
  const reserved = [
    'annotation-xml',
    'color-profile',
    'font-face',
    'font-face-src',
    'font-face-uri',
    'font-face-format',
    'font-face-name',
    'missing-glyph',
  ];
  return tagName.includes('-') && !reserved.includes(tagName);
}
