import {
  generateManifest,
  getCustomElementsFromManifest,
} from '../../manifest/index.js';
import { createScript, getAttribute, getTagName } from '@web/parse5-utils';
import type { Element } from '@web/parse5-utils';
import path from 'node:path';

export async function generateHydrationScripts(
  dir: string,
  indexDir: string,
  customElements: Element[],
) {
  const scriptSources = new Set<string>();
  const availableElements = getCustomElementsFromManifest(
    await generateManifest(dir),
  );

  for (const el of customElements) {
    if (getAttribute(el, 'hydrate') !== undefined) {
      const available = availableElements.find((element) => {
        return element.tagName === getTagName(el);
      });

      if (available) {
        scriptSources.add(path.relative(indexDir, available.path));
      }
    }
  }

  return Array.from(scriptSources, (source) => {
    return createScript({ type: 'module', src: source });
  });
}
