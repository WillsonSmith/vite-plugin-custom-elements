import {
  Element,
  getParentNode,
  getTagName,
  insertBefore,
  remove,
} from '@web/parse5-utils';

export function findTag(tagName: string): Element {
  return (el: Element) => {
    return getTagName(el) === tagName;
  };
}

export function replaceNode(target: Element, replacer: Element): void {
  insertBefore(getParentNode(target), replacer, target);
  remove(target);
}
