import { build as esbuild } from 'esbuild';
import path from 'node:path';
import { Worker } from 'node:worker_threads';

type RenderCustomElementResult =
  | {
      status: 'success';
      text: string;
    }
  | { status: 'error'; error: string };

export async function renderCustomElement(
  className: string,
  elementModulePath: string,
): Promise<RenderCustomElementResult> {
  const transpilePath = `${process.cwd()}/._tmp-wc/${path.basename(elementModulePath).replace('ts', 'js')}`;

  await esbuild({
    entryPoints: [elementModulePath],
    outfile: transpilePath,
    format: 'esm',
    minify: false,
    bundle: true,
    allowOverwrite: true,
  });

  await esbuild({
    entryPoints: [__dirname + '/renderWorker.ts'],
    outfile: __dirname + '/renderWorker.js',
    format: 'esm',
    platform: 'node',
    allowOverwrite: true,
  });

  return new Promise((resolve, reject) => {
    const worker = new Worker(__dirname + '/renderWorker.js', {
      workerData: [className, transpilePath],
    });

    worker.on('message', (markup) => {
      resolve({
        status: 'success',
        text: markup,
      });
    });

    worker.on('error', () => {
      resolve({
        status: 'error',
        error: 'No markup rendered',
      });
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}