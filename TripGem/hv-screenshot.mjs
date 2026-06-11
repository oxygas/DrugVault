import puppeteer from 'puppeteer-core';

const CHROME = '/usr/bin/chromium';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  // Desktop screenshot
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const errors = [];
  page.on('console', msg => {
    const txt = msg.text();
    if (msg.type() === 'error' || txt.toLowerCase().includes('error') || txt.toLowerCase().includes('failed')) {
      errors.push(`[${msg.type()}] ${txt}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[pageerror] ${err.stack || err.toString()}`);
  });

  // Set onboarded true to prevent the onboarding modal from blocking interactions
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('tripgem-settings', JSON.stringify({
      bodyWeight: 70,
      weightUnit: 'kg',
      userLevel: 'common',
      onboarded: true,
      uiSounds: false,
      loFiMode: false
    }));
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  
  console.log('Waiting for .substance-card...');
  await page.waitForSelector('.substance-card', { timeout: 10000 }).catch(err => {
    errors.push(`[TimeoutError] Failed to wait for .substance-card: ${err.message}`);
  });

  await page.screenshot({ path: '/tmp/hv-desktop-full.png', fullPage: false });
  console.log('Desktop screenshot saved');

  // Scroll down to see more content
  await page.evaluate(() => window.scrollTo(0, 600));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/tmp/hv-desktop-scrolled.png', fullPage: false });
  console.log('Desktop scrolled screenshot saved');

  // Mobile screenshot
  const mPage = await browser.newPage();
  await mPage.setViewport({ width: 375, height: 812 });
  mPage.on('console', msg => {
    const txt = msg.text();
    if (msg.type() === 'error') errors.push(`[mobile-console-error] ${txt}`);
  });
  mPage.on('pageerror', err => {
    errors.push(`[mobile-pageerror] ${err.toString()}`);
  });
  // Set onboarded true to prevent the onboarding modal from blocking interactions
  await mPage.evaluateOnNewDocument(() => {
    localStorage.setItem('tripgem-settings', JSON.stringify({
      bodyWeight: 70,
      weightUnit: 'kg',
      userLevel: 'common',
      onboarded: true,
      uiSounds: false,
      loFiMode: false
    }));
  });

  await mPage.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  await mPage.waitForSelector('.substance-card', { timeout: 5000 }).catch(() => {});
  await mPage.screenshot({ path: '/tmp/hv-mobile-full.png', fullPage: false });
  console.log('Mobile screenshot saved');

  // Check for console errors
  console.log('\n=== Console Errors/Warnings ===');
  if (errors.length) errors.forEach(e => console.log('ERROR:', e));
  else console.log('None');

  // Get computed styles of key elements
  const styles = await page.evaluate(() => {
    const getStyle = (sel, props) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return Object.fromEntries(props.map(p => [p, cs.getPropertyValue(p)]));
    };
    return {
      body: getStyle('body', ['background-color', 'color', 'font-family']),
      card: getStyle('.substance-card', ['background', 'border-radius', 'box-shadow', 'backdrop-filter']),
      accent: getStyle('.gradient-text', ['background', 'color', 'font-weight']),
    };
  });
  console.log('\n=== Computed Styles ===');
  console.log(JSON.stringify(styles, null, 2));

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
