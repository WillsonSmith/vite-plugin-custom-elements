### plugin-custom-elements

⚠️ prerelease ⚠️

`plugin-custom-elements` is a [vite](https://vitejs.dev) plugin designed to simplify building websites with [custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements).

Philosophy:
Use the platform and build websites the old way.

The robust set if tools we have today are great and have their place, but sometimes you just need the basics and a little sugar. This plugin aims to minimally augment the tools provided by the platform and make them just a little easier to use.

## WIP

This plugin is in its infancy and is bound to have issues.

Pre-1.0, patch changes should be safe, but minor version bumps may introduce breaking changes.

This is a project I use and intend to continue using, it will evolve an change in bursts, but I intend to keep it inline with the general philosophical principles.

## Building a project

What a project looks like:

Also see `/src`

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

### HTML Components

HTML-based componentst live in a directory specified by `elementDir (defaut: componenst)` in the Vite plugin's configuraiton. The markup within these components will replace any usage of those components in your HTML inpust. They use `<slot>` elements to determine how to handle child elements wherever you use them.

#### Example

```html
<!-- components/my-component.html -->
<style>
  .header {
    margin: 0;
  }
</style>
<h1 class="header"><slot></slot></h1>
```

`index.html` pre-build

```html
<!doctype html>
<html>
  <head></head>
  <body>
    <my-component>Some text</my-component>
</html>
```

`index.html` post-build

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

### JavaScript Components

JavaScript components require no special directory definition. Instead, the plugin searches your root directory for any custom element definitions and knows where they live.

#### Example

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

### Using Both

When you need markup associated with your JavaScript components you can include both an HTML-based component and a JavaScript component.

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

<script type="module" src="./my-counter.ts"></script>
```

### Templates and Shadow Roots

The web platform has recently added support for [Declarative Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM#declaratively_with_html), you can take advantage of this in your components by wrapping any component content with a `<template shadowrootmode="open"></template>`

```html
<!-- my-counter.html -->
<template shadowrootmode="open">
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
</template>
```

Note I have excluded the `<script>` tag. As of now, Vite's default HTML building plugin does not traverse `<template>` tags and so it will not transform any linked files within them. This also applies to any `<link>` tags.

Shadow roots encapuslate styles so `<style>` tags within a shadow root template will **not** scope style to a component tag name.

### Nesting components

Components can exist within each other. A component's styles will be injected as a `<style>` tag within a shadow root.
