import html from './adjustable-column.html?raw';

export class AdjustableColumn extends HTMLElement {
  constructor() {
    super();

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      const template = document.createElement('template');
      template.innerHTML = html;
      this.renderRoot.innerHTML = ``;
      this.renderRoot.appendChild(template.content.cloneNode(true));
    }
  }

  get renderRoot(): ShadowRoot | AdjustableColumn {
    return this.shadowRoot || this;
  }
}
