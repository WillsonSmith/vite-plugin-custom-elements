import {
  generateManifest,
  getCustomElementsFromManifest,
} from '../../manifest';
import { createScript, getAttribute, getTagName } from '@web/parse5-utils';

export async function generateHydrationScripts(
  dir: string,
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
        scriptSources.add(available.path.split(dir)[1]);
      }
    }
  }

  return Array.from(scriptSources, (source) => {
    return createScript({ type: 'module', src: source });
  });
}
