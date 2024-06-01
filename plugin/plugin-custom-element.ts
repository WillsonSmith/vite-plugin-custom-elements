import { getTagName } from '@web/parse5-utils';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, parseFragment } from 'parse5';

import { generateManifest } from './manifest';
import { findCustomElements } from './parsers';
import { findHtmlElementFiles } from './parsers/HtmlCustomElements/findHtmlElementFiles/findHtmlElementFiles';
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
      const elements = findCustomElements(document);

      const htmlCustomElementFiles = await findHtmlElementFiles(
        path.join(projectDir, elementDir),
      );

      const included = htmlCustomElementFiles.filter((elementFile) => {
        return elements.find((el) => elementFile.includes(getTagName(el)));
      });

      const parsed = await Promise.all(
        included.map(async (el) => {
          return {
            tagName: path.basename(el).split('.html')[0],
            parts: parseHtmlElement(parseFragment(await readFile(el, 'utf8'))),
          };
        }),
      );

      console.log(parsed);

      return content;
    },
  };
}
