import type { Element, Node } from '@web/parse5-utils';
import {
  findElements,
  getChildNodes,
  getParentNode,
  getTagName,
  insertBefore,
  remove,
} from '@web/parse5-utils';
import { serialize } from 'parse5';

export function findTag(tagName: string): Element {
  return (el: Element) => {
    return getTagName(el) === tagName;
  };
}

export function replaceNode(target: Element, replacer: Element): void {
  insertBefore(getParentNode(target), replacer, target);
  remove(target);
}

export function serializeWithStringifiedTags(parent: Node, tagName: string) {
  const elementContents = [];
  const elements = findElements(parent, (element) => {
    if (element.nodeName === tagName) {
      return true;
    }
    return false;
  });

  for (const element of elements) {
    const children = getChildNodes(element);
    const content = children.map((c: Node) => c.value).join('\n');
    elementContents.push(content);

    const index = elementContents.length - 1;
    element.childNodes = [createTextNode(`{{replacer[${index}]}}`)];
  }

  let serialized = serialize(parent);
  for (let i = 0; i < elementContents.length; i++) {
    serialized = serialized.replace(`{{replacer[${i}]}}`, elementContents[i]);
  }

  return serialized;
}

export function createTextNode(text: string): Node {
  return {
    nodeName: '#text',
    value: text,
    parentNode: null,
    attrs: [],
    __location: undefined,
  };
}
