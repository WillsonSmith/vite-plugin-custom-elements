import {
  appendChild,
  createDocumentFragment,
  createElement,
  findElement,
  findElements,
  findNode,
  getAttribute,
  getChildNodes,
  getParentNode,
  getTagName,
  getTemplateContent,
  insertBefore,
  remove,
} from '@web/parse5-utils';
import { readFile } from 'node:fs/promises';
import { parse, parseFragment, serialize } from 'parse5';
import path from 'path';
import { defineConfig } from 'vite';

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

const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml: async (htmlContent: string) => {
      const doc = parse(htmlContent);
      const body = findElement(doc, findTag('html'));

      const customElements = findElements(doc, (el) =>
        isCustomElement(getTagName(el)),
      );

      for (const element of customElements) {
        try {
          const { html: htmlFile, script: scriptFile } =
            await readComponentFile({
              componentDir: './components/',
              componentName: getTagName(element),
            });

          if (!htmlFile) return;

          if (scriptFile) {
            const scriptExists = findElement(doc, (el) => {
              return (
                getTagName(el) === 'script' &&
                getAttribute(el, 'src') ===
                  `./components/${getTagName(element)}/${getTagName(element)}.ts`
              );
            });

            if (!scriptExists) {
              appendChild(
                body,
                createElement('script', {
                  src: `./components/${getTagName(element)}/${getTagName(element)}.ts`,
                  type: 'module',
                }),
              );
            }
          }

          const componentMarkup = parseFragment(htmlFile);

          const templateNode = findNode(
            componentMarkup,
            (el) => getTagName(el) === 'template',
          );

          /* When using a template w/ shadowrootmode="open" it should maintain the template node */
          if (templateNode) {
            const newTag = createElement(getTagName(element));
            appendChild(newTag, templateNode);

            for (const child of getChildNodes(element)) {
              appendChild(newTag, child);
            }
            insertBefore(getParentNode(element), newTag, element);
            remove(element);
          } else {
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
    // viteRaw({
    //   fileRegex: /\.html$/,
    // }),
    transformImportedHtmlPlugin(),
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

type ReadComponentOptions = {
  componentDir: string;
  componentName: string;
  rootDir?: string;
};

async function readComponentFile({
  componentDir,
  componentName,
  rootDir = process.cwd(),
}: ReadComponentOptions) {
  const dir = `${rootDir}/${componentDir}/${componentName}/${componentName}`;
  const html = await readFile(dir + '.html', 'utf8').catch(() => undefined);
  const script = await readFile(dir + '.ts', 'utf8').catch(() => undefined);
  return { html, script };
}
