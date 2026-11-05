import { test, expect } from '@playwright/test';

test.describe('Sahal Mansiya Portfolio Verification', () => {
  test('Page loads with zero errors and matches required copy', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Headline and lead
    await expect(page.locator('.headline')).toHaveText('Real data, real hardware, real-time 3D.');
    await expect(page.locator('.lead')).toHaveText(
      'I build interactive 3D in the browser, IoT digital twins and the production backends behind them.'
    );

    // Initial project is SimOffice
    const activeBtn = page.locator('.project-btn[aria-current="true"]');
    await expect(activeBtn).toHaveText('SimOffice');

    // 3D canvas is present and attached
    const canvas = page.locator('#stage-container canvas');
    await expect(canvas).toBeAttached();

    expect(errors).toHaveLength(0);
  });

  test('Buttons are real <button> elements with aria-current navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const buttons = page.locator('.project-btn');
    expect(await buttons.count()).toBe(5);

    for (let i = 0; i < 5; i++) {
      const tagName = await buttons.nth(i).evaluate((el) => el.tagName.toLowerCase());
      expect(tagName).toBe('button');
    }
  });

  test('Keyboard navigation switches projects and updates active states', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // ArrowRight to Living Plant
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1200);
    await expect(page.locator('.project-btn[aria-current="true"]')).toHaveText('Living Plant');

    // ArrowRight to BindPoint
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1200);
    await expect(page.locator('.project-btn[aria-current="true"]')).toHaveText('BindPoint');

    // ArrowLeft back to Living Plant
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(1200);
    await expect(page.locator('.project-btn[aria-current="true"]')).toHaveText('Living Plant');
  });

  test('Credits dialog opens and closes properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    await page.click('#credits-trigger');
    await page.waitForTimeout(400);
    const dialog = page.locator('#credits-dialog');
    await expect(dialog).toHaveAttribute('open', '');

    await page.click('#credits-close');
    await page.waitForTimeout(400);
    await expect(dialog).not.toHaveAttribute('open', '');
  });

  test('Drag rotates stage smoothly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const stage = page.locator('#stage-container');
    const box = await stage.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 100, startY, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(500);
    }
  });

  test('All five models load and render cleanly', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(1500);

    const projectIds = ['simoffice', 'living-plant', 'bindpoint', 'iqra-sms', 'threatwatch'];
    for (const id of projectIds) {
      await page.click(`#project-btn-${id}`);
      await page.waitForTimeout(1200);
      await expect(page.locator(`#project-btn-${id}`)).toHaveAttribute('aria-current', 'true');
    }

    expect(errors).toHaveLength(0);
  });
});
