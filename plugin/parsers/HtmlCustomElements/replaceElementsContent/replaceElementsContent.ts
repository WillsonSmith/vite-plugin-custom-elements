import { findTag } from '../../../util/parse5.js';
import { findCustomElements } from '../../findCustomElements/findCustomElements.js';
import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements.js';
import {
  Element,
  appendChild,
  findElement,
  findElements,
  getAttribute,
  getChildNodes,
  getParentNode,
  getTagName,
  insertBefore,
  insertTextBefore,
  isTextNode,
  remove,
} from '@web/parse5-utils';
import { parseFragment, serialize } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';

type Document = DefaultTreeAdapterMap['document'];
type DocumentFragment = DefaultTreeAdapterMap['documentFragment'];

export function replaceElementsContent(
  replacers: RequiredElement[],
  root: Document | DocumentFragment | Element,
) {
  const customElements = findCustomElements(root);

  for (const customElement of customElements) {
    const replacer = replacers.find(
      (replacer) => getTagName(customElement) === replacer.tagName,
    );

    if (replacer === undefined) {
      continue;
    }

    const replacerContent = replacer.parsed.content;
    const replacerClone = cloneNode(replacerContent);
    replaceElementsContent(replacers, replacerClone);

    const replacerSlots = findElements(replacerClone, findTag('slot'));
    const [namedSlots, unnamedSlots] = getSlotTypes(replacerSlots);

    const unnamedSlot = unnamedSlots[0];
    const unnamedSlotParent = unnamedSlot
      ? getParentNode(unnamedSlot)
      : undefined;

    const shadowTemplate = findElement(
      replacerContent,
      (el) =>
        el.tagName === 'template' &&
        getAttribute(el, 'shadowrootmode') === 'open',
    );

    if (shadowTemplate !== null) {
      for (const child of getChildNodes(replacerClone)) {
        appendChild(customElement, child);
      }
      continue;
    }

    const currentElementChildren = getChildNodes(customElement);
    for (const currentElementChild of currentElementChildren) {
      const childSlotName = getAttribute(currentElementChild, 'slot');

      if (childSlotName) {
        const slotForName = namedSlots.find(
          (slot: Element) => getAttribute(slot, 'name') === childSlotName,
        );

        if (slotForName) {
          insertBefore(
            getParentNode(slotForName),
            currentElementChild,
            slotForName,
          );
          continue;
        }
      }

      if (unnamedSlot) {
        if (isTextNode(currentElementChild)) {
          insertTextBefore(
            unnamedSlotParent,
            currentElementChild.value,
            unnamedSlot,
          );
          continue;
        }
        insertBefore(unnamedSlotParent, currentElementChild, unnamedSlot);
      }
    }

    for (const slot of replacerSlots) remove(slot);
    customElement.childNodes = getChildNodes(replacerClone);
  }
}

function cloneNode(fragment: DocumentFragment) {
  return parseFragment(serialize(fragment));
}

function getSlotTypes(slots: Element): [Element, Element] {
  const named = [];
  const unnamed = [];

  for (const slot of slots) {
    if (getAttribute(slot, 'name')) {
      named.push(slot);
      continue;
    }
    unnamed.push(slot);
  }
  return [named, unnamed];
}
