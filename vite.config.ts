// @ts-expect-error `create` exists but is not in the types.
import { create } from '@custom-elements-manifest/analyzer';
import {
  appendChild,
  createElement,
  findElement,
  findElements,
  findNode,
  getAttribute,
  getAttributes,
  getChildNodes,
  getParentNode,
  getTagName,
  getTemplateContent,
  hasAttribute,
  insertBefore,
  remove,
  setAttribute,
} from '@web/parse5-utils';
import type { Package } from 'custom-elements-manifest';
import { glob } from 'glob';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, parseFragment, serialize } from 'parse5';
import ts from 'typescript';
import { defineConfig } from 'vite';

import { pluginCustomElement } from './plugin/plugin-custom-element';

const transformImportedHtmlPlugin = () => {
  return {
    name: 'transform-imported-html',

    transform(src: string, id: string) {
      const regex = /\.html\?component$/;
      if (regex.test(id)) {
        const fragment = parseFragment(src);
        const templateNode = findNode(
          fragment,
          (el) => getTagName(el) === 'template',
        );

        if (templateNode) {
          for (const child of getChildNodes(getTemplateContent(templateNode))) {
            appendChild(fragment, child);
          }
          remove(templateNode);
        }

        return {
          code: `export default \`${serialize(fragment).trim()}\``,
        };
      }
    },
  };
};

export default defineConfig({
  build: {},
  root: 'src',
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@/plugin': path.resolve(__dirname, 'plugin'),
    },
  },
  test: {
    root: './',
  },
  plugins: [
    transformImportedHtmlPlugin(),
    pluginCustomElement({
      root: './src',
    }),
    // htmlPlugin({ rootDir: './src', componentsDir: 'components' }),
    // pluginCustomElement({ root: './src', elementDir: 'components' }),
  ],
});
