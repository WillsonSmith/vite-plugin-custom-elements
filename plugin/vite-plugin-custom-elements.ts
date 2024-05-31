// @ts-expect-error `create` exists but is not in the types.
import { create } from '@custom-elements-manifest/analyzer';
import {
  appendChild,
  createElement,
  createScript,
  findElement,
  findElements,
  findNode,
  getAttribute,
  getAttributes,
  getChildNodes,
  getParentNode,
  getTagName,
  getTemplateContent,
  insertBefore,
  isTextNode,
  remove,
  setAttribute,
} from '@web/parse5-utils';
import {
  CustomElementDeclaration,
  Declaration,
  Package,
} from 'custom-elements-manifest';
import { build as esbuild } from 'esbuild';
import { glob } from 'glob';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, parseFragment, serialize } from 'parse5';
import { Document, DocumentFragment } from 'parse5/dist/tree-adapters/default';
import postcss, { Rule } from 'postcss';
// @ts-expect-error No type definitions
import prefixSelector from 'postcss-prefix-selector';
import ts from 'typescript';

import { renderCustomElement } from './render/renderCustomElement';

type PluginOptions = {
  root: string;
  elementDir: string;
};
export const pluginCustomElement = (options: PluginOptions) => {
  return {
    name: 'plugin-custom-element',
    transformIndexHtml: transformIndex(options),
  };
};

const cwd = process.cwd();

function isCustomElement(tagName: string) {
  const reserved = [
    'annotation-xml',
    'color-profile',
    'font-face',
    'font-face-src',
    'font-face-uri',
    'font-face-format',
    'font-face-name',
    'missing-glyph',
  ];
  return tagName.includes('-') && !reserved.includes(tagName);
}

function findTag(tagName: string) {
  return (el: Element) => {
    return getTagName(el) === tagName;
  };
}

function transformIndex(options: PluginOptions) {
  const normalizedRoot = options.root.split(cwd).join('');
  const projectPath = path.join(cwd, normalizedRoot);

  return async (content: string) => {
    const doc = parse(content);
    const body = findElement(doc, findTag('body'));

    const customElements: Element[] = findElements(doc, (el) => {
      return isCustomElement(getTagName(el));
    });

    await replaceContentWithCERendered(customElements, projectPath);

    await replaceContentWithHTMLElements(
      doc,
      customElements,
      projectPath,
      options.elementDir,
    );

    return serialize(doc);
  };
}

function transformStyles(fragment: DocumentFragment, tagName: string) {
  const styles = findElements(fragment, findTag('style'));
  console.log(styles, tagName);
}

async function replaceContentWithHTMLElements(
  doc: Document,
  customElements: Element[],
  projectPath: string,
  elementDir: string,
) {
  const htmlElements = await glob(`${projectPath}/${elementDir}/**/*-*.html`);

  const styles = new Map<string, Element[]>();
  const scripts = new Map<string, { relativePath: string; tags: Element[] }>();
  const shadyScripts = new Map<
    string,
    { relativePath: string; tags: Element[] }
  >();

  for (const element of customElements) {
    const thisOne = htmlElements.find((e) => {
      return e.includes(getTagName(element));
    });
    if (!thisOne) continue;

    const markup = await readFile(thisOne, 'utf8');

    // I need to handle template content here.
    // Focused on shadowrootmode="open" right now but should also consider non-shadow templates
    const fragment = parseFragment(markup);
    const shadowTemplates = findElement(fragment, (element) => {
      return Boolean(
        element.tagName === 'template' &&
          getAttribute(element, 'shadowrootmode'),
      );
    });

    const templateContent = shadowTemplates
      ? getTemplateContent(shadowTemplates)
      : undefined;

    const styleTags = findElements(fragment, (element: Element) => {
      if (getTagName(element) !== 'style') return false;
      if (!templateContent) return true;

      const withinShadowedTemplate = findElement(templateContent, (el) => {
        return el === element;
      });

      return withinShadowedTemplate === null;
    });

    // This isn't entirely accurate. I need to transform the scripts but not add them to the body.
    const scriptTags = findElements(fragment, (element: Element) => {
      if (getTagName(element) !== 'script') return false;
      if (!templateContent) return true;

      const withinShadowedTemplate = findElement(templateContent, (el) => {
        return el === element;
      });

      return withinShadowedTemplate === null;
    });

    const shadyScriptTags = findElements(fragment, (element: Element) => {
      if (getTagName(element) !== 'script') return false;
      if (!templateContent) return true;

      const withinShadowedTemplate = findElement(templateContent, (el) => {
        return el === element;
      });

      return withinShadowedTemplate !== null;
    });

    transformScriptsForShady(
      shadyScriptTags,
      path.dirname(thisOne.split(projectPath).join('')),
    );

    shadyScripts.set(getTagName(element), {
      relativePath: thisOne.split(projectPath).join(''),
      tags: shadyScriptTags,
    });

    styles.set(getTagName(element), styleTags);
    styleTags.forEach((style) => remove(style));

    scripts.set(getTagName(element), {
      relativePath: thisOne.split(projectPath).join(''),
      tags: scriptTags,
    });

    scriptTags.forEach((script) => remove(script));

    replaceElement(
      element,
      copyWithElementChildren(element, serialize(fragment)),
    );
  }

  const styleSet = new Set<string>();

  for (const [tag, st] of styles) {
    for (const t of st) {
      const child = getChildNodes(t)[0];
      if (child && isTextNode(child)) {
        const transformed = await postcss([
          prefixSelector({
            prefix: tag,
            transform: (
              prefix: string,
              selector: string,
              prefixedSelector: string,
              _: string,
              rule: Rule,
            ) => {
              // If nested selector { a { ... } }
              if (rule.parent && 'selector' in rule.parent) {
                const selector = rule.parent.selector as string | undefined;
                if (selector?.includes(prefix)) {
                  return selector;
                }
              }

              if (selector.startsWith('body') || selector.startsWith('html')) {
                return selector;
              }
              if (selector.startsWith(':host')) {
                return prefix;
              }
              return prefixedSelector;
            },
          }),
        ])
          .process(child.value)
          .then((result) => result.css);
        styleSet.add(transformed);
      }
    }
  }

  const scriptContents = new Set<string>();
  const scriptSrcs = new Set<string>();

  for (const [, scriptList] of scripts) {
    for (const script of scriptList.tags) {
      const src = getAttribute(script, 'src');
      if (src) {
        const elementRoot = path.dirname(scriptList.relativePath);
        const relativePath = path.join(elementRoot, src);
        scriptSrcs.add(relativePath);
      } else {
        const content = getChildNodes(script)[0];
        if (content && isTextNode(content)) {
          const importerPath = path.dirname(scriptList.relativePath);

          let value = content.value;

          const staticImportRegex =
            /import\s+((?:[\w*\s{},]*\s*from\s*)?['"])([^'"]+)(['"])/;

          value = value.replace(
            staticImportRegex,
            (_: string, p1: string, importPath: string, p3: string) => {
              return `import ${p1}${path.join(importerPath, importPath)}${p3}`;
            },
          );

          const dynamicImportRegex = /(import\s*\(\s*['"])([^'"]+)(['"]\s*\))/g;

          value = value.replace(
            dynamicImportRegex,
            (_: string, p1: string, importPath: string, p3: string) => {
              return `${p1}${path.join(importerPath, importPath)}${p3}`;
            },
          );

          scriptContents.add(value);
        }
      }
    }
  }

  for (const source of Array.from(scriptSrcs)) {
    appendChild(
      findElement(doc, findTag('body')),
      createScript({ type: 'module', src: source }),
    );
  }

  for (const content of Array.from(scriptContents)) {
    appendChild(
      findElement(doc, findTag('body')),
      createScript({ type: 'module', content }),
    );
  }

  const styleTags = Array.from(styleSet).map((content) => {
    const style = createElement('style');

    style.childNodes = [
      {
        nodeName: '#text',
        value: content,
        parentNode: null,
        attrs: [],
        __location: undefined,
      },
    ];
    return style;
  });

  for (const tag of styleTags) {
    appendChild(findElement(doc, findTag('head')), tag);
  }
}

function transformScriptsForShady(scripts: Element[], elementRoot: string) {
  for (const script of scripts) {
    const src = getAttribute(script, 'src');

    if (src) {
      setAttribute(script, 'src', path.join(elementRoot, src));
    }
    const content = getChildNodes(script)[0];
    if (content && isTextNode(content)) {
      const staticImportRegex =
        /import\s+((?:[\w*\s{},]*\s*from\s*)?['"])([^'"]+)(['"])/;

      const dynamicImportRegex = /(import\s*\(\s*['"])([^'"]+)(['"]\s*\))/g;

      const importerPath = elementRoot;
      let value = content.value;
      value = value.replace(
        staticImportRegex,
        (_: string, p1: string, importPath: string, p3: string) => {
          return `import ${p1}${path.join(importerPath, importPath)}${p3}`;
        },
      );

      value = value.replace(
        dynamicImportRegex,
        (_: string, p1: string, importPath: string, p3: string) => {
          return `${p1}${path.join(importerPath, importPath)}${p3}`;
        },
      );

      replaceElement(script, createScript({ type: 'module' }, value));
    }
  }
}

async function replaceContentWithCERendered(
  customElements: Element[],
  projectPath: string,
) {
  const scripts = await gatherScripts(projectPath);
  const tsSourceFiles = await generateTSSourceFiles(scripts);

  if (tsSourceFiles.status === 'success') {
    const manifest = generateSourceManifest(tsSourceFiles.result);
    const customElementModules = gatherAvailableCustomElements(manifest);

    // Begin element loop
    for (const element of customElements) {
      const available = customElementModules.find((mod) => {
        return mod.tagName === getTagName(element);
      });

      if (!available) continue;

      const modPath = path.join(cwd, available.path);
      const markup = await renderCustomElement(available.className, modPath);

      if (markup.status === 'success') {
        replaceElement(element, copyWithElementChildren(element, markup.text));
      }
    }
  }
}

function replaceElement(element: Element, newElement: Element) {
  insertBefore(getParentNode(element), newElement, element);
  remove(element);
}

function copyWithElementChildren(element: Element, markupText: string) {
  const markupFragment = parseFragment(markupText);
  const newElement = createElement(getTagName(element));

  const shadowTemplates = findElement(markupFragment, (element) => {
    return Boolean(
      element.tagName === 'template' && getAttribute(element, 'shadowrootmode'),
    );
  });

  copyAttributes(element, newElement);

  if (shadowTemplates) {
    appendChild(newElement, shadowTemplates);
    moveChildren(element, newElement);
  } else {
    moveChildren(markupFragment, newElement);

    replaceSlotWithContent(markupFragment, newElement, getChildNodes(element));
  }
  return newElement;
}

function replaceSlotWithContent(
  fragment: DocumentFragment,
  element: Element,
  children: Element[],
) {
  const slot = findElement(fragment, findTag('slot'));

  if (slot) {
    const newElementSlot = findElement(element, findTag('slot'));
    for (const child of children) {
      const slotParent = getParentNode(newElementSlot);
      insertBefore(slotParent, child, slot);
    }

    remove(slot);
  }

  return element;
}

function moveChildren(
  currentElement: Element | DocumentFragment,
  newElement: Element,
) {
  const children = getChildNodes(currentElement);
  for (const child of children) {
    appendChild(newElement, child);
  }
  return newElement;
}

function copyAttributes(currentElement: Element, newElement: Element) {
  const attrs = Object.entries(getAttributes(currentElement));
  for (const [key, value] of attrs) {
    setAttribute(newElement, key, value);
  }
  return newElement;
}

async function gatherScripts(projectPath: string) {
  const files = await glob(`${projectPath}/**/*.{ ts, js }`, {
    ignore: 'node_modules/**',
  });
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

type AvailableElement = {
  path: string;
  tagName: string;
  className: string;
};

function gatherAvailableCustomElements(manifest: Package): AvailableElement[] {
  const customElements: AvailableElement[] = [];

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

/** filter Custom Element Manifest `Declaration[]` to `CustomElementDeclaration[]`.
 * @param {Declaration[]} declarations - An array of declarations from the custom element manifest generator.*/
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
