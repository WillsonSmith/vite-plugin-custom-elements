import { parentPort, workerData } from "node:worker_threads";
const [className, modulePath] = workerData;
function html(strings, ...values) {
  return String.raw({ raw: strings }, ...values);
}
const mod = await import(modulePath);
const ElementClass = mod[className];
const n = new ElementClass();
const markup = n.render({
  html
});
parentPort?.postMessage(markup);
