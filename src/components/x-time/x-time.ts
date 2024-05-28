import './x-time.html?component';
import { define } from '@/utility/define';

define(
  'x-time',
  /**
   * A custom element that displays the current time.
   * @element x-time
   */
  class XTime extends HTMLElement {
    private interval?: ReturnType<typeof setInterval>;

    constructor() {
      super();
    }

    connectedCallback() {
      const time = this.querySelector('.time')!;
      console.log(this, time);
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
  },
);
