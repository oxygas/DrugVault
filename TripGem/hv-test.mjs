import puppeteer from 'puppeteer-core';

const CHROME = '/usr/bin/chromium';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
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

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  await page.waitForSelector('.substance-card', { timeout: 8000 });
  await new Promise(r => setTimeout(r, 1000));

  // Test 1: Click a substance card → check popup
  console.log('=== TEST 1: Substance Popup ===');
  await page.click('.substance-card');
  await new Promise(r => setTimeout(r, 500));
  const popup = await page.evaluate(() => {
    const el = document.querySelector('[class*="popup"], [class*="modal"], [role="dialog"]');
    if (!el) return { found: false };
    return {
      found: true,
      classes: el.className,
      text: el.innerText.substring(0, 500),
      tabs: el.querySelectorAll('button, [role="tab"]').length,
    };
  });
  console.log('Popup found:', popup.found);
  if (popup.found) {
    console.log('Popup text preview:', popup.text.substring(0, 200));
  } else {
    // Check if an overlay appeared
    const overlay = await page.evaluate(() => {
      const overlays = document.querySelectorAll('[class*="overlay"], [class*="backdrop"], [class*="fixed"]');
      return Array.from(overlays).map(o => ({ class: o.className.substring(0, 80), text: o.innerText.substring(0, 100) }));
    });
    console.log('Overlays found:', JSON.stringify(overlay.slice(0, 3)));
  }

  // Close popup with Escape
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));

  // Test 2: Switch to Matrix tab
  console.log('\n=== TEST 2: Matrix Tab ===');
  const matrixTab = await page.evaluateHandle(() => {
    const tabs = document.querySelectorAll('.nav-tab');
    for (const tab of tabs) {
      if (tab.textContent.includes('Matrix')) return tab;
    }
    return null;
  });
  if (matrixTab) {
    await matrixTab.click();
    await new Promise(r => setTimeout(r, 500));
    const matrixContent = await page.evaluate(() => {
      const allCells = Array.from(document.querySelectorAll('td'));
      const cells = allCells.filter(c => c.textContent.trim() !== '—');
      const sectionCards = document.querySelectorAll('.section-card');
      const headings = document.querySelectorAll('h3');
      return {
        comboCells: cells.length,
        sectionCards: sectionCards.length,
        headings: Array.from(headings).map(h => h.textContent),
        cellColors: Array.from(cells).slice(0, 10).map(c => c.getAttribute('aria-label') || ''),
        bodyText: document.body.innerText.substring(0, 1000),
      };
    });
    console.log('Combo cells:', matrixContent.comboCells);
    console.log('Section cards:', matrixContent.sectionCards);
    console.log('Headings:', matrixContent.headings);
    console.log('First 10 cell classes:', matrixContent.cellColors);
    await page.screenshot({ path: '/tmp/hv-matrix.png' });
  } else {
    console.log('Matrix tab not found');
  }

  // Test 3: Switch to Tools tab
  console.log('\n=== TEST 3: Tools Tab ===');
  const toolsTab = await page.evaluateHandle(() => {
    const tabs = document.querySelectorAll('.nav-tab');
    for (const tab of tabs) {
      if (tab.textContent.includes('Tools')) return tab;
    }
    return null;
  });
  if (toolsTab) {
    await toolsTab.click();
    await new Promise(r => setTimeout(r, 500));
    const toolsContent = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"]');
      const buttons = document.querySelectorAll('button');
      const sectionCards = document.querySelectorAll('.section-card');
      const headings = document.querySelectorAll('h3');
      return {
        inputs: inputs.length,
        buttons: buttons.length,
        sectionCards: sectionCards.length,
        headings: Array.from(headings).map(h => h.textContent),
        bodyText: document.body.innerText.substring(0, 1000),
      };
    });
    console.log('Inputs:', toolsContent.inputs);
    console.log('Section cards:', toolsContent.sectionCards);
    console.log('Headings:', toolsContent.headings);
    await page.screenshot({ path: '/tmp/hv-tools.png' });
  }

  // Test 4: Mobile view — check responsive
  console.log('\n=== TEST 4: Mobile Responsive ===');
  await page.setViewport({ width: 375, height: 812 });
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.nav-tab');
    for (const tab of tabs) {
      if (tab.textContent.includes('Substances')) return tab.click();
    }
  });
  await new Promise(r => setTimeout(r, 500));
  const mobileContent = await page.evaluate(() => {
    const cards = document.querySelectorAll('.substance-card');
    const firstCard = cards[0];
    if (!firstCard) return { cardCount: 0 };
    const rect = firstCard.getBoundingClientRect();
    return {
      cardCount: cards.length,
      firstCardWidth: rect.width,
      viewportWidth: window.innerWidth,
      cardsPerRow: Math.floor(window.innerWidth / (rect.width || 1)),
      isFullWidth: rect.width > window.innerWidth * 0.9,
    };
  });
  console.log('Mobile cards:', mobileContent.cardCount);
  console.log('Card width:', mobileContent.firstCardWidth, 'of viewport:', mobileContent.viewportWidth);
  console.log('Cards per row (should be 1 on mobile):', mobileContent.cardsPerRow);
  console.log('Is full-width card:', mobileContent.isFullWidth);
  await page.screenshot({ path: '/tmp/hv-mobile-final.png' });

  // Test 5: Check for any visual regressions — empty elements, overlapping text, etc.
  console.log('\n=== TEST 5: Visual Quality Checks ===');
  await page.setViewport({ width: 1280, height: 900 });
  // Go back to substances
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.nav-tab');
    for (const tab of tabs) {
      if (tab.textContent.includes('Substances')) return tab.click();
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const quality = await page.evaluate(() => {
    const cards = document.querySelectorAll('.substance-card');
    const issues = [];
    
    // Check if accent bar (::before) renders
    // Can't directly check pseudo-elements in JS, but check the card structure
    
    // Check for text overflow/ellipsis issues
    cards.forEach((card, i) => {
      if (i < 5) {
        const name = card.querySelector('[class*="font"]');
        if (name && name.scrollWidth > name.clientWidth + 10) {
          issues.push(`Card ${i}: name overflow`);
        }
      }
    });

    // Check for missing data
    let missingHarm = 0;
    let missingCategory = 0;
    cards.forEach(card => {
      if (!card.textContent.match(/harm/i)) missingHarm++;
    });

    // Check stats bar
    const metricCards = document.querySelectorAll('.metric-card');
    
    // Check search bar
    const searchInput = document.querySelector('input[placeholder]');
    const searchPlaceholder = searchInput?.getAttribute('placeholder');

    return {
      issues,
      missingHarm,
      metricCards: metricCards.length,
      searchPlaceholder,
      totalCards: cards.length,
    };
  });
  console.log('Quality issues:', quality.issues.length ? quality.issues : 'None');
  console.log('Missing harm data:', quality.missingHarm);
  console.log('Metric cards:', quality.metricCards);
  console.log('Search placeholder:', quality.searchPlaceholder);

  await browser.close();
  console.log('\nAll tests complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
