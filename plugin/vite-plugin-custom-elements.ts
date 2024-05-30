// @ts-expect-error `create` exists but is not in the types.
import { create } from '@custom-elements-manifest/analyzer';
import {
  CustomElementDeclaration,
  Declaration,
  Package,
} from 'custom-elements-manifest';
import { glob } from 'glob';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

type PluginOptions = {
  root: string;
  elementDir: string;
};
export const pluginCustomElement = (options: PluginOptions) => {
  return {
    name: 'plugin-custom-element',
    transformIndexHTML: transformIndex(options),
  };
};

const cwd = process.cwd();
async function transformIndex(options: PluginOptions) {
  const normalizedRoot = options.root.split(cwd).join('');
  const projectPath = path.join(cwd, normalizedRoot);

  const scripts = await gatherScripts(projectPath);
  const tsSourceFiles = await generateTSSourceFiles(scripts);

  if (tsSourceFiles.status === 'success') {
    const manifest = generateSourceManifest(tsSourceFiles.result);
    const customElements = gatherAvailableCustomElements(manifest);
    console.log(customElements);
  }
}

async function gatherScripts(projectPath: string) {
  const files = await glob(`${projectPath}/**/*.{ts,js}`);
  return files.map((path) => {
    return { path, file: readFile(path, 'utf8') };
  });
}

type TSSourceFileResponse = {
  status: 'success' | 'error';
  result: ts.SourceFile[];
};

async function generateTSSourceFiles(
  sources: { path: string; file: Promise<string> }[],
): Promise<TSSourceFileResponse> {
  const tsSources: ts.SourceFile[] = [];

  try {
    for (const source of sources) {
      await source.file.then((file) => {
        tsSources.push(
          ts.createSourceFile(
            source.path.split(cwd).join(''),
            file,
            ts.ScriptTarget.ES2020,
            true,
          ),
        );
      });
    }
    return {
      status: 'success',
      result: tsSources,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 'error',
      result: [],
    };
  }
}

function generateSourceManifest(sources: ts.SourceFile[]) {
  return create({ modules: sources }) as Package;
}

type CustomElementModule = {
  path: string;
  tagName: string;
  className: string;
};

function gatherAvailableCustomElements(
  manifest: Package,
): CustomElementModule[] {
  const customElements: CustomElementModule[] = [];

  for (const module of manifest.modules) {
    if (!module.exports) continue;
    if (!module.declarations) continue;

    const customElementsDeclarations = getCEDeclarations(module.declarations);
    for (const exp of module.exports) {
      const tag = customElementsDeclarations.find(
        (d) => d.name === exp.name,
      )?.tagName;

      const mod = exp.declaration.module;
      if (!(mod && tag)) continue;

      customElements.push({
        path: mod,
        tagName: tag,
        className: exp.name,
      });
    }
  }

  return customElements;
}

function getCEDeclarations(
  declarations: Declaration[],
): CustomElementDeclaration[] {
  const customElements = [];
  for (const declaration of declarations) {
    if (!('customElement' in declaration)) continue;
    if (declaration.kind === 'mixin') continue;
    if (!declaration.tagName) continue;
    customElements.push(declaration);
  }
  return customElements;
}
