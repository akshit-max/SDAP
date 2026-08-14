import { chromium } from 'playwright';
import path from 'path';

const mockUrl = 'http://localhost:8080/apps/extension/test-mock/mca-dashboard-mock.html';

async function runTests() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  console.log('--- TEST 1: mcaRestrictedModules = [MASTER_DATA] ---');
  await page.goto(mockUrl + '?mode=mca_test1');
  await page.waitForTimeout(1000);
  let isMasterDataVisible = await page.isVisible('a[href$="/mca/master-data.html"]');
  let isLlpVisible = await page.isVisible('a[href$="/mca/llp-e-filling.html"]');
  let isCompanyVisible = await page.isVisible('a[href$="/mca/e-filing.html"]');
  
  console.log(`Master Data Visible: ${isMasterDataVisible} (Expected: false)`);
  console.log(`LLP e-Filing Visible: ${isLlpVisible} (Expected: true)`);
  console.log(`Company e-Filing Visible: ${isCompanyVisible} (Expected: true)`);

  console.log('\n--- TEST 2: mcaRestrictedModules = [MASTER, DSC, COMPANY] ---');
  await page.goto(mockUrl + '?mode=mca_test2');
  await page.waitForTimeout(1000);
  
  isMasterDataVisible = await page.isVisible('a[href$="/mca/master-data.html"]');
  let isDscVisible = await page.isVisible('a[href$="/mca/dsc-services-v3.html"]');
  isCompanyVisible = await page.isVisible('a[href$="/mca/e-filing.html"]');
  isLlpVisible = await page.isVisible('a[href$="/mca/llp-e-filling.html"]');
  let isFoVisible = await page.isVisible('a[href$="/mca/fo-llp-services.html"]');
  let isComplaintsVisible = await page.isVisible('a[href$="/mca/complaints.html"]');

  console.log(`Master Data Visible: ${isMasterDataVisible} (Expected: false)`);
  console.log(`DSC Services Visible: ${isDscVisible} (Expected: false)`);
  console.log(`Company e-Filing Visible: ${isCompanyVisible} (Expected: false)`);
  
  console.log(`LLP e-Filing Visible: ${isLlpVisible} (Expected: true)`);
  console.log(`FO Services Visible: ${isFoVisible} (Expected: true)`);
  console.log(`Complaints Visible: ${isComplaintsVisible} (Expected: true)`);
  
  await browser.close();
}

runTests().catch(console.error);
