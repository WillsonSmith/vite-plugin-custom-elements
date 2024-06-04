import {
  Element,
  appendChild,
  createScript,
  findElement,
  getAttribute,
  getChildNodes,
  getTagName,
  setAttribute,
} from '@web/parse5-utils';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import { Document, DocumentFragment } from 'parse5/dist/tree-adapters/default';

import { generateManifest, getCustomElementsFromManifest } from './manifest';
import { findCustomElements } from './parsers';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles';
import { injectStyles } from './parsers/HtmlCustomElements/injectStyles/injectStyles';
import {
  RequiredElement,
  parseRequiredHtmlElements,
} from './parsers/HtmlCustomElements/parseRequiredHtmlElements/parseRequiredHtmlElements';
import { replaceElementsContent } from './parsers/HtmlCustomElements/replaceElementsContent/replaceElementsContent';
import { findTag } from './util/parse5';

const cwd = process.cwd();

type PluginCustomElementOptions = {
  root?: string;
  elementDir?: string;
};
export function pluginCustomElement({
  root = './',
  elementDir = 'components',
}: PluginCustomElementOptions) {
  return {
    name: 'plugin-custom-element',
    transformIndexHtml: async (content: string) => {
      const document = parse(content);
      const body = findElement(document, findTag('body'));

      const projectDir = path.join(cwd, root);
      const customElements: Element[] = findCustomElements(document);
      const customElementSourceFiles = await findHtmlElementFiles(
        path.join(projectDir, elementDir),
      );

      const parsedElements = await parseRequiredHtmlElements(
        customElements,
        customElementSourceFiles,
      );

      replaceElementsContent(parsedElements, document);
      injectStyles(parsedElements, document);

      injectScripts(projectDir, parsedElements, document);

      const hydrateScripts = await generateHydrationScripts(
        projectDir,
        customElements,
      );

      for (const script of hydrateScripts) {
        appendChild(body, script);
      }

      return serialize(document);
    },
  };
}

function injectScripts(
  rootDir: string,
  elements: RequiredElement[],
  root: Element | Document | DocumentFragment,
) {
  const scripts: Element[] = [];
  for (const element of elements) {
    const scriptTags = element.parsed.scriptTags;
    if (scriptTags.length === 0) continue;

    const scriptSources = new Set<string>();
    const scriptContents = new Set<string>();

    const relativePath = path.dirname(element.path).split(rootDir)[1];

    for (const tag of scriptTags) {
      const src = getAttribute(tag, 'src');

      if (src) {
        setAttribute(tag, 'src', path.join(relativePath, src));
        appendChild(root, tag);
        return;
      }

      const first = getChildNodes(tag)[0];
      if (first.nodeName === '#text') {
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

async function generateHydrationScripts(
  dir: string,
  customElements: Element[],
) {
  const scriptSources = new Set<string>();
  const availableElements = getCustomElementsFromManifest(
    await generateManifest(dir),
  );

  for (const el of customElements) {
    if (getAttribute(el, 'hydrate') !== undefined) {
      const available = availableElements.find((element) => {
        return element.tagName === getTagName(el);
      });

      if (available) {
        scriptSources.add(available.path.split(dir)[1]);
      }
    }
  }

  return Array.from(scriptSources, (source) => {
    return createScript({ type: 'module', src: source });
  });
}
