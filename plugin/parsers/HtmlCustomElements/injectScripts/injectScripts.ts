import { findTag, replaceNode } from '../../../util/parse5';
import type { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import {
  type Element,
  appendChild,
  createScript,
  findElements,
  getAttribute,
  getChildNodes,
  setAttribute,
} from '@web/parse5-utils';
import path from 'node:path';

export function transformShadowScripts(
  template: Element,
  element: RequiredElement,
  rootDir: string,
) {
  const scripts = findElements(template, findTag('script'));
  const relativePath = normalizePath(element.path, rootDir);

  for (const script of scripts) {
    const node = getChildNodes(script)[0];
    const textContent = node?.nodeName === '#text' && node.value;

    const src = getAttribute(script, 'src');
    if (src) {
      setAttribute(script, 'src', path.join(relativePath, src));
      continue;
    }

    if (textContent) {
      const newScript = createScript(
        { type: 'module' },
        transformScriptImports(relativePath, textContent),
      );

      replaceNode(script, newScript);
    }
  }
  return template;
}

function normalizePath(pathStr: string, rootDir: string) {
  return path.join('./', path.dirname(pathStr).split(rootDir)[1]);
}

export function injectScripts(
  rootDir: string,
  elements: RequiredElement[],
  root: Element | Document | DocumentFragment,
) {
  for (const element of elements) {
    const scriptTags = element.parsed.scriptTags;
    if (scriptTags.length === 0) continue;

    const relativePath = normalizePath(element.path, rootDir);
    const scriptContents = new Set<string>();
    for (const tag of scriptTags) {
      const src = getAttribute(tag, 'src');
      if (src) {
        setAttribute(tag, 'src', path.join(relativePath, src));
        appendChild(root, tag);
      }

      const first = getChildNodes(tag)[0];
      if (first?.nodeName === '#text') {
        scriptContents.add(transformScriptImports(relativePath, first.value));
      }
    }

    for (const script of Array.from(scriptContents)) {
      const scriptElement = createScript({ type: 'module' }, script);
      appendChild(root, scriptElement);
    }
  }
}

const STATIC_IMPORT_REGEX =
  /import\s+((?:[\w*\s{},]*\s*from\s*)?['"])([^'"]+)(['"])/;
const DYNAMIC_IMPORT_REGEX = /(import\s*\(\s*['"])([^'"]+)(['"]\s*\))/g;

function transformScriptImports(relativePath: string, scriptString: string) {
  return scriptString
    .replace(STATIC_IMPORT_REGEX, transformReplacer(relativePath, 'import '))
    .replace(DYNAMIC_IMPORT_REGEX, transformReplacer(relativePath));
}

function transformReplacer(relativePath: string, prefix: string = '') {
  return (_: string, p1: string, importPath: string, p3: string) => {
    return `${prefix}${p1}${path.join(relativePath, importPath)}${p3}`;
  };
}
