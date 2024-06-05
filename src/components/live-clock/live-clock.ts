import { autoBind } from '@/utility/autobind';

/**
 * Display the current time.
 * @element live-clock
 */
export class LiveClock extends HTMLElement {
  private _interval?: ReturnType<typeof setInterval>;

  _container: HTMLElement | null = null;

  constructor() {
    super();
    autoBind(this);
  }

  get container() {
    if (!this._container) {
      this._container = this.querySelector('.time');
    }
    return this._container;
  }

  connectedCallback() {
    this._interval = setInterval(this.setTime, 1000);
  }

  disconnectedCallback() {
    clearInterval(this._interval);
  }

  setTime() {
    this.container
      ? (this.container.innerHTML = new Intl.DateTimeFormat('en-CA', {
          hour: 'numeric',
          minute: 'numeric',
          second: undefined,
        }).format(new Date()))
      : undefined;
  }
}

customElements.get('live-clock')
  ? undefined
  : customElements.define('live-clock', LiveClock);

declare global {
  interface HTMLElementTagNameMap {
    'live-clock': LiveClock;
  }
}
