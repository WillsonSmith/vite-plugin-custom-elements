import { RequiredElement } from '../parseRequiredHtmlElements/parseRequiredHtmlElements';
import { getAttribute, setAttribute } from '@web/parse5-utils';
import path from 'node:path';

export function transformLinkUrls(rootDir: string, element: RequiredElement) {
  const linkTags = element.parsed.linkTags;

  for (const tag of linkTags) {
    const relativePath = normalizePath(element.path, rootDir);
    const currentHref = getAttribute(tag, 'href');
    if (currentHref) {
      setAttribute(tag, 'href', path.join(relativePath, currentHref));
    }
  }
}

function normalizePath(pathStr: string, rootDir: string) {
  return path.join('./', path.dirname(pathStr).split(rootDir)[1]);
}
