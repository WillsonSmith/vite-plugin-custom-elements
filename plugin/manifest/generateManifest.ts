// @ts-expect-error `create` exists but is not in the types.
import { type Module, create } from '@custom-elements-manifest/analyzer';
import {
  CustomElementDeclaration,
  Declaration,
  Package,
} from 'custom-elements-manifest';
import { glob } from 'glob';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

export async function generateManifest(directory: string): Module {
  const scripts = findScripts(directory);
  const typescriptSources = createTypescriptSources(await scripts);

  return create(typescriptSources);
}

type SourceScript = {
  path: string;
  file: Promise<string>;
};

async function findScripts(directory: string): Promise<SourceScript[]> {
  const files = await glob(path.join(directory, '/**/*.{ts,js}'));

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
