import {
  appendChild,
  createDocumentFragment,
  createElement,
  findElement,
  findElements,
  getChildNodes,
  getParentNode,
  getTagName,
  insertBefore,
  remove,
} from '@web/parse5-utils';
import { readFile } from 'node:fs/promises';
import { parse, parseFragment, serialize } from 'parse5';
import path from 'path';
import { defineConfig } from 'vite';
import viteRaw from 'vite-raw-plugin';

const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml: async (htmlContent: string) => {
      const doc = parse(htmlContent);
      // const html = findElement(doc, findTag('html'));
      // const head = findElement(doc, findTag('html'));
      // const body = findElement(doc, findTag('html'));

      const customElements = findElements(doc, (el) =>
        isCustomElement(getTagName(el)),
      );

      for (const element of customElements) {
        try {
          const f = await readFile(
            `${process.cwd()}/components/${element.tagName}/${element.tagName}.html`,
            'utf8',
          );

          const componentMarkup = parseFragment(f);
          const slot = findElement(componentMarkup, findTag('slot'));

          if (slot) {
            const newTag = createElement(getTagName(element));

            for (const c of getChildNodes(componentMarkup)) {
              appendChild(newTag, c);
            }

            const slot = findElement(newTag, findTag('slot'));
            const children = getChildNodes(element);
            for (const child of children) {
              insertBefore(getParentNode(slot), child, slot);
            }

            remove(slot);

            insertBefore(getParentNode(element), newTag, element);
            remove(element);
          }
        } catch (error) {
          console.log(error);
        }
      }

      return serialize(doc);
    },
  };
};
export default defineConfig({
  build: {},
  resolve: {
    alias: {
      '@/': path.resolve(__dirname),
    },
  },
  plugins: [
    viteRaw({
      fileRegex: /\.html$/,
    }),
    htmlPlugin(),
  ],
});

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
  return (el) => {
    return getTagName(el) === tagName;
  };
}
