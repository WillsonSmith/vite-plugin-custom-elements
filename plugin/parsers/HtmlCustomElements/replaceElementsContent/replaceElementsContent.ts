import { findTag } from '../../../util/parse5';
import { findCustomElements } from '../../findCustomElements/findCustomElements';
import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import {
  appendChild,
  findElement,
  getAttribute,
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

    if (replacer) {
      const cloned = cloneNode(replacer.parsed.content);
      const isTemplate = findElement(cloned, (el) => {
        return (
          el.nodeName === 'template' &&
          getAttribute(el, 'shadowrootmode') === 'open'
        );
      });

      replaceElementsContent(replacers, cloned);

      // TODO: Handle multiple slots
      const slot = findElement(cloned, findTag('slot'));
      const elementChildren = getChildNodes(customElement);
      if (slot) {
        for (const child of elementChildren) {
          if (child.nodeName === 'slot') continue;

          if (isTextNode(child)) {
            const content = child.value;

            insertBefore(
              getParentNode(slot),
              {
                nodeName: '#text',
                value: content,
              },
              slot,
            );
            remove(child);
          } else {
            insertBefore(getParentNode(slot), child, slot);
          }
        }
        // remove(slot);
      }

      if (!isTemplate) {
        for (const child of elementChildren) {
          remove(child);
        }
      }
      for (const child of getChildNodes(cloned)) {
        appendChild(customElement, child);
      }
    }
  }
}

function cloneNode(fragment: DocumentFragment) {
  return parseFragment(serialize(fragment));
}
