/**
 * An element to lay out content in various ways
 * @element x-layout
 */
export class XLayout extends HTMLElement {
  layout?: HTMLElement;
  connectedCallback() {
    console.log(this.querySelector('.x-layout'));
    this.layout = this.querySelector('.x-layout') || undefined;
  }

  attributeChangedCallback(name: string): void {
    if (name === 'layout') {
      this.layout?.classList.toggle(
        'x-layout--two-column',
        this.getAttribute('layout') === 'two-column',
      );
    }
  }

  static observedAttributes = ['layout'];
}

if (globalThis.customElements && !customElements?.get('x-layout')) {
  customElements.define('x-layout', XLayout);
}

declare global {
  interface HTMLElementTagNameMap {
    'x-layout': XLayout;
  }
}
