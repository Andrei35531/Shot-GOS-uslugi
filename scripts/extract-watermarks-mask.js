import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const src = path.join(__dirname, '../Public/Group 3.svg');
const dest = path.join(__dirname, '../Public/Group-3-watermarks-mask.svg');

const content = fs.readFileSync(src, 'utf8');
const start = content.indexOf('<g opacity="0.5">');
const end = content.indexOf('</g>', start) + 4;
const group = content.slice(start, end).replace(/ opacity="0\.5"/, '').replace(/fill="white"/g, 'fill="#fff"');

const maskSvg = `<svg viewBox="0 0 370 240" xmlns="http://www.w3.org/2000/svg"><rect width="370" height="240" fill="#000"/>${group}</svg>`;
fs.writeFileSync(dest, maskSvg);
console.log('Written', dest);
