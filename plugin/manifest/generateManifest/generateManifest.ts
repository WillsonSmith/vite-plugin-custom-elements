// @ts-expect-error This IS exported
import { create } from '@custom-elements-manifest/analyzer';
import { Package } from 'custom-elements-manifest';
import { glob } from 'glob';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

/** Generate a manifest of JavaScirpt modules in a directory
 * @param {string} directory - The directory to search for modules.
 */
export async function generateManifest(directory: string): Promise<Package> {
  const scripts = findScripts(directory);
  const typescriptSources = createTypescriptSources(await scripts);

  return create({ modules: await typescriptSources });
}

type SourceScript = {
  path: string;
  file: Promise<string>;
};

async function findScripts(directory: string): Promise<SourceScript[]> {
  const files = await glob(path.join(directory, '/**/*.{ts,js}'), {
    ignore: 'node_modules/**',
  });

  return files.map((filePath: string) => {
    return { path: filePath, file: readFile(filePath, 'utf8') };
  });
}

async function createTypescriptSources(
  sourceFiles: SourceScript[],
): Promise<ts.SourceFile[]> {
  return Promise.all(
    sourceFiles.map(async (source) => {
      return ts.createSourceFile(
        source.path,
        await source.file,
        ts.ScriptTarget.ES2020,
        true,
      );
    }),
  );
}
