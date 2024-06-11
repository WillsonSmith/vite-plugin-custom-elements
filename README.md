## plugin-custom-elements

⚠️ prerelease ⚠️

WIPperoni.

`plugin-custom-elements` is a [vite](https://vitejs.dev) plugin designed to simplify building websites with [custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements).

Guiding Philosophy:
Build websites the old way. The web provides some pretty poweful tooling, and sometimes all you need is basic html, css, and javascript. This plugin aims to augment the tools provided to make them just a little bit easier to use.

What a project looks like:

```
src/
├─ components/
│ ├─ my-component.html
│ ├─ my-counter/
│ │ ├─ my-counter.html
│ │ ├─ my-counter.ts
│ ├─ highlight-text.ts
├─ index.html
vite.config.ts
```

```ts
// vite.config.ts
import { pluginCustomElement } from 'plugin-custom-elements';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    rollupOptions: {
      input: 'src/index.html',
    },
  },
  plugins: [
    pluginCustomElement({
      root: './src',
      elementDir: 'components',
    }),
  ],
});
```

HTML-based components will automatically replace components used in input HTML files with their defined components. They use `<slot>` elements to determine where to inject content.

A basic HTML-based component

```html
<!-- components/my-component.html -->
<style>
  .header {
    margin: 0;
  }
</style>
<h1 class="header"><slot></slot></h1>
```

Index before build

```html
<!doctype html>
<html>
  <head></head>
  <body>
    <my-component>Some text</my-component>
</html>
```

Index after build:

```html
<!doctype html>
<html>
  <head>
    <style>
      my-component .header {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <my-component>
      <h1 class="header">Some text</h1>
    </my-component>
</html>
```

JavaScript components are a little different. The directory they live in does not have to be specified in plugin. Instead, the plugin searches for any custom element definitions and knows where they live.

```typescript
/*
 * @element my-counter
 */
export class MyCounter extends HTMLElement {}
customElements.get('my-counter')
  ? undefined
  : customElements.define('my-counter', MyCounter);
```

Notice the use of the JSDoc `@element`, this is how the plugin determines what is or is not a custom element.

In line with the Philosophy of this project: the default behaviour of the plugin is to do nothing with this custom element. You have a few options to use it.

1. import it in your index `<script type="module" src="./my-counter.ts"></module>`
2. add a `hydrate` attriubte to your use of the component. This will auto-import the script for you.

```html
<my-conter hydrate></my-counter>
```

Elements with both HTML and Javascript:

```html
<!-- my-counter.html -->
<style>
  .my-counter {
    display: flex;
    gap: 1rem;
  }
</style>
<div class="my-counter">
  <div class="count">0</div>
  <button>Add</button>
</div>
```

```typescript
/*
 * @element my-counter
 */
export class MyCounter extends HTMLElement {
  connectedCallback() {
    const button = this.querySelector('button');
    const count = this.querySelector('.count');
    button.addEventListener('click', () => {
      const curr = Number(count.textContent);
      count.innerHTML = curr + 1;
    });
  }
}

customElements.get('my-counter')
  ? undefined
  : customElements.define('my-counter', MyCounter);
```

When you use `<my-counter></my-counter>` it will be replaced like an HTML-based component. You can then add your functionality by adding a `hydrate` attribute: `<my-counter hydrate></my-counter>` or including it as a script. You can also include the script within your HTML component.

```html
<style>
  .my-counter {
    display: flex;
    gap: 1rem;
  }
</style>
<div class="my-counter">
  <div class="count">0</div>
  <button>Add</button>
</div>

<script type="module" src="./my-counter.ts"></script>
```
