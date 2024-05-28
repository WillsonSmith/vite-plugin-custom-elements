import { define } from '../../../utility/define';

if (!globalThis.HTMLElement) {
  // @ts-expect-error When undefined we don't want it to fail
  globalThis.HTMLElement = class {};
}

export function html(strings: TemplateStringsArray, ...values: unknown[]) {
  return String.raw({ raw: strings }, ...values);
}

export class BaseElement extends HTMLElement {
  html(strings: TemplateStringsArray, ...values: unknown[]) {
    return String.raw({ raw: strings }, ...values);
  }
}

export class XTimer extends BaseElement {
  render() {
    return html`<span
      >${new Intl.DateTimeFormat('en-CA', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        dayPeriod: 'short',
      }).format(new Date())}</span
    >`;
  }
}

define('x-timer', XTimer);
