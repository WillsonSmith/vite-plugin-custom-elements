import path from 'node:path';
import { parse } from 'parse5';

import { generateManifest } from './manifest';
import { findCustomElements } from './parsers';

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

      const manifest = await generateManifest(projectDir);
      console.log(elements);
      console.log(manifest);
      return content;
    },
  };
}
