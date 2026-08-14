import { chromium } from 'playwright';

async function checkMCAArchitecture() {
  console.log('Launching browser to observe MCA login page...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html');
  console.log('Navigated to MCA login page.');
  
  // Wait for the page to render
  await page.waitForTimeout(3000);
  
  // Check for React roots or Next.js indicators
  const isReact = await page.evaluate(() => {
    // Check for React 15+ data-reactroot
    const hasReactRoot = !!document.querySelector('[data-reactroot]');
    
    // Check for Next.js
    const hasNext = !!document.querySelector('#__next');
    
    // Check for modern React (internal properties on DOM nodes)
    const hasReactFiber = Array.from(document.querySelectorAll('*')).some(el => 
      Object.keys(el).some(key => key.startsWith('__reactFiber$'))
    );
    
    // Check for Angular/Vue just in case
    const hasAngular = !!document.querySelector('[ng-version]');
    const hasVue = !!document.querySelector('[data-v-app]');
    
    return { hasReactRoot, hasNext, hasReactFiber, hasAngular, hasVue };
  });

  console.log('\n--- Architectural Indicators ---');
  console.log(`React (Older data-reactroot): ${isReact.hasReactRoot}`);
  console.log(`Next.js (#__next): ${isReact.hasNext}`);
  console.log(`React (Modern Fiber): ${isReact.hasReactFiber}`);
  console.log(`Angular: ${isReact.hasAngular}`);
  console.log(`Vue: ${isReact.hasVue}`);
  
  if (isReact.hasReactRoot || isReact.hasNext || isReact.hasReactFiber) {
    console.log('\nCONCLUSION: MCA appears to be a React-based SPA (Single Page Application).');
  } else if (isReact.hasAngular || isReact.hasVue) {
    console.log('\nCONCLUSION: MCA appears to be an SPA built with Angular/Vue.');
  } else {
    console.log('\nCONCLUSION: MCA appears to be traditionally server-rendered HTML (or uses a framework we didn\'t explicitly detect).');
  }

  // Let's also check if clicking a simple internal link causes a full page reload
  console.log('\nChecking link navigation behavior...');
  const internalLink = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    // Find a link that stays on the same domain but changes path
    const target = links.find(l => {
      const href = l.getAttribute('href');
      return href && href.startsWith('/') && href.length > 1;
    });
    return target ? target.getAttribute('href') : null;
  });

  if (internalLink) {
    console.log(`Found internal link: ${internalLink}. Clicking it...`);
    
    let isFullReload = false;
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        isFullReload = true;
      }
    });

    await page.click(`a[href="${internalLink}"]`).catch(() => {});
    await page.waitForTimeout(2000);
    
    console.log(`Did the page do a full reload? ${isFullReload ? 'YES (Server-rendered behavior)' : 'NO (SPA pushState behavior)'}`);
  } else {
    console.log('Could not find a suitable internal link to test navigation.');
  }

  await browser.close();
}

checkMCAArchitecture().catch(console.error);
