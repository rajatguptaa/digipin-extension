#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs/promises';

// Lazy import to give a clearer error if not installed
let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch (e) {
  console.error('\nMissing dependency: sharp.');
  console.error('Install with: npm i -D sharp');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const iconsDir = resolve(__dirname, '../public/icons');
const srcSvg = resolve(iconsDir, 'icon.svg');
const sizes = [16, 24, 32, 48, 128];

const run = async () => {
  try {
    const svg = await fs.readFile(srcSvg);
    await fs.mkdir(iconsDir, { recursive: true });
    await Promise.all(
      sizes.map(async (size) => {
        const out = resolve(iconsDir, `icon${size}.png`);
        const img = await sharp(svg).resize(size, size, { fit: 'cover' }).png();
        await img.toFile(out);
        console.log('Generated', out);
      })
    );
  } catch (err) {
    console.error('Icon generation failed:', err);
    process.exit(1);
  }
};

run();

