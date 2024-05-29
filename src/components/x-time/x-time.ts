import { BaseElement } from '../BaseElement/BaseElement';

// import './x-time.html?component';

/**
 * A custom element that displays the current time.
 * @element x-time
 */
export class XTime extends BaseElement {
  private interval?: ReturnType<typeof setInterval>;

  connectedCallback() {
    const time = this.querySelector('.time')!;
    this.interval = setInterval(() => {
      const date = new Date();
      time.innerHTML = new Intl.DateTimeFormat('en-CA', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        dayPeriod: 'short',
      }).format(date);
    }, 1000);
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'x-time': XTime;
  }
}

