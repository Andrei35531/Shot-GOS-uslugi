/**
 * Выводит локальный URL для открытия проекта на iPhone (тот же Wi‑Fi).
 */
import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const ip = getLocalIP();
const port = 5173;
if (ip) {
  const url = `https://${ip}:${port}`;
  console.log('\n  📱 Открой на iPhone в Safari (HTTPS):\n');
  console.log('  ' + url + '\n');
  console.log('  При первом заходе Safari покажет предупреждение — нажми «Подробнее» → «Перейти на сайт».\n');
} else {
  console.log('\n  📱 Локальный IP не найден. Запустите npm run dev и смотрите строку "Network" в выводе.\n');
}
