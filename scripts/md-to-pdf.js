/**
 * Конвертирует docs/interface-sizes.md в PDF через HTML и Puppeteer.
 * Запуск: node scripts/md-to-pdf.js
 * Требует: npm i puppeteer (один раз, может скачать Chromium).
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const mdPath = join(root, 'docs', 'interface-sizes.md');
const htmlPath = join(root, 'docs', 'interface-sizes.html');
const pdfPath = join(root, 'docs', 'interface-sizes.pdf');

const md = readFileSync(mdPath, 'utf8');

// Простой парсер MD в HTML (таблицы, заголовки, параграфы)
function mdToHtml(text) {
  const lines = text.split(/\r?\n/);
  let out = [];
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      if (inTable) { inTable = false; out.push(renderTable(tableRows)); tableRows = []; }
      out.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (inTable) { inTable = false; out.push(renderTable(tableRows)); tableRows = []; }
      out.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      if (inTable) { inTable = false; out.push(renderTable(tableRows)); tableRows = []; }
      out.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed === '---') {
      if (inTable) { inTable = false; out.push(renderTable(tableRows)); tableRows = []; }
      out.push('<hr/>');
      continue;
    }
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
      if (cells.some(c => /^[-:]+$/.test(c))) continue; // separator row
      tableRows.push(cells);
      inTable = true;
      continue;
    }
    if (inTable && !trimmed.startsWith('|')) {
      inTable = false;
      out.push(renderTable(tableRows));
      tableRows = [];
    }
    if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
      out.push(`<p class="note">${escapeHtml(trimmed.slice(1, -1))}</p>`);
      continue;
    }
    if (trimmed) {
      out.push(`<p>${escapeHtml(trimmed)}</p>`);
    } else {
      out.push('<br/>');
    }
  }
  if (tableRows.length) out.push(renderTable(tableRows));

  return out.join('\n');
}

function renderTable(rows) {
  if (rows.length === 0) return '';
  let html = '<table><thead><tr>';
  rows[0].forEach(c => { html += `<th>${escapeHtml(c)}</th>`; });
  html += '</tr></thead><tbody>';
  for (let r = 1; r < rows.length; r++) {
    html += '<tr>';
    rows[r].forEach(c => { html += `<td>${escapeHtml(c)}</td>`; });
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const content = mdToHtml(md);
const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Размеры интерфейса</title>
  <link href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Golos Text', sans-serif; font-size: 14px; line-height: 1.5; padding: 24px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
    h1 { font-size: 24px; margin-top: 0; border-bottom: 2px solid #333; padding-bottom: 8px; }
    h2 { font-size: 20px; margin-top: 24px; }
    h3 { font-size: 16px; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
    th { background: #f0f0f0; font-weight: 600; }
    hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
    p { margin: 8px 0; }
    p.note { color: #555; font-style: italic; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
${content}
</body>
</html>`;

writeFileSync(htmlPath, html, 'utf8');
console.log('HTML создан:', htmlPath);

// Пробуем Puppeteer
async function tryPuppeteer() {
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({ path: pdfPath, format: 'A4', margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }, printBackground: true });
    await browser.close();
    console.log('PDF создан:', pdfPath);
  } catch (e) {
    console.warn('Puppeteer недоступен:', e.message);
    console.log('Откройте в браузере и сохраните как PDF:');
    console.log('  Откройте docs/interface-sizes.html в браузере → Ctrl+P → Сохранить как PDF.');
  }
}

tryPuppeteer().catch(() => {
  console.log('Откройте docs/interface-sizes.html в браузере и нажмите Ctrl+P → Сохранить как PDF.');
});
