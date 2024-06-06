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
    const time = new Intl.DateTimeFormat('en-CA', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date());

    if (this.container) {
      this.container.innerHTML = time;
    }
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
