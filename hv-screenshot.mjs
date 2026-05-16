import puppeteer from 'puppeteer-core';

const CHROME = '/home/sigh/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  // Desktop screenshot
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  await page.waitForSelector('.substance-card, .nav-tab, [class*="hero"], [class*="gradient-text"]', { timeout: 8000 }).catch(() => {});
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
  await mPage.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  await mPage.waitForSelector('.substance-card, .nav-tab, [class*="hero"]', { timeout: 8000 }).catch(() => {});
  await mPage.screenshot({ path: '/tmp/hv-mobile-full.png', fullPage: false });
  console.log('Mobile screenshot saved');

  // Get the hydrated DOM content
  const html = await page.evaluate(() => {
    const body = document.body;
    const elements = {
      hasOrbs: !!document.querySelector('.orb'),
      hasNav: !!document.querySelector('nav, [class*="nav-"]'),
      hasCards: document.querySelectorAll('.substance-card').length,
      hasSearch: !!document.querySelector('input[type="text"], input[placeholder]'),
      hasGradient: !!document.querySelector('[class*="gradient"]'),
      hasSection: !!document.querySelector('.section-card'),
      bodyText: body.innerText.substring(0, 2000),
      allClasses: [...new Set([...body.querySelectorAll('*')].map(e => e.className).filter(c => c && typeof c === 'string').flatMap(c => c.split(' ')))].sort().join('\n'),
    };
    return elements;
  });
  console.log('\n=== Hydrated DOM Analysis ===');
  console.log('Orbs:', html.hasOrbs);
  console.log('Nav:', html.hasNav);
  console.log('Substance cards:', html.hasCards);
  console.log('Search:', html.hasSearch);
  console.log('Gradient elements:', html.hasGradient);
  console.log('Section cards:', html.hasSection);
  console.log('\n=== Page Text (first 2000 chars) ===');
  console.log(html.bodyText);

  // Check for console errors
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.reload({ waitUntil: 'networkidle0', timeout: 15000 });
  await page.waitForSelector('.substance-card', { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  console.log('\n=== Console Errors ===');
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
