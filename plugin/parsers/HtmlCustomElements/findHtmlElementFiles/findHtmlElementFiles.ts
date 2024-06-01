import { glob } from 'glob';
import { join } from 'node:path';

export async function findHtmlElementFiles(
  directory: string,
): Promise<string[]> {
  return await glob(join(directory, '**/*-*.html'));
}
