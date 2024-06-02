import { appendChild, createElement, getTagName } from '@web/parse5-utils';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, parseFragment } from 'parse5';

import { generateManifest, getCustomElementsFromManifest } from './manifest';
import { findCustomElements } from './parsers';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles';
import { loadAndParseHtmlElements } from './parsers/HtmlCustomElements/loadAndParseHtmlElements/loadAndParseHtmlElements';
import { parseHtmlElement } from './parsers/HtmlCustomElements/parseHtmlElement/parseHtmlElement';

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
      const projectDir = path.join(cwd, root);

      const document = parse(content);
      const elements: Element[] = findCustomElements(document);

      const htmlCustomElementFiles = await findHtmlElementFiles(
        path.join(projectDir, elementDir),
      );

      const files: string[] = elements
        .map((element: Element) => {
          return htmlCustomElementFiles.find((file) =>
            file.includes(getTagName(element)),
          );
        })
        .filter(Boolean) as string[];

      const parsedHtmlElements = loadAndParseHtmlElements(files);

      const jsM = await generateManifest(projectDir);
      const jsEls = getCustomElementsFromManifest(jsM);

      // use this to get ones marked as hydratable
      // If one has `hydrate="true"` then auto-inject
      const includedJsEls = jsEls.filter((el) => {
        return elements.find((element) => {
          return getTagName(element) === el.tagName;
        });
      });

      console.log(includedJsEls);

      return content;
    },
  };
}
