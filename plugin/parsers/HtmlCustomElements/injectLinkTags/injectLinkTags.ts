import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import {
  createElement,
  findElement,
  getAttribute,
  getTagName,
  insertText,
  remove,
  setAttribute,
} from '@web/parse5-utils';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function transformLinkUrls(
  rootDir: string,
  element: RequiredElement,
) {
  const content = element.parsed.content;
  const linkTags = element.parsed.linkTags;

  const shadowTemplate = findElement(content, (el) => {
    return (
      getTagName(el) === 'template' &&
      getAttribute(el, 'shadowrootmode') === 'open'
    );
  });

  const style = createElement('style');
  const linkContents = new Set<string>();

  for (const tag of linkTags) {
    const relativePath = normalizePath(element.path, rootDir);
    const currentHref = getAttribute(tag, 'href');

    if (getAttribute(tag, 'rel') === 'stylesheet') {
      if (!shadowTemplate) {
        const href = getAttribute(tag, 'href');
        if (href) {
          const filePath = path.join(path.dirname(element.path), href);
          const content = await readFile(filePath, 'utf8').catch(
            () => undefined,
          );

          if (content) {
            linkContents.add(content);
          }
        }
        for (const content of linkContents) {
          insertText(style, content);
        }
        if (linkContents.size > 0) {
          element.parsed.styleTags.push(style);
        }
        for (const tag of linkTags) {
          remove(tag);
        }
      }
    }

    if (shadowTemplate) {
      if (currentHref) {
        const np = path.join(relativePath, currentHref);
        console.log(np);
        setAttribute(tag, 'href', np);
      }
    }
  }
}

function normalizePath(pathStr: string, rootDir: string) {
  return path.join('/', path.dirname(pathStr).split(rootDir)[1]);
}
