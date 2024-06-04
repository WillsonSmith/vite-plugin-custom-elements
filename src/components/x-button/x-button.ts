export class XButton extends HTMLElement {
  button: HTMLButtonElement | null = null;
  constructor() {
    super();
    this._wire = this._wire.bind(this);
  }
  connectedCallback() {
    this.button = this.querySelector('button');
    this.button?.addEventListener('click', this._wire);
  }

  _wire(event: Event) {
    console.log('click event...', event);
  }
}

customElements?.get('x-button')
  ? console.log('x-button already registered...')
  : customElements.define('x-button', XButton);
