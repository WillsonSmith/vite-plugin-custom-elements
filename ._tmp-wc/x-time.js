// src/components/BaseElement/BaseElement.ts
if (!globalThis.HTMLElement) {
  globalThis.HTMLElement = class {
  };
}
var BaseElement = class extends HTMLElement {
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      console.log(name, oldValue, newValue);
    }
  }
  /** Renders the component. Subclasses can override this method to provide specific rendering logic.
   * @param {RenderOptions} _options - The options for rendering
   * @returns {string} The rendered HTML
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(_options) {
    return "";
  }
  html(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  }
};

// src/components/x-time/x-time.ts
var XTime = class extends BaseElement {
  connectedCallback() {
    const time = this.querySelector(".time");
    this.interval = setInterval(() => {
      const date = /* @__PURE__ */ new Date();
      time.innerHTML = new Intl.DateTimeFormat("en-CA", {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        dayPeriod: "short"
      }).format(date);
    }, 1e3);
  }
  disconnectedCallback() {
    clearInterval(this.interval);
  }
};
export {
  XTime
};
