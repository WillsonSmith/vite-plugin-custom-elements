import {
  CustomElementDeclaration,
  Declaration,
  JavaScriptModule,
  Package,
} from 'custom-elements-manifest';

export type DefinedElement = {
  path: string;
  tagName: string;
  className: string;
};

export function getCustomElementsFromManifest(
  manifest: Package,
): DefinedElement[] {
  return manifest.modules.map(getElementDeclarations).flat();
}

function getElementDeclarations(module: JavaScriptModule): DefinedElement[] {
  if (module.exports && module.declarations) {
    const customElements = getCustomElements(module.declarations);
    return getExported(customElements, module.exports);
  }
  return [];
}

function getCustomElements(
  declarations: Declaration[],
): CustomElementDeclaration[] {
  const customElements = [];

  for (const declaration of declarations) {
    const isCustom = 'customElement' in declaration && declaration.tagName;

    if (isCustom && declaration.kind !== 'mixin') {
      customElements.push(declaration);
    }
  }
  return customElements;
}

function getExported(
  customElementsDeclarations: CustomElementDeclaration[],
  exports: JavaScriptModule['exports'],
): DefinedElement[] {
  const customElements: DefinedElement[] = [];
  for (const exp of exports!) {
    const tagName = customElementsDeclarations.find((dec) => {
      return dec.name === exp.name;
    })?.tagName;

    const mod = exp.declaration.module;
    if (mod && tagName) {
      customElements.push({
        path: mod,
        tagName: tagName,
        className: exp.name,
      });
    }
  }

  return customElements;
}
