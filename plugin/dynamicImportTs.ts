import {build as esbuild} from 'esbuild';

import path from 'node:path';
export async function dynamicImportTs(srcDir: string) {

  const transpilePath = `./._tmp-wc/${path.basename(srcDir).replace('ts', 'js')}`;

  await esbuild({
    entryPoints: [srcDir],
    minify: false,
    outfile: transpilePath,
    bundle: true,
    format: 'esm',
    allowOverwrite: true
  })

  const mod = await import(transpilePath);
  return mod;
}
