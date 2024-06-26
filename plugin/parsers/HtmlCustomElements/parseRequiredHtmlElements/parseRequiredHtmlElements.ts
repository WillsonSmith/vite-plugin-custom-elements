import { findCustomElements } from '../../findCustomElements/findCustomElements.js';
import { loadAndParseHtmlElement } from '../loadAndParseHtmlElements/loadAndParseHtmlElements.js';
import { ParsedHtmlElement } from '../parseHtmlElement/parseHtmlElement.js';
import { Element, getTagName } from '@web/parse5-utils';

// I don't think I should use this elsewhere?
export type RequiredElement = {
  path: string;
  tagName: string;
  parsed: ParsedHtmlElement;
};

export async function parseRequiredHtmlElements(
  customElements: Element[],
  sourceFiles: string[],
): Promise<RequiredElement[]> {
  const result: RequiredElement[] = [];

  for (const element of customElements) {
    const tagName: string = getTagName(element);
    const thisFile = sourceFiles.find((file) => file.includes(tagName));

    if (thisFile) {
      const parsed = await loadAndParseHtmlElement(thisFile);
      const nested = findCustomElements(parsed.content);
      if (nested.length > 0) {
        result.push(...(await parseRequiredHtmlElements(nested, sourceFiles)));
      }

      result.push({
        path: thisFile,
        tagName,
        parsed: parsed,
      });
    }
  }

  // TODO: Make efficient
  return deduplicateParsedList(result);
}

function deduplicateParsedList(list: RequiredElement[]) {
  const collected = new Map<string, [string, ParsedHtmlElement]>();
  for (const available of list) {
    const { path, tagName, parsed } = available;
    if (!collected.has(tagName)) {
      collected.set(tagName, [path, parsed]);
    }
  }

  return Array.from(collected.entries(), ([tagName, [path, parsed]]) => ({
    tagName,
    path,
    parsed,
  }));
}
