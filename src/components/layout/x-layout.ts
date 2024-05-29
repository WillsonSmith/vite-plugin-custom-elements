import { BaseElement, RenderOptions } from '../BaseElement/BaseElement';

/**
 * An element to lay out content in various ways
 * @element x-layout
 */
export class XLayout extends BaseElement {

  connectedCallback() {
    console.log('connected')
  }

  render({ html, attrs }: RenderOptions) {
    const layout = attrs?.layout || 'single-column';

    return html`
      <style>
        x-layout {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        x-layout--two-column {
          flex-direction: row;
          flex: 50% 50%;
        }
      </style>
      <div class="x-layout x-layout--${layout}">
        <slot></slot>
      </div>
    `;
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