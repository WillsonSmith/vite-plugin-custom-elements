if (!globalThis.HTMLElement) {
  // @ts-expect-error When undefined we don't want it to fail
  globalThis.HTMLElement = class { };
}

export type RenderOptions = {
  html: (strings: TemplateStringsArray, ...values: unknown[]) => string;
  attrs?: { [key: string]: string | undefined };
};

export class BaseElement extends HTMLElement {
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      console.log(name, oldValue, newValue);
    }
  }

  /** Renders the component. Subclasses can override this method to provide specific rendering logic.
   * @param {RenderOptions} _options - The options for rendering
   * @returns {string} The rendered HTML
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(_options: RenderOptions): string {
    return '';
  }

  protected html(strings: TemplateStringsArray, ...values: unknown[]) {
    return String.raw({ raw: strings }, ...values);
  }
}
