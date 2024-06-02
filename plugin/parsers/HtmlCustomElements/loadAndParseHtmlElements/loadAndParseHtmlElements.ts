import {
  type ParsedHtmlElement,
  parseHtmlElement,
} from '../parseHtmlElement/parseHtmlElement';
import { readFile } from 'node:fs/promises';
import { parseFragment } from 'parse5';

export async function loadAndParseHtmlElement(
  file: string,
): Promise<ParsedHtmlElement> {
  const loaded = await readFile(file, 'utf8');
  return parseHtmlElement(parseFragment(loaded));
}

export async function loadAndParseHtmlElements(
  files: string[],
): Promise<ParsedHtmlElement[]> {
  return await Promise.all(files.map(loadAndParseHtmlElement));
}
