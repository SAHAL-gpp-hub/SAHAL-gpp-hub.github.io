import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Static file server for dist/
function startServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.glb': 'model/gltf-binary',
    '.hdr': 'image/vnd.radiance',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
  };

  const server = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url.split('?')[0]);
    if (filePath.endsWith('/')) filePath = path.join(filePath, 'index.html');

    if (!fs.existsSync(filePath)) {
      // Check public files (models, hdri)
      const publicPath = path.join(distDir, '..', 'public', req.url.split('?')[0]);
      if (fs.existsSync(publicPath) && !fs.statSync(publicPath).isDirectory()) {
        filePath = publicPath;
      } else {
        filePath = path.join(distDir, 'index.html');
      }
    }

    try {
      if (fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      const data = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    } catch (err) {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 }
];

const PROJECTS = ['simoffice', 'living-plant', 'bindpoint', 'iqra-sms', 'threatwatch'];

async function main() {
  const iterNum = process.argv[2] || '1';
  const outDir = path.join(process.cwd(), 'qa', `iter-${iterNum}`);
  fs.mkdirSync(outDir, { recursive: true });

  const distDir = path.join(process.cwd(), 'dist');
  const port = 5173;
  const server = await startServer(distDir, port);
  console.log(`Server started at http://localhost:${port}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl']
  });

  const errors = [];
  const warnings = [];

  try {
    // 1. Initial Page Load & Console check
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error('Browser console error:', msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      errors.push(err.message);
      console.error('Unhandled page error:', err);
    });

    let totalTransferBytes = 0;
    page.on('response', async (res) => {
      try {
        const headers = res.headers();
        const len = headers['content-length'];
        if (len) totalTransferBytes += parseInt(len, 10);
      } catch {}
    });

    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
    // Wait for first model to settle
    await page.waitForTimeout(2500);

    console.log(`Initial network transfer: ${(totalTransferBytes / 1024 / 1024).toFixed(2)} MB`);
    if (totalTransferBytes > 3 * 1024 * 1024) {
      console.warn(`WARNING: Initial transfer exceeds 3 MB limit: ${(totalTransferBytes / 1024 / 1024).toFixed(2)} MB`);
    }

    // 2. Interaction verification: keyboard navigation
    console.log('Testing keyboard navigation...');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1000);
    const activeBtn1 = await page.$eval('.project-btn[aria-current="true"]', (el) => el.textContent);
    console.log('Active after ArrowRight:', activeBtn1);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(1000);
    const activeBtn2 = await page.$eval('.project-btn[aria-current="true"]', (el) => el.textContent);
    console.log('Active after ArrowLeft:', activeBtn2);

    // 3. Test Credits Dialog
    console.log('Testing Credits dialog...');
    await page.click('#credits-trigger');
    await page.waitForTimeout(500);
    const dialogOpen = await page.$eval('#credits-dialog', (el) => el.hasAttribute('open'));
    console.log('Credits dialog open:', dialogOpen);
    await page.click('#credits-close');
    await page.waitForTimeout(500);

    // 4. Test Drag Rotation on Stage
    console.log('Testing drag rotation on stage...');
    const stage = page.locator('#stage-container');
    const box = await stage.boundingBox();
    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 120, startY, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(500);
      console.log('Stage drag interaction completed smoothly');
    }

    // 5. Measure Frame Times for 10 seconds per project
    console.log('Measuring frame times (10s benchmark on SimOffice)...');
    const p95FrameTime = await page.evaluate(async () => {
      const times = [];
      let last = performance.now();
      const end = last + 10000;
      while (performance.now() < end) {
        await new Promise((r) => requestAnimationFrame(r));
        const now = performance.now();
        times.push(now - last);
        last = now;
      }
      times.sort((a, b) => a - b);
      const p95 = times[Math.floor(times.length * 0.95)];
      return { p95, count: times.length, avg: times.reduce((a, b) => a + b, 0) / times.length };
    });
    console.log(`10s Frame Stats: p95 = ${p95FrameTime.p95.toFixed(2)}ms, avg = ${p95FrameTime.avg.toFixed(2)}ms (${p95FrameTime.count} frames)`);

    await page.close();

    // 6. Capture Screenshots across all 3 viewports and all 5 projects
    console.log('Capturing multi-viewport screenshots for all 5 projects...');

    for (const vp of VIEWPORTS) {
      console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const vpPage = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

      await vpPage.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
      await vpPage.waitForTimeout(1800);

      for (let i = 0; i < PROJECTS.length; i++) {
        const projId = PROJECTS[i];
        console.log(`Selecting project: ${projId} on ${vp.name}...`);

        // Click project button
        await vpPage.click(`#project-btn-${projId}`);

        // Wait for model loading and transition cross-fade to settle
        await vpPage.waitForTimeout(1800);

        const screenshotPath = path.join(outDir, `${vp.name}-${projId}.png`);
        await vpPage.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`Saved screenshot: ${screenshotPath}`);
      }

      await vpPage.close();
    }

    console.log('\nAll QA verification tasks completed successfully!');
    console.log(`Total errors encountered: ${errors.length}`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('QA script failed:', err);
  process.exit(1);
});
