import { chromium } from 'playwright';
import path from 'path';

const mockUrl = 'http://localhost:8080/apps/extension/test-mock/mca-dashboard-mock.html';

async function runTests() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  console.log('--- TEST: No capabilities (unrestricted) ---');
  await page.goto(mockUrl + '?mode=unrestricted');
  // Wait a bit for the script to execute
  await page.waitForTimeout(1000);
  let isGstVisible = await page.isVisible('.nav-gst');
  let isCorpVisible = await page.isVisible('#menu-company-incorporation');
  let isDcaVisible = await page.isVisible('a[href*="DCA"]');
  console.log(`GST Visible: ${isGstVisible}`);
  console.log(`Corp Visible: ${isCorpVisible}`);
  console.log(`DCA Visible: ${isDcaVisible}`);

  console.log('\n--- TEST: GST_FILING capability (restricted) ---');
  await page.goto(mockUrl + '?mode=gst');
  await page.waitForTimeout(1000);
  isGstVisible = await page.isVisible('.nav-gst');
  isCorpVisible = await page.isVisible('#menu-company-incorporation');
  isDcaVisible = await page.isVisible('a[href*="DCA"]');
  console.log(`GST Visible: ${isGstVisible}`);
  console.log(`Corp Visible: ${isCorpVisible}`);
  console.log(`DCA Visible: ${isDcaVisible}`);

  // Test SPA route interception
  console.log('\n--- TEST: SPA Route Interception ---');
  // Try to click the DCA link (restricted route: '/DCA')
  // We can't actually click if it's hidden, so we'll evaluate pushState directly
  const interceptBlocked = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.addedNodes.length > 0) {
            const added = Array.from(m.addedNodes).find(n => n.id === 'withus-restriction-toast');
            if (added) {
              observer.disconnect();
              resolve(true);
            }
          }
        }
      });
      observer.observe(document.body, { childList: true });
      history.pushState(null, '', '/DCA/kyc');
      
      // Resolve false if toast doesn't appear after 500ms
      setTimeout(() => {
        observer.disconnect();
        resolve(false);
      }, 500);
    });
  });
  console.log(`SPA pushState to /DCA blocked: ${interceptBlocked}`);
  
  await browser.close();
}

runTests().catch(console.error);
