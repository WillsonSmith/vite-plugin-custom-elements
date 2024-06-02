import {
  type ParsedHtmlElement,
  parseHtmlElement,
} from '../parseHtmlElement/parseHtmlElement';
import { readFile } from 'node:fs/promises';
import { parseFragment } from 'parse5';

export async function loadAndParseHtmlElements(
  files: string[],
): Promise<ParsedHtmlElement[]> {
  const loaded = await Promise.all(
    files.map((file) => {
      return readFile(file, 'utf8');
    }),
  );

  return loaded.map((file) => parseHtmlElement(parseFragment(file)));
}
