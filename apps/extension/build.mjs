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
  
  // Copy static assets
  import('node:fs').then(fs => {
    fs.copyFileSync('manifest.json', 'dist/manifest.json');
    fs.copyFileSync('src/popup/popup.html', 'dist/popup/popup.html');
    
    // Copy icons if they exist
    if (fs.existsSync('icons')) {
      if (!fs.existsSync('dist/icons')) fs.mkdirSync('dist/icons');
      for (const file of fs.readdirSync('icons')) {
        fs.copyFileSync(`icons/${file}`, `dist/icons/${file}`);
      }
    }
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
