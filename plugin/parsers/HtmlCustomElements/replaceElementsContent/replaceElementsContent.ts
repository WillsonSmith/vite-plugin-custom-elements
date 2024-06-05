import { findTag } from '../../../util/parse5';
import { findCustomElements } from '../../findCustomElements/findCustomElements';
import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import {
  Element,
  findElement,
  findElements,
  getAttribute,
  getAttributes,
  getChildNodes,
  getParentNode,
  getTagName,
  getTemplateContent,
  insertBefore,
  insertTextBefore,
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
    replaceElementsContent(replacers, cloned);

    const isShadow = findElement(replacer.parsed.content, (el) => {
      return (
        el.tagName === 'template' &&
        getAttribute(el, 'shadowrootmode') === 'open'
      );
    });

    const slots = findElements(cloned, findTag('slot'));
    const elementChildren = getChildNodes(customElement);

    const namedSlots = slots.filter((slot) => getAttribute(slot, 'name'));
    const primarySlot = slots.find((slot) => !getAttribute(slot, 'name'));
    const primarySlotParent = primarySlot && getParentNode(primarySlot);

    if (!isShadow) {
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
      for (const slot of slots) {
        remove(slot);
      }
    }

    customElement.childNodes = getChildNodes(cloned);
  }
}

function cloneNode(fragment: DocumentFragment) {
  return parseFragment(serialize(fragment));
}
