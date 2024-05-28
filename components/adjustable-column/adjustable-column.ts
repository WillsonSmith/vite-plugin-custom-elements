import { autoBind } from '../../utility/autobind';

import css from './adjustable-column.css?inline';
import html from './adjustable-column.html';

if (!customElements?.get('adjustable-column')) {
  class AdjustableColumn extends HTMLElement {
    constructor() {
      super();

      autoBind(this);

      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
        const template = document.createElement('template');

        template.innerHTML = `<style>${css}</style>\n${html}`;

        this.renderRoot.innerHTML = ``;
        this.renderRoot.appendChild(template.content.cloneNode(true));
      }
    }

    connectedCallback() {
      const clickHandlers = Array.from(
        this.renderRoot.querySelectorAll('[click]'),
      );
      for (const handler of clickHandlers) {
        const fn = handler.getAttribute('click') as string;
        handler.addEventListener('click', this[fn]);
      }
    }

    adjustColumns() {
      this.renderRoot.querySelector('.column')?.classList.toggle('narrow');
    }

    get renderRoot(): ShadowRoot | AdjustableColumn {
      return this.shadowRoot || this;
    }
  }

  customElements.define('adjustable-column', AdjustableColumn);
}
