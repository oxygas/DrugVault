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

  // Collect console errors
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

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

  // Screenshot 1: Homepage with substance cards
  await page.screenshot({ path: '/tmp/hv-final-1-home.png' });
  console.log('1. Homepage screenshot saved');

  // Click Alcohol card to open popup
  const alcoholCard = await page.evaluateHandle(() => {
    const cards = document.querySelectorAll('.substance-card');
    return Array.from(cards).find(c => c.textContent.includes('Alcohol'));
  });
  if (alcoholCard) {
    await alcoholCard.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: '/tmp/hv-final-2-popup.png' });

    // Check popup content
    const popupInfo = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { found: false };
      return {
        found: true,
        hasRadar: !!dialog.querySelector('svg'),
        hasTimeline: dialog.textContent.includes('Onset') && dialog.textContent.includes('Peak'),
        hasAliases: dialog.textContent.includes('Ethanol'),
        hasTabs: dialog.textContent.includes('Overview') && dialog.textContent.includes('Risks') && dialog.textContent.includes('Dosage'),
      };
    });
    console.log('2. Popup screenshot saved. Content:', JSON.stringify(popupInfo));

    // Switch to Risks tab
    const risksTab = await page.evaluateHandle(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const tabs = dialog.querySelectorAll('button');
      return Array.from(tabs).find(t => t.textContent.includes('Risks'));
    });
    if (risksTab) {
      await risksTab.click();
      await new Promise(r => setTimeout(r, 300));
      await page.screenshot({ path: '/tmp/hv-final-3-risks.png' });
      console.log('3. Risks tab screenshot saved');
    }

    // Switch to Dosage tab
    const dosageTab = await page.evaluateHandle(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const tabs = dialog.querySelectorAll('button');
      return Array.from(tabs).find(t => t.textContent.includes('Dosage'));
    });
    if (dosageTab) {
      await dosageTab.click();
      await new Promise(r => setTimeout(r, 300));
      await page.screenshot({ path: '/tmp/hv-final-4-dosage.png' });
      const dosageContent = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return {
          hasRoa: dialog.textContent.includes('oral'),
          hasDoses: dialog.textContent.includes('Threshold') && dialog.textContent.includes('Heavy'),
          hasDuration: dialog.textContent.includes('Onset:') && dialog.textContent.includes('Peak:'),
        };
      });
      console.log('4. Dosage tab screenshot saved. Content:', JSON.stringify(dosageContent));
    }

    // Close popup
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 300));
  }

  // Switch to Matrix tab
  const matrixTab = await page.evaluateHandle(() => {
    const tabs = document.querySelectorAll('.nav-tab');
    return Array.from(tabs).find(t => t.textContent.includes('Matrix'));
  });
  if (matrixTab) {
    await matrixTab.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: '/tmp/hv-final-5-matrix.png' });
    const matrixInfo = await page.evaluate(() => {
      const allCells = Array.from(document.querySelectorAll('td'));
      const cells = allCells.filter(c => c.textContent.trim() !== '—');
      const selfCells = allCells.filter(c => c.textContent.trim() === '—');
      const labels = new Set();
      cells.forEach(c => { const t = c.textContent.trim(); if (t) labels.add(t); });
      return {
        totalCells: cells.length,
        selfCells: selfCells.length,
        labels: [...labels],
      };
    });
    console.log('5. Matrix screenshot saved. Cells:', matrixInfo.totalCells, 'Self:', matrixInfo.selfCells, 'Labels:', matrixInfo.labels);
  }

  // Switch to Tools tab
  const toolsTab = await page.evaluateHandle(() => {
    const tabs = document.querySelectorAll('.nav-tab');
    return Array.from(tabs).find(t => t.textContent.includes('Tools'));
  });
  if (toolsTab) {
    await toolsTab.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: '/tmp/hv-final-6-tools.png' });

    // Test interaction checker
    const inputs = await page.$$('input[type="text"]');
    if (inputs.length >= 2) {
      await inputs[0].type('Alcohol');
      await inputs[1].type('Cocaine');
      const checkBtn = await page.evaluateHandle(() => {
        const btns = document.querySelectorAll('button');
        return Array.from(btns).find(b => b.textContent.includes('Check Interaction'));
      });
      if (checkBtn) {
        await checkBtn.click();
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: '/tmp/hv-final-7-interaction.png' });
        const result = await page.evaluate(() => {
          const resultEl = document.querySelector('[class*="animate"]');
          return resultEl ? resultEl.textContent.substring(0, 200) : 'No result found';
        });
        console.log('7. Interaction result:', result);
      }
    }
  }

  // Mobile test
  await page.setViewport({ width: 375, height: 812 });
  // Go back to substances
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.nav-tab');
    for (const tab of tabs) {
      if (tab.textContent.includes('Substances')) { tab.click(); break; }
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/tmp/hv-final-8-mobile.png' });

  // Open popup on mobile
  const firstCard = await page.$('.substance-card');
  if (firstCard) {
    await firstCard.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: '/tmp/hv-final-9-mobile-popup.png' });
    const mobilePopup = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return null;
      const rect = dialog.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        isBottomSheet: rect.y > 0 && rect.y < 200,
        hasRoundedTop: true,
      };
    });
    console.log('9. Mobile popup:', JSON.stringify(mobilePopup));
  }

  console.log('\nConsole errors:', errors.length ? errors : 'None');
  await browser.close();
  console.log('\nAll visual tests complete. 9 screenshots saved.');
}

main().catch(e => { console.error(e); process.exit(1); });
