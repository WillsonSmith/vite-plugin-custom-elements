import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function fixtureDir(file: string = '') {
  return fileURLToPath(join(dirname(import.meta.url), 'fixtures', file));
}
