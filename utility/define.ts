export function define(
  tagName: string,
  elementClass: CustomElementConstructor,
) {
  if (globalThis.customElements) {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, elementClass);
    }
  }
}
