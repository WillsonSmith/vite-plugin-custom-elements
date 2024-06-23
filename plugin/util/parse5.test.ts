import { appendChild, createElement, findElement } from '@web/parse5-utils';
import { parse } from 'parse5';
import { describe, expect, it } from 'vitest';

import {
  createTextNode,
  findTag,
  serializeRawStringsForTag,
} from './parse5.js';

describe('serializeWithStringifiedTags', () => {
  it('does not escape content within tag', () => {
    const doc = parse('<!doctype html><html><head></head><body></body></html>');

    const styleTags = Array.from({ length: 5 }, () => {
      const tag = createElement('style');
      tag.childNodes = [createTextNode('.test { &.test2 { color: red; } }')];
      return tag;
    });

    const head = findElement(doc, findTag('head'));
    for (const tag of styleTags) {
      appendChild(head, tag);
    }

    const result = serializeRawStringsForTag(doc, 'style');
    expect(result).toContain('&.test2');
  });
});
