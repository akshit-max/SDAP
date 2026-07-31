import * as esbuild from 'esbuild';
import { watch } from 'node:fs';
import { argv } from 'node:process';

const isWatch = argv.includes('--watch');

const sharedConfig = {
  bundle: true,
  platform: 'browser',
  target: 'chrome114',
  format: 'iife',
  sourcemap: isWatch ? 'inline' : false,
};

const entryPoints = [
  { in: 'src/background/service-worker.ts', out: 'background/service-worker' },
  { in: 'src/content/autofill.ts', out: 'content/autofill' },
  { in: 'src/popup/popup.ts', out: 'popup/popup' },
];

async function build() {
  await esbuild.build({
    ...sharedConfig,
    entryPoints,
    outdir: 'dist',
  });
  console.log('[WITHUS Extension] Build complete');
}

if (isWatch) {
  const ctx = await esbuild.context({ ...sharedConfig, entryPoints, outdir: 'dist' });
  await ctx.watch();
  console.log('[WITHUS Extension] Watching for changes…');
} else {
  await build();
}
