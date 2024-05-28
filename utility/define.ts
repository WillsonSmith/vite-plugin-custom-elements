export function define(
  tagName: string,
  elementClass: CustomElementConstructor,
) {
  if (!customElements?.get(tagName)) {
    customElements.define(tagName, elementClass);
  }
}
