export function autoBind<T extends object>(instance: T): void {
  const prototype = Object.getPrototypeOf(instance);
  const propertyNames = Object.getOwnPropertyNames(prototype) as Array<keyof T>;

  for (const name of propertyNames) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
    if (
      descriptor &&
      typeof descriptor.value === 'function' &&
      name !== 'constructor'
    ) {
      const method = descriptor.value as unknown as (
        ...args: unknown[]
      ) => unknown;
      Object.defineProperty(instance, name, {
        value: method.bind(instance),
        configurable: true,
        writable: true,
      });
    }
  }
}
