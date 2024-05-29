import {
  appendChild,
  createDocumentFragment,
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

import type {Package} from 'custom-elements-manifest';

import {create} from  '@custom-elements-manifest/analyzer';

import { readFile } from 'node:fs/promises';
import { parse, parseFragment, serialize } from 'parse5';
import path from 'node:path';
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

import {glob} from 'glob';
import ts  from 'typescript';

import { dynamicImportTs } from './plugin/dynamicImportTs';

function html(strings: TemplateStringsArray, ...values: unknown[]) {
    return String.raw({ raw: strings }, ...values);
  }


const htmlPlugin = ({
  rootDir = process.cwd(),
  componentsDir = 'components',
}: {
  rootDir: string;
  componentsDir: string;
}) => {
  return {
    name: 'html-transform',
    transformIndexHtml: async (htmlContent: string) => {

      // const availableElements = create()

      const cwd = process.cwd();

      const sourcePath = `${cwd}/${rootDir?.split(cwd).join('') || ''}`;

      const tsFiles = (await glob(`${sourcePath}/**/*.ts`, {ignore: 'node_modules/**'})).map(file => {
        return {
          path: file,
          source: readFile(file, 'utf8')
        };
      });

      const srcFiles = [];
      for (const file of tsFiles) {
        srcFiles.push(
          ts.createSourceFile(
            file.path.split(process.cwd()).join(''), 
            await file.source, 
            ts.ScriptTarget.ES2020,
            true
          ))
      }

      type AvailableElement = {
        tagName: string,
        path: string,
        className: string
      }

      const availableElements: AvailableElement[] = [];

      const manifest: Package = create({modules: srcFiles});

      for (const module of manifest.modules) {
        if (!module.declarations) continue;
        for (const declaration of module.declarations) {
          if ('customElement' in declaration && declaration.tagName) {
            const exports = module.exports?.find(mod => mod.name === declaration.name);
            if (exports !== undefined) {
              const tagName = declaration.tagName;
              const path = exports.declaration.module;
              const className = exports.name;
              if (tagName && path && className) {
              availableElements.push({
                tagName,
                path,
                className
              })
              }
            }
          }
        }
      }


      const doc = parse(htmlContent);
      const body = findElement(doc, findTag('html'));

      const customElements = findElements(doc, (el) =>
        isCustomElement(getTagName(el)),
      );

      for (const element of customElements) {
        try {

          let htmlFile: string | undefined;
          let scriptSrc: string | undefined;

          const available = availableElements.find(el => el.tagName === getTagName(element));
          if (available) {
            const modulePath = (sourcePath + available.path).split(rootDir).join('');
            const module = await dynamicImportTs(modulePath);
            const ElementClass = module[available.className];
            const n = new ElementClass();
            const markup = n.render({
              html
            });

            htmlFile = markup;
            scriptSrc = modulePath;
          }

          if (!htmlFile) {
            const htmlComponents = await glob(sourcePath + '/' + componentsDir + '/**/*-*.html');
            const thisComponent = htmlComponents.find(c => c.includes(getTagName(element)));

            if (thisComponent) {
              const content = await readFile(thisComponent, 'utf8');
              // htmlFile = content;

              const fragment = parseFragment(content);

              // Change script logic to copy to body if not there. This is important for content that is within the script tag.
              const script = findElement(fragment, (element) => {
                return getTagName(element) === 'script' && hasAttribute(element, 'src');
              });

              remove(script);
              htmlFile = serialize(fragment);

              const scSource = `${path.dirname(thisComponent)}/${getAttribute(script, 'src')}`;
              scriptSrc = scSource;
            }
          }

          if (!htmlFile) continue;

          if (scriptSrc) {
            const scriptExists = findElement(doc, (el) => {
              return (
                getTagName(el) === 'script' &&
                getAttribute(el, 'src') === scriptSrc
              );
            });

            if (!scriptExists) {
              appendChild(body, createElement('script', {src: scriptSrc, type: 'module'}));
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

            const newTag = createElement(getTagName(element));
            for (const [key, value] of Object.entries(getAttributes(element))) {
              setAttribute(newTag, key, value);
            }
            for (const c of getChildNodes(componentMarkup)) {
              appendChild(newTag, c);
            }

            const slot = findElement(componentMarkup, findTag('slot'));
            if (slot) {
              const slot = findElement(newTag, findTag('slot'));
              const children = getChildNodes(element);
              for (const child of children) {
                insertBefore(getParentNode(slot), child, slot);
              }
              remove(slot);
            }

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

export default defineConfig({
  build: {},
  root: 'src',
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  plugins: [
    transformImportedHtmlPlugin(),
    htmlPlugin({ rootDir: './src', componentsDir: 'components' }),
  ],
});
