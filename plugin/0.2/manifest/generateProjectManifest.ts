import { getCustomElementsFromManifest } from '../../manifest/getCustomElementsFromManifest/getCustomElementsFromManifest.js';
import { create } from '@custom-elements-manifest/analyzer';
import { glob } from 'glob';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

type ProjectManifest = {
  elements: { fileName: string; tagName: string; type: 'ts' | 'html' }[];
};

/**
 * Creates a ProjectManifest of all custom element types.
 *
 * A ProjectManifest is a list of `.html`, `.ts`, and `.js` that match the plugin's custom element definition pattern.
 */
export async function generateProjectManifest(
  directories: string[],
): Promise<ProjectManifest> {
  let elements: ProjectManifest['elements'] = [];

  for (const directory of directories) {
    let scriptFiles: FileForDir[] = [];
    let htmlFiles: FileForDir[] = [];

    for (const file of await filesForDir(directory)) {
      if (file.path.endsWith('html')) {
        htmlFiles.push(file);
      }

      if (['ts', 'js'].some((f) => file.path.endsWith(f))) {
        scriptFiles.push(file);
      }
    }

    for (const file of htmlFiles) {
      if (file.path.includes('-')) {
        elements.push({
          fileName: file.path,
          tagName: trimFileName(file.path),
          type: 'html',
        });
      }
    }

    const ts = await manifestElementsFromTS(scriptFiles);
    elements.push(...ts);
  }

  return {
    elements,
  };
}

async function manifestElementsFromTS(
  files: FileForDir[],
): Promise<ProjectManifest['elements']> {
  let modules: ts.SourceFile[] = [];
  for (const file of files) {
    const content = await readFile(file.path, 'utf8');
    modules.push(
      ts.createSourceFile(file.path, content, ts.ScriptTarget.ES2020, true),
    );
  }
  const manifest = await create({ modules });
  const customElements = getCustomElementsFromManifest(manifest);
  return customElements.map((e) => ({
    fileName: e.path,
    tagName: e.tagName,
    type: 'ts',
  }));
}

type FileForDir = { path: string };
async function filesForDir(directory: string): Promise<FileForDir[]> {
  const pattern = path.join(directory, '/**/*.{ts,js,html}');
  const files = await glob(pattern, { ignore: 'node_modules/**' });
  return files.map((path) => {
    return { path };
  });
}

function trimFileName(nameWithExtension: string) {
  return path
    .basename(nameWithExtension)
    .split(path.extname(nameWithExtension))[0];
}
