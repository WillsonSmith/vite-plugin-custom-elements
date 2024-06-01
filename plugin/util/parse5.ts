import { getTagName } from '@web/parse5-utils';

export function findTag(tagName: string) {
  return (el: Element) => {
    return getTagName(el) === tagName;
  };
}
