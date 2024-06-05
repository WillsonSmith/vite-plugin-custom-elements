import { findTag } from '../../../util/parse5';
import { findCustomElements } from '../../findCustomElements/findCustomElements';
import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import {
  Element,
  findElements,
  getAttribute,
  getChildNodes,
  getParentNode,
  getTagName,
  insertBefore,
  insertTextBefore,
  isTextNode,
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
    const slots = findElements(cloned, findTag('slot'));
    const elementChildren = getChildNodes(customElement);

    const namedSlots = slots.filter((slot) => getAttribute(slot, 'name'));
    const primarySlot = slots.find((slot) => !getAttribute(slot, 'name'));
    const primarySlotParent = primarySlot && getParentNode(primarySlot);

    for (const child of elementChildren) {
      const slotName = getAttribute(child, 'slot');
      if (slotName) {
        const slot = namedSlots.find(
          (slot) => slotName === getAttribute(slot, 'name'),
        );

        if (slot) {
          insertBefore(getParentNode(slot), child, slot);
          continue;
        }
      }

      if (primarySlot) {
        if (isTextNode(child)) {
          insertTextBefore(primarySlotParent, child.value, primarySlot);
          continue;
        }
        insertBefore(primarySlotParent, child, primarySlot);
      }
    }

    customElement.childNodes = getChildNodes(cloned);
  }
}

function cloneNode(fragment: DocumentFragment) {
  return parseFragment(serialize(fragment));
}
