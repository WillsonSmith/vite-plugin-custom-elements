import {
  getParentNode,
  getTagName,
  insertBefore,
  remove,
} from '@web/parse5-utils';

export function findTag(tagName: string) {
  return (el: Element) => {
    return getTagName(el) === tagName;
  };
}

export function replaceNode(target: Element, replacer: Element) {
  insertBefore(getParentNode(target), replacer, target);
  remove(target);
}
