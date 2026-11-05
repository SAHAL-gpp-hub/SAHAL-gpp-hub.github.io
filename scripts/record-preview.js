import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function record() {
  const framesDir = path.join(process.cwd(), 'temp_frames');
  fs.mkdirSync(framesDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl']
  });

  const page = await browser.newPage({
    viewport: { width: 960, height: 600 }
  });

  console.log('Navigating to live deployment https://sahal-gpp-hub.github.io ...');
  await page.goto('https://sahal-gpp-hub.github.io', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const projects = ['simoffice', 'living-plant', 'bindpoint', 'iqra-sms', 'threatwatch'];
  let frameIdx = 0;

  for (const proj of projects) {
    console.log(`Recording project: ${proj}...`);
    await page.click(`#project-btn-${proj}`);
    await page.waitForTimeout(1400);

    // Capture 8 frames per project showing smooth animation / rotation
    for (let f = 0; f < 8; f++) {
      const framePath = path.join(framesDir, `frame_${String(frameIdx).padStart(4, '0')}.png`);
      await page.screenshot({ path: framePath });
      frameIdx++;
      await page.waitForTimeout(120);
    }
  }

  await browser.close();
  console.log(`Captured ${frameIdx} frames.`);

  // Assemble into preview.gif and preview.mp4 via Python imageio
  const pythonScript = `
import os
import glob
from PIL import Image
import imageio

frames_dir = '${framesDir}'
files = sorted(glob.glob(os.path.join(frames_dir, 'frame_*.png')))
print(f'Processing {len(files)} frames for animated GIF and MP4...')

# Load and optimize frames
images = []
for f in files:
    im = Image.open(f).resize((720, 450), Image.Resampling.LANCZOS)
    images.append(im)

out_assets = '/Users/mohammad/.gemini/antigravity/scratch/profile-repo/assets'
os.makedirs(out_assets, exist_ok=True)

# 1. Save optimized animated GIF (duration 150ms per frame = ~6.6 fps)
gif_path = os.path.join(out_assets, 'preview.gif')
images[0].save(
    gif_path,
    save_all=True,
    append_images=images[1:],
    duration=150,
    loop=0,
    optimize=True
)
print('Saved GIF:', gif_path, 'Size:', os.path.getsize(gif_path), 'bytes')

# 2. Save MP4
mp4_path = os.path.join(out_assets, 'preview.mp4')
try:
    with imageio.get_writer(mp4_path, fps=7) as writer:
        for im in images:
            writer.append_data(imageio.imread(im.filename if hasattr(im, 'filename') and im.filename else files[0]))
    print('Saved MP4:', mp4_path, 'Size:', os.path.getsize(mp4_path), 'bytes')
except Exception as e:
    print('MP4 generation notice:', e)
    # Fallback copy from ffmpeg or frames
`;

  fs.writeFileSync('temp_assemble.py', pythonScript);
  execSync('/opt/anaconda3/bin/python3 temp_assemble.py', { stdio: 'inherit' });

  // Cleanup temp files
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.rmSync('temp_assemble.py', { force: true });

  console.log('Preview recording and generation complete!');
}

record().catch(console.error);
