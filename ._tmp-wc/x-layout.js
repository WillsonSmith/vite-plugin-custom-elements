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

// src/components/layout/x-layout.ts
var XLayout = class extends BaseElement {
  connectedCallback() {
    console.log(this.querySelector(".x-layout"));
    this.layout = this.querySelector(".x-layout") || void 0;
  }
  render({ html, attrs }) {
    const layout = attrs?.layout || "single-column";
    return html`
      <style>
        .x-layout {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .x-layout--two-column {
          flex-direction: row;
          flex: 50% 50%;
        }
      </style>
      <div class="x-layout x-layout--${layout}">
        <slot></slot>
      </div>
    `;
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "layout") {
      this.querySelector(".x-layout")?.classList.toggle("x-layout--two-column", this.getAttribute("layout") === "two-column");
    }
  }
  static {
    this.observedAttributes = ["layout"];
  }
};
if (globalThis.customElements && !customElements?.get("x-layout")) {
  customElements.define("x-layout", XLayout);
}
export {
  XLayout
};
