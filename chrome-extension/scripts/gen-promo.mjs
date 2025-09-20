#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs/promises';

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch (e) {
  console.error('Missing dependency: sharp. Install with: npm i -D sharp');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const artworkDir = resolve(__dirname, '../artwork');
const srcSvg = resolve(artworkDir, 'small_promo.svg');

const run = async () => {
  try {
    const svg = await fs.readFile(srcSvg);
    await fs.mkdir(artworkDir, { recursive: true });

    // Export JPEG (no alpha)
    const jpgOut = resolve(artworkDir, 'small_promo.jpg');
    await sharp(svg)
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(jpgOut);
    console.log('Generated', jpgOut);

    // Export 24-bit PNG (no alpha): remove alpha by flattening against background
    const pngOut = resolve(artworkDir, 'small_promo.png');
    await sharp(svg)
      .flatten({ background: '#0b1020' }) // ensures RGB24, no alpha
      .png({ compressionLevel: 9 })
      .toFile(pngOut);
    console.log('Generated', pngOut);
  } catch (err) {
    console.error('Promo generation failed:', err);
    process.exit(1);
  }
};

run();

