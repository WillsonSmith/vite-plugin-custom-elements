import { glob } from 'glob';
import { join } from 'node:path';

/** Finds a series of Html custom elements in a directory
 * @param {string} directory - Where to find elements (recursive) (pattern: some-element.html)
 */
export async function findHtmlElementFiles(
  directory: string,
): Promise<string[]> {
  return await glob(join(directory, '**/*-*.html'));
}
