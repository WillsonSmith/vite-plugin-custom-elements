import { findTag, replaceNode } from '../../../util/parse5';
import { findCustomElements } from '../../findCustomElements/findCustomElements';
import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import {
  Element,
  appendChild,
  createDocumentFragment,
  findElement,
  findElements,
  getAttribute,
  getAttributes,
  getChildNodes,
  getParentNode,
  getTagName,
  insertBefore,
  isTextNode,
  remove,
} from '@web/parse5-utils';
import { parseFragment, serialize } from 'parse5';
import { Document, DocumentFragment } from 'parse5/dist/tree-adapters/default';

export function replaceElementsContent(
  replacers: RequiredElement[],
  root: Document | DocumentFragment | Element,
) {
  const customElements = findCustomElements(root);

  for (const customElement of customElements) {
    const tag = getTagName(customElement);
    const replacer = replacers.find((replacer) => {
      return replacer.tagName === tag;
    });

    if (!replacer) continue;

    const cloned = cloneNode(replacer.parsed.content);
    // const isTemplate = findElement(cloned, (el) => {
    //   return (
    //     el.nodeName === 'template' &&
    //     getAttribute(el, 'shadowrootmode') === 'open'
    //   );
    // });

    replaceElementsContent(replacers, cloned);

    // TODO: Handle multiple slots
    const slots = findElements(cloned, findTag('slot'));
    const elementChildren = getChildNodes(customElement);

    for (const slot of slots) {
      const parentNode = getParentNode(slot);
      const slotName = getAttribute(slot, 'name');
      if (slotName) {
        const children = elementChildren.filter((child: Element) => {
          return slotName === getAttribute(child, 'slot');
        });

        const fragment = createDocumentFragment();
        for (const s of children) {
          appendChild(fragment, s);
        }

        replaceNode(slot, fragment);
        continue;
      }

      for (const child of elementChildren) {
        if (isTextNode(child)) {
          const content = child.value;
          insertBefore(
            parentNode,
            {
              nodeName: '#text',
              value: content,
            },
            slot,
          );
          remove(child);
        } else {
          replaceNode(slot, child);
        }
      }
    }
    for (const child of getChildNodes(cloned)) {
      appendChild(customElement, child);
    }
  }
}

function cloneNode(fragment: DocumentFragment) {
  return parseFragment(serialize(fragment));
}
